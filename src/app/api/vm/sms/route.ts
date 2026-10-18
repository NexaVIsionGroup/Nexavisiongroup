import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pcc, userFromCookie, VM_COOKIE, VM_HOTSPOTS } from "@/lib/vm";

// Texting from the appliance's own SIM. That number receives the business's verification codes
// and the phone's screen is broken, so reading and replying happen here instead.
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function me() {
  const jar = await cookies();
  const u = await userFromCookie(jar.get(VM_COOKIE)?.value);
  if (!u || !u.phone_id || !VM_HOTSPOTS[u.phone_id]) return null;
  return u;
}

export async function GET() {
  const u = await me();
  if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json(await pcc(`/${u.phone_id}/sms`));
}

export async function POST(req: Request) {
  const u = await me();
  if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const dev = u.phone_id!;

  switch (String(body.action ?? "send")) {
    case "send": {
      // The rack validates these too -- it is what hands them to the phone. Checking here just
      // turns a bad number into a fast, clearer answer.
      const number = String(body.number ?? "").trim();
      const text = String(body.body ?? "");
      if (!/^\+?[0-9][0-9 ()\-]{4,24}$/.test(number)) {
        return NextResponse.json({ ok: false, error: "That does not look like a phone number." }, { status: 400 });
      }
      if (!text.trim()) {
        return NextResponse.json({ ok: false, error: "Nothing to send." }, { status: 400 });
      }
      return NextResponse.json(await pcc(`/${dev}/sms`, "POST", { action: "send", number, body: text }));
    }
    // A sent text cannot be edited -- the carrier already delivered it, so an "edit" would only
    // rewrite the local copy into something that never went out. Deleting is the honest option.
    case "delete":
      return NextResponse.json(await pcc(`/${dev}/sms`, "POST", { action: "delete", id: body.id }));
    default:
      return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  }
}
