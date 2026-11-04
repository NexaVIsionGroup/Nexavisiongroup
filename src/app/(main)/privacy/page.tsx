import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How NexaVision Group collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 3, 2026">
      <p>
        NexaVision Group (&quot;we,&quot; &quot;us&quot;) builds websites and business apps for local
        businesses. This policy explains what information we collect on nexavisiongroup.com and how
        we use it.
      </p>
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Information you give us, such as your name, business name, email, phone number, and anything you write in our forms.</li>
          <li>Basic visit information, such as pages viewed, device type, and approximate location, used to understand how the site is used.</li>
          <li>For clients only: business information and login details you choose to share with us so we can build or manage your project. These are stored encrypted.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To reply to you, prepare quotes, and deliver the work you hire us for.</li>
          <li>To improve our website and services.</li>
          <li>To send you messages about your project. We do not send marketing spam.</li>
        </ul>
      </section>
      <section>
        <h2>What we never do</h2>
        <p>We do not sell your information. We only share it with service providers we use to run our business (for example hosting, email, and payment companies), and only as needed to do the work, or when required by law.</p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>You can ask us to see, correct, or delete the information we have about you at any time by emailing <a href="mailto:admin@nexavisiongroup.com">admin@nexavisiongroup.com</a>.</p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>If we update this policy, we will change the date at the top of this page.</p>
      </section>
    </LegalPage>
  );
}
