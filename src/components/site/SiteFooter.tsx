import Link from "next/link";
import { nav, CHECKUP_HREF } from "./content";

export function SiteFooter() {
  return (
    <footer className="bg-nx-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <p className="font-nx-display text-[24px] font-extrabold tracking-[-0.02em]">NexaVision Group</p>
          <p className="mt-3 max-w-sm text-[17px] leading-relaxed text-white/75">
            Websites and business apps, built for you and run by us. Based in South Carolina, working with businesses everywhere.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="mb-3 text-[15px] font-bold text-nx-sun">Pages</p>
          <ul className="space-y-2 text-[17px]">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-white/85 hover:text-white hover:underline">{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="mb-3 text-[15px] font-bold text-nx-sun">Get in touch</p>
          <ul className="space-y-2 text-[17px]">
            <li><Link href={CHECKUP_HREF} className="text-white/85 hover:text-white hover:underline">Get a free check-up</Link></li>
            <li><a href="mailto:admin@nexavisiongroup.com" className="text-white/85 hover:text-white hover:underline">admin@nexavisiongroup.com</a></li>
            <li><Link href="/privacy" className="text-white/85 hover:text-white hover:underline">Privacy policy</Link></li>
            <li><Link href="/terms" className="text-white/85 hover:text-white hover:underline">Terms of use</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-5 py-6 text-[15px] text-white/60 md:px-8">
          © {new Date().getFullYear()} NexaVision Group. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
