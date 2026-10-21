'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RaceEngine, Marble } from '@/lib/race-engine';

interface MarbleRace3DProps {
  engine: RaceEngine;
  onHoverMarble?: (marble: Marble | null, pos: { x: number; y: number } | null) => void;
}

export const MarbleRace3D: React.FC<MarbleRace3DProps> = ({ engine }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL guard
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || 400;
    const height = width;

    // 2. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1320);
    scene.fog = new THREE.FogExp2(0x0f1320, 0.002);

    const camera = new THREE.PerspectiveCamera(40, 1, 1, 1000);
    camera.position.set(0, 310, 220);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.borderRadius = '1.5rem';

    // 3. Studio Environment Map (PMREMGenerator + RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig (Warm Key Light + Cool Hemisphere Fill)
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.0);
    keyLight.position.set(90, 200, 120);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 10;
      keyLight.shadow.camera.far = 400;
      keyLight.shadow.camera.left = -160;
      keyLight.shadow.camera.right = 160;
      keyLight.shadow.camera.top = 160;
      keyLight.shadow.camera.bottom = -160;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // 5. Procedural Cyber Arena Platform
    const arenaGroup = new THREE.Group();
    scene.add(arenaGroup);

    // Platform Base: Hexagonal beveled cylinder
    const baseGeo = new THREE.CylinderGeometry(155, 160, 10, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.85,
      roughness: 0.3,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -5;
    baseMesh.receiveShadow = !isSoftwareGl;
    arenaGroup.add(baseMesh);

    // Platform Rim Glow Ring
    const rimGeo = new THREE.TorusGeometry(156, 1.8, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.2;
    arenaGroup.add(rimMesh);

    // Arena Floor
    const floorGeo = new THREE.CircleGeometry(152, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.45,
      metalness: 0.6,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0.1;
    floorMesh.receiveShadow = !isSoftwareGl;
    arenaGroup.add(floorMesh);

    // Central Core Pillar (3 parts: base ring, glowing crystal, top cap)
    const coreGroup = new THREE.Group();
    const coreBaseGeo = new THREE.CylinderGeometry(18, 20, 6, 32);
    const coreBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
    const coreBase = new THREE.Mesh(coreBaseGeo, coreBaseMat);
    coreBase.position.y = 3;
    coreGroup.add(coreBase);

    const coreCrystalGeo = new THREE.SphereGeometry(12, 24, 24);
    const coreCrystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.8,
      roughness: 0.1,
      metalness: 0.2,
    });
    const coreCrystal = new THREE.Mesh(coreCrystalGeo, coreCrystalMat);
    coreCrystal.position.y = 12;
    coreGroup.add(coreCrystal);

    const coreRingGeo = new THREE.TorusGeometry(15, 1.2, 16, 32);
    const coreRingMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x0ea5e9, emissiveIntensity: 1 });
    const coreRing = new THREE.Mesh(coreRingGeo, coreRingMat);
    coreRing.rotation.x = Math.PI / 2;
    coreRing.position.y = 12;
    coreGroup.add(coreRing);

    arenaGroup.add(coreGroup);

    // 6. Ring 3D Models
    // Each ring has curved tube/torus segments for each solid arc
    const ringMeshes: THREE.Group[] = [];
    const scaleFactor = 150 / engine.arenaRadius; // map 2D coords to 3D world units

    const ringColors = [0x7dd3fc, 0x38bdf8, 0x0284c7];

    for (let rIdx = 0; rIdx < engine.rings.length; rIdx++) {
      const ring = engine.rings[rIdx];
      const rGroup = new THREE.Group();
      arenaGroup.add(rGroup);
      ringMeshes.push(rGroup);

      const ringRadius3D = ring.radius * scaleFactor;
      const tubeRadius = (ring.thickness * scaleFactor) * 0.42;

      const ringMat = new THREE.MeshStandardMaterial({
        color: ringColors[rIdx],
        emissive: ringColors[rIdx],
        emissiveIntensity: 1.2,
        roughness: 0.15,
        metalness: 0.8,
      });

      // Divide gaps into solid arcs
      const sortedGaps = [...ring.gaps].sort((a, b) => a.startAngle - b.startAngle);
      for (let i = 0; i < sortedGaps.length; i++) {
        const currentGap = sortedGaps[i];
        const nextGap = sortedGaps[(i + 1) % sortedGaps.length];

        const arcStart = currentGap.startAngle + currentGap.size;
        let arcLength = nextGap.startAngle - arcStart;
        if (arcLength < 0) arcLength += Math.PI * 2;

        if (arcLength > 0.08) {
          const arcGeo = new THREE.TorusGeometry(ringRadius3D, tubeRadius, 16, 48, arcLength);
          const arcMesh = new THREE.Mesh(arcGeo, ringMat);
          arcMesh.rotation.x = Math.PI / 2;
          arcMesh.rotation.z = -arcStart;
          arcMesh.position.y = tubeRadius;
          arcMesh.castShadow = !isSoftwareGl;
          rGroup.add(arcMesh);
        }
      }
    }

    // 7. Marbles Meshes & Textures
    const textureLoader = new THREE.TextureLoader();
    const marbleMeshMap = new Map<string, THREE.Mesh>();
    const marbleGeo = new THREE.SphereGeometry(1, 24, 24);

    const updateMarbles3D = () => {
      for (const marble of engine.marbles) {
        let mesh = marbleMeshMap.get(marble.id);
        if (!mesh) {
          const flagUrl = `/flags/${marble.country.code.toLowerCase()}.svg`;
          const texture = textureLoader.load(flagUrl);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;

          const mat = new THREE.MeshPhysicalMaterial({
            map: texture,
            roughness: 0.25,
            metalness: 0.1,
            clearcoat: 0.9,
            clearcoatRoughness: 0.1,
          });

          mesh = new THREE.Mesh(marbleGeo, mat);
          mesh.castShadow = !isSoftwareGl;
          mesh.receiveShadow = !isSoftwareGl;
          mesh.userData = { countryName: marble.country.name };
          arenaGroup.add(mesh);
          marbleMeshMap.set(marble.id, mesh);
        }

        if (marble.escaped) {
          mesh.visible = false;
        } else {
          mesh.visible = true;
          const r3D = marble.radius * scaleFactor;
          mesh.scale.set(r3D, r3D, r3D);

          const x3D = (marble.x - engine.center.x) * scaleFactor;
          const z3D = (marble.y - engine.center.y) * scaleFactor;

          mesh.position.set(x3D, r3D, z3D);

          // Rolling spin based on 2D velocity
          mesh.rotation.x = marble.y * 0.1;
          mesh.rotation.y = marble.angle;
          mesh.rotation.z = -marble.x * 0.1;
        }
      }
    };

    // 8. Raycasting for hover tooltip
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const activeMeshes = Array.from(marbleMeshMap.values()).filter(m => m.visible);
      const intersects = raycaster.intersectObjects(activeMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        setHoveredCountry(hit.userData.countryName || null);
      } else {
        setHoveredCountry(null);
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    // 9. Animation & Render Loop
    let lastTime = performance.now();
    let isMounted = true;

    function tick(time: number) {
      if (!isMounted) return;

      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Update physics simulation
      engine.update(dt);

      // Rotate 3D rings to match 2D engine angles
      for (let rIdx = 0; rIdx < engine.rings.length; rIdx++) {
        const ring = engine.rings[rIdx];
        const rGroup = ringMeshes[rIdx];
        if (rGroup) {
          rGroup.rotation.y = -ring.angle;
        }
      }

      // Pulse central core crystal
      coreCrystal.rotation.y += 0.02;
      coreRing.rotation.z += 0.03;

      // Update Marbles
      updateMarbles3D();

      // Subtle camera breathing
      const camAngle = time * 0.0003;
      camera.position.x = Math.sin(camAngle) * 35;
      camera.lookAt(0, 5, 0);

      renderer.render(scene, camera);

      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animFrameRef.current);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.dispose();
      baseGeo.dispose();
      baseMat.dispose();
      rimGeo.dispose();
      rimMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      coreBaseGeo.dispose();
      coreBaseMat.dispose();
      coreCrystalGeo.dispose();
      coreCrystalMat.dispose();
      coreRingGeo.dispose();
      coreRingMat.dispose();
      marbleGeo.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [engine]);

  return (
    <div className="relative w-full flex items-center justify-center p-2 select-none touch-none">
      <div
        ref={mountRef}
        className="relative w-full max-w-[420px] aspect-square rounded-3xl overflow-hidden border border-sky-500/20 shadow-[0_0_35px_rgba(56,189,248,0.15)] bg-[#0f1320]"
      >
        {hoveredCountry && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-sky-400/50 shadow-lg text-xs font-semibold text-sky-200 backdrop-blur-sm">
            <span>{hoveredCountry}</span>
          </div>
        )}
      </div>
    </div>
  );
};
