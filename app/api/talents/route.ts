import { NextRequest, NextResponse } from "next/server"
import { TALENT_DATA, type TalentEntry } from "@/lib/talent-data"

// Re-export the type as FetchedTalent so existing imports in other components continue to work.
export type FetchedTalent = TalentEntry

export async function GET(req: NextRequest) {
  const className = req.nextUrl.searchParams.get("class") ?? "Stormblade"
  const talents = TALENT_DATA[className] ?? []

  return NextResponse.json(
    { talents, totalPages: 1, fetchedAt: Date.now() },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  )
}
