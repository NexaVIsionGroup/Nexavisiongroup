import type { Metadata } from "next";
import JoinClient from "./JoinClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Join Nexa Video", robots: { index: false, follow: false } };

export default async function NexaVideoJoin({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <JoinClient token={token} />;
}
