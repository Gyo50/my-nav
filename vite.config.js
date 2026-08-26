import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,

    proxy: {
      /*
       * ┌──────────────────────────────────────────────────────────────┐
       * │  CORS 우회 프록시 설정                                        │
       * │                                                              │
       * │  네이버 Directions API는 브라우저에서 직접 호출하면           │
       * │  CORS 오류가 발생합니다.                                      │
       * │  Vite 개발 서버가 중간에서 요청을 대신 전달해주는 방식입니다.  │
       * │                                                              │
       * │  /api/directions/... 로 요청하면                             │
       * │  → https://naveropenapi.apigw.ntruss.com/... 로 전달됩니다  │
       * └──────────────────────────────────────────────────────────────┘
       */
      '/api/naver': {
        target: 'https://naveropenapi.apigw.ntruss.com',
        changeOrigin: true,
        // URL에서 '/api/directions' 부분을 제거하고 전달
        rewrite: (path) => path.replace(/^\/api\/naver/, ''),
      },
    },
  },
})
