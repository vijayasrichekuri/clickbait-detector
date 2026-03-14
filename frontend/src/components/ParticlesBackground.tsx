/**
 * Particle background using tsparticles (slim bundle).
 */

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function ParticlesBackground() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
      setReady(true);
    });
  }, []);

  if (!ready) return null;

  return (
    <Particles
      id="tsparticles"
      className="absolute inset-0 -z-10"
      options={{
        fullScreen: { enable: true },
        background: { color: { value: "#020617" } },
        fpsLimit: 60,
        particles: {
          number: { value: 50, density: { enable: true, width: 800, height: 800 } },
          color: { value: ["#7c3aed", "#06b6d4", "#3b82f6"] },
          shape: { type: "circle" },
          opacity: { value: 0.3 },
          size: { value: { min: 0.5, max: 2 } },
          move: {
            enable: true,
            speed: 1,
            direction: "none",
            random: true,
            outModes: { default: "out" },
          },
        },
        interactivity: {
          detectsOn: "canvas",
          events: {
            onHover: { enable: true, mode: "grab" },
          },
          modes: {
            grab: { distance: 120, links: { opacity: 0.3 } },
          },
        },
        detectRetina: true,
      }}
    />
  );
}
