import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { ThemeId } from "../hooks/settings";

interface FrameProps {
  children: ReactNode;
  tiltEnabled?: boolean;
  theme?: ThemeId;
  customColor?: string;
}

export default function Frame({
  children,
  tiltEnabled = true,
  theme = "matte-black",
  customColor = "#2a5ca8",
}: FrameProps) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [scale, setScale] = useState(1);

  // fit-to-viewport: shrink (never grow) the board so it never overflows
  // the window at the larger default tile size, with a small margin.
  useEffect(() => {
    const compute = () => {
      const el = measureRef.current;
      if (!el) return;
      const naturalW = el.offsetWidth;
      const naturalH = el.offsetHeight;
      if (!naturalW || !naturalH) return;
      const availW = window.innerWidth * 0.92;
      const availH = window.innerHeight * 0.86;
      const next = Math.min(1, availW / naturalW, availH / naturalH);
      setScale(Number.isFinite(next) ? next : 1);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tiltEnabled || !tiltRef.current) return;
      const rect = tiltRef.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!tiltRef.current) return;
        const rotateY = px * 4.5;
        const rotateX = -py * 3.5;
        tiltRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
    },
    [tiltEnabled]
  );

  const handleMouseLeave = useCallback(() => {
    if (!tiltRef.current) return;
    tiltRef.current.style.transform = "rotateX(0deg) rotateY(0deg)";
  }, []);

  return (
    <div className="frame-stage" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <div className="frame-vignette" />
      <div className="frame-scale" style={{ transform: `scale(${scale})` }} ref={measureRef}>
        <div
          className={`frame theme-${theme}`}
          ref={tiltRef}
          style={theme === "custom" ? ({ "--frame-accent": customColor } as CSSProperties) : undefined}
        >
          <div className="frame-ambient" />
          <div className="frame-inner">{children}</div>
        </div>
      </div>
    </div>
  );
}
