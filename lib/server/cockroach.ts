import { Pool } from "pg"

declare global {
  // eslint-disable-next-line no-var
  var __cockroachPool: Pool | undefined
}

function env(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`[shared-sets] Missing environment variable: ${name}`)
  }
  return value
}

function boolEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]
  if (value === undefined) return defaultValue
  const normalized = value.trim().toLowerCase()
  return normalized !== "false" && normalized !== "0" && normalized !== "off"
}

function createPool(): Pool {
  const connectionString = process.env.COCKROACH_DB_URL?.trim()

  if (connectionString) {
    return new Pool({
      connectionString,
      ssl: { rejectUnauthorized: boolEnv("COCKROACH_DB_SSL_REJECT_UNAUTHORIZED", true) },
      max: 8,
    })
  }

  return new Pool({
    user: env("COCKROACH_DB_USER"),
    password: env("COCKROACH_DB_PASSWORD"),
    host: env("COCKROACH_DB_HOST"),
    port: Number(process.env.COCKROACH_DB_PORT ?? "26257"),
    database: env("COCKROACH_DB_NAME"),
    ssl: { rejectUnauthorized: boolEnv("COCKROACH_DB_SSL_REJECT_UNAUTHORIZED", true) },
    max: 8,
  })
}

export function getCockroachPool(): Pool {
  if (!global.__cockroachPool) {
    global.__cockroachPool = createPool()
  }
  return global.__cockroachPool
}
