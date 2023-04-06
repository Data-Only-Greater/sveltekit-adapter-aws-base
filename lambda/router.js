import staticFiles from './static.js'

export async function handler(event, context, callback) {
  const request = event.Records[0].cf.request

  if (request.method === 'OPTIONS') {
    callback(null, performReWrite(uri, request, 'options'))
    return
  } else if (request.method !== 'GET') {
    callback(null, performReWrite(uri, request, 'server'))
    return
  }

  let uri = request.uri

  if (staticFiles.includes(uri)) {
    callback(null, request)
    return
  }

  // Remove the trailing slash (if any) to normalise the path
  if (uri.slice(-1) === '/') {
    uri = uri.substring(0, uri.length - 1)
  }

  // Pre-rendered pages could be named `/index.html` or `route/name.html` lets try looking for those as well
  if (staticFiles.includes(uri + '/index.html')) {
    callback(null, performReWrite(uri + '/index.html', request))
    return
  }
  if (staticFiles.includes(uri + '.html')) {
    callback(null, performReWrite(uri + '.html', request))
    return
  }

  callback(null, performReWrite(uri, request, 'server'))
}

function performReWrite(uri, request, target) {
  request.uri = uri

  if (typeof target === 'undefined') {
    return request
  }

  let domainName

  if (target === 'server') {
    domainName = 'SERVER_URL'
  } else if (target === 'options') {
    domainName = 'OPTIONS_URL'
  } else {
    throw Error(`Unknown target '${target}'`)
  }

  request.origin.custom.domainName = domainName
  request.origin.custom.path = ''
  request.headers['host'] = [{ key: 'host', value: domainName }]

  return request
}
