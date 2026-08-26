// api/directions.js
// Vercel 서버리스 함수 - 네이버 Directions API 프록시
// 브라우저 대신 서버에서 API 키를 붙여서 네이버에 요청합니다

export default async function handler(req, res) {
    // 쿼리스트링 그대로 전달 (start, goal, option 등)
    const params = new URLSearchParams(req.query).toString()

    const url = `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?${params}`

    try {
        const response = await fetch(url, {
            headers: {
                'X-NCP-APIGW-API-KEY-ID': 'yorn0kg66a',
                'X-NCP-APIGW-API-KEY': 'wGPSLkAE1q1ndCPYYzJqPypRsxETfu3YLLZfE5hj',
            },
        })

        const data = await response.json()
        res.status(response.status).json(data)

    } catch (e) {
        res.status(500).json({ error: e.message })
    }
}