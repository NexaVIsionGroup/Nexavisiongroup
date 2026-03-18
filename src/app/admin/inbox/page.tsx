"use client";

import AppShell from "@/components/admin/AppShell";
import AdminInbox from "@/components/admin/AdminInbox";

export default function InboxPage() {
  return (
    <AppShell title="Inbox">
      <div className="max-w-6xl mx-auto -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 -mb-16 lg:-mb-6" style={{ height: "calc(100vh - 3.5rem)" }}>
        <AdminInbox />
      </div>
    </AppShell>
  );
}
