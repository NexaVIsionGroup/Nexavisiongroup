import * as THREE from "three";
import { buildPhone, type Island } from "./buildPhone";
import { buildChip } from "./buildChip";
import { studioEnvironment, studioLights, STUDIO_INTENSITY } from "./studio";
import type { Color as Swatch } from "../catalog";

// One WebGL renderer for every shop card. Browsers cap live WebGL contexts (and a
// context per card would drain a phone), so each frame this renders the cards that
// are on screen one after another into a shared offscreen canvas and copies each
// result onto that card's own 2D canvas. Same studio lighting as the big viewer.

export type CardModel = { id: string; island: Island; fold: boolean; swatch: Swatch; label: string };

type Built = { group: THREE.Group; tick: (dt: number, t: number) => void; dispose: () => void };
type Entry = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  build: () => Built;
  /** Object height / width to frame, in scene units. */
  fit: { h: number; w: number };
  /** Per-frame pose. */
  pose: (g: THREE.Group, t: number, phase: number, still: boolean) => void;
  shadowY: number;
  shadowScale: number;
  phone: Built | null;
  visible: boolean;
  phase: number;
  onReady: () => void;
  ready: boolean;
};

const FPS = 30;
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let shadow: THREE.Mesh;
let broken = false;
let raf = 0;
let lastFrame = 0;
let t0 = 0;
let still = false;
const entries = new Set<Entry>();

function init() {
  if (renderer || broken) return !!renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    broken = true;
    return false;
  }
  renderer.setPixelRatio(1); // we size in device pixels ourselves
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = STUDIO_INTENSITY;
  studioLights(scene);

  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

  // Soft contact shadow under the phone
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(15,26,33,.55)");
  gr.addColorStop(0.55, "rgba(15,26,33,.18)");
  gr.addColorStop(1, "rgba(15,26,33,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.42),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, toneMapped: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  t0 = performance.now();
  return true;
}

function frame(now: number) {
  raf = requestAnimationFrame(frame);
  if (document.hidden || !renderer) return;
  if (now - lastFrame < 1000 / FPS - 2) return;
  const dt = Math.min(0.1, (now - (lastFrame || now)) / 1000);
  lastFrame = now;
  const t = (now - t0) / 1000;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  for (const e of entries) {
    if (!e.visible) continue;
    const w = Math.round(e.canvas.clientWidth * dpr);
    const h = Math.round(e.canvas.clientHeight * dpr);
    if (w < 8 || h < 8) continue;
    if (!e.phone) e.phone = e.build();
    if (e.canvas.width !== w || e.canvas.height !== h) {
      e.canvas.width = w;
      e.canvas.height = h;
    }
    const size = renderer.getSize(new THREE.Vector2());
    if (size.x !== w || size.y !== h) renderer.setSize(w, h, false);

    // Frame the phone: fit its height, and its width on narrow stages.
    const aspect = w / h;
    camera.aspect = aspect;
    const fitH = e.fit.h / (2 * Math.tan((30 * Math.PI) / 360));
    const fitW = e.fit.w / (2 * Math.tan((30 * Math.PI) / 360) * aspect);
    camera.position.set(0, 0.12, Math.max(fitH, fitW));
    camera.lookAt(0, -0.02, 0);
    camera.updateProjectionMatrix();

    const g = e.phone.group;
    e.pose(g, t, e.phase, still);
    shadow.position.y = e.shadowY;
    shadow.scale.setScalar(e.shadowScale);
    (shadow.material as THREE.MeshBasicMaterial).opacity = 0.85 - g.position.y * 3;
    e.phone.tick(dt, t);

    scene.add(g);
    renderer.render(scene, camera);
    scene.remove(g);

    // Copy straight away: the drawing buffer is only valid until the next render.
    e.ctx.clearRect(0, 0, w, h);
    e.ctx.drawImage(renderer.domElement, 0, 0, w, h);
    if (!e.ready) {
      e.ready = true;
      e.onReady();
    }
  }
}

// Eased spin: lingers on the back and the screen, turns quickly through the
// edge-on angles where a phone is just a sliver.
const phonePose = (g: THREE.Group, t: number, phase: number, still: boolean) => {
  const th = phase + t * 0.5;
  g.rotation.set(0.06, still ? -0.45 : th - 0.38 * Math.sin(2 * th), 0);
  g.position.y = still ? 0 : Math.sin(t * 1.2 + phase) * 0.025;
};

// The chip tilts and sways so the brushed lid keeps catching the light streaks,
// but never turns its face away.
const chipPose = (g: THREE.Group, t: number, phase: number, still: boolean) => {
  g.rotation.set(-0.38 + (still ? 0 : Math.sin(t * 0.6 + phase) * 0.1), still ? 0.3 : Math.sin(t * 0.45 + phase) * 0.55, 0);
  g.position.y = -0.04;
  g.position.y += still ? 0 : Math.sin(t * 1.1 + phase) * 0.02;
};

export type ObjectSpec = { build: () => Built; fit?: { h: number; w: number }; pose?: Entry["pose"]; shadowY?: number; shadowScale?: number };

/** Show any 3D object on `canvas` with the shared renderer. Returns a cleanup function. */
export function mountObject(canvas: HTMLCanvasElement, spec: ObjectSpec, onReady: () => void): () => void {
  if (!init()) return () => {};
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const e: Entry = {
    canvas,
    ctx,
    build: spec.build,
    fit: spec.fit ?? { h: 1.78, w: 1.15 },
    pose: spec.pose ?? phonePose,
    shadowY: spec.shadowY ?? -0.86,
    shadowScale: spec.shadowScale ?? 1,
    phone: null,
    visible: false,
    phase: -0.5 + Math.random() * 0.6 + (entries.size % 2) * Math.PI,
    onReady,
    ready: false,
  };
  entries.add(e);
  const io = new IntersectionObserver(([x]) => (e.visible = x.isIntersecting), { rootMargin: "60px" });
  io.observe(canvas);
  if (!raf) raf = requestAnimationFrame(frame);
  return () => {
    io.disconnect();
    entries.delete(e);
    e.phone?.dispose();
    if (!entries.size && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

/** A spinning phone for a shop card. */
export function mountCard(canvas: HTMLCanvasElement, model: CardModel, onReady: () => void): () => void {
  return mountObject(
    canvas,
    {
      build: () => {
        const ph = buildPhone(model.island, model.fold, model.swatch, model.label, model.id);
        ph.setFold?.(1);
        return ph;
      },
    },
    onReady
  );
}

/** The flagship chip tile. */
export function mountChip(canvas: HTMLCanvasElement, lines: [string, string, string], onReady: () => void): () => void {
  return mountObject(
    canvas,
    { build: () => buildChip(...lines), fit: { h: 1.6, w: 1.5 }, pose: chipPose, shadowY: -0.66, shadowScale: 0.9 },
    onReady
  );
}
