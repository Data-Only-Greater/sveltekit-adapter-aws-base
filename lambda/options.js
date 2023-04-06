export async function handler(event, context) {
  const allowedOrigins = JSON.parse(process.env['ALLOWED_ORIGINS'])
  var headers = {
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': 86400,
    Connection: 'keep-alive',
  }
  if (allowedOrigins.includes(event.headers.origin)) {
    headers['Access-Control-Allow-Origin'] = event.headers.origin
  }
  const response = {
    statusCode: 204,
    headers: headers,
  }
  return response
}
