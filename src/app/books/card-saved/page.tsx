export const metadata = { title: "Card saved · NexaBooks", robots: { index: false } };

// Where a NexaBooks customer lands after saving their card on the NexaVision pay page.
export default function CardSaved() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#05070d", color: "#e8eefc", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", padding: 16 }}>
      <div style={{ maxWidth: 440, width: "100%", background: "#101726", border: "1px solid #1e2a40", borderRadius: 18, padding: 28 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Nexa<span style={{ color: "#7dd3fc" }}>Books</span></div>
        <h1 style={{ fontSize: 24, margin: "18px 0 8px" }}>Your card is saved</h1>
        <p style={{ color: "#b9c6dc", lineHeight: 1.55, fontSize: 16 }}>
          Thank you. We&apos;ll email you before each monthly charge. Charges show on your statement as SQ *NEXAVISION GROUP.
        </p>
        <a href="https://books.nexavisiongroup.com/app" style={{ display: "inline-block", marginTop: 18, background: "linear-gradient(135deg,#6366f1,#22d3ee)", color: "#fff", textDecoration: "none", fontWeight: 700, padding: "13px 22px", borderRadius: 12 }}>
          Back to NexaBooks
        </a>
      </div>
    </main>
  );
}
