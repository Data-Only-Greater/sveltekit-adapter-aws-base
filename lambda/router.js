const { HttpRequest } = require("@aws-sdk/protocol-http");
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const { SignatureV4 } = require("@aws-sdk/signature-v4");
import { Sha256 } from '@aws-crypto/sha256-js';

import staticFiles from './static.js'

export async function handler(event, context, callback) {
  let request = event.Records[0].cf.request
  const uri = request.uri

  if (request.method === 'OPTIONS') {
    request = await performReWrite(uri, request, 'options')
    callback(null, request)
    return
  } else if (request.method !== 'GET') {
    request = await performReWrite(uri, request, 'server')
    callback(null, request)
    return
  }

  if (staticFiles.includes(uri)) {
    callback(null, request)
    return
  }

  // Remove the trailing slash (if any) to normalise the path
  let uriBase = uri

  if (uri.slice(-1) === '/') {
    uriBase = uri.substring(0, uri.length - 1)
  }

  if (staticFiles.includes(uriBase + '/index.html')) {
    request = await performReWrite(uriBase + '/index.html', request)
    callback(null, request)
    return
  }

  if (staticFiles.includes(uriBase + '.html')) {
    request = await performReWrite(uriBase + '.html', request)
    callback(null, request)
    return
  }
  
  request = await performReWrite(uri, request, 'server')
  callback(null, request)
}

async function performReWrite(uri, request, target) {
  request.uri = uri

  if (typeof target === 'undefined') {
    return request
  }

  let domainName

  if (target === 'server') {
    domainName = SERVER_URL
  } else if (target === 'options') {
    domainName = OPTIONS_URL
  } else {
    throw Error(`Unknown target '${target}'`)
  }

  request.origin = {
    custom: {
      domainName: domainName,
      port: 443,
      protocol: 'https',
      path: '',
      sslProtocols: ['TLSv1', 'TLSv1.1', 'TLSv1.2', 'SSLv3'],
      readTimeout: 60,
      keepaliveTimeout: 60,
      customHeaders: {},
    },
  }
  request.headers['host'] = [{ key: 'host', value: domainName }]
  request.headers['origin'] = [
    { key: 'origin', value: `https://${domainName}` },
  ]
  request.querystring = encodeURIComponent(request.querystring)
  
  const headersToSign = {}
  
  for (const v of Object.values(request.headers)) {
    headersToSign[v[0]['key']] = v[0]['value']
  }
  
  const requestToSign = new HttpRequest({
    body: atob(request['body']['data']),
    headers: headersToSign,
    hostname: domainName,
    method: request.method,
    path: request.uri
  });
  
  const domainSegments = domainName.split('.')
  const region = domainSegments[2]
  
  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region: region,
    service: 'lambda',
    sha256: Sha256,
  });
  
  const signedRequest = await signer.sign(requestToSign)
  const cloudFrontHeaders = {}
  
  for (const [k, v] of Object.entries(signedRequest.headers)) {
    cloudFrontHeaders[k.toLowerCase()] = [{
      'key': k,
      'value': v
    }]
  }
  
  request['headers'] = cloudFrontHeaders

  return request
}
