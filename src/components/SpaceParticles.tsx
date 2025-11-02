import { useEffect, useRef } from "react";
import * as THREE from "three";

const SpaceParticles = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.z = 1000;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create space particles (stars)
    const particleCount = 3000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 2000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = radius + Math.random() * 500;

      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);

      sizes[i / 3] = Math.random() * 2 + 1;
    }

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particles.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for twinkling stars
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float time;

        void main() {
          vColor = vec3(1.0, 1.0, 1.0);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform float time;

        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          float alpha = 1.0 - smoothstep(0.0, 0.5, distance);
          alpha *= 0.8 + 0.2 * sin(time * 2.0);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Create nebula effect
    const nebulaGeometry = new THREE.BufferGeometry();
    const nebulaPositions = new Float32Array(5000 * 3);
    const nebulaColors = new Float32Array(5000 * 3);

    const nebulaColor1 = new THREE.Color(0xec4899);
    const nebulaColor2 = new THREE.Color(0x8b5cf6);
    const nebulaColor3 = new THREE.Color(0x3b82f6);

    for (let i = 0; i < 5000 * 3; i += 3) {
      const radius = 800 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      nebulaPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      nebulaPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      nebulaPositions[i + 2] = radius * Math.cos(phi);

      const colorChoice = Math.random();
      let color: THREE.Color;
      if (colorChoice < 0.33) color = nebulaColor1;
      else if (colorChoice < 0.66) color = nebulaColor2;
      else color = nebulaColor3;

      nebulaColors[i] = color.r;
      nebulaColors[i + 1] = color.g;
      nebulaColors[i + 2] = color.b;
    }

    nebulaGeometry.setAttribute("position", new THREE.BufferAttribute(nebulaPositions, 3));
    nebulaGeometry.setAttribute("color", new THREE.BufferAttribute(nebulaColors, 3));

    const nebulaMaterial = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
    scene.add(nebula);

    // Animation
    let time = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      time += 0.01;

      particleSystem.rotation.x += 0.0001;
      particleSystem.rotation.y += 0.0002;
      nebula.rotation.x += 0.00005;
      nebula.rotation.y += 0.0001;

      if (particleMaterial.uniforms) {
        particleMaterial.uniforms.time.value = time;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particles.dispose();
      nebulaGeometry.dispose();
      particleMaterial.dispose();
      nebulaMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ background: "transparent" }}
    />
  );
};

export default SpaceParticles;

