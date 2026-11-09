import { NextResponse } from "next/server";
import { db, SITE } from "@/lib/proposals/server";

export const dynamic = "force-dynamic";

/**
 * Short, permanent customer link: /go/<first 6 characters of the token>.
 * Before signing it lands where content.entry says (full proposal by default, or the summary or the agreement);
 * after signing it always opens the project page. Views are counted by the page it lands on, not here.
 */
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const code = params.code;
  if (!/^[A-Za-z0-9]{6,32}$/.test(code)) return NextResponse.redirect(`${SITE}/project/${encodeURIComponent(code)}`, 307);
  const { data } = await db().from("proposals").select("token,signed_at,content").like("token", `${code}%`).limit(2);
  if (!data || data.length !== 1) return NextResponse.redirect(`${SITE}/project/${code}`, 307); // shows "can't find this page"
  const p = data[0] as { token: string; signed_at: string | null; content: { entry?: string } | null };
  const entry = p.content?.entry;
  const tail = p.signed_at ? "" : entry === "sign" ? "/sign" : entry === "short" ? "/short" : "";
  return NextResponse.redirect(`${SITE}/project/${p.token}${tail}`, 307);
}
