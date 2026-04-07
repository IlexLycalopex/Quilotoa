import { db } from '../config/db.js'
import { tenants, users, teams } from './schema.js'
import { logger } from '../config/logger.js'
import bcrypt from 'bcrypt'
import { Role } from '@msas/shared'

async function main() {
  logger.info('Seeding database...')

  // Create default tenant
  const [tenant] = await db.insert(tenants).values({
    slug: 'mysoft',
    name: 'Mysoft',
    config: {
      branding: { primaryColour: '#1e3a5f', companyName: 'Mysoft' },
      benchmarkOverrides: {},
      featureFlags: { phase2Enabled: false },
    },
  }).onConflictDoNothing().returning()

  if (!tenant) {
    logger.info('Tenant already exists, skipping seed.')
    process.exit(0)
  }

  // Create default team
  const [team] = await db.insert(teams).values({ tenantId: tenant.id, name: 'Sales Team' }).returning()

  // Create seed users
  const passwordHash = await bcrypt.hash('Password1!', 12)
  await db.insert(users).values([
    { tenantId: tenant.id, email: 'admin@mysoft.com',    passwordHash, fullName: 'System Admin',   role: Role.ADMIN,      teamId: team?.id },
    { tenantId: tenant.id, email: 'director@mysoft.com', passwordHash, fullName: 'Sales Director', role: Role.DIRECTOR,   teamId: team?.id },
    { tenantId: tenant.id, email: 'lead@mysoft.com',     passwordHash, fullName: 'Team Lead',       role: Role.TEAM_LEAD,  teamId: team?.id },
    { tenantId: tenant.id, email: 'bde@mysoft.com',      passwordHash, fullName: 'BDE User',        role: Role.BDE,        teamId: team?.id },
    { tenantId: tenant.id, email: 'presales@mysoft.com', passwordHash, fullName: 'Pre-Sales User',  role: Role.PRE_SALES,  teamId: team?.id },
  ]).onConflictDoNothing()

  logger.info('Seed complete. Tenant: mysoft, all users: Password1!')
  process.exit(0)
}

main().catch((err) => {
  logger.error(err, 'Seed failed')
  process.exit(1)
})
