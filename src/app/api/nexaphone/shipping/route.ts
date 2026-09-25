import { NextResponse } from "next/server";
import { quote } from "@/lib/nexaphone/shipping";

// Checkout asks for rates as soon as the address has a ZIP and state.
// Only the phone count matters to the parcel, so that's all the browser sends.
export async function POST(req: Request) {
  let b: { zip?: string; state?: string; city?: string; street?: string; phones?: number };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const zip = String(b.zip || "").trim();
  const state = String(b.state || "").trim().toUpperCase();
  const phones = Math.floor(Number(b.phones));
  if (!/^\d{5}(-\d{4})?$/.test(zip)) return NextResponse.json({ error: "Enter a 5-digit ZIP." }, { status: 400 });
  if (!/^[A-Z]{2}$/.test(state)) return NextResponse.json({ error: "Enter a 2-letter state." }, { status: 400 });
  if (!(phones >= 1 && phones <= 500)) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  const q = await quote({ zip, state, city: String(b.city || "").slice(0, 80), street: String(b.street || "").slice(0, 200) }, phones);
  return NextResponse.json(q, { headers: { "Cache-Control": "no-store" } });
}
