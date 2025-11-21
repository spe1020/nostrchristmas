import { useEffect, useRef } from 'react';

export function WinterNightBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const starsRef = useRef<Array<{ x: number; y: number; size: number; opacity: number; twinkleSpeed: number }>>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create stars
    const createStars = () => {
      const starCount = Math.floor((canvas.width * canvas.height) / 25000); // Very subtle density
      starsRef.current = Array.from({ length: starCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 0.8 + 0.3, // 0.3-1.1px (tiny)
        opacity: Math.random() * 0.3 + 0.1, // 0.1-0.4 opacity (barely visible)
        twinkleSpeed: Math.random() * 0.02 + 0.01, // Slow twinkle
      }));
    };

    createStars();

    let time = 0;

    // Animation loop
    const animate = () => {
      time += 0.01;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw aurora-like streaks (bokeh effect)
      ctx.save();
      ctx.globalAlpha = 0.15;
      
      // Create flowing aurora streaks
      for (let i = 0; i < 8; i++) {
        const x = (canvas.width / 8) * i + Math.sin(time + i) * 50;
        const y = canvas.height * 0.3 + Math.cos(time * 0.5 + i) * 100;
        const radius = 150 + Math.sin(time + i) * 30;
        
        // Create gradient for aurora effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, i % 3 === 0 ? 'rgba(59, 130, 246, 0.4)' : i % 3 === 1 ? 'rgba(147, 51, 234, 0.3)' : 'rgba(96, 165, 250, 0.35)');
        gradient.addColorStop(0.5, i % 3 === 0 ? 'rgba(59, 130, 246, 0.2)' : i % 3 === 1 ? 'rgba(147, 51, 234, 0.15)' : 'rgba(96, 165, 250, 0.18)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();

      // Draw stars with gentle twinkle
      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed) * 0.1 + 0.9;
        const currentOpacity = star.opacity * twinkle;
        
        ctx.save();
        ctx.globalAlpha = currentOpacity;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 2;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

