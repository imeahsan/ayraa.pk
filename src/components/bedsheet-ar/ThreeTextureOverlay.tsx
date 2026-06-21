"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useARStore } from '@/lib/bedsheet-ar/store';
import { CornerPoint } from '@/lib/bedsheet-ar/types';

interface ThreeTextureOverlayProps {
  width: number;
  height: number;
}

const GRID_SIZE = 32; // Subdivisions to prevent perspective distortion

// Bilinear interpolation math
function bilerp(
  topLeft: CornerPoint,
  topRight: CornerPoint,
  bottomRight: CornerPoint,
  bottomLeft: CornerPoint,
  u: number,
  v: number
) {
  const topX = topLeft.x + (topRight.x - topLeft.x) * u;
  const topY = topLeft.y + (topRight.y - topLeft.y) * u;

  const bottomX = bottomLeft.x + (bottomRight.x - bottomLeft.x) * u;
  const bottomY = bottomLeft.y + (bottomRight.y - bottomLeft.y) * u;

  const x = topX + (bottomX - topX) * v;
  const y = topY + (bottomY - topY) * v;

  return { x, y };
}

export function ThreeTextureOverlay({ width, height }: ThreeTextureOverlayProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const textureUrl = useARStore((state) => state.textureUrl);
  const corners = useARStore((state) => state.corners);
  const settings = useARStore((state) => state.settings);
  const [textureLoaded, setTextureLoaded] = useState(false);

  // Keep references to update three.js scene on state change without reloading canvas
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Create Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Top-left is (0,0), bottom-right is (width, height)
    const camera = new THREE.OrthographicCamera(0, width, 0, height, -100, 100);
    camera.position.z = 10;
    cameraRef.current = camera;

    // 2. Create WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true // Required for screenshot compositing
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.domElement.id = 'three-ar-canvas';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '10';
    renderer.domElement.style.pointerEvents = 'none';

    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Create Grid Geometry
    const geometry = new THREE.BufferGeometry();
    geometryRef.current = geometry;

    const vertices = new Float32Array((GRID_SIZE + 1) * (GRID_SIZE + 1) * 3);
    const uvs = new Float32Array((GRID_SIZE + 1) * (GRID_SIZE + 1) * 2);
    const indices: number[] = [];

    // Build grid vertices and uvs placeholders
    let vIdx = 0;
    let uvIdx = 0;
    for (let j = 0; j <= GRID_SIZE; j++) {
      const v = j / GRID_SIZE;
      for (let i = 0; i <= GRID_SIZE; i++) {
        const u = i / GRID_SIZE;
        vertices[vIdx++] = 0;
        vertices[vIdx++] = 0;
        vertices[vIdx++] = 0;

        uvs[uvIdx++] = u;
        uvs[uvIdx++] = v;
      }
    }

    // Build grid cells indices (2 triangles per cell)
    for (let j = 0; j < GRID_SIZE; j++) {
      for (let i = 0; i < GRID_SIZE; i++) {
        const a = j * (GRID_SIZE + 1) + i;
        const b = j * (GRID_SIZE + 1) + i + 1;
        const c = (j + 1) * (GRID_SIZE + 1) + i;
        const d = (j + 1) * (GRID_SIZE + 1) + i + 1;

        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    // 4. Create Material (starts invisible)
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false
    });
    materialRef.current = material;

    // 5. Create Mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    scene.add(mesh);
    meshRef.current = mesh;

    // 6. Animation loop
    let animationFrameId: number;
    const animate = () => {
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
      if (textureRef.current) textureRef.current.dispose();
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [width, height]);

  // Load and apply texture
  useEffect(() => {
    if (!textureUrl || !materialRef.current) return;

    setTextureLoaded(false);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      textureUrl,
      (loadedTexture) => {
        // Configure texture wrapping and repeat
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        loadedTexture.colorSpace = THREE.SRGBColorSpace;

        // Apply to material
        if (materialRef.current) {
          materialRef.current.map = loadedTexture;
          materialRef.current.needsUpdate = true;
        }

        // Dispose of old texture if exists
        if (textureRef.current) {
          textureRef.current.dispose();
        }
        textureRef.current = loadedTexture;
        setTextureLoaded(true);
      },
      undefined,
      (err) => {
        console.error('Error loading texture:', err);
      }
    );
  }, [textureUrl]);

  // Update geometry when corners change
  useEffect(() => {
    const geometry = geometryRef.current;
    const mesh = meshRef.current;

    if (!geometry || !mesh) return;

    if (corners.length < 4 || !textureLoaded) {
      mesh.visible = false;
      return;
    }

    // Apply bilinear interpolation map coordinates
    const positions = geometry.attributes.position.array as Float32Array;
    let index = 0;

    const tl = corners.find(c => c.label === 'topLeft') || corners[0];
    const tr = corners.find(c => c.label === 'topRight') || corners[1];
    const br = corners.find(c => c.label === 'bottomRight') || corners[2];
    const bl = corners.find(c => c.label === 'bottomLeft') || corners[3];

    for (let j = 0; j <= GRID_SIZE; j++) {
      const v = j / GRID_SIZE;
      for (let i = 0; i <= GRID_SIZE; i++) {
        const u = i / GRID_SIZE;
        // Mirror U axis: pass tr as first arg so u=0→topRight (screen right), u=1→topLeft (screen left)
        // This corrects the horizontal flip caused by the orthographic camera setup
        const pt = bilerp(tr, tl, bl, br, u, v);
        positions[index++] = pt.x;
        positions[index++] = pt.y;
        positions[index++] = 0;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    mesh.visible = true;
  }, [corners, textureLoaded]);

  // Update settings (opacity, scale, rotation, repeat)
  useEffect(() => {
    const material = materialRef.current;
    const texture = textureRef.current;

    if (!material) return;

    // Apply opacity
    material.opacity = settings.opacity;

    // Apply texture specific settings (scale, rotation, wrap mode)
    if (texture) {
      // Repeat mode
      if (settings.repeatMode === 'repeat') {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(settings.scale, settings.scale);
      } else {
        // Clamp to edge wrapping for cover/contain styles
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1.0, 1.0);
      }

      // Rotate around texture center (0.5, 0.5)
      texture.center.set(0.5, 0.5);
      texture.rotation = settings.rotation;
      texture.needsUpdate = true;
    }
  }, [settings, textureLoaded]);

  return <div ref={mountRef} className="absolute inset-0 z-10 pointer-events-none" />;
}
