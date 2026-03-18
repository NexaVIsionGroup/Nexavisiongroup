"use client";

import AppShell from "@/components/admin/AppShell";
import { FileText } from "lucide-react";

export default function ProposalsPage() {
  return (
    <AppShell title="Proposals">
      <div className="max-w-6xl mx-auto">
        <div className="nv-glass rounded-nv-lg p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="w-16 h-16 bg-nv-violet/10 rounded-full flex items-center justify-center mb-4">
            <FileText size={28} className="text-nv-violet" />
          </div>
          <h2 className="font-display font-bold text-xl text-nv-text-primary">
            Proposals
          </h2>
          <p className="text-nv-text-muted text-sm mt-2 max-w-md">
            Create, send, and track project proposals. 6-step wizard with deliverables, pricing, payment schedules, and PDF generation.
          </p>
          <div className="nv-chip mt-4">Phase 4</div>
        </div>
      </div>
    </AppShell>
  );
}
