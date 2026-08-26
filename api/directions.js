export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    const { start, goal, option = 'trafast' } = req.query

    if (!start || !goal) {
        return res.status(400).json({ error: 'start, goal 파라미터가 필요합니다.' })
    }

    const url = `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}&option=${option}`

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-NCP-APIGW-API-KEY-ID': 'kvy0ec2zgu',
                'X-NCP-APIGW-API-KEY': '5anSvaNVW2c6jpNAS56zz56otzxbOsNGfxyfbiaC',
                'Accept': 'application/json',
            },
        })
        const data = await response.json()
        return res.status(response.status).json(data)
    } catch (e) {
        return res.status(500).json({ error: e.message })
    }
}