import { Server } from '../index.js'
import { manifest } from '../manifest.js'
import { splitCookiesString } from 'set-cookie-parser'

export const handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    const app = new Server(manifest)
    const {
      rawPath,
      headers,
      rawQueryString,
      body,
      requestContext,
      isBase64Encoded,
      cookies,
    } = event

    const encoding = isBase64Encoded
      ? 'base64'
      : headers['content-encoding'] || 'utf-8'
    const rawBody =
      typeof body === 'string' ? Buffer.from(body, encoding) : body

    if (cookies) {
      headers['cookie'] = cookies.join('; ')
    }

    const domainName =
      'x-forwarded-host' in headers
        ? headers['x-forwarded-host']
        : requestContext.domainName

    const origin =
      'ORIGIN' in process.env ? process.env['ORIGIN'] : `https://${domainName}`

    let rawURL = `${origin}${rawPath}${
      rawQueryString ? `?${rawQueryString}` : ''
    }`

    await app.init({
      env: process.env,
    })

    // Render the app
    const request = new Request(rawURL, {
      method: requestContext.http.method,
      headers: new Headers(headers),
      body: rawBody,
    })
    console.log(request)

    const rendered = await app.respond(request, {
      platform: { context },
    })

    let metadata

    if (rendered) {
      metadata = {
        ...split_headers(rendered.headers),
        statusCode: rendered.status,
      }
      metadata.headers['cache-control'] = 'no-cache'
    } else {
      metadata = {
        statusCode: 404,
      }
    }

    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata)

    if (rendered) {
      setResponse(responseStream, rendered)
    } else {
      responseStream.end()
    }
  }
)

// Copyright (c) 2020 [these people](https://github.com/sveltejs/kit/graphs/contributors) (MIT)
// From: kit/packages/adapter-netlify/src/headers.js
/**
 * Splits headers into two categories: single value and multi value
 * @param {Headers} headers
 * @returns {{
 *   headers: Record<string, string>,
 *   cookies: string[]
 * }}
 */
export function split_headers(headers) {
  /** @type {Record<string, string>} */
  const h = {}

  /** @type {string[]} */
  let c = []

  headers.forEach((value, key) => {
    if (key === 'set-cookie') {
      c = c.concat(splitCookiesString(value))
    } else {
      h[key] = value
    }
  })
  return {
    headers: h,
    cookies: c,
  }
}

export async function setResponse(res, response) {
  if (!response.body) {
    res.end()
    return
  }

  if (response.body.locked) {
    res.end(
      'Fatal error: Response body is locked. ' +
        `This can happen when the response was already read (for example through 'response.json()' or 'response.text()').`
    )
    return
  }

  const reader = response.body.getReader()

  if (res.destroyed) {
    reader.cancel()
    return
  }

  const cancel = (/** @type {Error|undefined} */ error) => {
    res.off('close', cancel)
    res.off('error', cancel)

    // If the reader has already been interrupted with an error earlier,
    // then it will appear here, it is useless, but it needs to be catch.
    reader.cancel(error).catch(() => {})
    if (error) res.destroy(error)
  }

  res.on('close', cancel)
  res.on('error', cancel)

  next()

  async function next() {
    try {
      for (;;) {
        const { done, value } = await reader.read()

        if (done) break

        if (!res.write(value)) {
          res.once('drain', next)
          return
        }
      }
      res.end()
    } catch (error) {
      cancel(error instanceof Error ? error : new Error(String(error)))
    }
  }
}
