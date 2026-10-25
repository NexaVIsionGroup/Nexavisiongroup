import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/** The thin blue rule + small tag that closes a chapter and points at the next one. */
export default function ChapterEnd({ label, href }: { label: string; href: string }) {
  return (
    <div className="np-wrap np-chapter-end">
      <Link href={href} aria-label={`Next: ${label}`}>
        <span>{label}</span>
        <ArrowUpRight size={18} />
      </Link>
    </div>
  );
}
