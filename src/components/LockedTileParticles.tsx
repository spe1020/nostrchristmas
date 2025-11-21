import { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
}

interface LockedTileParticlesProps {
  isHovered: boolean;
}

export function LockedTileParticles({ isHovered }: LockedTileParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isHovered || !canvasRef.current || !containerRef.current) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = containerRef.current.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Create soft particles from center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const particleCount = 8;

    particlesRef.current = Array.from({ length: particleCount }, (_, i) => {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
      const speed = Math.random() * 1.5 + 0.5;
      return {
        id: i,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 1.5 + 0.5,
        opacity: 0.6,
        life: 1,
      };
    });

    const animate = () => {
      if (!isHovered) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
        particle.opacity = particle.life * 0.4;

        if (particle.life <= 0) return false;

        // Draw soft particle
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = 'rgba(147, 51, 234, 0.6)';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(147, 51, 234, 0.5)';

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        return true;
      });

      // Create new particles if needed
      if (particlesRef.current.length < particleCount && Math.random() > 0.7) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 0.5;
        particlesRef.current.push({
          id: Date.now(),
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 1.5 + 0.5,
          opacity: 0.6,
          life: 1,
        });
      }

      if (particlesRef.current.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovered]);

  return (
    <div ref={containerRef} className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  );
}

