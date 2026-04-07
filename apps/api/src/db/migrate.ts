import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from '../config/db.js'
import { logger } from '../config/logger.js'

async function main() {
  logger.info('Running migrations...')
  await migrate(db, { migrationsFolder: './src/db/migrations' })
  logger.info('Migrations complete.')
  process.exit(0)
}

main().catch((err) => {
  logger.error(err, 'Migration failed')
  process.exit(1)
})
