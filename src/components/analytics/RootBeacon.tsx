"use client";

import { usePathname } from "next/navigation";
import Beacon from "./Beacon";

// The (nexaphone) route group has its own Beacon(site="nexaphone") nested inside this
// root layout — skip here so a /nexaphone page (on either host) isn't counted twice.
export default function RootBeacon() {
  const pathname = usePathname();
  if (pathname?.startsWith("/nexaphone")) return null;
  return <Beacon site="nexavisiongroup" />;
}
