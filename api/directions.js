export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { start, goal, option = 'trafast' } = req.query
  if (!start || !goal) {
    return res.status(400).json({ error: 'start, goal 파라미터 필요' })
  }

  // ✅ VPC 환경 URL 사용
  const url = `https://maps.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}&option=${option}`

  console.log('요청 URL:', url)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        // ✅ mynav 앱의 Client ID / Client Secret 사용 (IAM 아님!)
        'X-NCP-APIGW-API-KEY-ID': process.env.NCP_ACCESS_KEY,
        'X-NCP-APIGW-API-KEY':    process.env.NCP_SECRET_KEY,
        'Accept': 'application/json',
      },
    })

    console.log('네이버 응답 상태:', response.status)
    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (e) {
    console.error('에러:', e.message)
    return res.status(500).json({ error: e.message })
  }
}