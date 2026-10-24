import { writeFile } from 'node:fs/promises'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// H1 레시피 관리 화면(?admin)의 저장. 개발 서버에만 붙고(apply: 'serve') 빌드 결과에는 들어가지 않는다.
// 검사(lib/recipeCheck)를 통과한 목록만 src/data/recipes.json에 쓴다. 고친 내용은 git 변경으로 남는다
function recipeAdmin(): Plugin {
  return {
    name: 'kokcook-recipe-admin',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__admin/recipes', async (req, res) => {
        const send = (status: number, data: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        }
        // 다른 사이트가 개발 서버로 보내는 요청은 받지 않는다
        if (req.method !== 'POST' || req.headers['sec-fetch-site'] !== 'same-origin') return send(403, { errors: ['허용하지 않는 요청이에요'] })
        try {
          let body = ''
          for await (const chunk of req) body += chunk
          const list: unknown = JSON.parse(body)
          if (!Array.isArray(list)) return send(400, { errors: ['레시피 목록이 아니에요'] })
          const { checkRecipes } = await server.ssrLoadModule('/src/lib/recipeCheck.ts')
          const errors: string[] = checkRecipes(list)
          if (errors.length) return send(400, { errors })
          await writeFile(new URL('./src/data/recipes.json', import.meta.url), JSON.stringify(list, null, 2) + '\n')
          send(200, { ok: true })
        } catch (e) {
          send(400, { errors: [String(e)] })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), recipeAdmin()],
})
