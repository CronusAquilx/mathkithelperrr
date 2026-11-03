import { useEffect, useRef } from "react";
import { getAppearance, usePrefs } from "@/lib/astra/prefs";

/** A single lightweight canvas per shell; never mounted by standalone gameplay. */
export function WallpaperEffects({ appearance }: { appearance?: ReturnType<typeof getAppearance> }) {
  const prefs = usePrefs();
  const look = appearance ?? getAppearance(prefs);
  const canvas = useRef<HTMLCanvasElement>(null);
  const enabled = (look.particles !== "off" || look.liveWallpaper !== "off") && !look.reduceMotion && !prefs.perfMode && prefs.device !== "phone";
  useEffect(() => {
    const node = canvas.current;
    if (!node || !enabled) return;
    const ctx = node.getContext("2d");
    if (!ctx) return;
    let frame = 0; let previous = 0;
    const resize = () => { node.width = node.clientWidth; node.height = node.clientHeight; };
    const observer = new ResizeObserver(resize); observer.observe(node); resize();
    const color = getComputedStyle(node).getPropertyValue(look.liveWallpaper !== "off" ? "--desktop-ink" : "--star").trim();
    const points = Array.from({ length: look.particleDensity === "subtle" ? 24 : 64 }, (_, i) => ({ x: ((i * 73) % 101) / 101, y: ((i * 47) % 103) / 103, speed: 0.008 + (i % 5) * 0.003 }));
    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (time - previous < 33 || document.hidden) return;
      const delta = Math.min((time - previous) / 1000, 0.05) * (look.effectSpeed ?? 1); previous = time;
      ctx.clearRect(0, 0, node.width, node.height); ctx.fillStyle = color; ctx.strokeStyle = color;
      if (look.liveWallpaper === "water") {
        for (let i = 0; i < 9; i++) {
          const phase = (time / 5500 + i / 9) % 1;
          ctx.globalAlpha = (1 - phase) * .16;
          ctx.beginPath();
          ctx.ellipse(node.width * (.18 + (i % 4) * .21), node.height * (.66 + (i % 3) * .1), 12 + phase * node.width * .2, 2 + phase * 16, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (look.particles === "off") return;
      }
      points.forEach((p, i) => {
        p.y += (look.liveWallpaper === "rain" ? 18 : -1) * p.speed * delta; if (p.y < -0.02) p.y = 1.02; if (p.y > 1.02) p.y = -.02;
        const x = p.x * node.width + Math.sin(time / 5000 + i) * 12; const y = p.y * node.height;
        ctx.globalAlpha = 0.18 + (i % 3) * 0.12;
        if (look.particles === "rain" || look.liveWallpaper === "rain") { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 18); ctx.stroke(); }
        else if (look.particles === "snow" || look.particles === "fireflies") { ctx.globalAlpha = look.particles === "fireflies" ? .25 + Math.sin(time / 800 + i) * .2 : .45; ctx.beginPath(); ctx.arc(x, y, look.particles === "snow" ? 2 + i % 3 : 2, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.fillRect(x, y, i % 2 + 1, i % 2 + 1); }
      });
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [enabled, look.liveWallpaper, look.particles, look.particleDensity, look.accent, look.palette, look.effectSpeed]);
  return enabled ? <canvas ref={canvas} aria-hidden="true" className="wallpaper-effects pointer-events-none absolute inset-0 size-full"/> : null;
}