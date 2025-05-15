import React, { useRef, useEffect } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';

const RotatingGlobe: React.FC = () => {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    globe.pointOfView({ altitude: 0.75 }, 0);

    const ctl = globe.controls();
    ctl.autoRotate = true;
    ctl.autoRotateSpeed = 0.6;
    ctl.enableZoom = false;
  }, []);

  return (
    <Globe
      ref={globeRef}
      backgroundColor="rgba(0,0,0,0)"
      width={undefined}
      height={undefined}
       globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
  bumpImageUrl="https://www.solarsystemscope.com/textures/download/8k_earth_bump.jpg"
  backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png" 
    />
  );
};

export default RotatingGlobe;
