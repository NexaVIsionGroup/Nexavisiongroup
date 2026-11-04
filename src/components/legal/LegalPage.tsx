import type { ReactNode } from "react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen pt-32 pb-24">
      <article className="nv-container max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{title}</h1>
        <p className="text-nv-text-muted mb-12">Last updated: {updated}</p>
        <div className="space-y-8 text-lg leading-relaxed text-white/80 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:text-nv-teal [&_a]:underline">
          {children}
        </div>
      </article>
    </main>
  );
}
