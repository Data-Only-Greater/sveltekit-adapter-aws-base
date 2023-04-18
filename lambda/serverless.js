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

  const origin =
    'ORIGIN' in process.env
      ? process.env['ORIGIN']
      : `https://${requestContext.domainName}`

  let rawURL = `https://${requestContext.domainName}${rawPath}${
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

  // Parse the response into lambda proxy response
  let response

  if (rendered) {
    response = {
      ...split_headers(rendered.headers),
      body: await rendered.text(),
      statusCode: rendered.status,
    }
    response.headers['cache-control'] = 'no-cache'
  } else {
    response = {
      statusCode: 404,
      body: 'Not found.',
    }
  }
  console.log(response)

  return response
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
