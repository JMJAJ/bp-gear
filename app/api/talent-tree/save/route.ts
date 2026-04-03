import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Only allow in development mode for security
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not available in production" }, { status: 403 })
    }

    // Get the file path from the request body, or use default
    const relativePath = data._filePath ?? "stormblade-moonstrike.json"
    
    // Remove the internal _filePath property before saving
    const { _filePath, ...dataToSave } = data
    
    const filePath = path.join(process.cwd(), "public", "planner-data", relativePath)
    
    // Ensure the directory exists
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), "utf-8")
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving talent tree:", error)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}
