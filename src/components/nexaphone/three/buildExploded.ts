import * as THREE from "three";

// Exploded view: a phone as a stack of layers that pull apart along Z. Built
// as its own simplified model (the showcase phone's slab is one welded piece)
// so each layer can move and be called out by number.

export type Layer = { id: string; title: string; body: string; hot?: boolean };
export type ExplodedHandle = {
  group: THREE.Group;
  layers: Layer[];
  /** 0 = assembled, 1 = fully apart. */
  setExplode: (t: number) => void;
  /** Index of the layer to spotlight (brighter), or -1. */
  setFocus: (i: number) => void;
  tick: (dt: number, t: number) => void;
  dispose: () => void;
};

export type ExplodedSpec = {
  display: string;
  glass: string;
  chip: string;
  modem: string;
  battery: string;
  fan: boolean;
  swatch: { hex: string; finish: string };
  island: "round" | "offset" | "wide" | "fan" | "wrap";
};

const W = 0.76;
const H = 1.6;
const R = 0.09;

function rr(w: number, h: number, r: number) {
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
  return s;
}
function plate(w: number, h: number, r: number, depth: number, bevel = 0.004) {
  const g = new THREE.ExtrudeGeometry(rr(w - bevel * 2, h - bevel * 2, Math.max(0.001, r - bevel)), {
    depth: Math.max(0.001, depth - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 18,
  });
  g.translate(0, 0, -(depth - bevel * 2) / 2);
  g.computeVertexNormals();
  return g;
}
/** Flat plane with 0..1 UVs cut to a rounded rect. */
function face(w: number, h: number, r: number) {
  const g = new THREE.ShapeGeometry(rr(w, h, r), 18);
  const pos = g.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) + w / 2) / w;
    uv[i * 2 + 1] = (pos.getY(i) + h / 2) / h;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}
function label(w: number, h: number, draw: (g: CanvasRenderingContext2D, W: number, H: number) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function buildExploded(spec: ExplodedSpec): ExplodedHandle {
  const own: { dispose: () => void }[] = [];
  const tr = <T extends { dispose: () => void }>(x: T) => {
    own.push(x);
    return x;
  };
  const group = new THREE.Group();
  const parts: { obj: THREE.Object3D; rest: number; spread: number; mats: THREE.Material[] }[] = [];
  const layers: Layer[] = [];
  const add = (obj: THREE.Object3D, rest: number, spread: number, layer: Layer, mats: THREE.Material[]) => {
    obj.position.z = rest;
    group.add(obj);
    parts.push({ obj, rest, spread, mats });
    layers.push(layer);
  };

  // Z runs front (-) to back (+); the spread opens the stack toward the camera side.
  // 1. front glass
  const glass = new THREE.Mesh(tr(plate(W, H, R, 0.012)), tr(new THREE.MeshPhysicalMaterial({ color: 0x0a0d10, metalness: 0.1, roughness: 0.04, clearcoat: 1, transparent: true, opacity: 0.72 })));
  add(glass, -0.075, -0.95, { id: "glass", title: "Front glass", body: spec.glass }, [glass.material as THREE.Material]);

  // 2. display: lit panel
  const screenTex = tr(
    label(512, 1080, (g, Wc, Hc) => {
      const bg = g.createLinearGradient(0, 0, Wc * 0.4, Hc);
      bg.addColorStop(0, "#07121a");
      bg.addColorStop(1, "#04080b");
      g.fillStyle = bg;
      g.fillRect(0, 0, Wc, Hc);
      const au = g.createRadialGradient(Wc * 0.5, Hc * 0.45, 10, Wc * 0.5, Hc * 0.45, Wc * 0.9);
      au.addColorStop(0, "rgba(79,134,255,.4)");
      au.addColorStop(1, "rgba(79,134,255,0)");
      g.fillStyle = au;
      g.fillRect(0, 0, Wc, Hc);
      for (let r = 1; r <= 3; r++) {
        g.strokeStyle = `rgba(79,134,255,${0.6 - r * 0.15})`;
        g.lineWidth = 4;
        g.beginPath();
        g.arc(Wc / 2, Hc * 0.45, Wc * 0.08 * r, 0, Math.PI * 2);
        g.stroke();
      }
      g.fillStyle = "#4f86ff";
      g.beginPath();
      g.arc(Wc / 2, Hc * 0.45, Wc * 0.035, 0, Math.PI * 2);
      g.fill();
      g.textAlign = "center";
      g.fillStyle = "#eefcfd";
      g.font = `700 ${Wc * 0.07}px system-ui`;
      g.fillText("Locked on", Wc / 2, Hc * 0.62);
    })
  );
  const display = new THREE.Mesh(tr(face(W - 0.04, H - 0.04, R - 0.02)), tr(new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false, side: THREE.DoubleSide })));
  display.rotation.y = Math.PI; // screen faces the front (-Z), so the text reads right from the camera side
  add(display, -0.058, -0.7, { id: "display", title: "Display", body: spec.display }, [display.material as THREE.Material]);

  // 3. frame: metal ring (plate minus inner cutout)
  const frameShape = rr(W, H, R);
  frameShape.holes.push(rr(W - 0.05, H - 0.05, R - 0.025));
  const frameGeo = tr(new THREE.ExtrudeGeometry(frameShape, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 18 }));
  frameGeo.translate(0, 0, -0.045);
  const frameMat = tr(new THREE.MeshPhysicalMaterial({ color: spec.swatch.finish === "clear" ? 0x3a4046 : 0x2b3036, metalness: 1, roughness: 0.28, clearcoat: 0.5 }));
  const frame = new THREE.Mesh(frameGeo, frameMat);
  add(frame, 0, -0.42, { id: "frame", title: "Frame", body: "Metal frame with antenna windows on every edge. Every radio has a clean path out." }, [frameMat]);

  // 4. Nexa Signal Engine board
  const boardTex = tr(
    label(512, 1080, (g, Wc, Hc) => {
      g.fillStyle = "#0c1a16";
      g.fillRect(0, 0, Wc, Hc);
      g.strokeStyle = "rgba(79,134,255,.25)";
      g.lineWidth = 3;
      for (let i = 0; i < 90; i++) {
        const x = Math.random() * Wc;
        const y = Math.random() * Hc;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(Math.random() > 0.5 ? x + 120 : x, Math.random() > 0.5 ? y : y + 120);
        g.stroke();
      }
      g.fillStyle = "#4f86ff";
      g.shadowColor = "#4f86ff";
      g.shadowBlur = 40;
      g.fillRect(Wc * 0.3, Hc * 0.3, Wc * 0.4, Wc * 0.4);
      g.shadowBlur = 0;
      g.fillStyle = "#06201f";
      g.textAlign = "center";
      g.font = `900 ${Wc * 0.09}px system-ui`;
      g.fillText("NEXA", Wc / 2, Hc * 0.3 + Wc * 0.17);
      g.font = `800 ${Wc * 0.05}px system-ui`;
      g.fillText("SIGNAL ENGINE", Wc / 2, Wc * 0.26 + Hc * 0.3);
      g.fillStyle = "#cfe9ec";
      g.font = `700 ${Wc * 0.055}px system-ui`;
      g.fillText(spec.modem.toUpperCase(), Wc / 2, Hc * 0.62);
      g.fillStyle = "#4f86ff";
      g.font = `600 ${Wc * 0.045}px system-ui`;
      g.fillText("TOWER + BAND LOCK", Wc / 2, Hc * 0.67);
    })
  );
  const board = new THREE.Mesh(tr(plate(W - 0.08, H - 0.1, R - 0.03, 0.014)), tr(new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: boardTex, roughness: 0.5, metalness: 0.2 })));
  board.rotation.y = Math.PI; // face the camera side when apart
  add(board, 0.012, -0.12, { id: "engine", title: "Nexa Signal Engine", body: `${spec.modem} plus our own software, working as one. The tower and band lock lives here.`, hot: true }, [board.material as THREE.Material]);

  // 5. chip (on the board side)
  const chip = new THREE.Group();
  const die = new THREE.Mesh(tr(new THREE.BoxGeometry(0.22, 0.22, 0.02)), tr(new THREE.MeshPhysicalMaterial({ color: 0x8a9199, metalness: 1, roughness: 0.3 })));
  const chipTex = tr(
    label(256, 256, (g, S) => {
      g.fillStyle = "#6a727b";
      g.fillRect(0, 0, S, S);
      g.fillStyle = "#0b0e11";
      g.textAlign = "center";
      g.font = `800 ${S * 0.11}px system-ui`;
      g.fillText("SNAPDRAGON", S / 2, S * 0.45);
      g.font = `900 ${S * 0.18}px system-ui`;
      g.fillText(spec.chip.replace(/^Snapdragon\s*/i, "").toUpperCase().slice(0, 12), S / 2, S * 0.68);
    })
  );
  const chipFace = new THREE.Mesh(tr(new THREE.PlaneGeometry(0.2, 0.2)), tr(new THREE.MeshPhysicalMaterial({ map: chipTex, metalness: 1, roughness: 0.35 })));
  chipFace.position.z = -0.0105;
  chipFace.rotation.y = Math.PI;
  chip.add(die, chipFace);
  chip.position.set(0, 0.28, 0);
  add(chip, 0.012, 0.18, { id: "chip", title: spec.chip, body: "Flagship Snapdragon silicon. Designed for games and sustained speed; here it's fed by a connection that holds." }, [die.material as THREE.Material, chipFace.material as THREE.Material]);

  // 6. battery
  const batTex = tr(
    label(512, 760, (g, Wc, Hc) => {
      g.fillStyle = "#1a1d21";
      g.fillRect(0, 0, Wc, Hc);
      g.fillStyle = "#2b3036";
      g.fillRect(0, 0, Wc, Hc * 0.18);
      g.fillStyle = "#cfd9df";
      g.textAlign = "center";
      g.font = `900 ${Wc * 0.17}px system-ui`;
      g.fillText(spec.battery.replace(/\s*mAh/i, ""), Wc / 2, Hc * 0.58);
      g.font = `700 ${Wc * 0.08}px system-ui`;
      g.fillText("mAh", Wc / 2, Hc * 0.7);
    })
  );
  const bat = new THREE.Mesh(tr(plate(W - 0.16, (H - 0.1) * 0.52, 0.03, 0.03)), tr(new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: batTex, roughness: 0.6, metalness: 0.1 })));
  bat.position.y = -0.36;
  bat.rotation.y = Math.PI;
  add(bat, 0.03, 0.48, { id: "battery", title: "Battery", body: `${spec.battery}. A locked phone isn't hunting for towers all day, and hunting is what drains batteries.` }, [bat.material as THREE.Material]);

  // 7. fan (Turbo) or nothing
  if (spec.fan) {
    const fan = new THREE.Group();
    const ring = new THREE.Mesh(tr(new THREE.TorusGeometry(0.17, 0.012, 12, 48)), tr(new THREE.MeshPhysicalMaterial({ color: 0x4f86ff, emissive: 0x1a6f75, metalness: 0.3, roughness: 0.3 })));
    fan.add(ring);
    const blades = new THREE.Group();
    const bladeMat = tr(new THREE.MeshStandardMaterial({ color: 0x2a2f36, metalness: 0.6, roughness: 0.35 }));
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Mesh(tr(new THREE.BoxGeometry(0.13, 0.03, 0.006)), bladeMat);
      b.position.x = 0.09;
      const h = new THREE.Group();
      h.add(b);
      h.rotation.z = (i / 9) * Math.PI * 2;
      blades.add(h);
    }
    fan.add(blades);
    fan.position.y = 0.05;
    add(fan, 0.05, 0.82, { id: "fan", title: "Cooling fan", body: "Active cooling that keeps the chip at full speed through a whole shift, not just a benchmark." }, [ring.material as THREE.Material, bladeMat]);
    fan.userData.blades = blades;
  }

  // 8. back panel with camera island
  const backMat = tr(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(spec.swatch.hex), metalness: 0.1, roughness: spec.swatch.finish === "matte" ? 0.3 : 0.06, clearcoat: spec.swatch.finish === "matte" ? 0.35 : 1, clearcoatRoughness: 0.2, transparent: spec.swatch.finish === "clear", opacity: spec.swatch.finish === "clear" ? 0.6 : 1 }));
  const back = new THREE.Group();
  back.add(new THREE.Mesh(tr(plate(W - 0.012, H - 0.012, R - 0.006, 0.012)), backMat));
  const islandMat = tr(new THREE.MeshPhysicalMaterial({ color: 0x1b1f24, metalness: 0.8, roughness: 0.3 }));
  const island =
    spec.island === "round" || spec.island === "fan"
      ? new THREE.Mesh(tr(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 48)), islandMat)
      : new THREE.Mesh(tr(plate(0.3, 0.3, 0.07, 0.02)), islandMat);
  if (spec.island === "round" || spec.island === "fan") island.rotation.x = Math.PI / 2;
  island.position.set(spec.island === "offset" || spec.island === "wrap" ? -0.17 : 0, H / 2 - 0.32, 0.014);
  back.add(island);
  add(back, 0.062, spec.fan ? 1.15 : 0.95, { id: "back", title: "Back panel", body: "Like new, inspected and tested in our shop before it ships." }, [backMat, islandMat]);

  let focus = -1;
  const base = parts.map((p) => p.mats.map((m) => ((m as THREE.MeshStandardMaterial).emissive ? (m as THREE.MeshStandardMaterial).emissive.clone() : null)));

  return {
    group,
    layers,
    setExplode: (t) => {
      const e = 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 2);
      parts.forEach((p) => (p.obj.position.z = p.rest + p.spread * e));
    },
    setFocus: (i) => {
      if (i === focus) return;
      focus = i;
      parts.forEach((p, k) =>
        p.mats.forEach((m, j) => {
          const sm = m as THREE.MeshStandardMaterial;
          if (!sm.emissive || !base[k][j]) return;
          sm.emissive.copy(base[k][j]!);
          if (k === i) sm.emissive.add(new THREE.Color(0x163a3e));
        })
      );
    },
    tick: (dt) => {
      const blades = (parts.find((p) => p.obj.userData.blades)?.obj.userData.blades as THREE.Group | undefined) ?? null;
      if (blades) blades.rotation.z -= dt * 18;
    },
    dispose: () => own.splice(0).forEach((x) => x.dispose()),
  };
}
