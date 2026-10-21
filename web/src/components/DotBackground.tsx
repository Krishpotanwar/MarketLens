import { useEffect, useRef } from "react";
import { advanceDot, type Dot } from "../utils/dots";

interface DotBackgroundProps {
  darkMode?: boolean;
}

export function DotBackground({ darkMode = true }: DotBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const staticMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce), (pointer: coarse)"
    );
    let dots: Dot[] = [];
    let pointer: { x: number; y: number } | null = null;
    let frame = 0;
    let previousTime = 0;
    let width = 0;
    let height = 0;

    const draw = () => {
      context.clearRect(0, 0, width, height);
      // High-contrast clean dots tuned for pitch-black theme:
      context.fillStyle = darkMode
        ? "rgba(255, 255, 255, 0.22)"
        : "rgba(0, 0, 0, 0.15)";
      context.beginPath();
      for (const dot of dots) {
        const x = dot.x + dot.offsetX;
        const y = dot.y + dot.offsetY;
        context.moveTo(x + 1.2, y);
        context.arc(x, y, 1.2, 0, Math.PI * 2);
      }
      context.fill();
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    };

    const animate = (time: number) => {
      frame = 0;
      const elapsed = previousTime ? Math.min(time - previousTime, 48) : 16.67;
      previousTime = time;
      const blend = 1 - Math.exp(-elapsed / 96);
      let moving = false;
      for (const dot of dots) {
        moving = advanceDot(dot, pointer, blend) || moving;
      }
      draw();
      if (moving) {
        frame = requestAnimationFrame(animate);
      } else {
        previousTime = 0;
      }
    };

    const wake = () => {
      if (!frame && !document.hidden && !staticMotion.matches) {
        frame = requestAnimationFrame(animate);
      }
    };

    const reset = () => {
      stop();
      pointer = null;
      for (const dot of dots) {
        dot.offsetX = 0;
        dot.offsetY = 0;
      }
      if (!document.hidden) draw();
    };

    const resize = () => {
      stop();
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const step = 28;
      for (let y = 14; y < height; y += step) {
        for (let x = 14; x < width; x += step) {
          dots.push({ x, y, offsetX: 0, offsetY: 0 });
        }
      }
      if (!document.hidden) draw();
      if (pointer) wake();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (staticMotion.matches || document.hidden || event.pointerType === "touch") return;
      pointer = { x: event.clientX, y: event.clientY };
      wake();
    };

    const clearPointer = () => {
      pointer = null;
      wake();
    };

    resize();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("blur", clearPointer);
    document.addEventListener("mouseleave", clearPointer);
    document.addEventListener("visibilitychange", reset);
    staticMotion.addEventListener("change", reset);

    return () => {
      stop();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      window.removeEventListener("blur", clearPointer);
      document.removeEventListener("mouseleave", clearPointer);
      document.removeEventListener("visibilitychange", reset);
      staticMotion.removeEventListener("change", reset);
    };
  }, [darkMode]);

  return <canvas ref={canvasRef} className="dot-background" aria-hidden="true" />;
}
