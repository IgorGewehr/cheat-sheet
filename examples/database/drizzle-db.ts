import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Para queries
const client = postgres(connectionString)
export const db = drizzle(client, { schema })

// Uso:
// const users = await db.select().from(schema.users).where(eq(schema.users.tenantId, tenantId))