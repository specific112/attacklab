"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cyberStore } from "./cyber-provider";

export default function AICore() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.set(0, 0.5, 4);
    camera.lookAt(0, 0, 0);

    // ── Core Glow Sphere ──
    const coreGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x4a9eff),
      emissive: new THREE.Color(0x4a9eff),
      emissiveIntensity: 0.6,
      metalness: 0.1,
      roughness: 0.2,
      transparent: true,
      opacity: 0.7,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Inner core glow
    const innerGeo = new THREE.SphereGeometry(0.18, 24, 24);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x6afff0, transparent: true, opacity: 0.5 });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerCore);

    // ── Rotating Neon Rings ──
    const rings: { mesh: THREE.Mesh; speed: number; axis: string; phase: number }[] = [];

    const createRing = (radius: number, tube: number, color: number, opacity: number, emissiveIntensity: number, posY: number, rotX: number, rotZ: number, speed: number, axis: string) => {
      const geo = new THREE.TorusGeometry(radius, tube, 32, 64);
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity,
        transparent: true,
        opacity,
        metalness: 0.8,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = posY;
      mesh.rotation.x = rotX;
      mesh.rotation.z = rotZ;
      scene.add(mesh);
      rings.push({ mesh, speed, axis, phase: Math.random() * Math.PI * 2 });
      return { geo, mat };
    };

    createRing(0.55, 0.015, 0x00d4e0, 0.3, 0.4, 0, Math.PI * 0.3, Math.PI * 0.1, 0.4, "z");
    createRing(0.7, 0.01, 0xb44eff, 0.25, 0.3, 0, Math.PI * 0.6, Math.PI * 0.25, -0.3, "y");
    createRing(0.45, 0.012, 0x6afff0, 0.2, 0.35, 0.4, Math.PI * 0.4, 0.15, 0.5, "z");
    createRing(0.65, 0.008, 0xff6b9d, 0.2, 0.25, -0.3, Math.PI * 0.5, Math.PI * 0.35, -0.2, "y");
    createRing(0.5, 0.01, 0x4a9eff, 0.15, 0.2, 0.2, Math.PI * 0.2, Math.PI * 0.5, 0.35, "z");

    // ── Holographic Energy Particles ──
    const particleCount = 120;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pSpeeds = new Float32Array(particleCount);
    const pRadii = new Float32Array(particleCount);
    const pAngles = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.7;
      const yOff = (Math.random() - 0.5) * 1.0;
      pPos[i * 3] = Math.cos(angle) * radius;
      pPos[i * 3 + 1] = yOff;
      pPos[i * 3 + 2] = Math.sin(angle) * radius;
      pSpeeds[i] = 0.2 + Math.random() * 0.5;
      pRadii[i] = radius;
      pAngles[i] = angle;
    }

    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x6afff0,
      size: 0.025,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── Floating holographic hexagon layers ──
    const hexGroup = new THREE.Group();
    const hexShape = new THREE.Shape();
    const sides = 6;
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      const x = Math.cos(a) * 0.25;
      const y = Math.sin(a) * 0.25;
      if (i === 0) hexShape.moveTo(x, y);
      else hexShape.lineTo(x, y);
    }
    hexShape.closePath();

    const hexGeo = new THREE.ShapeGeometry(hexShape);
    const hexMat = new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const hexMesh = new THREE.Mesh(hexGeo, hexMat);
    hexMesh.position.z = -0.3;
    hexGroup.add(hexMesh);

    const hexMat2 = new THREE.MeshBasicMaterial({
      color: 0xb44eff,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const hexMesh2 = new THREE.Mesh(hexGeo.clone(), hexMat2);
    hexMesh2.position.z = 0.3;
    hexMesh2.scale.setScalar(0.8);
    hexGroup.add(hexMesh2);

    // Hex outline
    const lineGeo = new THREE.EdgesGeometry(hexGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x6afff0, transparent: true, opacity: 0.15 });
    const hexLine = new THREE.LineSegments(lineGeo, lineMat);
    hexLine.position.z = -0.3;
    hexGroup.add(hexLine);

    const lineMat2 = new THREE.LineBasicMaterial({ color: 0xb44eff, transparent: true, opacity: 0.12 });
    const hexLine2 = new THREE.LineSegments(lineGeo.clone(), lineMat2);
    hexLine2.position.z = 0.3;
    hexLine2.scale.setScalar(0.8);
    hexGroup.add(hexLine2);

    scene.add(hexGroup);

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
    let startTime = performance.now();

    const animate = () => {
      const elapsed = (performance.now() - startTime) * 0.001;
      const mx = (cyberStore.smoothMouse.x - 0.5) * 0.5;
      const my = (cyberStore.smoothMouse.y - 0.5) * 0.5;

      // Camera subtle movement
      camera.position.x = mx * 0.3;
      camera.position.y = 0.5 + my * 0.2;
      camera.lookAt(0, 0, 0);

      // Core pulse
      const pulse = 0.6 + 0.15 * Math.sin(elapsed * 0.5);
      coreMat.emissiveIntensity = pulse;
      core.scale.setScalar(1 + 0.03 * Math.sin(elapsed * 0.3));

      // Inner core rotation
      innerCore.rotation.x += 0.003;
      innerCore.rotation.y += 0.005;

      // Rings rotation
      for (const ring of rings) {
        if (ring.axis === "z") ring.mesh.rotation.z += ring.speed * 0.008;
        if (ring.axis === "y") ring.mesh.rotation.y += ring.speed * 0.008;
        ring.mesh.rotation.x += 0.001;
        // Pulse opacity
        const mat = ring.mesh.material as THREE.MeshPhysicalMaterial;
        mat.emissiveIntensity = 0.2 + 0.2 * Math.sin(elapsed * 0.4 + ring.phase);
      }

      // Particles orbit
      const positions = pGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pAngles[i] += pSpeeds[i] * 0.008;
        const radius = pRadii[i];
        positions[i * 3] = Math.cos(pAngles[i] + elapsed * 0.1) * radius;
        positions[i * 3 + 1] += Math.sin(elapsed * pSpeeds[i] + pAngles[i]) * 0.001;
        positions[i * 3 + 2] = Math.sin(pAngles[i] + elapsed * 0.1) * radius;
      }
      pGeo.attributes.position.needsUpdate = true;

      pMat.opacity = 0.3 + 0.2 * Math.sin(elapsed * 0.2);

      // Hex group rotation
      hexGroup.rotation.y += 0.002;
      hexGroup.rotation.x = Math.sin(elapsed * 0.1) * 0.05;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="ai-core-canvas" aria-hidden="true" />;
}
