"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AccessLinkPage() {
  const { token } = useParams<{ token: string }>();
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const validateAccess = async () => {
      try {
        const res = await fetch("/api/admin/auth/access-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Invalid or expired access link");
        }

        // Access link sets the auth cookie — redirect to admin
        router.replace("/admin");
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      }
    };

    validateAccess();
  }, [token, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-nv-void flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-nv-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-nv-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="font-display font-bold text-xl text-nv-text-primary">
            Link Expired
          </h2>
          <p className="text-nv-text-secondary text-sm mt-2">{error}</p>
          <a
            href="/admin/login"
            className="inline-block mt-4 text-nv-teal text-sm hover:underline"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nv-void flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} className="text-nv-teal animate-spin" />
        <p className="text-nv-text-secondary text-sm font-mono tracking-wider uppercase">
          Verifying access...
        </p>
      </div>
    </div>
  );
}
