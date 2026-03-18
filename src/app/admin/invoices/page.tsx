"use client";

import AppShell from "@/components/admin/AppShell";
import { Receipt } from "lucide-react";

export default function InvoicesPage() {
  return (
    <AppShell title="Invoices">
      <div className="max-w-6xl mx-auto">
        <div className="nv-glass rounded-nv-lg p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="w-16 h-16 bg-nv-ember/10 rounded-full flex items-center justify-center mb-4">
            <Receipt size={28} className="text-nv-ember" />
          </div>
          <h2 className="font-display font-bold text-xl text-nv-text-primary">
            Invoices
          </h2>
          <p className="text-nv-text-muted text-sm mt-2 max-w-md">
            Invoice management with Stripe payments, auto-PDF generation, payment terms, financing agreements, and auto-email on events.
          </p>
          <div className="nv-chip mt-4">Phase 4</div>
        </div>
      </div>
    </AppShell>
  );
}
