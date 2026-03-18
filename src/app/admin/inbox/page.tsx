"use client";

import AuthGuard from "@/components/admin/AuthGuard";
import AdminInbox from "@/components/admin/AdminInbox";

export default function InboxPage() {
  return (
    <AuthGuard>
      <div className="h-screen w-screen bg-nv-void">
        <AdminInbox />
      </div>
    </AuthGuard>
  );
}
