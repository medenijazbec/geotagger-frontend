// RealisticGlobe.tsx
import React, { useRef, useEffect } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

/* ── tweakables ─────────────────────────────── */
const SHOW_CLOUDS   = true;
const SHOW_ATMOS    = true;
const CLOUD_OPACITY = 0.34;
const CLOUD_SPEED   = 0.00004;
const SUN_DIR       = new THREE.Vector3(-0.9, 0.3, -0.25).normalize();
/* ───────────────────────────────────────────── */

/*atmosphere layers*/ 
const ATMOS_LAYERS = [
  { file: "/textures/atmo_whiteish.webp",           radius: 104.8, opacity: 0.009 },
  { file: "/textures/atmo_whiteishultrablue.webp",  radius: 105.3, opacity: 0.013 },
  { file: "/textures/atmo_ultrablue.webp",          radius: 105.7, opacity: 0.013 },
  { file: "/textures/atmo_blue.webp",               radius: 106.0, opacity: 0.014 },
  { file: "/textures/atmo_darkishblue.webp",        radius: 106.2, opacity: 0.013 }
];

// Globe and other textures
const DAY_TEXTURE    = "/textures/earth_day_blue.jpg";
const BUMP_TEXTURE   = "/textures/earth_day2.webp";
const SPEC_TEXTURE   = "/textures/water_spec_8k.webp";
const NIGHT_TEXTURE  = "/textures/earth_night.webp";
const CLOUD_TEXTURE  = "/textures/clouds.jpg";

// loader
const loadTex = (url: string) =>
  new Promise<THREE.Texture>((res, rej) =>
    new THREE.TextureLoader().load(
      url,
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
    let atmoMeshes: THREE.Mesh[] = [];
    let rafId: number | null = null;

    (async () => {
      /* ---------- Earth (day / night + specular) ---------------- */
      const [dayTex, nightTex, specTex, bumpTex] = await Promise.all([
        loadTex(DAY_TEXTURE),
        loadTex(NIGHT_TEXTURE),
        loadTex(SPEC_TEXTURE),
        loadTex(BUMP_TEXTURE)
      ]);

      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(101, 200, 200),
        new THREE.ShaderMaterial({
          uniforms: {
            dayMap  : { value: dayTex   },
            nightMap: { value: nightTex },
            specMap : { value: specTex  },
            bumpMap : { value: bumpTex  },
            sunDir  : { value: SUN_DIR  }
          },
          vertexShader: `
            varying vec2 vUv; varying vec3 vN;
            uniform sampler2D bumpMap;
            void main(){
              vUv = uv;
              vN  = normalize(normalMatrix * normal);
              vec3 displaced = normal * (texture2D(bumpMap, uv).r * 0.5);
              gl_Position = projectionMatrix * modelViewMatrix *
                            vec4(position + displaced, 1.);
            }`,
          fragmentShader: `
            uniform sampler2D dayMap, nightMap, specMap;
            uniform vec3 sunDir;
            varying vec2 vUv;  varying vec3 vN;
            void main(){
              vec3  n = normalize(vN);
              float kDay = smoothstep(-.25,.15,dot(n, sunDir));
              vec3  day    = texture2D(dayMap,   vUv).rgb;
              vec3  night  = texture2D(nightMap, vUv).rgb;
              float oceanMask = smoothstep(.55,.8, day.b - max(day.r, day.g));
              day = mix(day, vec3(0.11,0.45,1.0), oceanMask*0.6);
              float specStr = pow(max(dot(n, sunDir), 0.0), 25.0) *
                              texture2D(specMap, vUv).r * 0.8;
              vec3  col = mix(night, day, kDay) + vec3(specStr);
              gl_FragColor = vec4(col, 1.);
            }`
        })
      );
      globe.scene().add(earth);

      /* ---------- Clouds ---------------------------------------- */
      if (SHOW_CLOUDS) {
        const cloudTex = await loadTex(CLOUD_TEXTURE);

        const cloudMat = new THREE.MeshPhongMaterial({
          map: cloudTex,
          transparent: true,
          opacity: CLOUD_OPACITY,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits : -1
        });

        cloudMesh = new THREE.Mesh(
          new THREE.SphereGeometry(102, 160, 160), cloudMat
        );
        globe.scene().add(cloudMesh);

        const spin = () => {
          cloudMesh!.rotation.y += CLOUD_SPEED;
          rafId = requestAnimationFrame(spin);
        };
        spin();
      }

      /* ---------- Stacked Atmosphere Layers --------------------- */
      if (SHOW_ATMOS) {
        for (let i = 0; i < ATMOS_LAYERS.length; ++i) {
          const layer = ATMOS_LAYERS[i];
          const atmoTex = await loadTex(layer.file);

          const atmoMesh = new THREE.Mesh(
            new THREE.SphereGeometry(layer.radius, 160, 160),
            new THREE.MeshBasicMaterial({
              map: atmoTex,
              transparent: true,
              opacity: layer.opacity,
              depthWrite: false
            })
          );
          atmoMesh.renderOrder = 1.1 + i * 0.01;
          globe.scene().add(atmoMesh);
          atmoMeshes.push(atmoMesh);
        }
      }
    })();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      [cloudMesh, ...atmoMeshes].forEach(m=>{
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
      globeImageUrl={DAY_TEXTURE}
      bumpImageUrl={BUMP_TEXTURE}
      backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
      width={undefined}
      height={undefined}
    />
  );
};

export default RealisticGlobe;
