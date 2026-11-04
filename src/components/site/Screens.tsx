import type { ReactNode } from "react";
import {
  Inbox, Paperclip, FolderOpen, FileText, Image as ImageIcon, Video, Check, CreditCard, ShoppingBag, Package, Star, Sparkles, Play,
} from "lucide-react";

/** Phone hardware frame; the screen content is passed in. */
export function Phone({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`nxs-phone ${className}`}>
      <div className="nxs-phone-screen">
        <span className="nxs-phone-island" />
        <div className="nxs-phone-status"><span>9:41</span><span>100%</span></div>
        {children}
        <span className="nxs-phone-glare" />
      </div>
    </div>
  );
}

const T = {
  pine: { background: "#0f5c55", color: "#fff" },
  sun: { background: "#f4b740", color: "#0d1d1b" },
  ink: { background: "#0d1d1b", color: "#fff" },
  mint: { background: "#dff3ee", color: "#0f5c55" },
};

function Head({ over, title }: { over: string; title: string }) {
  return (
    <div className="nxs-app-head">
      <small>{over}</small>
      <h4>{title}</h4>
    </div>
  );
}

export function InboxScreen() {
  const mail = [
    ["Maria Lopez", "Catering for 40 on Saturday?", "9:38", true],
    ["Square", "Payout sent: $1,962.40", "9:12", true],
    ["Mike (crew)", "Photos from the Smith job", "8:55", false],
    ["Supplier", "Invoice #2231 attached", "8:20", false],
    ["Google", "You have 3 new reviews", "Yesterday", false],
  ] as const;
  return (
    <>
      <Head over="Inbox · 2 unread" title="Inbox" />
      <div className="nxs-app-body">
        {mail.map(([from, subj, time, unread]) => (
          <div key={subj} className="nxs-row">
            <span className="nxs-row-ico" style={unread ? T.pine : T.mint}><Inbox size={16} /></span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <strong style={{ display: "flex", justifyContent: "space-between" }}>
                {from}<em style={{ fontStyle: "normal", fontWeight: 400, fontSize: 11, color: "#4a5a57" }}>{time}</em>
              </strong>
              <span style={{ display: "flex", gap: 4, alignItems: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {subj.includes("attached") && <Paperclip size={11} />}{subj}
              </span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

export function DriveScreen() {
  const items = [
    ["Job photos", FolderOpen, T.pine, "248 files"],
    ["Contracts", FolderOpen, T.sun, "36 files"],
    ["Plans.pdf", FileText, T.ink, "12 MB"],
    ["Site walk", ImageIcon, T.mint, "12 photos"],
    ["Walkthrough", Video, T.ink, "2:14"],
    ["Permits", FolderOpen, T.pine, "9 files"],
  ] as const;
  return (
    <>
      <Head over="Your Drive" title="Files" />
      <div className="nxs-app-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {items.map(([name, Icon, tone, meta]) => (
          <div key={name} className="nxs-row" style={{ flexDirection: "column", alignItems: "flex-start", marginBottom: 0 }}>
            <span className="nxs-row-ico" style={tone}><Icon size={16} /></span>
            <span><strong>{name}</strong><span>{meta}</span></span>
          </div>
        ))}
      </div>
      <div style={{ margin: "14px 14px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#4a5a57" }}><span>Storage</span><span>38 GB of 1 TB</span></div>
        <div style={{ height: 6, borderRadius: 6, background: "#dfe8e6", marginTop: 6 }}><div style={{ width: "18%", height: "100%", borderRadius: 6, background: "#0f5c55" }} /></div>
      </div>
    </>
  );
}

export function QuotesScreen() {
  return (
    <>
      <Head over="Quote #1048" title="Back yard cleanup" />
      <div className="nxs-app-body">
        <div className="nxs-row" style={{ padding: 0, overflow: "hidden", height: 92, position: "relative", background: "linear-gradient(135deg,#2f5d3a,#7aa35a)" }}>
          <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <span style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.9)", display: "grid", placeItems: "center" }}><Play size={18} fill="#0d1d1b" /></span>
          </span>
          <span style={{ position: "absolute", left: 10, bottom: 8, color: "#fff", fontSize: 11.5, fontWeight: 700 }}>Customer video · 0:42</span>
        </div>
        {[["Brush and debris removal", "$640"], ["Mulch, 6 yards installed", "$480"], ["Haul away", "$160"]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px", borderBottom: "1px solid rgba(13,29,27,.08)" }}>
            <span>{k}</span><b className="nxs-num">{v}</b>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px" }}>
          <b style={{ fontSize: 15 }}>Total</b><b className="nxs-num" style={{ fontSize: 22, color: "#0f5c55" }}>$1,280</b>
        </div>
        <div className="nxs-row" style={{ ...T.pine, justifyContent: "center", fontWeight: 700 }}>
          <Check size={16} /> Accepted by customer
        </div>
      </div>
    </>
  );
}

export function PaymentsScreen() {
  return (
    <>
      <Head over="Invoice #2207" title="Kitchen remodel" />
      <div className="nxs-app-body">
        <div className="nxs-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2, padding: 14 }}>
          <span>Paid today</span>
          <b className="nxs-num" style={{ fontSize: 34, color: "#0f5c55", letterSpacing: "-.03em" }}>$3,500.00</b>
          <span className="nxs-pill" style={T.mint}>Deposit · Visa •••• 4242</span>
        </div>
        <p style={{ margin: "12px 4px 6px", fontWeight: 700 }}>Payment plan</p>
        {[["Deposit", "$3,500", true], ["Midpoint", "$5,250", false], ["Final", "$3,750", false]].map(([k, v, done]) => (
          <div key={k as string} className="nxs-row">
            <span className="nxs-row-ico" style={done ? T.pine : T.mint}>{done ? <Check size={16} /> : <CreditCard size={16} />}</span>
            <span><strong>{k}</strong><span>{done ? "Paid" : "Card on file · auto-charge"}</span></span>
            <span className="nxs-amt">{v}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function OrdersScreen() {
  const orders = [
    ["#318", "Pad Thai, Green Curry", "$42.50", "New", T.sun],
    ["#317", "Drunken Noodles x2", "$31.00", "Cooking", T.pine],
    ["#316", "Classic hoodie, black", "$58.00", "Shipped", T.ink],
    ["#315", "Tom Yum, Spring Rolls", "$27.75", "Picked up", T.mint],
  ] as const;
  return (
    <>
      <Head over="Tonight" title="Orders" />
      <div className="nxs-app-body">
        <div className="nxs-stats" style={{ marginTop: 0, marginBottom: 10 }}>
          <div><b>31</b><small>Orders</small></div><div><b>$1,184</b><small>Sales</small></div><div><b>12m</b><small>Avg. wait</small></div>
        </div>
        {orders.map(([n, what, amt, st, tone]) => (
          <div key={n} className="nxs-row">
            <span className="nxs-row-ico" style={tone}>{st === "Shipped" ? <Package size={16} /> : <ShoppingBag size={16} />}</span>
            <span style={{ minWidth: 0 }}><strong>{n} · {st}</strong><span style={{ whiteSpace: "nowrap" }}>{what}</span></span>
            <span className="nxs-amt">{amt}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function ReviewsScreen() {
  return (
    <>
      <Head over="Google reviews" title="4.8 ★ · 612 reviews" />
      <div className="nxs-app-body">
        <div className="nxs-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6, padding: 14 }}>
          <span style={{ display: "flex", gap: 2, color: "#f4b740" }}>{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={14} fill="#f4b740" />)}</span>
          <strong>Jasmine K.</strong>
          <span style={{ color: "#0d1d1b" }}>&ldquo;Best curry in town, and the online ordering is so easy. Ready in 12 minutes!&rdquo;</span>
        </div>
        <div className="nxs-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6, padding: 14, background: "#0f5c55", color: "#fff", marginLeft: 22 }}>
          <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11.5, fontWeight: 700, color: "#9ff3e2" }}><Sparkles size={13} /> Reply posted automatically</span>
          <span style={{ color: "#fff" }}>Thank you, Jasmine! We&rsquo;re so glad the curry hit the spot. See you next time!</span>
        </div>
        <div className="nxs-stats">
          <div><b>100%</b><small>Replied</small></div><div><b>+38</b><small>This month</small></div><div><b>4.8</b><small>Rating</small></div>
        </div>
      </div>
    </>
  );
}

export const SCREENS = {
  inbox: InboxScreen,
  drive: DriveScreen,
  quotes: QuotesScreen,
  payments: PaymentsScreen,
  orders: OrdersScreen,
  reviews: ReviewsScreen,
} as const;
