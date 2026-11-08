import React from "react";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { BUSINESS_NAME, defaultPackage, dueAtSigning, money, normalizeContent, surchargeOn } from "./types";

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

  return renderToBuffer(
    <Document title={`${p.title} (${p.number})`} author={BUSINESS_NAME}>
      <Page size="LETTER" style={s.page}>
        <Text style={s.brand}>{BUSINESS_NAME}</Text>
        <Text style={s.meta}>{p.signed_at ? "Signed agreement" : "Proposal"} {p.number}</Text>
        <Text style={s.title}>{p.title}</Text>
        {!!who && <Text>Prepared for {who}{p.client_company && p.client_name ? `, attention ${p.client_name}` : ""}</Text>}
        {!!c.intro && <Text style={{ marginTop: 8 }}>{c.intro}</Text>}

        {c.findings.length > 0 && <View><Text style={s.h2}>What we found</Text>{c.findings.map((f, i) => (
          <View key={i} style={s.item} wrap={false}><Text style={s.b}>{f.title}</Text>{!!f.detail && <Text>{f.detail}</Text>}</View>
        ))}</View>}

        {c.goals.length > 0 && <View><Text style={s.h2}>Your goals</Text>{c.goals.map((g, i) => <Text key={i} style={s.item}>{"•"} {g}</Text>)}</View>}

        {c.work.length > 0 && <View><Text style={s.h2}>What we&apos;ll do</Text>{c.work.map((w, i) => (
          <View key={i} style={s.item} wrap={false}>
            <Text style={s.b}>{w.area}</Text>
            {!!w.detail && <Text>{w.detail}</Text>}
            {w.items.map((it, n) => <Text key={n}>{"•"} {it}</Text>)}
          </View>
        ))}</View>}

        {c.timeline.length > 0 && <View><Text style={s.h2}>Timeline</Text>{c.timeline.map((t, i) => (
          <View key={i} style={s.row}><Text>{t.label}</Text><Text>{t.when}</Text></View>
        ))}</View>}

        {pkg && <View wrap={false}><Text style={s.h2}>{p.signed_at ? "What was selected" : "Pricing"}</Text>
          <Text style={s.b}>{pkg.name}</Text>
          {!!pkg.description && <Text>{pkg.description}</Text>}
          {pkg.includes.map((it, n) => <Text key={n}>{"•"} {it}</Text>)}
          <View style={{ marginTop: 6 }}>
            {Number(pkg.price) > 0 && <View style={s.row}><Text>One-time</Text><Text>{money(pkg.price)}</Text></View>}
            {Number(pkg.monthly) > 0 && <View style={s.row}><Text>Monthly</Text><Text>{money(pkg.monthly)}/mo</Text></View>}
            {due > 0 && <View style={s.row}><Text>Due at signing</Text><Text>{money(due)}</Text></View>}
            {fee > 0 && <View style={s.row}><Text>4% card fee on the amount due</Text><Text>{money(fee)}</Text></View>}
          </View>
        </View>}
        {!!c.payment.notes && <Text style={{ marginTop: 8 }}>{c.payment.notes}</Text>}

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
