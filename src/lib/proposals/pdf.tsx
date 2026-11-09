import React from "react";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { BUSINESS_NAME, MOTTO, defaultPackage, dueAtSigning, money, normalizeContent, surchargeOn } from "./types";

const INK = "#10211f", PINE = "#0f5c55", MUTED = "#51625f", LINE = "#d5dedb";
const s = StyleSheet.create({
  page: { padding: 46, fontFamily: "Helvetica", fontSize: 10.5, color: INK, lineHeight: 1.45 },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 13, color: PINE },
  meta: { fontSize: 9.5, color: MUTED, marginTop: 2 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 21, marginTop: 18, marginBottom: 6, lineHeight: 1.15 },
  h2: { fontFamily: "Helvetica-Bold", fontSize: 13, color: PINE, marginTop: 18, marginBottom: 6 },
  b: { fontFamily: "Helvetica-Bold" },
  item: { marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: LINE },
  cols: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: LINE },
  col: { flex: 1, paddingRight: 8 },
  small: { fontSize: 9, color: MUTED },
  sigBox: { marginTop: 8, padding: 12, borderWidth: 1, borderColor: LINE, borderRadius: 4 },
  sig: { width: 190, height: 62, objectFit: "contain", marginBottom: 6 },
  audit: { fontSize: 8.5, color: MUTED, marginTop: 8 },
  foot: { position: "absolute", bottom: 24, left: 46, right: 46, fontSize: 8.5, color: MUTED, textAlign: "center" },
});

const fmt = (d: string) => new Date(d).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "America/New_York" }) + " ET";

export function renderProposalPdf(p: any): Promise<Buffer> {
  const c = normalizeContent(p.signed_snapshot?.content || p.content);
  const pkg = c.packages.find((x) => x.id === p.selected_package_id) || defaultPackage(c);
  const due = p.due_amount != null ? Number(p.due_amount) : dueAtSigning(c, pkg);
  const fee = surchargeOn(c, due);
  const who = p.client_company || p.client_name || "";
  const autopay: boolean | null = typeof p.signed_snapshot?.autopay_opt_in === "boolean" ? p.signed_snapshot.autopay_opt_in : null;
  const ramp = pkg?.ramp?.filter((r) => Number(r.monthly) > 0) || [];

  return renderToBuffer(
    <Document title={`${p.title} (${p.number})`} author={BUSINESS_NAME}>
      <Page size="LETTER" style={s.page}>
        <Text style={s.brand}>{BUSINESS_NAME}</Text>
        <Text style={s.meta}>{MOTTO}  ·  {p.signed_at ? "Signed agreement" : "Proposal"} {p.number}</Text>
        <Text style={s.title}>{p.title}</Text>
        {!!who && <Text>Prepared for {who}{p.client_company && p.client_name ? `, attention ${p.client_name}` : ""}</Text>}
        {!!c.intro && <Text style={{ marginTop: 8 }}>{c.intro}</Text>}

        {c.findings.length > 0 && <View><Text style={s.h2}>What we found</Text>{c.findings.map((f, i) => (
          <View key={i} style={s.item}>
            <Text style={s.b}>{f.stat ? `${f.stat} ${f.statLabel ? `(${f.statLabel}) ` : ""}— ` : ""}{f.title}</Text>
            {!!f.detail && <Text>{f.detail}</Text>}
            {f.body?.map((para, n) => <Text key={n}>{para}</Text>)}
            {f.compare?.map((r, n) => <Text key={n} style={s.small}>{r.source}: {r.value}</Text>)}
            {f.bars?.map((r, n) => <Text key={n} style={s.small}>{r.label}{r.note ? ` ${r.note}` : ""}: {money(r.value)}</Text>)}
            {!!f.fix && <Text>What we&apos;d do: {f.fix}</Text>}
            {!!f.source && <Text style={s.small}>{f.source}</Text>}
          </View>
        ))}</View>}

        {!!c.strengths?.length && <View><Text style={s.h2}>What&apos;s working</Text>{c.strengths.map((f, i) => (
          <View key={i} style={s.item} wrap={false}><Text style={s.b}>{f.stat ? `${f.stat} — ` : ""}{f.title}</Text>{!!f.detail && <Text>{f.detail}</Text>}</View>
        ))}</View>}

        {!!c.comparison?.rows?.length && <View><Text style={s.h2}>{c.comparison.heading || "Today and after"}</Text>
          <View style={s.cols}><Text style={[s.col, s.b]}> </Text><Text style={[s.col, s.b]}>Today</Text><Text style={[s.col, s.b]}>With {BUSINESS_NAME}</Text></View>
          {c.comparison.rows.map((r, i) => (
            <View key={i} style={s.cols} wrap={false}><Text style={[s.col, s.b]}>{r.label}</Text><Text style={s.col}>{r.today}</Text><Text style={s.col}>{r.after}</Text></View>
          ))}
        </View>}

        {c.goals.length > 0 && <View><Text style={s.h2}>Your goals</Text>{c.goals.map((g, i) => <Text key={i} style={s.item}>{"•"} {g}</Text>)}</View>}

        {!!c.features?.length && <View><Text style={s.h2}>What we&apos;ll build</Text>{c.features.map((f, i) => (
          <View key={i} style={s.item} wrap={false}><Text style={s.b}>{f.title}</Text><Text>{f.body}</Text></View>
        ))}</View>}

        {c.work.length > 0 && <View><Text style={s.h2}>What we&apos;ll do</Text>{c.work.map((w, i) => (
          <View key={i} style={s.item} wrap={false}>
            <Text style={s.b}>{w.area}</Text>
            {!!w.detail && <Text>{w.detail}</Text>}
            {w.items.map((it, n) => <Text key={n}>{"•"} {it}</Text>)}
          </View>
        ))}</View>}

        {c.timeline.length > 0 && <View><Text style={s.h2}>Timeline</Text>{c.timeline.map((t, i) => (
          <View key={i} style={s.cols} wrap={false}><Text style={{ flex: 1, paddingRight: 12 }}><Text style={s.b}>{t.label}</Text>{t.note ? ` — ${t.note}` : ""}</Text><Text style={{ width: 120, textAlign: "right", color: MUTED }}>{t.when}</Text></View>
        ))}</View>}

        {pkg && <View wrap={false}><Text style={s.h2}>{p.signed_at ? "What was selected" : "Pricing"}</Text>
          <Text style={s.b}>{pkg.name}</Text>
          {!!pkg.description && <Text>{pkg.description}</Text>}
          {pkg.includes.map((it, n) => <Text key={n}>{"•"} {it}</Text>)}
          <View style={{ marginTop: 6 }}>
            {Number(pkg.price) > 0 && <View style={s.row}><Text>{pkg.setupLabel || "One-time"}</Text><Text>{money(pkg.price)}</Text></View>}
            {ramp.map((r) => <View key={r.label} style={s.row}><Text>Monthly, {r.label}</Text><Text>{money(r.monthly)}/mo</Text></View>)}
            {Number(pkg.monthly) > 0 && <View style={s.row}><Text>{pkg.monthlyLabel ? `Monthly, ${pkg.monthlyLabel.toLowerCase()}` : ramp.length ? "Monthly after that" : "Monthly"}</Text><Text>{money(pkg.monthly)}/mo</Text></View>}
            {!!pkg.rampNote && <Text>{pkg.rampNote}</Text>}
            {!!pkg.percent && Number(pkg.percent.rate) > 0 && <View style={s.row}><Text>Plus {pkg.percent.rate}% of {pkg.percent.of}</Text><Text>{pkg.percent.rate}%</Text></View>}
            {due > 0 && <View style={s.row}><Text>Due at signing</Text><Text>{money(due)}</Text></View>}
            {fee > 0 && <View style={s.row}><Text>4% card fee on the amount due</Text><Text>{money(fee)}</Text></View>}
          </View>
        </View>}
        {!!c.payment.schedule?.length && (
          <View style={{ marginTop: 8 }}>
            <Text style={s.b}>When you pay</Text>
            {c.payment.schedule.map((x, i) => <View key={i} style={s.cols} wrap={false}><Text style={{ flex: 1, paddingRight: 12 }}>{x.when}{x.note ? ` (${x.note})` : ""}</Text><Text style={{ width: 80, textAlign: "right" }}>{money(x.amount)}</Text></View>)}
          </View>
        )}
        {!!c.payment.notes && <Text style={{ marginTop: 8 }}>{c.payment.notes}</Text>}
        {autopay !== null && <Text style={{ marginTop: 6 }}><Text style={s.b}>Monthly billing: </Text>{autopay ? "automatic card billing each month, chosen at signing." : "invoiced each month, paid by the customer; automatic billing declined at signing."}</Text>}

        <Text style={s.h2}>Terms</Text>
        {c.terms.map((t, i) => <View key={i} style={s.item}><Text style={s.b}>{t.title}</Text><Text>{t.text}</Text></View>)}

        {p.signed_at && (
          <View wrap={false}>
            <Text style={s.h2}>Signature</Text>
            <View style={s.sigBox}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              {!!p.signature_data && <Image src={p.signature_data} style={s.sig} />}
              <Text style={s.b}>{p.signed_name}{p.signed_title ? `, ${p.signed_title}` : ""}</Text>
              <Text>Signed {fmt(p.signed_at)}</Text>
              <Text style={s.audit}>Signed electronically from IP {p.signer_ip || "unknown"}. Document fingerprint (SHA-256): {p.signed_hash}</Text>
            </View>
          </View>
        )}
        <Text style={s.foot} fixed render={({ pageNumber, totalPages }) => `${BUSINESS_NAME}  |  ${p.number}  |  Page ${pageNumber} of ${totalPages}`} />
      </Page>
    </Document>
  ) as unknown as Promise<Buffer>;
}

// ── Service agreement: the formal 2-3 page document (letterhead, parties, fees, schedule, terms, signatures) ──
const A_INK = "#1d150e", A_COPPER = "#a86a2c", A_MUTED = "#6b5a49", A_LINE = "#e3d6c4", A_SOFT = "#f7f0e5";
const a = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 56, paddingHorizontal: 48, fontFamily: "Helvetica", fontSize: 10, color: A_INK, lineHeight: 1.45 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: A_COPPER },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 15, letterSpacing: 1.5 },
  motto: { fontSize: 9, color: A_MUTED, marginTop: 3 },
  docType: { fontFamily: "Times-Bold", fontSize: 18, textAlign: "right" },
  docMeta: { fontSize: 9, color: A_MUTED, textAlign: "right", marginTop: 2 },
  draft: { marginTop: 12, padding: 8, backgroundColor: A_SOFT, borderLeftWidth: 3, borderLeftColor: A_COPPER, fontSize: 9, color: A_MUTED },
  parties: { flexDirection: "row", marginTop: 16 },
  party: { flex: 1, padding: 12, borderWidth: 1, borderColor: A_LINE, borderRadius: 4 },
  label: { fontSize: 8, color: A_COPPER, fontFamily: "Helvetica-Bold", letterSpacing: 1.2, marginBottom: 4 },
  strong: { fontFamily: "Helvetica-Bold" },
  h2: { fontFamily: "Times-Bold", fontSize: 13, marginTop: 18, marginBottom: 6, color: A_INK },
  muted: { color: A_MUTED },
  small: { fontSize: 8.5, color: A_MUTED },
  bullets: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  bullet: { width: "50%", paddingRight: 10, marginBottom: 3 },
  tHead: { flexDirection: "row", backgroundColor: A_INK, color: "#ffffff", paddingVertical: 5, paddingHorizontal: 8, fontFamily: "Helvetica-Bold", fontSize: 9 },
  tRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: A_LINE },
  tTotal: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, backgroundColor: A_SOFT, fontFamily: "Helvetica-Bold" },
  cItem: { flex: 1, paddingRight: 10 },
  cAmt: { width: 110, textAlign: "right" },
  term: { marginBottom: 7 },
  sigs: { flexDirection: "row", marginTop: 8 },
  sigBox: { flex: 1, padding: 12, borderWidth: 1, borderColor: A_LINE, borderRadius: 4, minHeight: 120 },
  sigImg: { width: 180, height: 56, objectFit: "contain" },
  sigLine: { borderBottomWidth: 1, borderBottomColor: A_INK, height: 44, marginBottom: 4 },
  foot: { position: "absolute", bottom: 24, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: A_MUTED, borderTopWidth: 1, borderTopColor: A_LINE, paddingTop: 6 },
});
const day = (d: string | Date) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });

export function renderAgreementPdf(p: any, opts: { link?: string } = {}): Promise<Buffer> {
  const c = normalizeContent(p.signed_snapshot?.content || p.content);
  const pkg = c.packages.find((x) => x.id === p.selected_package_id) || defaultPackage(c);
  const due = p.due_amount != null ? Number(p.due_amount) : dueAtSigning(c, pkg);
  const fee = surchargeOn(c, due);
  const signed = !!p.signed_at;
  const autopay: boolean | null = typeof p.signed_snapshot?.autopay_opt_in === "boolean" ? p.signed_snapshot.autopay_opt_in : null;
  const ramp = pkg?.ramp?.filter((r) => Number(r.monthly) > 0) || [];
  let n = 0;
  const sec = (t: string) => `${++n}. ${t}`;

  return renderToBuffer(
    <Document title={`Service Agreement ${p.number}`} author={BUSINESS_NAME} subject={p.title}>
      <Page size="LETTER" style={a.page}>
        <View style={a.head}>
          <View>
            <Text style={a.brand}>NEXAVISION GROUP</Text>
            <Text style={a.motto}>{MOTTO}</Text>
            <Text style={a.motto}>info@nexavisiongroup.com  ·  nexavisiongroup.com</Text>
          </View>
          <View>
            <Text style={a.docType}>Service Agreement</Text>
            <Text style={a.docMeta}>No. {p.number}</Text>
            <Text style={a.docMeta}>{signed ? `Signed ${day(p.signed_at)}` : `Issued ${day(p.sent_at || p.created_at || new Date())}`}</Text>
            {!signed && !!p.expires_at && <Text style={a.docMeta}>Pricing valid through {day(p.expires_at)}</Text>}
          </View>
        </View>

        {!signed && <Text style={a.draft}>Copy for review. {opts.link ? `Sign online at ${opts.link}` : "Sign online at the link we sent you"}. Your signed copy is emailed to you automatically.</Text>}

        <View style={a.parties}>
          <View style={[a.party, { marginRight: 12 }]}>
            <Text style={a.label}>PROVIDER</Text>
            <Text style={a.strong}>{BUSINESS_NAME}</Text>
            <Text style={a.muted}>info@nexavisiongroup.com</Text>
            <Text style={a.muted}>nexavisiongroup.com</Text>
          </View>
          <View style={a.party}>
            <Text style={a.label}>CLIENT</Text>
            <Text style={a.strong}>{p.client_company || p.client_name}</Text>
            {!!p.client_company && !!p.client_name && <Text style={a.muted}>Attention: {p.client_name}</Text>}
            {!!p.client_email && <Text style={a.muted}>{p.client_email}</Text>}
            {!!p.client_phone && <Text style={a.muted}>{String(p.client_phone).replace(/^1?(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3")}</Text>}
          </View>
        </View>

        {pkg && <View>
          <Text style={a.h2}>{sec("Services")}</Text>
          <Text><Text style={a.strong}>{pkg.name}. </Text>{pkg.description}</Text>
          <View style={a.bullets}>{pkg.includes.map((it, i) => <Text key={i} style={a.bullet}>{"•"}  {it}</Text>)}</View>
          <Text style={[a.small, { marginTop: 4 }]}>The full scope, findings and timeline are set out in Proposal {p.number}, which forms part of this agreement.</Text>
        </View>}

        {pkg && <View wrap={false}>
          <Text style={a.h2}>{sec("Fees")}</Text>
          <View style={a.tHead}><Text style={a.cItem}>Item</Text><Text style={a.cAmt}>Amount</Text></View>
          {Number(pkg.price) > 0 && <View style={a.tRow}><Text style={a.cItem}>{pkg.setupLabel || "Setup"}, one time</Text><Text style={a.cAmt}>{money(pkg.price)}</Text></View>}
          {ramp.map((r) => <View key={r.label} style={a.tRow}><Text style={a.cItem}>Monthly service, {r.label.toLowerCase()}</Text><Text style={a.cAmt}>{money(r.monthly)} / month</Text></View>)}
          {Number(pkg.monthly) > 0 && <View style={a.tRow}><Text style={a.cItem}>Monthly service, {(pkg.monthlyLabel || (ramp.length ? "after that" : "monthly")).toLowerCase()}</Text><Text style={a.cAmt}>{money(pkg.monthly)} / month</Text></View>}
          {!!pkg.percent && Number(pkg.percent.rate) > 0 && <View style={a.tRow}><Text style={a.cItem}>Plus {pkg.percent.rate}% of {pkg.percent.of}</Text><Text style={a.cAmt}>{pkg.percent.rate}%</Text></View>}
          {fee > 0 && <View style={a.tRow}><Text style={a.cItem}>4% card fee on the amount due at signing</Text><Text style={a.cAmt}>{money(fee)}</Text></View>}
          {due > 0 && <View style={a.tTotal}><Text style={a.cItem}>Due at signing</Text><Text style={a.cAmt}>{money(due + fee)}</Text></View>}
          {!!pkg.rampNote && <Text style={[a.small, { marginTop: 6 }]}>{pkg.rampNote}</Text>}
        </View>}

        {!!c.payment.schedule?.length && <View wrap={false}>
          <Text style={a.h2}>{sec("Payment schedule")}</Text>
          <View style={a.tHead}><Text style={a.cItem}>When</Text><Text style={a.cAmt}>Amount</Text></View>
          {c.payment.schedule.map((x, i) => (
            <View key={i} style={a.tRow}><View style={a.cItem}><Text style={a.strong}>{x.when}</Text>{!!x.note && <Text style={a.small}>{x.note}</Text>}</View><Text style={a.cAmt}>{money(x.amount)}</Text></View>
          ))}
        </View>}

        {(!!c.payment.notes || !!c.payment.autopay?.offer) && <View>
          <Text style={a.h2}>{sec("Billing")}</Text>
          {!!c.payment.notes && <Text>{c.payment.notes}</Text>}
          {!!c.payment.autopay?.offer && <Text style={{ marginTop: 6 }}><Text style={a.strong}>Monthly billing: </Text>{autopay === true ? "automatic card billing each month, chosen at signing." : autopay === false ? "invoiced each month and paid by the client; automatic billing declined at signing." : "chosen at signing: automatic card billing each month, or a monthly invoice paid by card."}</Text>}
        </View>}

        <Text style={a.h2}>{sec("Terms")}</Text>
        {c.terms.map((t, i) => <View key={i} style={a.term}><Text><Text style={a.strong}>{n}.{i + 1} {t.title}. </Text>{t.text}</Text></View>)}

        <View wrap={false}>
          <Text style={a.h2}>{sec("Signatures")}</Text>
          <Text style={a.small}>Signed electronically. An electronic signature has the same effect as a handwritten one.</Text>
          <View style={a.sigs}>
            <View style={[a.sigBox, { marginRight: 12 }]}>
              <Text style={a.label}>CLIENT</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              {signed && p.signature_data ? <Image src={p.signature_data} style={a.sigImg} /> : <View style={a.sigLine} />}
              <Text style={a.strong}>{signed ? p.signed_name : "Name"}{signed && p.signed_title ? `, ${p.signed_title}` : ""}</Text>
              <Text style={a.muted}>for {p.client_company || p.client_name}</Text>
              <Text style={a.muted}>{signed ? `Signed ${fmt(p.signed_at)}` : "Date"}</Text>
            </View>
            <View style={a.sigBox}>
              <Text style={a.label}>PROVIDER</Text>
              <View style={{ height: 56, justifyContent: "center" }}><Text style={{ fontFamily: "Times-Italic", fontSize: 16 }}>{BUSINESS_NAME}</Text></View>
              <Text style={a.strong}>{BUSINESS_NAME}</Text>
              <Text style={a.muted}>{signed ? `Accepted ${fmt(p.signed_at)}` : "Accepted when the client signs"}</Text>
            </View>
          </View>
          {signed && <Text style={[a.small, { marginTop: 8 }]}>Signed from IP {p.signer_ip || "unknown"}. Document fingerprint (SHA-256): {p.signed_hash}</Text>}
        </View>

        <View style={a.foot} fixed>
          <Text>{BUSINESS_NAME}  ·  Service Agreement {p.number}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  ) as unknown as Promise<Buffer>;
}
