import * as THREE from "three";

// The Fold's inner display: a live "Signal Engine" console spread across both
// halves. Left pane = site map (radar sweep, the locked tower, a blocked fake
// site); right pane = live throughput and link stats. Redrawn ~15fps, and only
// while the phone is open.

const CYAN = "86,224,232";
const towers: { x: number; y: number; name: string; state: "lock" | "idle" | "fake" }[] = [
  { x: 0.2, y: 0.24, name: "A", state: "idle" },
  { x: 0.74, y: 0.16, name: "B", state: "idle" },
  { x: 0.52, y: 0.42, name: "C", state: "lock" },
  { x: 0.16, y: 0.6, name: "D", state: "idle" },
  { x: 0.82, y: 0.58, name: "?", state: "fake" },
];

export function foldScreen(label: string) {
  const W = 1024;
  const H = 1160;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const hist: number[] = Array.from({ length: 64 }, (_, i) => 820 + Math.sin(i * 0.6) * 18 + Math.sin(i * 1.7) * 9);
  let acc = 0;
  let mbps = 842;

  const P = W / 2; // pane width
  const pad = 34;

  const text = (s: string, x: number, y: number, size: number, weight: number, color: string, align: CanvasTextAlign = "left", track = 0) => {
    g.font = `${weight} ${size}px system-ui, -apple-system, Segoe UI, sans-serif`;
    g.fillStyle = color;
    g.textAlign = align;
    if ("letterSpacing" in g) (g as unknown as { letterSpacing: string }).letterSpacing = `${track}px`;
    g.fillText(s, x, y);
    if ("letterSpacing" in g) (g as unknown as { letterSpacing: string }).letterSpacing = "0px";
  };
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
  };
  const tower = (x: number, y: number, s: number, col: string) => {
    g.strokeStyle = col;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x, y - s);
    g.lineTo(x - s * 0.55, y + s);
    g.moveTo(x, y - s);
    g.lineTo(x + s * 0.55, y + s);
    g.moveTo(x - s * 0.33, y + s * 0.2);
    g.lineTo(x + s * 0.33, y + s * 0.2);
    g.stroke();
    g.fillStyle = col;
    g.beginPath();
    g.arc(x, y - s, 4, 0, Math.PI * 2);
    g.fill();
  };

  function draw(t: number) {
    // base
    const bg = g.createLinearGradient(0, 0, W * 0.3, H);
    bg.addColorStop(0, "#050c11");
    bg.addColorStop(0.6, "#071820");
    bg.addColorStop(1, "#03070a");
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = `rgba(${CYAN},.045)`;
    g.lineWidth = 1;
    for (let x = 0; x < W; x += 32) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, H);
      g.stroke();
    }
    for (let y = 0; y < H; y += 32) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
    }

    // status bar
    text("07:30", pad, 46, 26, 600, "#d6eef1");
    for (let i = 0; i < 4; i++) {
      g.fillStyle = "#d6eef1";
      g.fillRect(W - 150 + i * 11, 40 - i * 6, 7, 8 + i * 6);
    }
    text("5G UW", W - 162, 46, 22, 700, `rgb(${CYAN})`, "right");
    rr(W - 98, 26, 50, 22, 6);
    g.strokeStyle = "#d6eef1";
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = "#d6eef1";
    g.fillRect(W - 94, 30, 34, 14);
    g.beginPath();
    g.arc(W / 2, 38, 11, 0, Math.PI * 2); // under-display camera dot sits on the right half
    g.fillStyle = "#000";
    g.fill();

    /* ── left pane: site map ── */
    text("SIGNAL ENGINE", pad, 112, 22, 800, `rgb(${CYAN})`, "left", 4);
    text("Plant 2 · Dock B", pad, 150, 30, 600, "#eefcfd");
    const mx = pad;
    const my = 180;
    const mw = P - pad * 2 - 6;
    const mh = 560;
    rr(mx, my, mw, mh, 26);
    g.fillStyle = "rgba(255,255,255,.03)";
    g.fill();
    g.strokeStyle = `rgba(${CYAN},.22)`;
    g.lineWidth = 2;
    g.stroke();
    g.save();
    rr(mx, my, mw, mh, 26);
    g.clip();
    const px = mx + mw * 0.46;
    const py = my + mh * 0.86;
    for (let i = 1; i <= 5; i++) {
      g.strokeStyle = `rgba(${CYAN},${0.16 - i * 0.02})`;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(px, py, i * 110, 0, Math.PI * 2);
      g.stroke();
    }
    // radar sweep
    const a = (t * 1.1) % (Math.PI * 2);
    const sweep = g.createRadialGradient(px, py, 0, px, py, 620);
    sweep.addColorStop(0, `rgba(${CYAN},.28)`);
    sweep.addColorStop(1, `rgba(${CYAN},0)`);
    g.fillStyle = sweep;
    g.beginPath();
    g.moveTo(px, py);
    g.arc(px, py, 620, a - 0.5, a);
    g.closePath();
    g.fill();
    // links
    towers.forEach((tw) => {
      const tx = mx + mw * tw.x;
      const ty = my + mh * tw.y;
      if (tw.state === "lock") {
        g.strokeStyle = `rgba(${CYAN},.9)`;
        g.lineWidth = 4;
        g.shadowColor = `rgba(${CYAN},.9)`;
        g.shadowBlur = 18;
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(tx, ty + 30);
        g.stroke();
        g.shadowBlur = 0;
        // packets riding the link
        for (let k = 0; k < 4; k++) {
          const f = (t * 0.9 + k / 4) % 1;
          g.fillStyle = "#eefcfd";
          g.beginPath();
          g.arc(px + (tx - px) * f, py + (ty + 30 - py) * f, 5, 0, Math.PI * 2);
          g.fill();
        }
        const pulse = (t * 0.8) % 1;
        g.strokeStyle = `rgba(${CYAN},${0.8 * (1 - pulse)})`;
        g.lineWidth = 3;
        g.beginPath();
        g.arc(tx, ty, 30 + pulse * 70, 0, Math.PI * 2);
        g.stroke();
      } else if (tw.state === "idle") {
        g.setLineDash([6, 10]);
        g.strokeStyle = "rgba(160,180,190,.18)";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(tx, ty + 30);
        g.stroke();
        g.setLineDash([]);
      }
    });
    towers.forEach((tw) => {
      const tx = mx + mw * tw.x;
      const ty = my + mh * tw.y;
      const col = tw.state === "lock" ? `rgb(${CYAN})` : tw.state === "fake" ? "#ff5a4a" : "rgba(170,190,200,.55)";
      tower(tx, ty, 30, col);
      text(tw.state === "fake" ? "Unknown site" : `Tower ${tw.name}`, tx, ty + 70, 21, 700, col, "center");
      if (tw.state === "fake") {
        text("BLOCKED", tx, ty + 96, 17, 800, "#ff5a4a", "center", 3);
        g.strokeStyle = "#ff5a4a";
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(tx - 22, ty - 30);
        g.lineTo(tx + 22, ty + 14);
        g.moveTo(tx + 22, ty - 30);
        g.lineTo(tx - 22, ty + 14);
        g.stroke();
      }
      if (tw.state === "lock") text("LOCKED", tx, ty + 96, 17, 800, `rgb(${CYAN})`, "center", 3);
    });
    // the phone
    g.fillStyle = "#eefcfd";
    g.shadowColor = `rgba(${CYAN},1)`;
    g.shadowBlur = 24;
    rr(px - 13, py - 22, 26, 44, 6);
    g.fill();
    g.shadowBlur = 0;
    g.restore();

    // lock rows
    const rows: [string, string][] = [
      ["Tower", "C · Cell 312"],
      ["Channel", "66786 · Band 66"],
      ["Hops today", "0"],
    ];
    rows.forEach(([k, v], i) => {
      const y = 790 + i * 92;
      rr(pad, y, P - pad * 2 - 6, 76, 18);
      g.fillStyle = "rgba(255,255,255,.04)";
      g.fill();
      text(k, pad + 24, y + 48, 24, 500, "#8fa3ad");
      text(v, P - pad - 30, y + 48, 26, 700, "#eefcfd", "right");
    });

    /* ── right pane: throughput ── */
    const R = P + 22;
    const rw = W - R - pad;
    g.fillStyle = `rgb(${CYAN})`;
    g.beginPath();
    g.arc(R + 10, 104, 9, 0, Math.PI * 2);
    g.fill();
    text("LOCKED ON", R + 32, 112, 22, 800, `rgb(${CYAN})`, "left", 4);
    text(String(Math.round(mbps)), R, 270, 168, 800, "#eefcfd");
    text("Mbps down", R + 6, 316, 28, 600, "#8fa3ad");
    // graph
    const gy = 360;
    const gh = 250;
    rr(R, gy, rw, gh, 22);
    g.fillStyle = "rgba(255,255,255,.03)";
    g.fill();
    const min = 700;
    const max = 900;
    const step = rw / (hist.length - 1);
    g.beginPath();
    hist.forEach((v, i) => {
      const x = R + i * step;
      const y = gy + gh - ((v - min) / (max - min)) * (gh - 30) - 10;
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    });
    const line = new Path2D();
    hist.forEach((v, i) => {
      const x = R + i * step;
      const y = gy + gh - ((v - min) / (max - min)) * (gh - 30) - 10;
      if (i) line.lineTo(x, y);
      else line.moveTo(x, y);
    });
    g.lineTo(R + rw, gy + gh);
    g.lineTo(R, gy + gh);
    g.closePath();
    const fill = g.createLinearGradient(0, gy, 0, gy + gh);
    fill.addColorStop(0, `rgba(${CYAN},.35)`);
    fill.addColorStop(1, `rgba(${CYAN},0)`);
    g.fillStyle = fill;
    g.fill();
    g.strokeStyle = `rgb(${CYAN})`;
    g.lineWidth = 4;
    g.shadowColor = `rgba(${CYAN},.8)`;
    g.shadowBlur = 12;
    g.stroke(line);
    g.shadowBlur = 0;
    text("Last 60 s · no drops", R + 20, gy + 40, 21, 600, "#8fa3ad");

    // tiles
    const tiles: [string, string, string][] = [
      ["Signal", "−71 dBm", "#eefcfd"],
      ["Quality", "24 dB", "#eefcfd"],
      ["Latency", "18 ms", "#eefcfd"],
      ["Fake sites blocked", "3", "#ff8a7a"],
    ];
    const tw2 = (rw - 16) / 2;
    tiles.forEach(([k, v, col], i) => {
      const x = R + (i % 2) * (tw2 + 16);
      const y = 640 + Math.floor(i / 2) * 150;
      rr(x, y, tw2, 134, 20);
      g.fillStyle = "rgba(255,255,255,.04)";
      g.fill();
      g.strokeStyle = "rgba(255,255,255,.06)";
      g.lineWidth = 2;
      g.stroke();
      text(k, x + 20, y + 42, 21, 600, "#8fa3ad");
      text(v, x + 20, y + 104, 46, 800, col);
    });
    // dock
    const icons = ["#56e0e8", "#f2b84b", "#7c8cff", "#4be08a", "#ff6b5e"];
    const iy = 965;
    const isz = 64;
    const gap = (rw - isz * icons.length) / (icons.length - 1);
    icons.forEach((col, i) => {
      const x = R + i * (isz + gap);
      rr(x, iy, isz, isz, 18);
      const ig = g.createLinearGradient(x, iy, x + isz, iy + isz);
      ig.addColorStop(0, col);
      ig.addColorStop(1, "rgba(0,0,0,.35)");
      g.fillStyle = ig;
      g.fill();
    });
    text(label.toUpperCase(), R + rw / 2, 1090, 22, 800, "rgba(238,252,253,.45)", "center", 6);
    g.fillStyle = "rgba(238,252,253,.6)";
    g.fillRect(W / 2 - 70, H - 26, 140, 6);
  }

  draw(0);
  return {
    tex,
    /** Returns true when it redrew (callers flag their texture clones). */
    update(dt: number, t: number) {
      acc += dt;
      if (acc < 1 / 15) return false;
      acc = 0;
      mbps += (835 + Math.sin(t * 0.9) * 14 + (Math.random() - 0.5) * 10 - mbps) * 0.25;
      hist.shift();
      hist.push(mbps);
      draw(t);
      return true;
    },
  };
}
