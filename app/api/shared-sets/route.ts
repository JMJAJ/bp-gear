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
  uploaderId: z.string().trim().min(1).max(64).optional(),
})

type DbRow = {
  share_code: string
  name: string
  spec: string
  uploader_name: string | null
  uploader_id: string | null
  gear_set: z.infer<typeof gearSetSchema>
  created_at: Date
}

type DbSummaryRow = {
  share_code: string
  name: string
  spec: string
  uploader_name: string | null
  uploader_id: string | null
  created_at: Date
}

const SHARE_CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/

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
          uploader_id STRING,
          gear_set JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `)

      // Add uploader_id column if it doesn't exist (for existing tables)
      await pool.query(`
        ALTER TABLE shared_gear_sets ADD COLUMN IF NOT EXISTS uploader_id STRING
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

    const { gearSet, spec, uploaderName, uploaderId } = parsed.data
    const pool = getCockroachPool()

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const shareCode = generateShareCode()
      try {
        await pool.query(
          `
            INSERT INTO shared_gear_sets (share_code, name, spec, uploader_name, uploader_id, gear_set)
            VALUES ($1, $2, $3, $4, $5, $6::JSONB)
          `,
          [shareCode, gearSet.name, spec ?? "", uploaderName ?? null, uploaderId ?? null, JSON.stringify(gearSet)],
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
    console.error("[shared-sets POST error]", err)
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
          SELECT share_code, name, spec, uploader_name, uploader_id, created_at
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
          uploaderId: row.uploader_id,
          createdAt: row.created_at.toISOString(),
        })),
      })
    }

    const result = await pool.query<DbRow>(
      `
        SELECT share_code, name, spec, uploader_name, uploader_id, gear_set, created_at
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
      uploaderId: row.uploader_id,
      createdAt: row.created_at.toISOString(),
      gearSet: row.gear_set,
    })
  } catch (err) {
    console.error("[shared-sets GET error]", err)
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: "Failed to load shared set", message: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureSchema()

    const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase()
    const uploaderId = req.nextUrl.searchParams.get("uploaderId")?.trim()

    if (!code || !uploaderId) {
      return NextResponse.json({ error: "Missing code or uploaderId" }, { status: 400 })
    }

    if (!SHARE_CODE_REGEX.test(code)) {
      return NextResponse.json({ error: "Invalid share code format" }, { status: 400 })
    }

    const pool = getCockroachPool()
    const result = await pool.query(
      `
        DELETE FROM shared_gear_sets
        WHERE share_code = $1 AND uploader_id = $2
        RETURNING share_code
      `,
      [code, uploaderId],
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Set not found or not owned by you" }, { status: 404 })
    }

    return NextResponse.json({ success: true, shareCode: code })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: "Failed to delete shared set", message: msg }, { status: 500 })
  }
}

const putSchema = z.object({
  shareCode: z.string().trim().min(1).max(16).regex(SHARE_CODE_REGEX, "Invalid share code format"),
  uploaderId: z.string().trim().min(1).max(64),
  gearSet: gearSetSchema,
  spec: z.string().max(80).optional(),
})

export async function PUT(req: NextRequest) {
  try {
    await ensureSchema()

    const parsed = putSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { shareCode, uploaderId, gearSet, spec } = parsed.data
    const pool = getCockroachPool()

    const result = await pool.query(
      `
        UPDATE shared_gear_sets
        SET name = $1, spec = $2, gear_set = $3::JSONB
        WHERE share_code = $4 AND uploader_id = $5
        RETURNING share_code
      `,
      [gearSet.name, spec ?? "", JSON.stringify(gearSet), shareCode, uploaderId],
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Set not found or not owned by you" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      shareCode,
      name: gearSet.name,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: "Failed to update shared set", message: msg }, { status: 500 })
  }
}
