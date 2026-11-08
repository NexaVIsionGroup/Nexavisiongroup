import { nxBody, nxDisplay } from "@/components/site/fonts";
import { BUSINESS_NAME } from "@/lib/proposals/types";
import "@/styles/nexa-site.css";
import "@/styles/proposal.css";

export function ProposalShell({ children }: { children: React.ReactNode }) {
  return <div className={`nxs nxp ${nxDisplay.variable} ${nxBody.variable}`}>{children}</div>;
}

const NOTICE = {
  missing: { h: "We can't find this page", p: "The link may be incomplete. Check the link in your email, or contact us and we'll send it again." },
  paused: { h: "This page is paused", p: "We've paused this link for now. Contact us and we'll get you back in." },
  expired: { h: "This proposal has expired", p: "Contact us and we'll send you an updated one." },
};

export function LinkNotice({ state }: { state: "missing" | "paused" | "expired" }) {
  const n = NOTICE[state];
  return (
    <div className="nxp-page nxp-notice">
      <div>
        <p className="nxp-kind">{BUSINESS_NAME}</p>
        <h1>{n.h}</h1>
        <p>{n.p}</p>
        <p><a href="mailto:info@nexavisiongroup.com">info@nexavisiongroup.com</a></p>
      </div>
    </div>
  );
}
