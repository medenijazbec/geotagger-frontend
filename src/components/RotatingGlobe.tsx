import React, { useRef, useEffect } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

const loadTexture = (url: string) =>
  new Promise<THREE.Texture>((resolve, reject) =>
    new THREE.TextureLoader().load(url, resolve, undefined, reject)
  );

// --- simple flags ----------------------------------------------------------
// flip these to true / false (or lift them into props / state)
const SHOW_CLOUDS      = true;   //hide or show the clouds
const SHOW_ATMOSPHERE  = true;    //+ hide or show the glow
const CLOUD_OPACITY    = 0.36;    
const CLOUD_SPEED      = 0.000099;  // rotation speed (rad / frame)
// ---------------------------------------------------------------------------

const RealisticGlobe: React.FC = () => {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    globe.pointOfView({ altitude: 0.78 }, 0);
    const ctl = globe.controls();
    ctl.autoRotate = true;
    ctl.autoRotateSpeed = 0.45;
    ctl.enableZoom = false;

    let cloudMesh: THREE.Mesh | null = null;
    let atmosphereMesh: THREE.Mesh | null = null;
    let animationId: number | null = null;

(async () => {

  // ---------------------------------------------------------------------
  // CLOUDS
  // ---------------------------------------------------------------------
  if (SHOW_CLOUDS) {
    const cloudTexture = await loadTexture("/cloud_combined_2048_alpha.png");
    cloudTexture.anisotropy = 16;

    const cloudGeometry = new THREE.SphereGeometry(100.6, 75, 75);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map:         cloudTexture,
      transparent: true,
      opacity:     CLOUD_OPACITY,   
      depthWrite:  false
    });

    cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    globe.scene().add(cloudMesh);

    const animate = () => {
      if (cloudMesh) cloudMesh.rotation.y += CLOUD_SPEED;
      animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  // ---------------------------------------------------------------------
  // ATMOSPHERE
  // ---------------------------------------------------------------------
  if (SHOW_ATMOSPHERE) {
    const atmoGeometry = new THREE.SphereGeometry(101.3, 75, 75);
    const atmoMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0,0,1.0)), 7.0);
          gl_FragColor = vec4(0.3, 0.7, 1.0, 0.65) * intensity;
        }
      `,
      blending:    THREE.AdditiveBlending,
      side:        THREE.BackSide,
      transparent: true
    });
    atmosphereMesh = new THREE.Mesh(atmoGeometry, atmoMaterial);
    globe.scene().add(atmosphereMesh);
  }
})();


    // -------- cleanup ----------
    return () => {
      if (animationId !== null) cancelAnimationFrame(animationId);
      if (cloudMesh) {
        globe.scene().remove(cloudMesh);
        (cloudMesh.material as THREE.Material).dispose();
        cloudMesh.geometry.dispose();
      }
      if (atmosphereMesh) {
        globe.scene().remove(atmosphereMesh);
        (atmosphereMesh.material as THREE.Material).dispose();
        atmosphereMesh.geometry.dispose();
      }
    };
  }, []);

  return (
    <Globe
      ref={globeRef}
      backgroundColor="rgba(0,0,0,0)"
      width={undefined}
      height={undefined}
      globeImageUrl="/earth_daymap_cloudless.jpg"
      bumpImageUrl="/earth_daymap_cloudless.jpg"
      backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
    />
  );
};

export default RealisticGlobe;
