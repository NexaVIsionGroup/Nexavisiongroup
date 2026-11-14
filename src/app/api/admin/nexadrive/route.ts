import { NextRequest, NextResponse } from "next/server";
import { deleteFile, listBackups, listFolder, uploadFile } from "@/lib/nexadrive";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET  /api/admin/nexadrive?folder=/x     folder contents and recent backups
// POST /api/admin/nexadrive               multipart: folder, file (up to 4 MB)
// DELETE /api/admin/nexadrive?id=<uuid>   hide a file (backup pieces are protected)
// The admin middleware already requires a signed-in user for /api/admin/*.

export async function GET(req: NextRequest) {
  try {
    const folder = req.nextUrl.searchParams.get("folder") || "/";
    const [contents, backups] = await Promise.all([listFolder(folder), listBackups(30)]);
    return NextResponse.json({ ...contents, backups }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a file first." }, { status: 400 });
    const folder = String(form.get("folder") || "/");
    if (/^\/Backups(\/|$)/i.test(folder)) return NextResponse.json({ error: "The Backups folder is filled automatically." }, { status: 400 });
    const id = await uploadFile(folder, file, "admin");
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id") || "";
    if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
    await deleteFile(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 400 });
  }
}
