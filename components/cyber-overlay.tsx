"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cyberStore } from "./cyber-provider";

export default function CyberOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 6;
    camera.position.y = 0.5;

    // ── Particles ──
    const particleCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    const offsets = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2 + Math.random() * 4;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 3;
      speeds[i] = 0.1 + Math.random() * 0.3;
      offsets[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color(0x88bbff),
      size: 0.035,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // ── Geometric Objects ──
    // Track created objects/materials/geometries for cleanup
    const disposables: { geo?: THREE.BufferGeometry; mat?: THREE.Material }[] = [];
    const objects: { mesh: THREE.Mesh; rotSpeed: THREE.Vector3; floatOffset: number; floatSpeed: number; baseY: number }[] = [];

    const createObject = (geo: THREE.BufferGeometry, color: number, pos: THREE.Vector3, scale: number) => {
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.15,
        metalness: 0.7,
        roughness: 0.3,
        transparent: true,
        opacity: 0.35,
        wireframe: false,
        envMapIntensity: 0.4,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.scale.setScalar(scale);
      scene.add(mesh);
      objects.push({
        mesh,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.2
        ),
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.2 + Math.random() * 0.3,
        baseY: pos.y,
      });
      disposables.push({ geo, mat });
    };

    createObject(
      new THREE.OctahedronGeometry(0.35, 0),
      0x7a4bff,
      new THREE.Vector3(-1.8, -0.2, -1.5),
      1
    );
    createObject(
      new THREE.TorusKnotGeometry(0.25, 0.08, 48, 8),
      0x4a9eff,
      new THREE.Vector3(2.0, 0.6, -2.0),
      1
    );
    createObject(
      new THREE.IcosahedronGeometry(0.3, 0),
      0x00d4e0,
      new THREE.Vector3(-0.5, -1.2, -3.0),
      1
    );
    createObject(
      new THREE.TorusGeometry(0.28, 0.07, 24, 32),
      0xb44eff,
      new THREE.Vector3(1.5, -0.8, -2.5),
      1
    );
    createObject(
      new THREE.DodecahedronGeometry(0.3, 0),
      0x2ecc71,
      new THREE.Vector3(-2.2, 1.0, -1.0),
      1
    );

    // ── Cyber Ring ──
    const ringGeo = new THREE.TorusGeometry(0.55, 0.012, 32, 64);
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x00d4e0),
      emissive: new THREE.Color(0x00d4e0),
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.25,
      metalness: 0.9,
      roughness: 0.2,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, 0.3, -1.0);
    ring.rotation.x = Math.PI * 0.3;
    ring.rotation.z = Math.PI * 0.1;
    scene.add(ring);

    const ringGeo2 = new THREE.TorusGeometry(0.75, 0.008, 24, 48);
    const ringMat2 = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x7a4bff),
      emissive: new THREE.Color(0x7a4bff),
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.15,
      metalness: 0.8,
      roughness: 0.3,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.position.set(0, -0.4, -2.5);
    ring2.rotation.x = Math.PI * 0.6;
    ring2.rotation.y = Math.PI * 0.25;
    scene.add(ring2);

    // ── Resize ──
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize, { passive: true });

    // ── Animation ──
    const animate = () => {
      const elapsed = performance.now() * 0.001;
      const mx = (cyberStore.smoothMouse.x - 0.5) * 0.3;
      const my = (cyberStore.smoothMouse.y - 0.5) * 0.3;

      // Move camera slightly with mouse
      camera.position.x = mx * 0.4;
      camera.position.y = 0.5 + my * 0.3;
      camera.lookAt(0, 0, -1);

      // Animate particles
      const positions = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const speed = speeds[i];
        const offset = offsets[i];
        positions[i3 + 1] += Math.sin(elapsed * speed + offset) * 0.002;
        positions[i3] += Math.cos(elapsed * speed * 0.7 + offset * 1.3) * 0.001;
      }
      geometry.attributes.position.needsUpdate = true;

      // Particle opacity pulse
      material.opacity = 0.4 + 0.2 * Math.sin(elapsed * 0.15);

      // Animate objects
      for (const obj of objects) {
        obj.mesh.rotation.x += obj.rotSpeed.x * 0.008;
        obj.mesh.rotation.y += obj.rotSpeed.y * 0.008;
        obj.mesh.rotation.z += obj.rotSpeed.z * 0.006;
        obj.mesh.position.y =
          obj.baseY + Math.sin(elapsed * obj.floatSpeed + obj.floatOffset) * 0.15;
        // Gentle mouse influence on position
        obj.mesh.position.x += (mx * 0.02 - (obj.mesh.position.x - obj.mesh.position.x)) * 0.01;
      }

      // Animate rings
      ring.rotation.z += 0.003;
      ring.rotation.x += 0.001;
      const ringPulse = 0.2 + 0.08 * Math.sin(elapsed * 0.2);
      ringMat.opacity = ringPulse;
      ringMat.emissiveIntensity = 0.15 + 0.2 * Math.sin(elapsed * 0.3);

      ring2.rotation.y += 0.002;
      ring2.rotation.x += 0.001;
      ringMat2.opacity = 0.1 + 0.08 * Math.sin(elapsed * 0.18 + 1.0);
      ringMat2.emissiveIntensity = 0.1 + 0.15 * Math.sin(elapsed * 0.25 + 2.0);

      // Mouse velocity burst effect
      const velMag = Math.abs(cyberStore.mouseVelocity.x) + Math.abs(cyberStore.mouseVelocity.y);
      if (velMag > 0.02) {
        const burst = Math.min(velMag * 3, 0.5);
        ringMat.emissiveIntensity += burst;
        ringMat.opacity += burst * 0.3;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      // Dispose all geometries and materials
      geometry.dispose();
      material.dispose();
      ringMat.dispose();
      ringGeo.dispose();
      ringMat2.dispose();
      ringGeo2.dispose();
      for (const d of disposables) {
        if (d.geo) d.geo.dispose();
        if (d.mat) d.mat.dispose();
      }
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="cyber-overlay"
      aria-hidden="true"
    />
  );
}
