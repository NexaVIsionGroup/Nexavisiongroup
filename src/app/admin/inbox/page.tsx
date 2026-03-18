"use client";

import AppShell from "@/components/admin/AppShell";
import { Mail } from "lucide-react";

export default function InboxPage() {
  return (
    <AppShell title="Inbox">
      <div className="max-w-6xl mx-auto">
        <div className="nv-glass rounded-nv-lg p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="w-16 h-16 bg-nv-teal/10 rounded-full flex items-center justify-center mb-4">
            <Mail size={28} className="text-nv-teal" />
          </div>
          <h2 className="font-display font-bold text-xl text-nv-text-primary">
            Email Client
          </h2>
          <p className="text-nv-text-muted text-sm mt-2 max-w-md">
            Full Gmail-style inbox coming in Phase 2. Multi-account support, threads, compose, reply, forward, contacts, and attachments.
          </p>
          <div className="nv-chip mt-4">Phase 2</div>
        </div>
      </div>
    </AppShell>
  );
}
