import type { Template } from "@/lib/questionnaires/types";
import { thaiStation } from "./thai-station-cafe/checkup";

// PROSPECT STAGING AREA (see ./README.md)
// Every new client starts here on the NexaVision stack: a check-up link at
// nexavisiongroup.com/q/<token>, answers in the Nexa Supabase, assets under
// public/p/<client>/. Once a client signs, their real site is built on their
// OWN GitHub/Vercel/Supabase, and their folder here is archived.

export const PROSPECT_TEMPLATES: Template[] = [thaiStation];
