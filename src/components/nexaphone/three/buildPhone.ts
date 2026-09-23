import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Color as Swatch } from "../catalog";

/**
 * Procedural phone models. No downloaded meshes: each Nexa device is built
 * from rounded boxes, cylinders and canvas textures so it loads instantly
 * and can recolor live. Back faces +Z (toward the camera), screen faces -Z.
 */

export type Island = "round" | "offset" | "wide" | "fan";
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

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return track(t);
}

function lockScreen(w: number, h: number, label: string) {
  return canvasTex(w, h, (g) => {
    const bg = g.createLinearGradient(0, 0, w * 0.4, h);
    bg.addColorStop(0, "#08121a");
    bg.addColorStop(0.55, "#0b1d26");
    bg.addColorStop(1, "#04080b");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    // aurora
    const au = g.createRadialGradient(w * 0.7, h * 0.28, 10, w * 0.7, h * 0.28, w * 0.9);
    au.addColorStop(0, "rgba(86,224,232,.35)");
    au.addColorStop(1, "rgba(86,224,232,0)");
    g.fillStyle = au;
    g.fillRect(0, 0, w, h);
    // status bar
    g.fillStyle = "#cfe9ec";
    g.font = `600 ${w * 0.045}px system-ui`;
    g.fillText("NEXA", w * 0.08, h * 0.045);
    for (let i = 0; i < 4; i++) g.fillRect(w * 0.78 + i * w * 0.028, h * 0.04 - i * h * 0.005, w * 0.016, h * 0.008 + i * h * 0.005);
    // clock
    g.textAlign = "center";
    g.fillStyle = "#eefcfd";
    g.font = `200 ${w * 0.26}px system-ui`;
    g.fillText("07:30", w / 2, h * 0.27);
    g.font = `500 ${w * 0.045}px system-ui`;
    g.fillStyle = "#9fb4bd";
    g.fillText("Tuesday, shift start", w / 2, h * 0.32);
    // tower lock widget
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
    g.fillStyle = "rgba(255,255,255,.08)";
    g.fillRect(150, 300, 210, 210);
    g.strokeStyle = "rgba(255,255,255,.25)";
    g.strokeRect(150, 300, 210, 210);
    g.fillStyle = "rgba(255,255,255,.35)";
    g.font = "700 28px system-ui";
    g.textAlign = "center";
    g.fillText("NEXA CORE", 255, 415);
  });
}

function leatherBump() {
  return canvasTex(256, 256, (g) => {
    const img = g.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 110 + Math.random() * 60;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}

function finishMaterial(s: Swatch) {
  const m = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(s.hex),
      metalness: 0.15,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
    })
  );
  applyFinish(m, s);
  return m;
}

function applyFinish(m: THREE.MeshPhysicalMaterial, s: Swatch) {
  m.transparent = s.finish === "clear";
  m.opacity = s.finish === "clear" ? 0.72 : 1;
  m.roughness = s.finish === "matte" ? 0.5 : s.finish === "leather" ? 0.85 : 0.14;
  m.clearcoat = s.finish === "leather" ? 0 : s.finish === "matte" ? 0.25 : 1;
  m.sheen = s.finish === "leather" ? 1 : 0;
  m.sheenColor = new THREE.Color(s.hex).offsetHSL(0, 0, 0.2);
  m.bumpMap = s.finish === "leather" ? leatherBump() : null;
  m.bumpScale = 0.6;
  m.needsUpdate = true;
}

function roundedPlane(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const g = track(new THREE.ShapeGeometry(s, 12));
  // map UVs to 0..1 over the bounds
  const pos = g.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) + w / 2) / w;
    uv[i * 2 + 1] = (pos.getY(i) + h / 2) / h;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

const metal = () =>
  track(new THREE.MeshPhysicalMaterial({ color: 0x9aa3ab, metalness: 1, roughness: 0.28, clearcoat: 0.4 }));
const lensGlass = () =>
  track(
    new THREE.MeshPhysicalMaterial({
      color: 0x05080d,
      metalness: 0.6,
      roughness: 0.04,
      clearcoat: 1,
      iridescence: 0.8,
      iridescenceIOR: 1.6,
    })
  );

function lens(r: number) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(track(new THREE.TorusGeometry(r, r * 0.13, 12, 48)), metal());
  const barrel = new THREE.Mesh(track(new THREE.CylinderGeometry(r, r, r * 0.35, 40)), track(new THREE.MeshStandardMaterial({ color: 0x0a0c0f, roughness: 0.6 })));
  barrel.rotation.x = Math.PI / 2;
  const glass = new THREE.Mesh(track(new THREE.SphereGeometry(r * 0.78, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)), lensGlass());
  glass.rotation.x = Math.PI / 2;
  glass.scale.y = 0.35; // flatten the dome (local y points out of the back)
  glass.position.z = r * 0.12;
  const inner = new THREE.Mesh(track(new THREE.CircleGeometry(r * 0.3, 24)), track(new THREE.MeshBasicMaterial({ color: 0x1a3a55 })));
  inner.position.z = r * 0.1;
  g.add(barrel, ring, inner, glass);
  ring.position.z = r * 0.17;
  return g;
}

function flash(r: number) {
  const m = new THREE.Mesh(track(new THREE.CircleGeometry(r, 24)), track(new THREE.MeshBasicMaterial({ color: 0xfff1d6 })));
  return m;
}

type Dims = { w: number; h: number; d: number; r: number };

function slab(dims: Dims, back: THREE.MeshPhysicalMaterial, frameMat: THREE.Material) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(track(new RoundedBoxGeometry(dims.w, dims.h, dims.d * 0.82, 6, dims.r)), frameMat);
  const backPanel = new THREE.Mesh(track(new RoundedBoxGeometry(dims.w - 0.012, dims.h - 0.012, dims.d * 0.3, 6, dims.r * 0.95)), back);
  backPanel.position.z = dims.d * 0.33;
  g.add(frame, backPanel);
  return g;
}

function screen(dims: Dims, tex: THREE.Texture, repeatX = 1, offsetX = 0) {
  const t = tex.clone();
  track(t);
  t.repeat.set(repeatX, 1);
  t.offset.set(offsetX, 0);
  t.needsUpdate = true;
  const m = new THREE.Mesh(roundedPlane(dims.w - 0.03, dims.h - 0.03, dims.r * 0.8), track(new THREE.MeshBasicMaterial({ map: t, toneMapped: false })));
  m.position.z = -dims.d * 0.42;
  m.rotation.y = Math.PI;
  return m;
}

export function buildPhone(island: Island, fold: boolean, swatch: Swatch, label: string): PhoneHandle {
  bucket = [];
  const own = bucket;
  const group = new THREE.Group();
  const backMat = finishMaterial(swatch);
  const frameMat = metal();
  const anchors = {
    camera: new THREE.Object3D(),
    chip: new THREE.Object3D(),
    battery: new THREE.Object3D(),
    signal: new THREE.Object3D(),
  };
  let fan: THREE.Group | null = null;
  let rgb: THREE.MeshBasicMaterial | null = null;
  let setFold: ((t: number) => void) | undefined;

  const dims: Dims =
    island === "fan"
      ? { w: 0.78, h: 1.64, d: 0.1, r: 0.06 }
      : fold
        ? { w: 0.7, h: 1.54, d: 0.062, r: 0.07 }
        : { w: 0.76, h: 1.63, d: 0.088, r: 0.085 };
  const backZ = dims.d * 0.49;

  const addIsland = (target: THREE.Group, cx: number, cy: number) => {
    if (island === "round" || island === "offset") {
      const R = fold ? 0.25 : 0.21;
      const disc = new THREE.Mesh(track(new THREE.CylinderGeometry(R, R, 0.026, 72)), backMat);
      disc.rotation.x = Math.PI / 2;
      disc.position.set(cx, cy, backZ + 0.013);
      const ring = new THREE.Mesh(track(new THREE.TorusGeometry(R, 0.012, 12, 96)), frameMat);
      ring.position.set(cx, cy, backZ + 0.02);
      target.add(disc, ring);
      const pts: [number, number][] = [
        [-0.085, 0.07],
        [0.085, 0.07],
        [0, -0.08],
      ];
      pts.forEach(([x, y]) => {
        const l = lens(fold ? 0.075 : 0.066);
        l.position.set(cx + x, cy + y, backZ + 0.03);
        target.add(l);
      });
      const f = flash(0.022);
      f.position.set(cx + 0.12, cy - 0.1, backZ + 0.028);
      target.add(f);
    } else if (island === "wide") {
      const box = new THREE.Mesh(track(new RoundedBoxGeometry(0.4, 0.4, 0.03, 5, 0.1)), backMat);
      box.position.set(cx, cy, backZ + 0.012);
      target.add(box);
      const pts: [number, number, number][] = [
        [-0.09, 0.09, 0.068],
        [0.09, 0.09, 0.068],
        [-0.09, -0.09, 0.068],
      ];
      pts.forEach(([x, y, r]) => {
        const l = lens(r);
        l.position.set(cx + x, cy + y, backZ + 0.032);
        target.add(l);
      });
      const f = flash(0.03);
      f.position.set(cx + 0.09, cy - 0.09, backZ + 0.03);
      target.add(f);
    } else {
      // Turbo: flush lens column, fan window, RGB ring and accent strip.
      [0.52, 0.36, 0.2].forEach((y, i) => {
        const l = lens(i === 2 ? 0.035 : 0.06);
        l.position.set(-0.24, y, backZ + 0.012);
        target.add(l);
      });
      const fanWin = new THREE.Group();
      fanWin.position.set(0.1, 0.34, backZ + 0.004);
      const well = new THREE.Mesh(track(new THREE.CircleGeometry(0.17, 64)), track(new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.9 })));
      fanWin.add(well);
      fan = new THREE.Group();
      for (let i = 0; i < 9; i++) {
        const blade = new THREE.Mesh(track(new THREE.BoxGeometry(0.13, 0.03, 0.004)), track(new THREE.MeshStandardMaterial({ color: 0x2a2f36, metalness: 0.6, roughness: 0.4 })));
        blade.position.x = 0.075;
        blade.rotation.x = 0.5;
        const arm = new THREE.Group();
        arm.rotation.z = (i / 9) * Math.PI * 2;
        arm.add(blade);
        fan.add(arm);
      }
      const hub = new THREE.Mesh(track(new THREE.CircleGeometry(0.035, 32)), metal());
      hub.position.z = 0.006;
      fan.add(hub);
      fan.position.z = 0.004;
      fanWin.add(fan);
      rgb = track(new THREE.MeshBasicMaterial({ color: 0xff3b30, toneMapped: false }));
      const ringLight = new THREE.Mesh(track(new THREE.TorusGeometry(0.175, 0.008, 12, 96)), rgb);
      ringLight.position.z = 0.01;
      const cover = new THREE.Mesh(track(new THREE.CircleGeometry(0.18, 64)), track(new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0, clearcoat: 1 })));
      cover.position.z = 0.014;
      fanWin.add(ringLight, cover);
      target.add(fanWin);
      const strip = new THREE.Mesh(track(new THREE.BoxGeometry(0.012, 0.36, 0.004)), rgb);
      strip.position.set(dims.w / 2 - 0.07, -0.35, backZ + 0.004);
      target.add(strip);
    }
  };

  const tex = lockScreen(512, 1110, label);

  if (!fold) {
    const body = slab(dims, backMat, frameMat);
    group.add(body);
    if (swatch.finish === "clear") {
      const guts = new THREE.Mesh(roundedPlane(dims.w - 0.08, dims.h - 0.1, 0.05), track(new THREE.MeshBasicMaterial({ map: circuitTex() })));
      guts.position.z = dims.d * 0.18;
      group.add(guts);
    }
    group.add(screen(dims, tex));
    const ix = island === "offset" ? -dims.w / 2 + 0.25 : island === "wide" ? -dims.w / 2 + 0.25 : 0;
    const iy = island === "wide" ? dims.h / 2 - 0.25 : dims.h / 2 - 0.33;
    if (island !== "fan") addIsland(group, ix, iy);
    else addIsland(group, 0, 0);
    anchors.camera.position.set(island === "fan" ? -0.24 : ix, island === "fan" ? 0.4 : iy, backZ + 0.05);
    anchors.chip.position.set(0.05, 0.15, 0);
    anchors.battery.position.set(0, -0.35, 0);
    anchors.signal.position.set(dims.w / 2, dims.h / 2 - 0.12, 0);
    group.add(...Object.values(anchors));
  } else {
    // Two halves on a hinge at x = 0. Left half carries the cameras,
    // right half carries the cover screen on its back.
    const left = new THREE.Group();
    const leftBody = slab(dims, backMat, frameMat);
    leftBody.position.x = -dims.w / 2;
    left.add(leftBody);
    const innerL = screen(dims, tex, 0.5, 0.5);
    innerL.position.x = -dims.w / 2;
    left.add(innerL);
    addIsland(left, -dims.w / 2, dims.h / 2 - 0.36);

    const pivot = new THREE.Group();
    pivot.position.z = -dims.d / 2;
    const right = new THREE.Group();
    right.position.z = dims.d / 2;
    const rightBody = slab(dims, backMat, frameMat);
    rightBody.position.x = dims.w / 2;
    right.add(rightBody);
    const innerR = screen(dims, tex, 0.5, 0);
    innerR.position.x = dims.w / 2;
    right.add(innerR);
    const cover = screen(dims, lockScreen(512, 1110, label));
    cover.rotation.y = 0;
    cover.position.set(dims.w / 2, 0, dims.d * 0.49 + 0.002);
    cover.scale.set(0.92, 0.95, 1);
    right.add(cover);
    pivot.add(right);
    const hinge = new THREE.Mesh(track(new THREE.CylinderGeometry(dims.d * 0.55, dims.d * 0.55, dims.h * 0.98, 24)), frameMat);
    hinge.position.z = 0;
    left.add(hinge);
    group.add(left, pivot);

    setFold = (t: number) => {
      pivot.rotation.y = t * Math.PI;
      // keep the model centered as it folds
      group.children.forEach((c) => (c.position.x = (dims.w / 2) * t));
    };
    setFold(1);

    anchors.camera.position.set(-dims.w / 2, dims.h / 2 - 0.36, backZ + 0.05);
    anchors.chip.position.set(-dims.w / 2, 0.1, 0);
    anchors.battery.position.set(-dims.w / 2, -0.35, 0);
    anchors.signal.position.set(-0.02, dims.h / 2 - 0.12, 0);
    left.add(...Object.values(anchors));
  }

  let last = swatch.hex;
  const target = new THREE.Color(swatch.hex);

  return {
    group,
    anchors,
    setFold,
    setColor: (s) => {
      if (s.hex === last) return;
      last = s.hex;
      target.set(s.hex);
      applyFinish(backMat, s);
    },
    tick: (dt, t) => {
      backMat.color.lerp(target, Math.min(1, dt * 6));
      if (fan) fan.rotation.z -= dt * 22;
      if (rgb) rgb.color.setHSL((t * 0.08) % 1, 1, 0.55);
    },
    dispose: () => own.splice(0).forEach((d) => d.dispose()),
  };
}
