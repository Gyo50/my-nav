import crypto from 'crypto'

// ── 환경 변수에서 키 읽기 (코드에 키 직접 X)
const ACCESS_KEY = process.env.NCP_ACCESS_KEY
const SECRET_KEY = process.env.NCP_SECRET_KEY

function makeSignature(method, url, timestamp) {
  const message = `${method} ${url}\n${timestamp}\n${ACCESS_KEY}`
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(message)
    .digest('base64')
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { start, goal, option = 'trafast' } = req.query
  if (!start || !goal) {
    return res.status(400).json({ error: 'start, goal 파라미터가 필요합니다.' })
  }

  const path = `/map-direction/v1/driving?start=${start}&goal=${goal}&option=${option}`
  const url  = `https://naveropenapi.apigw.ntruss.com${path}`

  const timestamp = Date.now().toString()
  const signature = makeSignature('GET', path, timestamp)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-ncp-apigw-timestamp':    timestamp,
        'x-ncp-iam-access-key':     ACCESS_KEY,
        'x-ncp-apigw-signature-v2': signature,
        'Accept': 'application/json',
      },
    })
    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}