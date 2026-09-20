import type { Metadata } from "next";
import JoinClient from "./JoinClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set up Nexa Cloud", robots: { index: false, follow: false } };

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <JoinClient token={token} />;
}
