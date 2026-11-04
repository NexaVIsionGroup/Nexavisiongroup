import Link from "next/link";
import { nav, CHECKUP_HREF } from "./content";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="nxs-footer nxs-dark">
      <div className="nxs-wrap">
        <div className="nxs-footer-grid">
          <div>
            <Logo uid="foot" />
            <p style={{ marginTop: 16, maxWidth: 26 + "em", color: "#b7c8c4" }}>
              Websites and business apps, built for you and run by us. From a café&rsquo;s online menu to a company&rsquo;s entire operation.
            </p>
          </div>
          <nav aria-label="Footer">
            <h4>Pages</h4>
            <ul>{nav.map((n) => <li key={n.href}><Link href={n.href}>{n.label}</Link></li>)}</ul>
          </nav>
          <div>
            <h4>Get in touch</h4>
            <ul>
              <li><Link href={CHECKUP_HREF}>Get a free check-up</Link></li>
              <li><a href="mailto:admin@nexavisiongroup.com">admin@nexavisiongroup.com</a></li>
              <li><Link href="/privacy">Privacy policy</Link></li>
              <li><Link href="/terms">Terms of use</Link></li>
            </ul>
          </div>
        </div>
        <p className="nxs-footer-base">© {new Date().getFullYear()} NexaVision Group. Based in South Carolina, working with businesses everywhere.</p>
      </div>
    </footer>
  );
}
