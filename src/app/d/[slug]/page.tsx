import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { docCookieName, isExpired, verifyDocAccess } from "@/lib/documents";
import DocFrame from "./DocFrame";
import PasswordGate from "./PasswordGate";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string } };

async function getDoc(slug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("shared_documents")
    .select("id, slug, title, description, client_name, status, expires_at, password_hash, show_toolbar")
    .eq("slug", slug)
    .single();
  return data;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const doc = await getDoc(params.slug);
  if (!doc) return { title: "Document not found", robots: { index: false, follow: false } };
  return {
    title: doc.title,
    description: doc.description || `A document prepared by NexaVision Group.`,
    robots: { index: false, follow: false },
    openGraph: {
      title: doc.title,
      description: doc.description || "Prepared by NexaVision Group",
      type: "article",
      siteName: "NexaVision Group",
    },
    twitter: { card: "summary_large_image", title: doc.title },
  };
}

function Notice({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm nv-glass-elevated rounded-nv-xl p-8 text-center">
        <h1 className="font-display font-semibold text-lg text-nv-text-primary mb-2">{heading}</h1>
        <p className="text-sm text-nv-text-muted">{body}</p>
        <p className="text-[11px] text-nv-text-muted mt-6">
          <a href="https://nexavisiongroup.com" className="nv-gradient-text-teal font-medium">
            NexaVision Group
          </a>
        </p>
      </div>
    </div>
  );
}

export default async function SharedDocumentPage({ params }: Params) {
  const doc = await getDoc(params.slug);

  if (!doc) {
    return (
      <Notice
        heading="Document not found"
        body="This link doesn't exist. Check the address, or ask the sender for a fresh link."
      />
    );
  }

  if (doc.status !== "active") {
    return (
      <Notice
        heading="Link turned off"
        body="This document is no longer being shared. Reach out to your contact at NexaVision Group for access."
      />
    );
  }

  if (isExpired(doc.expires_at)) {
    return (
      <Notice
        heading="Link expired"
        body="This share link has expired. Ask your contact at NexaVision Group to send a new one."
      />
    );
  }

  if (doc.password_hash) {
    const cookie = cookies().get(docCookieName(doc.id))?.value;
    if (!verifyDocAccess(doc.id, cookie)) {
      return <PasswordGate slug={doc.slug} title={doc.title} />;
    }
  }

  return (
    <DocFrame
      src={`/d/${doc.slug}/view`}
      title={doc.title}
      showToolbar={doc.show_toolbar !== false}
    />
  );
}
