import { NextResponse } from "next/server";
import { db, newNumber, newToken, projectUrl, syncPaid } from "@/lib/proposals/server";
import { blankContent, normalizeContent } from "@/lib/proposals/types";

// Admin (middleware-protected): list + create proposals.
export const dynamic = "force-dynamic";

const LIST = "id,token,number,title,status,division,client_name,client_company,client_email,link_enabled,expires_at,sent_at,first_viewed_at,last_viewed_at,view_count,seconds_viewed,signed_at,signed_name,due_amount,invoice_number,paid_at,created_at,updated_at";

export async function GET() {
  const { data, error } = await db().from("proposals").select(LIST).order("updated_at", { ascending: false }).limit(300);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = await Promise.all((data || []).map((p: any) => (p.invoice_number && !p.paid_at ? syncPaid(p) : p)));
  return NextResponse.json({ proposals: rows.map((p: any) => ({ ...p, url: projectUrl(p.token) })) });
}

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Links the proposal to a Nexa customer, adding a prospect when the email is new. */
async function findOrCreateCustomer(name: string, company: string, email: string, phone: string) {
  if (!email) return null;
  const supabase = db();
  const { data: found } = await supabase.from("customers").select("id").ilike("email", email).limit(1).maybeSingle();
  if (found) return found.id as string;
  const [first, ...rest] = name.split(/\s+/);
  const { data } = await supabase.from("customers").insert({
    first_name: first || null, last_name: rest.join(" ") || null, company_name: company || null,
    email, phone: phone || null, customer_type: "prospect", source: "proposal",
  }).select("id").single();
  return (data?.id as string) || null;
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const title = str(b.title);
  if (!title) return NextResponse.json({ error: "Give the proposal a title." }, { status: 400 });
  const client_name = str(b.client_name, 120), client_company = str(b.client_company, 160);
  const client_email = str(b.client_email, 200).toLowerCase(), client_phone = str(b.client_phone, 40);
  const customer_id = await findOrCreateCustomer(client_name, client_company, client_email, client_phone);
  const content = b.content ? normalizeContent(b.content) : blankContent();

  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await db().from("proposals").insert({
      token: newToken(), number: newNumber(), title, division: str(b.division, 60) || null,
      customer_id, client_name: client_name || null, client_company: client_company || null,
      client_email: client_email || null, client_phone: client_phone || null, content,
    }).select("id,token,number").single();
    if (!error) return NextResponse.json({ proposal: data, url: projectUrl(data.token) }, { status: 201 });
    if (error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Could not create a proposal number." }, { status: 500 });
}
