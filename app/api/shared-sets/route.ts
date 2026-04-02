import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCockroachPool } from "@/lib/server/cockroach"

export const runtime = "nodejs"

const moduleSlotSchema = z.object({
  rarity: z.enum(["Gold", "Purple", "Blue"]),
  a1: z.string(),
  a1lv: z.coerce.number(),
  a2: z.string(),
  a2lv: z.coerce.number(),
  a3: z.string(),
  a3lv: z.coerce.number(),
  enabled: z.boolean().optional(),
})

const imagineSlotSchema = z.object({
  key: z.string(),
  idx: z.coerce.number(),
})

const gearSetSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1).max(120),
    gear: z.array(z.record(z.string(), z.unknown())).min(1).max(32),
    legendaryTypes: z.array(z.string()).max(32),
    legendaryVals: z.array(z.coerce.number()).max(32),
    imagines: z.array(imagineSlotSchema).max(8),
    modules: z.array(moduleSlotSchema).max(16),
    selectedTalents: z.array(z.string()).max(512),
    talentAspd: z.coerce.number(),
    createdAt: z.string(),
  })
  .passthrough()

const postSchema = z.object({
  gearSet: gearSetSchema,
  spec: z.string().max(80).optional(),
  uploaderName: z.string().trim().min(1).max(40).optional(),
})

type DbRow = {
  share_code: string
  name: string
  spec: string
  uploader_name: string | null
  gear_set: z.infer<typeof gearSetSchema>
  created_at: Date
}

type DbSummaryRow = {
  share_code: string
  name: string
  spec: string
  uploader_name: string | null
  created_at: Date
}

const SHARE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

let schemaInitPromise: Promise<void> | null = null

function generateShareCode(length = 8): string {
  let out = ""
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * SHARE_CODE_ALPHABET.length)
    out += SHARE_CODE_ALPHABET[index]
  }
  return out
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505"
}

async function ensureSchema(): Promise<void> {
  if (!schemaInitPromise) {
    const pool = getCockroachPool()
    schemaInitPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS shared_gear_sets (
          share_code STRING PRIMARY KEY,
          name STRING NOT NULL,
          spec STRING NOT NULL DEFAULT '',
          uploader_name STRING,
          gear_set JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `)

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_shared_gear_sets_created_at
        ON shared_gear_sets (created_at DESC)
      `)
    })().catch((err) => {
      schemaInitPromise = null
      throw err
    })
  }

  await schemaInitPromise
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema()

    const parsed = postSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { gearSet, spec, uploaderName } = parsed.data
    const pool = getCockroachPool()

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const shareCode = generateShareCode()
      try {
        await pool.query(
          `
            INSERT INTO shared_gear_sets (share_code, name, spec, uploader_name, gear_set)
            VALUES ($1, $2, $3, $4, $5::JSONB)
          `,
          [shareCode, gearSet.name, spec ?? "", uploaderName ?? null, JSON.stringify(gearSet)],
        )

        return NextResponse.json({
          shareCode,
          name: gearSet.name,
          createdAt: new Date().toISOString(),
        })
      } catch (err) {
        if (!isUniqueViolation(err)) {
          throw err
        }
      }
    }

    return NextResponse.json({ error: "Unable to generate unique share code" }, { status: 500 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: "Failed to upload shared set", message: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureSchema()

    const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase()
    const pool = getCockroachPool()

    if (!code) {
      const rawLimit = Number(req.nextUrl.searchParams.get("limit") ?? "30")
      const limit = Number.isFinite(rawLimit)
        ? Math.max(1, Math.min(100, Math.floor(rawLimit)))
        : 30

      const result = await pool.query<DbSummaryRow>(
        `
          SELECT share_code, name, spec, uploader_name, created_at
          FROM shared_gear_sets
          ORDER BY created_at DESC
          LIMIT $1
        `,
        [limit],
      )

      return NextResponse.json({
        sets: result.rows.map((row) => ({
          shareCode: row.share_code,
          name: row.name,
          spec: row.spec,
          uploaderName: row.uploader_name,
          createdAt: row.created_at.toISOString(),
        })),
      })
    }

    const result = await pool.query<DbRow>(
      `
        SELECT share_code, name, spec, uploader_name, gear_set, created_at
        FROM shared_gear_sets
        WHERE share_code = $1
        LIMIT 1
      `,
      [code],
    )

    const row = result.rows[0]
    if (!row) {
      return NextResponse.json({ error: "Shared set not found" }, { status: 404 })
    }

    return NextResponse.json({
      shareCode: row.share_code,
      name: row.name,
      spec: row.spec,
      uploaderName: row.uploader_name,
      createdAt: row.created_at.toISOString(),
      gearSet: row.gear_set,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: "Failed to load shared set", message: msg }, { status: 500 })
  }
}
