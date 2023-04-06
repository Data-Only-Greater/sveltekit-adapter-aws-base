import { Server } from '../index.js'
import { manifest } from '../manifest.js'
import { splitCookiesString } from 'set-cookie-parser'

export async function handler(event, context) {
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
  const rawBody = typeof body === 'string' ? Buffer.from(body, encoding) : body

  if (cookies) {
    headers['cookie'] = cookies.join('; ')
  }

  let rawURL = `https://${requestContext.domainName}${rawPath}${
    rawQueryString ? `?${rawQueryString}` : ''
  }`

  await app.init({
    env: process.env,
  })

  //Render the app
  const rendered = await app.respond(
    new Request(rawURL, {
      method: requestContext.http.method,
      headers: new Headers(headers),
      body: rawBody,
    }),
    {
      platform: { context },
    }
  )

  //Parse the response into lambda proxy response
  if (rendered) {
    const resp = {
      ...split_headers(rendered.headers),
      body: await rendered.text(),
      statusCode: rendered.status,
    }
    resp.headers['cache-control'] = 'no-cache'
    return resp
  }
  return {
    statusCode: 404,
    body: 'Not found.',
  }
}

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
