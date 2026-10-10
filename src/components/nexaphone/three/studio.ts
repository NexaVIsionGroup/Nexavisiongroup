import * as THREE from "three";

// Shared product-photo studio for every 3D phone on the site (the big viewer on
// each phone page and the small spinning models on the shop cards), so they all
// light the same way.

export function studioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  // Product-photo studio: a black room lit by a few long softboxes. Glossy glass
  // and polished frames then read as dark with crisp light streaks that sweep as
  // the phone turns (the look of real product shots), instead of the flat grey a
  // uniformly bright room gives.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x020304);
  const softbox = (w: number, h: number, x: number, y: number, z: number, power: number, color = 0xffffff) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(power), side: THREE.DoubleSide })
    );
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    studio.add(m);
  };
  softbox(0.9, 9, -3.2, 0.5, 3.2, 7); // tall strip, front-left
  softbox(0.5, 9, 3.6, 0, 2.4, 5); // thin strip, front-right
  softbox(7, 1.2, 0, 5, 1.5, 3); // overhead
  softbox(9, 9, 0, -6, 0, 0.18); // faint floor bounce: lifts the lower glass without a hard edge
  // Gradient card above/behind the camera: the smooth top-to-bottom sheen real
  // black glass shows in product photos, with no hard edge.
  {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 256;
    const g = c.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#fff");
    gr.addColorStop(0.45, "#3a3a3a");
    gr.addColorStop(1, "#000");
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 256);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 7),
      new THREE.MeshBasicMaterial({ map, color: new THREE.Color(14, 14, 14), side: THREE.DoubleSide }) // glass reflects ~4% head-on, so the card must be studio-bright
    );
    card.position.set(0, 2.2, 5.2);
    card.lookAt(0, 0, 0);
    studio.add(card);
  }
  softbox(0.6, 7, -3.5, 0.5, -3, 3, 0x56e0e8); // cyan kicker behind
  softbox(0.6, 7, 3.5, 0.5, -3, 1.6, 0x56e0e8);
  const envTex = pmrem.fromScene(studio, 0).texture;
  studio.traverse((o) => {
    const m = o as import("three").Mesh;
    m.geometry?.dispose?.();
    (m.material as import("three").Material | undefined)?.dispose?.();
  });
  pmrem.dispose();
  return envTex;
}

export const STUDIO_INTENSITY = 1.15;

export function studioLights(scene: THREE.Scene) {
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(2, 3, 4);
  const rim = new THREE.PointLight(0x56e0e8, 14, 8);
  rim.position.set(-1.8, 0.6, -1.6);
  const rim2 = new THREE.PointLight(0x56e0e8, 6, 8);
  rim2.position.set(1.8, -0.8, 1.2);
  scene.add(key, rim, rim2, new THREE.AmbientLight(0xffffff, 0.06));
}
