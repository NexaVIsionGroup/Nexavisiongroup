import * as THREE from "three";
import type { Color as Swatch } from "../catalog";

/**
 * Procedural phone models, detailed enough to read as real hardware:
 * chamfered metal rails, inset back glass, a front glass slab with a
 * punch-hole display, multi-layer lenses, buttons, alert slider, USB-C,
 * speaker holes and antenna lines. Each Nexa model gets its own camera
 * design. Back faces +Z (toward the camera), screen faces -Z.
 */

export type Island = "round" | "offset" | "wide" | "fan" | "wrap";
export type PhoneHandle = {
  group: THREE.Group;
  anchors: Record<"camera" | "chip" | "battery" | "signal", THREE.Object3D>;
  setColor: (c: Swatch) => void;
  setFold?: (t: number) => void; // 0 open, 1 closed
  tick: (dt: number, t: number) => void;
  dispose: () => void;
};

// Each build collects its own GPU resources so it can be freed on swap.
let bucket: { dispose: () => void }[] = [];
const track = <T extends { dispose: () => void }>(x: T) => {
  bucket.push(x);
  return x;
};

/* ───────────── textures ───────────── */

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return track(t);
}

function lockScreen(w: number, h: number, label: string, punch: boolean) {
  return canvasTex(w, h, (g) => {
    const bg = g.createLinearGradient(0, 0, w * 0.4, h);
    bg.addColorStop(0, "#08121a");
    bg.addColorStop(0.55, "#0b1d26");
    bg.addColorStop(1, "#04080b");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    const au = g.createRadialGradient(w * 0.7, h * 0.28, 10, w * 0.7, h * 0.28, w * 0.9);
    au.addColorStop(0, "rgba(86,224,232,.35)");
    au.addColorStop(1, "rgba(86,224,232,0)");
    g.fillStyle = au;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#cfe9ec";
    g.font = `600 ${w * 0.04}px system-ui`;
    g.fillText("07:30", w * 0.07, h * 0.04);
    for (let i = 0; i < 4; i++) g.fillRect(w * 0.76 + i * w * 0.026, h * 0.036 - i * h * 0.005, w * 0.015, h * 0.007 + i * h * 0.005);
    g.fillRect(w * 0.88, h * 0.026, w * 0.06, h * 0.014);
    if (punch) {
      g.fillStyle = "#000";
      g.beginPath();
      g.arc(w / 2, h * 0.03, w * 0.028, 0, Math.PI * 2);
      g.fill();
    }
    g.textAlign = "center";
    g.fillStyle = "#eefcfd";
    g.font = `200 ${w * 0.26}px system-ui`;
    g.fillText("07:30", w / 2, h * 0.27);
    g.font = `500 ${w * 0.045}px system-ui`;
    g.fillStyle = "#9fb4bd";
    g.fillText("Tuesday, shift start", w / 2, h * 0.32);
    const cx = w / 2;
    const cy = h * 0.55;
    for (let r = 1; r <= 3; r++) {
      g.strokeStyle = `rgba(86,224,232,${0.55 - r * 0.13})`;
      g.lineWidth = w * 0.006;
      g.beginPath();
      g.arc(cx, cy, w * 0.07 * r, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = "#56e0e8";
    g.beginPath();
    g.arc(cx, cy, w * 0.03, 0, Math.PI * 2);
    g.fill();
    g.font = `700 ${w * 0.06}px system-ui`;
    g.fillStyle = "#eefcfd";
    g.fillText("Locked on Tower C", cx, h * 0.7);
    g.font = `500 ${w * 0.045}px system-ui`;
    g.fillStyle = "#56e0e8";
    g.fillText("842 Mbps  ·  fastest band", cx, h * 0.745);
    g.font = `800 ${w * 0.05}px system-ui`;
    g.fillStyle = "rgba(238,252,253,.5)";
    g.fillText(label.toUpperCase(), cx, h * 0.93);
    g.fillStyle = "rgba(238,252,253,.6)";
    g.fillRect(w * 0.36, h * 0.975, w * 0.28, h * 0.004);
  });
}

/** Camera glass: dark, with concentric element rings and coating tints. */
function lensTex() {
  return canvasTex(256, 256, (g) => {
    const c = 128;
    const base = g.createRadialGradient(c, c, 0, c, c, 128);
    base.addColorStop(0, "#0b1320");
    base.addColorStop(0.55, "#05080e");
    base.addColorStop(1, "#010203");
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 256);
    const rings: [number, string, number][] = [
      [118, "rgba(120,130,150,.5)", 3],
      [96, "rgba(60,70,90,.8)", 5],
      [74, "rgba(40,90,140,.55)", 3],
      [54, "rgba(120,60,160,.45)", 2],
      [36, "rgba(30,120,110,.5)", 2],
    ];
    rings.forEach(([r, col, lw]) => {
      g.strokeStyle = col;
      g.lineWidth = lw;
      g.beginPath();
      g.arc(c, c, r, 0, Math.PI * 2);
      g.stroke();
    });
    g.fillStyle = "#000";
    g.beginPath();
    g.arc(c, c, 26, 0, Math.PI * 2);
    g.fill();
    const refl = g.createLinearGradient(40, 40, 200, 200);
    refl.addColorStop(0, "rgba(140,90,255,.25)");
    refl.addColorStop(0.5, "rgba(0,0,0,0)");
    refl.addColorStop(1, "rgba(60,220,200,.18)");
    g.fillStyle = refl;
    g.beginPath();
    g.arc(c, c, 100, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(255,255,255,.55)";
    g.beginPath();
    g.ellipse(c - 42, c - 46, 16, 7, -0.7, 0, Math.PI * 2);
    g.fill();
  });
}

function flashTex() {
  return canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, "#fff8e6");
    gr.addColorStop(0.6, "#e8d9b4");
    gr.addColorStop(1, "#8c8068");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = "rgba(0,0,0,.25)";
    for (let i = 0; i < 128; i += 10) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 128);
      g.stroke();
    }
  });
}

function wordmark(color: string) {
  return canvasTex(512, 128, (g) => {
    g.clearRect(0, 0, 512, 128);
    g.fillStyle = color;
    g.font = "700 76px system-ui";
    g.textAlign = "center";
    g.textBaseline = "middle";
    (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "18px";
    g.fillText("NEXA", 256, 66);
  });
}

function circuitTex() {
  return canvasTex(512, 1024, (g) => {
    g.fillStyle = "#0b0e12";
    g.fillRect(0, 0, 512, 1024);
    g.strokeStyle = "rgba(86,224,232,.35)";
    g.lineWidth = 2;
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 90; i++) {
      let x = rnd() * 512;
      let y = rnd() * 1024;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 4; k++) {
        if (rnd() > 0.5) x += (rnd() - 0.5) * 160;
        else y += (rnd() - 0.5) * 160;
        g.lineTo(x, y);
      }
      g.stroke();
      g.fillStyle = "rgba(86,224,232,.6)";
      g.fillRect(x - 3, y - 3, 6, 6);
    }
  });
}

function noiseTex(scale = 60) {
  return canvasTex(
    256,
    256,
    (g) => {
      const img = g.createImageData(256, 256);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 128 + (Math.random() - 0.5) * scale;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    },
    false
  );
}

/* ───────────── geometry helpers ───────────── */

function rrShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(w / 2, h / 2 - r);
  s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
  s.lineTo(-w / 2 + r, h / 2);
  s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-w / 2, -h / 2 + r);
  s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** Extruded rounded slab centered on z=0 with a chamfer/bevel. */
function slabGeo(w: number, h: number, r: number, depth: number, bevel: number) {
  const g = new THREE.ExtrudeGeometry(rrShape(w - bevel * 2, h - bevel * 2, Math.max(0.001, r - bevel)), {
    depth: Math.max(0.0005, depth - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 24,
  });
  g.translate(0, 0, -Math.max(0.0005, depth - bevel * 2) / 2);
  g.computeVertexNormals();
  return track(g);
}

function planeUV(w: number, h: number, r: number) {
  const g = track(new THREE.ShapeGeometry(rrShape(w, h, r), 24));
  const pos = g.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) + w / 2) / w;
    uv[i * 2 + 1] = (pos.getY(i) + h / 2) / h;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

const box = (w: number, h: number, d: number) => track(new THREE.BoxGeometry(w, h, d));
const cyl = (r: number, h: number, seg = 48) => {
  const g = track(new THREE.CylinderGeometry(r, r, h, seg));
  g.rotateX(Math.PI / 2); // axis along z
  return g;
};

/* ───────────── materials ───────────── */

function frameColorFor(s: Swatch) {
  const c = new THREE.Color(s.hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  // Color-matched metal rails: dark phones get dark anodized rails.
  return new THREE.Color().setHSL(hsl.h, hsl.s * 0.55, Math.min(0.72, Math.max(0.2, hsl.l * 0.9 + 0.1)));
}

function applyFinish(m: THREE.MeshPhysicalMaterial, s: Swatch, bump: THREE.Texture) {
  m.color.set(s.hex);
  m.transparent = s.finish === "clear";
  m.opacity = s.finish === "clear" ? 0.62 : 1;
  m.metalness = s.finish === "leather" ? 0 : 0.1;
  m.roughness = s.finish === "matte" ? 0.42 : s.finish === "leather" ? 0.78 : 0.08;
  m.clearcoat = s.finish === "leather" ? 0 : s.finish === "matte" ? 0.15 : 1;
  m.clearcoatRoughness = s.finish === "matte" ? 0.4 : 0.03;
  m.sheen = s.finish === "leather" ? 0.8 : 0;
  m.sheenRoughness = 0.6;
  m.sheenColor = new THREE.Color(s.hex).offsetHSL(0, 0, 0.18);
  m.bumpMap = s.finish === "leather" || s.finish === "matte" ? bump : null;
  m.bumpScale = s.finish === "leather" ? 1.2 : 0.15;
  m.needsUpdate = true;
}

/* ───────────── per-model layout ───────────── */

type Ctx = {
  add: (o: THREE.Object3D) => void;
  w: number;
  h: number;
  backZ: number;
  backMat: THREE.MeshPhysicalMaterial;
  metal: THREE.MeshPhysicalMaterial;
  lens: (r: number, x: number, y: number, z: number) => void;
  flash: (r: number, x: number, y: number, z: number) => void;
  onFan: (g: THREE.Group, ring: THREE.MeshBasicMaterial) => void;
};

type Spec = {
  w: number;
  h: number;
  d: number;
  r: number;
  punch: boolean;
  slider: "right" | "left" | "none";
  camera: (ctx: Ctx) => { x: number; y: number };
};

function islandPlate(ctx: Ctx, shape: THREE.Shape, x: number, y: number, h: number, mat: THREE.Material, bevel = 0.006) {
  const g = track(
    new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 48 })
  );
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, ctx.backZ);
  ctx.add(m);
  return m;
}

const circle = (r: number) => {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, 0, Math.PI * 2, false);
  return s;
};

function sideCircle(c: Ctx, R: number) {
  const x = -c.w / 2 + R + 0.035;
  const y = c.h / 2 - R - 0.1;
  // metal band joining the island to the left rail
  islandPlate(c, rrShape(R + 0.06, R * 1.25, 0.03), -c.w / 2 + (R + 0.06) / 2 - 0.002, y, 0.014, c.metal, 0.004);
  islandPlate(c, circle(R), x, y, 0.02, c.metal);
  islandPlate(c, circle(R - 0.016), x, y, 0.024, c.backMat, 0.004);
  c.lens(0.066, x - 0.075, y + 0.06, c.backZ + 0.032);
  c.lens(0.066, x + 0.075, y + 0.06, c.backZ + 0.032);
  c.lens(0.066, x - 0.03, y - 0.09, c.backZ + 0.032);
  c.flash(0.022, x + 0.1, y - 0.08, c.backZ + 0.032);
  return { x, y };
}

function redmagic(c: Ctx) {
  const lx = -c.w / 2 + 0.13;
  [0.55, 0.38].forEach((y) => c.lens(0.06, lx, y, c.backZ + 0.01));
  c.lens(0.032, lx, 0.24, c.backZ + 0.008);
  c.flash(0.018, lx + 0.1, 0.55, c.backZ + 0.006);
  const fan = new THREE.Group();
  fan.position.set(0.12, 0.36, c.backZ + 0.003);
  const well = new THREE.Mesh(track(new THREE.CircleGeometry(0.16, 64)), track(new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.9 })));
  fan.add(well);
  const blades = new THREE.Group();
  const bladeMat = track(new THREE.MeshStandardMaterial({ color: 0x2a2f36, metalness: 0.6, roughness: 0.35 }));
  for (let i = 0; i < 11; i++) {
    const b = new THREE.Mesh(box(0.12, 0.026, 0.003), bladeMat);
    b.position.x = 0.07;
    b.rotation.x = 0.55;
    const arm = new THREE.Group();
    arm.rotation.z = (i / 11) * Math.PI * 2;
    arm.add(b);
    blades.add(arm);
  }
  const hub = new THREE.Mesh(cyl(0.032, 0.008), c.metal);
  hub.position.z = 0.006;
  blades.add(hub);
  blades.position.z = 0.004;
  fan.add(blades);
  const ringMat = track(new THREE.MeshBasicMaterial({ color: 0xff3b30, toneMapped: false }));
  const ring = new THREE.Mesh(track(new THREE.TorusGeometry(0.165, 0.007, 12, 96)), ringMat);
  ring.position.z = 0.008;
  const cover = new THREE.Mesh(
    track(new THREE.CircleGeometry(0.17, 64)),
    track(new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, roughness: 0, clearcoat: 1 }))
  );
  cover.position.z = 0.012;
  fan.add(ring, cover);
  const slotMat = track(new THREE.MeshStandardMaterial({ color: 0x050505 }));
  for (let i = 0; i < 6; i++) {
    const slot = new THREE.Mesh(box(0.008, 0.08, 0.002), slotMat);
    slot.position.set(0.23 + i * 0.016, 0, 0);
    fan.add(slot);
  }
  c.add(fan);
  const strip = new THREE.Mesh(box(0.012, 0.34, 0.003), ringMat);
  strip.position.set(c.w / 2 - 0.08, -0.3, c.backZ + 0.002);
  c.add(strip);
  c.onFan(blades, ringMat);
  return { x: lx, y: 0.46 };
}

const SPECS: Record<string, Spec> = {
  // OnePlus 10 Pro: squarish camera housing that wraps toward the left edge
  n10: {
    w: 0.74, h: 1.63, d: 0.086, r: 0.09, punch: true, slider: "right",
    camera: (c) => {
      const x = -c.w / 2 + 0.2;
      const y = c.h / 2 - 0.3;
      islandPlate(c, rrShape(0.42, 0.44, 0.08), x - 0.01, y, 0.016, c.backMat);
      c.lens(0.068, x - 0.07, y + 0.1, c.backZ + 0.024);
      c.lens(0.068, x - 0.07, y - 0.1, c.backZ + 0.024);
      c.lens(0.05, x + 0.1, y + 0.1, c.backZ + 0.024);
      c.flash(0.024, x + 0.1, y - 0.08, c.backZ + 0.024);
      return { x, y };
    },
  },
  // OnePlus 11 / 12: big circular island fused into the left rail
  n11: { w: 0.75, h: 1.63, d: 0.086, r: 0.095, punch: true, slider: "right", camera: (c) => sideCircle(c, 0.215) },
  n12: { w: 0.76, h: 1.64, d: 0.092, r: 0.1, punch: true, slider: "left", camera: (c) => sideCircle(c, 0.225) },
  // OnePlus 13: floating circular island
  n13: {
    w: 0.765, h: 1.63, d: 0.089, r: 0.085, punch: true, slider: "left",
    camera: (c) => {
      const x = -c.w / 2 + 0.235;
      const y = c.h / 2 - 0.3;
      islandPlate(c, circle(0.19), x, y, 0.018, c.metal);
      islandPlate(c, circle(0.175), x, y, 0.022, c.backMat, 0.004);
      c.lens(0.062, x - 0.06, y + 0.065, c.backZ + 0.03);
      c.lens(0.062, x + 0.07, y + 0.035, c.backZ + 0.03);
      c.lens(0.062, x - 0.02, y - 0.085, c.backZ + 0.03);
      c.flash(0.02, x + 0.1, y - 0.07, c.backZ + 0.03);
      return { x, y };
    },
  },
  // OnePlus 15: squircle island top-left
  n15: {
    w: 0.76, h: 1.62, d: 0.085, r: 0.075, punch: true, slider: "left",
    camera: (c) => {
      const x = -c.w / 2 + 0.23;
      const y = c.h / 2 - 0.23;
      islandPlate(c, rrShape(0.37, 0.37, 0.1), x, y, 0.02, c.backMat);
      c.lens(0.066, x - 0.08, y + 0.08, c.backZ + 0.028);
      c.lens(0.066, x + 0.08, y + 0.08, c.backZ + 0.028);
      c.lens(0.066, x - 0.08, y - 0.08, c.backZ + 0.028);
      c.flash(0.028, x + 0.08, y - 0.08, c.backZ + 0.028);
      return { x, y };
    },
  },
  // OnePlus Open: large centered circle with a metal ring
  nfold: {
    w: 0.7, h: 1.54, d: 0.06, r: 0.075, punch: true, slider: "left",
    camera: (c) => {
      const x = 0;
      const y = c.h / 2 - 0.35;
      islandPlate(c, circle(0.25), x, y, 0.02, c.metal);
      islandPlate(c, circle(0.235), x, y, 0.024, c.backMat, 0.004);
      c.lens(0.072, x - 0.08, y + 0.07, c.backZ + 0.033);
      c.lens(0.072, x + 0.08, y + 0.07, c.backZ + 0.033);
      c.lens(0.072, x, y - 0.09, c.backZ + 0.033);
      c.flash(0.022, x + 0.13, y - 0.08, c.backZ + 0.033);
      return { x, y };
    },
  },
  nrm10: { w: 0.78, h: 1.64, d: 0.089, r: 0.06, punch: false, slider: "none", camera: (c) => redmagic(c) },
  nrm11: { w: 0.78, h: 1.64, d: 0.09, r: 0.06, punch: false, slider: "none", camera: (c) => redmagic(c) },
};

/* ───────────── build ───────────── */

export function buildPhone(_island: Island, fold: boolean, swatch: Swatch, label: string, id = ""): PhoneHandle {
  bucket = [];
  const own = bucket;
  const spec = SPECS[id] ?? SPECS.n13;
  const bump = noiseTex(90);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(4, 8);

  const backMat = track(new THREE.MeshPhysicalMaterial({ ior: 1.5 }));
  applyFinish(backMat, swatch, bump);
  const metal = track(
    new THREE.MeshPhysicalMaterial({ color: frameColorFor(swatch), metalness: 1, roughness: 0.26, clearcoat: 0.5, clearcoatRoughness: 0.2 })
  );
  const glassFront = track(new THREE.MeshPhysicalMaterial({ color: 0x020304, metalness: 0.2, roughness: 0.05, clearcoat: 1 }));
  const dark = track(new THREE.MeshStandardMaterial({ color: 0x060708, roughness: 0.6 }));
  const antenna = track(new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5 }));
  const lensGlass = track(new THREE.MeshPhysicalMaterial({ map: lensTex(), metalness: 0.1, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0 }));
  const domeMat = track(new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0, clearcoat: 1 }));
  const flashMat = track(new THREE.MeshStandardMaterial({ map: flashTex(), roughness: 0.3, emissive: 0x221c10 }));

  const group = new THREE.Group();
  const anchors = {
    camera: new THREE.Object3D(),
    chip: new THREE.Object3D(),
    battery: new THREE.Object3D(),
    signal: new THREE.Object3D(),
  };
  let blades: THREE.Group | null = null;
  let rgb: THREE.MeshBasicMaterial | null = null;
  let setFold: ((t: number) => void) | undefined;

  const { w, h, d, r } = spec;
  const backZ = d / 2;
  const screenTex = lockScreen(512, 1110, label, spec.punch);

  const lens = (target: THREE.Group) => (lr: number, x: number, y: number, z: number) => {
    const g = new THREE.Group();
    const bezel = new THREE.Mesh(cyl(lr * 1.18, 0.012, 64), metal);
    const barrel = new THREE.Mesh(cyl(lr * 1.02, 0.014, 64), dark);
    barrel.position.z = 0.002;
    const glass = new THREE.Mesh(track(new THREE.CircleGeometry(lr * 0.98, 64)), lensGlass);
    glass.position.z = 0.0095;
    const dome = new THREE.Mesh(track(new THREE.SphereGeometry(lr, 48, 16, 0, Math.PI * 2, 0, Math.PI / 5)), domeMat);
    dome.rotation.x = Math.PI / 2;
    dome.position.z = 0.0095 - lr * Math.cos(Math.PI / 5);
    g.add(bezel, barrel, glass, dome);
    g.position.set(x, y, z - 0.004);
    target.add(g);
  };
  const flash = (target: THREE.Group) => (fr: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(track(new THREE.CircleGeometry(fr, 32)), flashMat);
    m.position.set(x, y, z + 0.001);
    const rim = new THREE.Mesh(track(new THREE.RingGeometry(fr, fr * 1.25, 32)), metal);
    rim.position.copy(m.position);
    target.add(m, rim);
  };

  /** One slab: a full phone, or one half of the Fold. */
  function slab(opts: { camera: boolean; screen: THREE.Texture | null; screenRepeat?: [number, number]; buttons: boolean; bottom: boolean }) {
    const s = new THREE.Group();
    s.add(new THREE.Mesh(slabGeo(w, h, r, d * 0.86, 0.012), metal));
    const back = new THREE.Mesh(slabGeo(w - 0.012, h - 0.012, r - 0.006, 0.012, 0.005), backMat);
    back.position.z = backZ - 0.012;
    s.add(back);
    const front = new THREE.Mesh(slabGeo(w - 0.01, h - 0.01, r - 0.005, 0.012, 0.005), glassFront);
    front.position.z = -backZ + 0.012;
    s.add(front);
    if (opts.screen) {
      const t = opts.screen.clone();
      track(t);
      if (opts.screenRepeat) {
        t.repeat.set(opts.screenRepeat[0], 1);
        t.offset.set(opts.screenRepeat[1], 0);
      }
      t.needsUpdate = true;
      const scr = new THREE.Mesh(planeUV(w - 0.035, h - 0.035, r - 0.02), track(new THREE.MeshBasicMaterial({ map: t, toneMapped: false })));
      scr.rotation.y = Math.PI;
      scr.position.z = -backZ + 0.0055;
      s.add(scr);
    }
    // antenna lines
    [
      [w / 2, h / 2 - 0.16],
      [w / 2, -h / 2 + 0.16],
      [-w / 2, h / 2 - 0.16],
      [-w / 2, -h / 2 + 0.16],
    ].forEach(([x, y]) => {
      const a = new THREE.Mesh(box(0.004, 0.012, d * 0.7), antenna);
      a.position.set(x, y, 0);
      s.add(a);
    });
    [
      [0.16, h / 2],
      [-0.16, h / 2],
      [0.16, -h / 2],
      [-0.16, -h / 2],
    ].forEach(([x, y]) => {
      const a = new THREE.Mesh(box(0.012, 0.004, d * 0.7), antenna);
      a.position.set(x, y, 0);
      s.add(a);
    });
    if (opts.buttons) {
      const btn = (x: number, y: number, len: number) => {
        const b = new THREE.Mesh(box(0.012, len, d * 0.34), metal);
        b.position.set(x, y, 0);
        s.add(b);
      };
      btn(w / 2 + 0.004, 0.28, 0.13);
      btn(w / 2 + 0.004, 0.06, 0.2);
      if (spec.slider !== "none") {
        const side = spec.slider === "left" ? -1 : 1;
        const sy = side > 0 ? 0.47 : 0.36;
        const sl = new THREE.Mesh(box(0.012, 0.075, d * 0.3), metal);
        sl.position.set(side * (w / 2 + 0.004), sy, 0);
        s.add(sl);
        for (let i = 0; i < 5; i++) {
          const rid = new THREE.Mesh(box(0.013, 0.004, d * 0.28), dark);
          rid.position.set(side * (w / 2 + 0.004), sy - 0.03 + i * 0.015, 0);
          s.add(rid);
        }
      } else {
        // REDMAGIC shoulder triggers
        [0.55, -0.1].forEach((y) => {
          const trig = new THREE.Mesh(box(0.004, 0.09, d * 0.3), antenna);
          trig.position.set(w / 2 + 0.002, y, 0);
          s.add(trig);
        });
      }
    }
    if (opts.bottom) {
      const port = new THREE.Mesh(box(0.1, 0.012, 0.03), dark);
      port.position.set(0, -h / 2 - 0.001, 0);
      s.add(port);
      for (let i = 0; i < 7; i++) {
        const hole = new THREE.Mesh(track(new THREE.CylinderGeometry(0.0055, 0.0055, 0.012, 12)), dark);
        hole.position.set(0.12 + i * 0.022, -h / 2, 0);
        s.add(hole);
      }
      const sim = new THREE.Mesh(box(0.12, 0.003, d * 0.28), antenna);
      sim.position.set(-0.17, -h / 2 - 0.001, 0);
      s.add(sim);
    }
    if (opts.camera) {
      const light = new THREE.Color(swatch.hex).getHSL({ h: 0, s: 0, l: 0 }).l > 0.5;
      const mark = new THREE.Mesh(
        track(new THREE.PlaneGeometry(0.2, 0.05)),
        track(new THREE.MeshPhysicalMaterial({ map: wordmark(light ? "#2a2f33" : "#c9d2d8"), transparent: true, metalness: 0.6, roughness: 0.3 }))
      );
      mark.position.set(0, -h / 2 + 0.28, backZ + 0.0012);
      s.add(mark);
    }
    return s;
  }

  const makeCtx = (target: THREE.Group): Ctx => ({
    add: (o) => target.add(o),
    w,
    h,
    backZ: backZ - 0.001,
    backMat,
    metal,
    lens: lens(target),
    flash: flash(target),
    onFan: (g, ring) => {
      blades = g;
      rgb = ring;
    },
  });

  if (!fold) {
    group.add(slab({ camera: true, screen: screenTex, buttons: true, bottom: true }));
    if (swatch.finish === "clear") {
      const guts = new THREE.Mesh(planeUV(w - 0.08, h - 0.1, 0.05), track(new THREE.MeshBasicMaterial({ map: circuitTex() })));
      guts.position.z = backZ - 0.016;
      group.add(guts);
    }
    const cam = spec.camera(makeCtx(group));
    anchors.camera.position.set(cam.x, cam.y, backZ + 0.04);
    anchors.chip.position.set(0.05, 0.12, 0);
    anchors.battery.position.set(0, -0.35, 0);
    anchors.signal.position.set(w / 2, h / 2 - 0.16, 0);
    group.add(...Object.values(anchors));
  } else {
    const left = new THREE.Group();
    const leftBody = slab({ camera: true, screen: screenTex, screenRepeat: [0.5, 0.5], buttons: false, bottom: true });
    leftBody.position.x = -w / 2;
    left.add(leftBody);
    const camGroup = new THREE.Group();
    camGroup.position.x = -w / 2;
    left.add(camGroup);
    const cam = spec.camera(makeCtx(camGroup));

    const pivot = new THREE.Group();
    pivot.position.z = -d / 2;
    const right = new THREE.Group();
    right.position.z = d / 2;
    const rightBody = slab({ camera: false, screen: screenTex, screenRepeat: [0.5, 0], buttons: true, bottom: false });
    rightBody.position.x = w / 2;
    right.add(rightBody);
    const cover = new THREE.Mesh(
      planeUV(w - 0.05, h - 0.06, r - 0.02),
      track(new THREE.MeshBasicMaterial({ map: lockScreen(512, 1110, label, true), toneMapped: false }))
    );
    cover.position.set(w / 2, 0, backZ + 0.0015);
    right.add(cover);
    pivot.add(right);
    const hinge = new THREE.Mesh(track(new THREE.CylinderGeometry(d * 0.55, d * 0.55, h * 0.985, 32)), metal);
    left.add(hinge);
    group.add(left, pivot);

    setFold = (t: number) => {
      pivot.rotation.y = t * Math.PI;
      group.children.forEach((c) => (c.position.x = (w / 2) * t));
    };
    setFold(1);

    anchors.camera.position.set(-w / 2 + cam.x, cam.y, backZ + 0.05);
    anchors.chip.position.set(-w / 2, 0.1, 0);
    anchors.battery.position.set(-w / 2, -0.35, 0);
    anchors.signal.position.set(-0.02, h / 2 - 0.16, 0);
    left.add(...Object.values(anchors));
  }

  let last = swatch.hex + swatch.finish;
  const target = new THREE.Color(swatch.hex);
  const frameTarget = frameColorFor(swatch);

  return {
    group,
    anchors,
    setFold,
    setColor: (s) => {
      if (s.hex + s.finish === last) return;
      last = s.hex + s.finish;
      const keep = backMat.color.clone();
      applyFinish(backMat, s, bump);
      backMat.color.copy(keep); // lerp toward the new color in tick
      target.set(s.hex);
      frameTarget.copy(frameColorFor(s));
    },
    tick: (dt, t) => {
      backMat.color.lerp(target, Math.min(1, dt * 6));
      metal.color.lerp(frameTarget, Math.min(1, dt * 6));
      if (blades) (blades as THREE.Group).rotation.z -= dt * 24;
      if (rgb) (rgb as THREE.MeshBasicMaterial).color.setHSL((t * 0.08) % 1, 1, 0.55);
    },
    dispose: () => own.splice(0).forEach((x) => x.dispose()),
  };
}
