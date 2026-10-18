import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pcc, userFromCookie, VM_COOKIE, VM_HOTSPOTS } from "@/lib/vm";

// The signed-in user's hotspot appliance: read its live status, change what it advertises,
// or restart it. Same /vm door and same vm_session cookie as the cloud phones -- the account's
// phone_id decides which device answers, so a user can only ever reach their own.
export const dynamic = "force-dynamic";
// Changing the credentials restarts the access point AND re-renders the label painted on the
// phone's own screen; that round trip measures ~25 s, so the default 10 s ceiling is far too low.
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
  return NextResponse.json(await pcc(`/${u.phone_id}/hotspot`));
}

export async function POST(req: Request) {
  const u = await me();
  if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const dev = u.phone_id!;

  switch (String(body.action ?? "")) {
    case "credentials": {
      // The rack validates these too -- it has to, since it is what writes them onto the
      // phone. Checking here as well just turns a bad paste into a fast, clearer answer.
      const ssid = String(body.ssid ?? "").trim();
      const password = String(body.password ?? "");
      if (!/^[A-Za-z0-9][A-Za-z0-9 ._-]{0,30}$/.test(ssid)) {
        return NextResponse.json(
          { ok: false, error: "Network name: 1-31 characters. Letters, numbers, space . _ - only." },
          { status: 400 });
      }
      if (!/^[A-Za-z0-9._@#%+-]{8,63}$/.test(password)) {
        return NextResponse.json(
          { ok: false, error: "Password: 8-63 characters. Letters, numbers, . _ @ # % + - only." },
          { status: 400 });
      }
      return NextResponse.json(await pcc(`/${dev}/hotspot`, "POST", { ssid, password }));
    }
    case "restart": {
      const r = await pcc(`/${dev}/cmd`, "POST", { cmd: "reboot" });
      return NextResponse.json({ ok: r.ok !== false, ...r });
    }
    default:
      return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  }
}
