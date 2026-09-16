import Fastify from 'fastify'
import cors from '@fastify/cors'
import { gamesRoutes } from './routes/games'

export function buildServer() {
  const app = Fastify({ logger: true })
  app.register(cors, { origin: 'http://localhost:5173' })
  app.register(gamesRoutes)
  return app
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const app = buildServer()
  app.listen({ port: 3000 }, (err) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
  })
}
