import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// Nexa Pro shipping quotes.
//
// Live carrier rates come from Shippo when SHIPPO_API_KEY and
// NEXA_SHIP_FROM are set on Vercel. Until then — or if Shippo is down — the
// FALLBACK table below is used so checkout never blocks.
//
// A quote is signed (HMAC with NEXA_ORDER_SECRET) and the order route only accepts
// a shipping price that carries a valid, unexpired signature for the same ZIP and
// phone count. The browser never sets the shipping price.
//
// NEXA_SHIP_FROM = JSON: {"name":"Nexa Pro","street1":"…","city":"…","state":"SC","zip":"…","phone":"8643011806"}

export type ShipOption = { id: string; carrier: string; service: string; days: number | null; amount: number };
export type Quote = { options: ShipOption[]; token: string; live: boolean };

const TTL_MS = 45 * 60_000;

// Placeholder flat rates (owner to confirm): first phone, each extra phone.
// Used only if Shippo can't be reached.
const FALLBACK: { id: string; carrier: string; service: string; days: number; first: number; extra: number }[] = [
  { id: "standard", carrier: "USPS", service: "Priority Mail", days: 3, first: 12, extra: 4 },
];

// Buyers don't pick a speed: there is ONE shipping price, for the service we ship with once the
// phone is ready. Shippo servicelevel tokens, first match wins; otherwise the cheapest rate.
const PREFERRED = ["usps_priority", "usps_ground_advantage"];

// A retail phone box with padding: ~7x4x3in, 1.3 lb. Up to 5 phones share a 10x8x6 carton.
function parcels(phones: number) {
  const out = [];
  let left = phones;
  while (left > 0) {
    const n = Math.min(5, left);
    left -= n;
    out.push(
      n === 1
        ? { length: "7", width: "4", height: "3", distance_unit: "in", weight: "1.3", mass_unit: "lb" }
        : { length: "10", width: "8", height: "6", distance_unit: "in", weight: (1.3 * n + 0.6).toFixed(1), mass_unit: "lb" }
    );
  }
  return out;
}

const money2 = (n: number) => Math.round(n * 100) / 100;

async function shippoRates(to: { zip: string; state: string; city?: string; street?: string }, phones: number): Promise<ShipOption[] | null> {
  const key = process.env.SHIPPO_API_KEY;
  const fromRaw = process.env.NEXA_SHIP_FROM;
  if (!key || !fromRaw) return null;
  let from: Record<string, string>;
  try {
    from = JSON.parse(fromRaw);
  } catch {
    console.error("NEXA_SHIP_FROM is not JSON");
    return null;
  }
  try {
    const r = await fetch("https://api.goshippo.com/shipments/", {
      method: "POST",
      headers: { Authorization: `ShippoToken ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        address_from: { ...from, country: "US" },
        address_to: { name: "Customer", street1: to.street || "", city: to.city || "", state: to.state, zip: to.zip, country: "US" },
        parcels: parcels(phones),
        async: false,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) {
      console.error("shippo", r.status, (await r.text()).slice(0, 300));
      return null;
    }
    const j = (await r.json()) as {
      rates?: { object_id: string; amount: string; provider: string; servicelevel?: { name?: string; token?: string }; estimated_days?: number | null }[];
    };
    const all = (j.rates || [])
      .map((x) => ({
        id: x.servicelevel?.token || x.object_id,
        carrier: x.provider,
        service: x.servicelevel?.name || "Shipping",
        days: x.estimated_days ?? null,
        amount: money2(Number(x.amount)),
      }))
      .filter((x) => x.amount > 0);
    if (!all.length) return null;
    for (const tok of PREFERRED) {
      const hit = all.find((x) => x.id === tok);
      if (hit) return [hit];
    }
    return [[...all].sort((a, b) => a.amount - b.amount)[0]];
  } catch (e) {
    console.error("shippo", e);
    return null;
  }
}

function fallbackRates(phones: number): ShipOption[] {
  return FALLBACK.map((f) => ({ id: f.id, carrier: f.carrier, service: f.service, days: f.days, amount: money2(f.first + f.extra * Math.max(0, phones - 1)) }));
}

function secret() {
  const s = process.env.NEXA_ORDER_SECRET;
  if (!s) throw new Error("NEXA_ORDER_SECRET missing");
  return s;
}

type Signed = { z: string; s: string; n: number; o: ShipOption[]; x: number };

function sign(p: Signed) {
  const body = Buffer.from(JSON.stringify(p)).toString("base64url");
  const mac = createHmac("sha256", secret()).update("ship." + body).digest("base64url");
  return `${body}.${mac}`;
}

export async function quote(to: { zip: string; state: string; city?: string; street?: string }, phones: number): Promise<Quote> {
  const live = await shippoRates(to, phones);
  const options = live || fallbackRates(phones);
  const token = sign({ z: to.zip.slice(0, 5), s: to.state.toUpperCase(), n: phones, o: options, x: Date.now() + TTL_MS });
  return { options, token, live: !!live };
}

/** Returns the chosen option if the token is genuine, fresh and matches this order. */
export function verifyQuote(token: string, optionId: string, to: { zip: string; state: string }, phones: number): ShipOption | null {
  const [body, mac] = String(token || "").split(".");
  if (!body || !mac) return null;
  const want = Buffer.from(createHmac("sha256", secret()).update("ship." + body).digest("base64url"));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  let p: Signed;
  try {
    p = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
  if (p.x < Date.now() || p.z !== to.zip.slice(0, 5) || p.s !== to.state.toUpperCase() || p.n !== phones) return null;
  return p.o.find((o) => o.id === optionId) || null;
}

export const shipLabel = (o: ShipOption) => `${o.carrier} ${o.service}`;
