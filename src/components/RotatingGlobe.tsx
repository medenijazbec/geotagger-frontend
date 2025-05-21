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

// Globe and other textures (high res)
const DAY_TEXTURE    = "/textures/earth_day_blue.jpg";
const BUMP_TEXTURE   = "/textures/earth_day2.webp";
const SPEC_TEXTURE   = "/textures/water_spec_8k.webp";
const NIGHT_TEXTURE  = "/textures/earth_night.webp";
const CLOUD_TEXTURE  = "/textures/clouds.jpg";

// Low-res equivalents
const LOW_DAY_TEXTURE    = "/textures/low_earth_day_blue.jpg";
const LOW_BUMP_TEXTURE   = "/textures/low_earth_day2.jpg";
const LOW_SPEC_TEXTURE   = "/textures/low_water_spec_8k.jpg";
const LOW_NIGHT_TEXTURE  = "/textures/low_earth_night.jpg";
const LOW_CLOUD_TEXTURE  = "/textures/low_clouds.jpg";

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
    let earth: THREE.Mesh | null = null;
    let rafId: number | null = null;

    (async () => {
      // Load low-res main textures in parallel
      const [
        dayTex,
        nightTex,
        specTex,
        bumpTex
      ] = await Promise.all([
        loadTex(LOW_DAY_TEXTURE),
        loadTex(LOW_NIGHT_TEXTURE),
        loadTex(LOW_SPEC_TEXTURE),
        loadTex(LOW_BUMP_TEXTURE)
      ]);

      // Keep references for disposal
      let lowDayTex = dayTex;
      let lowNightTex = nightTex;
      let lowSpecTex = specTex;
      let lowBumpTex = bumpTex;

      // Add earth mesh using low-res textures
      earth = new THREE.Mesh(
        new THREE.SphereGeometry(101, 64, 64),
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

      // Start background loading of high-res main textures, then hot-swap them & dispose low-res
      Promise.all([
        loadTex(DAY_TEXTURE),
        loadTex(NIGHT_TEXTURE),
        loadTex(SPEC_TEXTURE),
        loadTex(BUMP_TEXTURE)
      ]).then(([hiDay, hiNight, hiSpec, hiBump]) => {
        if (earth && earth.material instanceof THREE.ShaderMaterial) {
          // Dispose old (low-res) textures before swapping
          if (earth.material.uniforms.dayMap.value && earth.material.uniforms.dayMap.value !== hiDay) {
            (earth.material.uniforms.dayMap.value as THREE.Texture).dispose();
          }
          if (earth.material.uniforms.nightMap.value && earth.material.uniforms.nightMap.value !== hiNight) {
            (earth.material.uniforms.nightMap.value as THREE.Texture).dispose();
          }
          if (earth.material.uniforms.specMap.value && earth.material.uniforms.specMap.value !== hiSpec) {
            (earth.material.uniforms.specMap.value as THREE.Texture).dispose();
          }
          if (earth.material.uniforms.bumpMap.value && earth.material.uniforms.bumpMap.value !== hiBump) {
            (earth.material.uniforms.bumpMap.value as THREE.Texture).dispose();
          }
          earth.material.uniforms.dayMap.value   = hiDay;
          earth.material.uniforms.nightMap.value = hiNight;
          earth.material.uniforms.specMap.value  = hiSpec;
          earth.material.uniforms.bumpMap.value  = hiBump;
          earth.material.needsUpdate = true;
        }
        // Remove references to low-res textures for GC
        lowDayTex = null as any;
        lowNightTex = null as any;
        lowSpecTex = null as any;
        lowBumpTex = null as any;
      });

      /* ---------- Clouds ---------------------------------------- */
      if (SHOW_CLOUDS) {
        const cloudTex = await loadTex(LOW_CLOUD_TEXTURE);
        let lowCloudTex = cloudTex;

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
          new THREE.SphereGeometry(102, 64, 64), cloudMat
        );
        globe.scene().add(cloudMesh);

        // Load high-res clouds async and swap in & dispose low-res
        loadTex(CLOUD_TEXTURE).then(hiCloudTex => {
          if (cloudMesh && cloudMesh.material instanceof THREE.MeshPhongMaterial) {
            if (cloudMesh.material.map && cloudMesh.material.map !== hiCloudTex) {
              cloudMesh.material.map.dispose();
            }
            cloudMesh.material.map = hiCloudTex;
            cloudMesh.material.needsUpdate = true;
            lowCloudTex = null as any;
          }
        });

        const spin = () => {
          cloudMesh!.rotation.y += CLOUD_SPEED;
          rafId = requestAnimationFrame(spin);
        };
        spin();
      }

      /* ---------- Stacked Atmosphere Layers --------------------- */
      if (SHOW_ATMOS) {
        // No low-res for atmos, just load as usual (they're tiny)
        for (let i = 0; i < ATMOS_LAYERS.length; ++i) {
          const layer = ATMOS_LAYERS[i];
          const atmoTex = await loadTex(layer.file);

          const atmoMesh = new THREE.Mesh(
            new THREE.SphereGeometry(layer.radius, 64, 64),
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
      [cloudMesh, earth, ...atmoMeshes].forEach(m=>{
        if (!m) return;
        globe.scene().remove(m);
        if (m.material) (m.material as THREE.Material).dispose();
        if (m.geometry) m.geometry.dispose();
      });
    };
  }, []);

  return (
    <Globe
      ref={globeRef as any}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl={DAY_TEXTURE} // fallback, not used for custom mesh
      bumpImageUrl={BUMP_TEXTURE} // fallback, not used for custom mesh
      backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
      width={undefined}
      height={undefined}
    />
  );
};

export default RealisticGlobe;
