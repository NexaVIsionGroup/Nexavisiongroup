"use client";

import { useEffect, useRef, useState } from "react";
import type { Color as Swatch } from "../catalog";
import type { Island, PhoneHandle } from "./buildPhone";

export type AnchorName = "camera" | "chip" | "battery" | "signal";
export type AnchorPos = Record<AnchorName, { x: number; y: number; visible: number }>;

type Props = {
  modelKey: string;
  island: Island;
  fold: boolean;
  swatch: Swatch;
  label: string;
  folded?: boolean;
  className?: string;
  /** Called every frame with screen positions for HUD callouts. */
  onAnchors?: (a: AnchorPos) => void;
  onReady?: () => void;
};

/**
 * Drag-to-spin 3D phone on a holographic pad. Three.js is loaded on demand,
 * the loop pauses offscreen, horizontal drags spin (with momentum) while
 * vertical swipes still scroll the page.
 */
export default function Viewer3D(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef(props);
  live.current = props;
  const api = useRef<{ swap: () => void; recolor: () => void; fold: () => void } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      const { buildPhone } = await import("./buildPhone");
      if (disposed || !host.current) return;
      const el = host.current;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        setFailed(true);
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);
      renderer.domElement.style.touchAction = "pan-y";
      renderer.domElement.style.display = "block";
      renderer.domElement.style.cursor = "grab";

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      scene.environmentIntensity = 0.55; // keep dark finishes reading as dark

      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
      camera.position.set(0, 0.15, 4.4);
      camera.lookAt(0, 0, 0);

      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(2, 3, 4);
      const rim = new THREE.PointLight(0x56e0e8, 14, 8);
      rim.position.set(-1.8, 0.6, -1.6);
      const rim2 = new THREE.PointLight(0x56e0e8, 6, 8);
      rim2.position.set(1.8, -0.8, 1.2);
      scene.add(key, rim, rim2, new THREE.AmbientLight(0xffffff, 0.15));

      // Holographic pad
      const pad = new THREE.Group();
      pad.position.y = -1.08;
      const holo = (r0: number, r1: number, o: number) =>
        new THREE.Mesh(
          new THREE.RingGeometry(r0, r1, 96),
          new THREE.MeshBasicMaterial({ color: 0x56e0e8, transparent: true, opacity: o, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
        );
      const rings = [holo(0.9, 0.92, 0.7), holo(0.62, 0.63, 0.45), holo(1.2, 1.205, 0.25)];
      const dash = new THREE.Mesh(
        new THREE.RingGeometry(1.02, 1.06, 64, 1, 0, Math.PI * 1.3),
        new THREE.MeshBasicMaterial({ color: 0x56e0e8, transparent: true, opacity: 0.55, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(0.95, 64),
        new THREE.MeshBasicMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          map: (() => {
            const c = document.createElement("canvas");
            c.width = c.height = 256;
            const g = c.getContext("2d")!;
            const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
            gr.addColorStop(0, "rgba(86,224,232,.55)");
            gr.addColorStop(1, "rgba(86,224,232,0)");
            g.fillStyle = gr;
            g.fillRect(0, 0, 256, 256);
            return new THREE.CanvasTexture(c);
          })(),
        })
      );
      const grid = new THREE.PolarGridHelper(1.3, 16, 6, 64, 0x2a6f78, 0x1a3c44);
      (grid.material as import("three").Material).transparent = true;
      (grid.material as import("three").Material).opacity = 0.35;
      [...rings, dash, glow].forEach((m) => (m.rotation.x = -Math.PI / 2));
      pad.add(grid, glow, dash, ...rings);
      scene.add(pad);

      // Scan beam that sweeps up the phone now and then
      const scan = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 0.012),
        new THREE.MeshBasicMaterial({ color: 0x56e0e8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      scene.add(scan);

      // Model
      const rig = new THREE.Group(); // user rotation
      scene.add(rig);
      let phone: PhoneHandle | null = null;
      let entering = 1; // 0..1 scale-in progress
      let foldT = 1;

      const mount = () => {
        const p = live.current;
        const next = buildPhone(p.island, p.fold, p.swatch, p.label);
        if (phone) {
          rig.remove(phone.group);
          phone.dispose();
        }
        phone = next;
        rig.add(phone.group);
        foldT = p.fold ? (p.folded === false ? 0 : 1) : 1;
        phone.setFold?.(foldT);
        entering = 0;
        scanT = 0;
      };

      // Interaction: yaw/pitch with inertia
      let yaw = -0.5;
      let pitch = 0.08;
      let vYaw = 0.9; // start with a spin
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      let lastT = 0;
      let idle = 0;

      const down = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = performance.now();
        vYaw = 0;
        renderer.domElement.style.cursor = "grabbing";
        renderer.domElement.setPointerCapture(e.pointerId);
      };
      const move = (e: PointerEvent) => {
        if (!dragging) return;
        const now = performance.now();
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        const dt = Math.max(1, now - lastT);
        yaw += dx * 0.011;
        pitch = Math.max(-0.6, Math.min(0.6, pitch + dy * 0.006));
        vYaw = (dx * 0.011) / (dt / 1000);
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = now;
        idle = 0;
      };
      const up = () => {
        dragging = false;
        renderer.domElement.style.cursor = "grab";
        vYaw = Math.max(-14, Math.min(14, vYaw));
      };
      const cancel = () => {
        dragging = false;
      };
      renderer.domElement.addEventListener("pointerdown", down);
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      renderer.domElement.addEventListener("pointercancel", cancel);

      // Double-tap flips front/back
      let lastTap = 0;
      const tap = () => {
        const now = performance.now();
        if (now - lastTap < 300) vYaw = 9;
        lastTap = now;
      };
      renderer.domElement.addEventListener("pointerup", tap);

      const resize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        renderer.setSize(w, h, false);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        camera.aspect = w / h;
        // keep the phone framed on narrow screens
        camera.position.z = w / h < 0.75 ? 5.6 : 4.4;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
      io.observe(el);

      const v = new THREE.Vector3();
      const n = new THREE.Vector3();
      const q = new THREE.Quaternion();
      const clock = new THREE.Clock();
      let scanT = 0;
      let raf = 0;
      const anchorOut = {} as AnchorPos;

      mount();
      live.current.onReady?.();

      const loop = () => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(clock.getDelta(), 0.05);
        if (!visible || document.hidden || !phone) return;
        const t = clock.elapsedTime;

        if (!dragging) {
          yaw += vYaw * dt;
          vYaw *= Math.pow(0.9, dt * 60 * 0.35);
          idle += dt;
          if (idle > 2.5) vYaw += (0.35 - vYaw) * dt * 0.8; // settle into a slow showcase spin
          pitch += (0.08 - pitch) * dt * 1.5;
        }
        rig.rotation.set(pitch, yaw, 0);

        entering = Math.min(1, entering + dt * 1.6);
        const e = 1 - Math.pow(1 - entering, 3);
        const s = 0.6 + 0.4 * e;
        phone.group.scale.setScalar(s);
        phone.group.position.y = Math.sin(t * 1.3) * 0.035 + (1 - e) * -0.4;
        phone.group.rotation.y = (1 - e) * Math.PI * 1.5;

        const targetFold = live.current.fold && live.current.folded === false ? 0 : 1;
        if (phone.setFold && Math.abs(foldT - targetFold) > 0.001) {
          foldT += (targetFold - foldT) * Math.min(1, dt * 4);
          phone.setFold(foldT);
        }
        phone.tick(dt, t);

        pad.rotation.y = t * 0.15;
        dash.rotation.z = -t * 0.6;
        rings[1].scale.setScalar(1 + Math.sin(t * 2) * 0.04);

        scanT += dt;
        const sc = (scanT % 4.5) / 1.4;
        if (sc < 1) {
          scan.position.set(0, -0.85 + sc * 1.7, 0.4);
          (scan.material as import("three").MeshBasicMaterial).opacity = Math.sin(sc * Math.PI) * 0.7;
        } else (scan.material as import("three").MeshBasicMaterial).opacity = 0;

        renderer.render(scene, camera);

        const cb = live.current.onAnchors;
        if (cb) {
          const w = el.clientWidth;
          const h = el.clientHeight;
          // back-facing factor: is the camera side of the phone toward us?
          phone.group.getWorldQuaternion(q);
          n.set(0, 0, 1).applyQuaternion(q);
          const facing = n.dot(v.copy(camera.position).normalize());
          (Object.keys(phone.anchors) as AnchorName[]).forEach((k) => {
            phone!.anchors[k].getWorldPosition(v);
            v.project(camera);
            anchorOut[k] = {
              x: (v.x * 0.5 + 0.5) * w,
              y: (-v.y * 0.5 + 0.5) * h,
              visible: k === "camera" ? Math.max(0, facing) : Math.min(1, entering),
            };
          });
          cb(anchorOut);
        }
      };
      loop();

      api.current = {
        swap: mount,
        recolor: () => phone?.setColor(live.current.swatch),
        fold: () => {},
      };

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        phone?.dispose();
        scene.traverse((o) => {
          const m = o as import("three").Mesh;
          m.geometry?.dispose?.();
          const mat = m.material as import("three").Material | undefined;
          mat?.dispose?.();
        });
        envTex.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  // Swap model when the device changes; recolor in place otherwise.
  useEffect(() => {
    api.current?.swap();
  }, [props.modelKey]);
  useEffect(() => {
    api.current?.recolor();
  }, [props.swatch.hex, props.swatch.finish]);

  return (
    <div ref={host} className={props.className}>
      {failed && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--fog)", fontSize: 14 }}>
          3D view isn&apos;t available on this device.
        </div>
      )}
    </div>
  );
}
