import { createApp, logStartup } from './app.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'

const app = createApp()

const server = app.listen(env.PORT, () => {
  logStartup(env.PORT)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  server.close(() => process.exit(0))
})
