import { NextRequest, NextResponse } from "next/server";
import { fetchFile } from "@/lib/nexadrive";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/admin/nexadrive/file?id=<uuid>  streams a stored file as a download.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  try {
    const f = await fetchFile(id);
    const safe = f.name.replace(/["\r\n\\]/g, "_");
    return new NextResponse(f.body as unknown as ReadableStream, {
      headers: {
        "Content-Type": f.mime,
        "Content-Length": String(f.size),
        "Content-Disposition": `attachment; filename="${safe}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 400 });
  }
}
