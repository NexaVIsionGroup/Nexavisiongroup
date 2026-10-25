import * as THREE from "three";

// The "big badass chip": a flagship SoC package rendered for real in the same
// studio as the phones. Brushed-metal heat spreader with the chip name cut into
// it, a cyan-lit die seam, gold contacts around the rim, a traced substrate.
// It's our own artwork (the Snapdragon name is text; no Qualcomm logo).

export type ChipHandle = { group: THREE.Group; tick: (dt: number, t: number) => void; dispose: () => void };

function roundedRect(w: number, h: number, r: number) {
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

function plate(w: number, h: number, r: number, depth: number, bevel: number) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w - bevel * 2, h - bevel * 2, Math.max(0.001, r - bevel)), {
    depth: Math.max(0.001, depth - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 16,
  });
  g.translate(0, 0, -(depth - bevel * 2) / 2);
  g.computeVertexNormals();
  return g;
}

/** Brushed lid with the chip name engraved. Returns color + bump maps. */
function lidMaps(line1: string, line2: string, line3: string) {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  // brushed metal: horizontal streaks
  const base = g.createLinearGradient(0, 0, S, S);
  base.addColorStop(0, "#7e868f");
  base.addColorStop(0.5, "#5c646c");
  base.addColorStop(1, "#767e87");
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) {
    const y = Math.random() * S;
    const a = Math.random() * 0.22;
    g.strokeStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 0.8})`;
    g.lineWidth = Math.random() * 1.6;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(S, y + (Math.random() - 0.5) * 2);
    g.stroke();
  }
  // engraving — each line shrinks to fit inside the lid (max 78% of its width)
  const engrave = (text: string, y: number, size: number, weight: number, track: number, color: string) => {
    const ls = g as unknown as { letterSpacing: string };
    let px = size;
    for (;;) {
      g.font = `${weight} ${px}px system-ui, -apple-system, Segoe UI, sans-serif`;
      ls.letterSpacing = `${track * (px / size)}px`;
      if (g.measureText(text).width <= S * 0.78 || px < 8) break;
      px *= 0.94;
    }
    g.fillStyle = color;
    g.fillText(text, S / 2, y);
    ls.letterSpacing = "0px";
  };
  g.textAlign = "center";
  engrave(line1, S * 0.4, S * 0.078, 800, S * 0.012, "#0b0e11");
  engrave(line2, S * 0.6, S * 0.16, 900, S * 0.004, "#0b0e11");
  engrave(line3, S * 0.72, S * 0.038, 700, S * 0.016, "#15191d");
  // corner marks
  g.strokeStyle = "#2a2f35";
  g.lineWidth = 4;
  [[0.1, 0.1], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9]].forEach(([x, y]) => {
    g.beginPath();
    g.arc(x * S, y * S, 10, 0, Math.PI * 2);
    g.stroke();
  });
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  // bump: same streaks, letters recessed
  const b = document.createElement("canvas");
  b.width = b.height = S;
  const gb = b.getContext("2d")!;
  gb.fillStyle = "#808080";
  gb.fillRect(0, 0, S, S);
  for (let i = 0; i < 1800; i++) {
    const y = Math.random() * S;
    gb.strokeStyle = `rgba(${Math.random() > 0.5 ? 255 : 0},${Math.random() > 0.5 ? 255 : 0},${Math.random() > 0.5 ? 255 : 0},0.12)`;
    gb.lineWidth = Math.random() * 1.5;
    gb.beginPath();
    gb.moveTo(0, y);
    gb.lineTo(S, y);
    gb.stroke();
  }
  gb.textAlign = "center";
  gb.fillStyle = "#000";
  for (const [text, y, size, weight] of [[line1, S * 0.4, S * 0.078, 800], [line2, S * 0.6, S * 0.16, 900]] as [string, number, number, number][]) {
    let px = size;
    for (;;) {
      gb.font = `${weight} ${px}px system-ui, sans-serif`;
      if (gb.measureText(text).width <= S * 0.78 || px < 8) break;
      px *= 0.94;
    }
    gb.fillText(text, S / 2, y);
  }
  const bump = new THREE.CanvasTexture(b);
  return { map, bump };
}

/** Substrate: dark board with faint traces. */
function boardMap() {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0e1a17";
  g.fillRect(0, 0, S, S);
  g.strokeStyle = "rgba(86,224,232,.18)";
  g.lineWidth = 2;
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    g.beginPath();
    g.moveTo(x, y);
    const len = 40 + Math.random() * 140;
    const horiz = Math.random() > 0.5;
    g.lineTo(horiz ? x + len : x, horiz ? y : y + len);
    g.lineTo(horiz ? x + len + 20 : x + 20, horiz ? y + 20 : y + len + 20);
    g.stroke();
    g.fillStyle = "rgba(86,224,232,.35)";
    g.beginPath();
    g.arc(x, y, 3, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildChip(line1: string, line2: string, line3: string): ChipHandle {
  const own: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(x: T) => {
    own.push(x);
    return x;
  };
  const group = new THREE.Group();

  // substrate
  const board = new THREE.Mesh(
    track(plate(1.0, 1.0, 0.03, 0.06, 0.008)),
    track(new THREE.MeshPhysicalMaterial({ map: track(boardMap()), roughness: 0.55, metalness: 0.1, clearcoat: 0.4, clearcoatRoughness: 0.3 }))
  );
  group.add(board);

  // die glow seam: emissive plane just above the board, mostly hidden by the lid
  const seam = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.8, 0.8)),
    track(new THREE.MeshBasicMaterial({ color: 0x56e0e8, toneMapped: false, transparent: true, opacity: 0.9 }))
  );
  seam.position.z = 0.031;
  group.add(seam);
  const halo = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.0, 1.0)),
    track(
      new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        map: (() => {
          const c = document.createElement("canvas");
          c.width = c.height = 128;
          const g = c.getContext("2d")!;
          const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64);
          gr.addColorStop(0, "rgba(86,224,232,.5)");
          gr.addColorStop(1, "rgba(86,224,232,0)");
          g.fillStyle = gr;
          g.fillRect(0, 0, 128, 128);
          return track(new THREE.CanvasTexture(c));
        })(),
      })
    )
  );
  halo.position.z = 0.032;
  group.add(halo);

  // lid
  const { map, bump } = lidMaps(line1, line2, line3);
  track(map);
  track(bump);
  // ExtrudeGeometry UVs are in scene units, so the engraved artwork goes on a
  // properly 0..1-mapped face laid on top of the plain metal lid.
  const lidMat = track(new THREE.MeshPhysicalMaterial({ color: 0x6a727b, metalness: 1, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 }));
  const lid = new THREE.Mesh(track(plate(0.74, 0.74, 0.04, 0.06, 0.012)), lidMat);
  lid.position.z = 0.06;
  group.add(lid);
  const face = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.715, 0.715)),
    track(
      new THREE.MeshPhysicalMaterial({
        map,
        bumpMap: bump,
        bumpScale: 0.8,
        metalness: 1,
        roughness: 0.42,
        clearcoat: 0.5,
        clearcoatRoughness: 0.3,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
    )
  );
  face.position.z = 0.0905;
  group.add(face);
  // lid side wall (darker metal)
  const skirt = new THREE.Mesh(
    track(plate(0.76, 0.76, 0.045, 0.03, 0.004)),
    track(new THREE.MeshPhysicalMaterial({ color: 0x5f666d, metalness: 1, roughness: 0.4 }))
  );
  skirt.position.z = 0.04;
  group.add(skirt);

  // gold contacts around the rim
  const gold = track(new THREE.MeshPhysicalMaterial({ color: 0xd9b45a, metalness: 1, roughness: 0.3, clearcoat: 0.3 }));
  const padGeo = track(new THREE.BoxGeometry(0.028, 0.055, 0.012));
  const padGeoR = track(new THREE.BoxGeometry(0.055, 0.028, 0.012));
  const N = 13;
  for (let i = 0; i < N; i++) {
    const p = -0.4 + (0.8 * i) / (N - 1);
    for (const [x, y, geo] of [
      [p, 0.44, padGeo],
      [p, -0.44, padGeo],
      [0.44, p, padGeoR],
      [-0.44, p, padGeoR],
    ] as [number, number, THREE.BufferGeometry][]) {
      const m = new THREE.Mesh(geo, gold);
      m.position.set(x, y, 0.036);
      group.add(m);
    }
  }
  // pin-1 marker
  const dot = new THREE.Mesh(track(new THREE.CircleGeometry(0.02, 24)), gold);
  dot.position.set(-0.46, 0.46, 0.031);
  group.add(dot);

  const seamMat = seam.material as THREE.MeshBasicMaterial;
  return {
    group,
    tick: (_dt, t) => {
      seamMat.opacity = 0.75 + Math.sin(t * 2.2) * 0.2;
      (halo.material as THREE.MeshBasicMaterial).opacity = 0.7 + Math.sin(t * 2.2) * 0.3;
    },
    dispose: () => own.splice(0).forEach((x) => x.dispose()),
  };
}
