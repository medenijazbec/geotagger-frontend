import React, { useRef, useEffect } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

/* ===== tweakables ================================================= */
const SHOW_CLOUDS      = true;
const SHOW_ATMOSPHERE  = true;
const CLOUD_OPACITY    = 0.34;
const CLOUD_SPEED      = 0.00004;
const SUN_DIR = new THREE.Vector3(-0.9, 0.3, -0.25).normalize(); 

/* =================================================================== */

const loadTex = (src: string) =>
  new Promise<THREE.Texture>((res, rej) =>
    new THREE.TextureLoader().load(
      src,
      t => {
        t.anisotropy = 16;
        t.minFilter  = THREE.LinearMipMapLinearFilter;
        t.magFilter  = THREE.LinearFilter;
        res(t);
      },
      undefined,
      rej
    )
  );

const RealisticGlobe: React.FC = () => {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    globe.pointOfView({ altitude: 1.05 }, 0);
    const ctl = globe.controls();
    ctl.autoRotate = true;
    ctl.autoRotateSpeed = 0.30;
    ctl.enableZoom = false;

    let cloudMesh: THREE.Mesh | null = null;
    let atmoMesh : THREE.Mesh | null = null;
    let rafId    : number | null     = null;

    (async () => {
      /* --------- EARTH (day + night shader) ---------------------- */
      const [dayTex, nightTex] = await Promise.all([
        loadTex("/earth_daymap_cloudless.jpg"),
        loadTex("/earth_lights_lrg.jpg")
      ]);

      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(101, /*★*/ 200, 200),
        new THREE.ShaderMaterial({
          uniforms: {
            dayMap : { value: dayTex   },
            nightMap: { value: nightTex },
            sunDir : { value: SUN_DIR   }
          },
          vertexShader: `
            varying vec2 vUv; varying vec3 vN;
            void main(){
              vUv = uv;
              vN  = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
            }`,
          fragmentShader: `
            uniform sampler2D dayMap, nightMap; uniform vec3 sunDir;
            varying vec2 vUv; varying vec3 vN;
            void main(){
              float k = smoothstep(-.25,.15,dot(normalize(vN), sunDir));
              vec3 col = mix(texture2D(nightMap, vUv).rgb,
                             texture2D(dayMap,  vUv).rgb, k);
              gl_FragColor = vec4(col, 1.);
            }`
        })
      );
      globe.scene().add(earth);

      /* --------- CLOUDS ----------------------------------------- */
      if (SHOW_CLOUDS) {
        const cloudTex = await loadTex("/cloud_combined_2048_alpha.png");

        const cloudMat = new THREE.MeshPhongMaterial({
          map: cloudTex,
          transparent: true,
          opacity: CLOUD_OPACITY,
          depthWrite: false,
          depthTest:  true,
          /* ★ depth bias – push the clouds a hair closer to the camera */
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits : -1
        });

        cloudMesh = new THREE.Mesh(
          /* ★ radius bumped from 101 → 102 */
          new THREE.SphereGeometry(102, 160, 160),
          cloudMat
        );
        cloudMesh.renderOrder = 1;
        globe.scene().add(cloudMesh);

        const spin = () => {
          if (cloudMesh) cloudMesh.rotation.y += CLOUD_SPEED;
          rafId = requestAnimationFrame(spin);
        };
        spin();
      }

      /* --------- ATMOSPHERE ------------------------------------- */
      if (SHOW_ATMOSPHERE) {
        atmoMesh = new THREE.Mesh(
          new THREE.SphereGeometry(104, 160, 160),
          new THREE.ShaderMaterial({
            vertexShader: `
              varying vec3 n;
              void main(){ n = normalize(normalMatrix * normal);
                           gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
            fragmentShader: `
              varying vec3 n;
              void main(){
                float i = pow(.5 - dot(n, vec3(0,0,1.)), 4.);
                gl_FragColor = vec4(vec3(0.10,0.50,1.0) * i, 1.);
              }`,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
          })
        );
        atmoMesh.renderOrder = 2;
        globe.scene().add(atmoMesh);
      }
    })();

    /* -------- cleanup -------- */
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      [cloudMesh, atmoMesh].forEach(m => {
        if (!m) return;
        globe.scene().remove(m);
        (m.material as THREE.Material).dispose();
        m.geometry.dispose();
      });
    };
  }, []);

  return (
    <Globe
      ref={globeRef as any}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl="/earth_daymap_cloudless.jpg"
      bumpImageUrl="/earth_daymap_cloudless.jpg"
      backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
      width={undefined}
      height={undefined}
    />
  );
};

export default RealisticGlobe;
