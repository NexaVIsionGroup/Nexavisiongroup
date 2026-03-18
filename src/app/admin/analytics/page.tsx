"use client";

import AppShell from "@/components/admin/AppShell";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <AppShell title="Analytics">
      <div className="max-w-6xl mx-auto">
        <div className="nv-glass rounded-nv-lg p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="w-16 h-16 bg-nv-info/10 rounded-full flex items-center justify-center mb-4">
            <BarChart3 size={28} className="text-nv-info" />
          </div>
          <h2 className="font-display font-bold text-xl text-nv-text-primary">
            Analytics
          </h2>
          <p className="text-nv-text-muted text-sm mt-2 max-w-md">
            Revenue metrics, pipeline value, proposal win rate, and payment collection timelines.
          </p>
          <div className="nv-chip mt-4">Phase 7</div>
        </div>
      </div>
    </AppShell>
  );
}
