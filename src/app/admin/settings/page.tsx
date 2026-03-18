"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/admin/AppShell";
import {
  Settings,
  UserPlus,
  Copy,
  Check,
  Loader2,
  Shield,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [inviteRole, setInviteRole] = useState("team_member");
  const supabase = createClient();

  const generateInvite = async () => {
    setGenerating(true);

    // Generate a 30-char random token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map((b) => b.toString(36).padStart(2, "0"))
      .join("")
      .slice(0, 30);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("invite_tokens").insert({
      token,
      role: inviteRole,
      created_by: user?.email || "unknown",
    });

    const origin = window.location.origin;
    setInviteLink(`${origin}/admin/join/${token}`);
    setGenerating(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell title="Settings">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Team & Access */}
        <div className="nv-glass rounded-nv-lg p-5">
          <div className="flex items-center gap-3 mb-5">
            <Shield size={20} className="text-nv-teal" />
            <h3 className="font-display font-semibold text-nv-text-primary">
              Team & Access
            </h3>
          </div>

          <div className="space-y-4">
            {/* Generate Invite */}
            <div>
              <label className="block text-nv-text-secondary text-sm font-medium mb-2">
                Invite a team member
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-sm text-nv-text-primary focus:outline-none focus:border-nv-teal/50 transition-all"
                >
                  <option value="team_member">Team Member</option>
                  <option value="admin">Admin</option>
                  <option value="developer">Developer</option>
                </select>
                <button
                  onClick={generateInvite}
                  disabled={generating}
                  className="nv-btn-primary py-2 px-4 text-xs"
                >
                  {generating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={14} />
                      Generate Link
                    </>
                  )}
                </button>
              </div>

              {inviteLink && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-nv-void/60 border border-white/10 rounded-nv-md text-xs text-nv-teal font-mono truncate"
                  />
                  <button
                    onClick={copyLink}
                    className="p-2 rounded-lg bg-white/5 hover:bg-nv-teal/10 text-nv-text-muted hover:text-nv-teal transition-colors"
                  >
                    {copied ? (
                      <Check size={16} className="text-nv-success" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Accounts Placeholder */}
        <div className="nv-glass rounded-nv-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <Mail size={20} className="text-nv-teal" />
            <h3 className="font-display font-semibold text-nv-text-primary">
              Email Accounts
            </h3>
          </div>
          <p className="text-nv-text-muted text-sm">
            Email account configuration coming in Phase 2.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
