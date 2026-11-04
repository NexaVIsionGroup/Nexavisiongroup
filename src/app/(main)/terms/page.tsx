import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms for using nexavisiongroup.com.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="November 3, 2026">
      <p>
        By using nexavisiongroup.com you agree to these terms. If you hire us for a project, the
        written agreement or quote for that project is what governs the work, and it takes priority
        over this page.
      </p>
      <section>
        <h2>Using this website</h2>
        <p>You may browse this site and contact us for your own business purposes. Please do not misuse the site, try to break into it, or copy its content for commercial use without permission.</p>
      </section>
      <section>
        <h2>Information on this site</h2>
        <p>We work to keep our content and prices accurate. &quot;Starting at&quot; prices are estimates; your final price is the one in your written quote.</p>
      </section>
      <section>
        <h2>Client work shown here</h2>
        <p>Projects shown on this site are shown with permission. Their names, logos, and content belong to their owners.</p>
      </section>
      <section>
        <h2>Limits</h2>
        <p>This website is provided &quot;as is.&quot; To the extent allowed by law, we are not responsible for losses that come from using it or from links to other websites.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Questions about these terms? Email <a href="mailto:admin@nexavisiongroup.com">admin@nexavisiongroup.com</a>.</p>
      </section>
    </LegalPage>
  );
}
