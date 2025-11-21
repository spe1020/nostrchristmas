import { useEffect, useRef } from 'react';
import { Snowflake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface SnowflakeParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  drift: number;
}

interface SnowfallProps {
  hasUnlockedDays: boolean;
}

export function Snowfall({ hasUnlockedDays }: SnowfallProps) {
  const [enabled, setEnabled] = useLocalStorage('snowfall-enabled', true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<SnowflakeParticle[]>([]);

  useEffect(() => {
    if (!enabled || !hasUnlockedDays || !canvasRef.current) {
      // Clear canvas when disabled or no unlocked days
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx && canvasRef.current.width && canvasRef.current.height) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Snowfall: Could not get canvas context');
      return;
    }

    // Create initial particles function
    const createParticles = () => {
      const particleCount = Math.floor((canvas.width * canvas.height) / 15000); // Subtle but visible density
      particlesRef.current = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1.5, // 1.5-4.5px (slightly larger)
        speed: Math.random() * 0.5 + 0.3, // Slow: 0.3-0.8px/frame
        opacity: Math.random() * 0.4 + 0.3, // 0.3-0.7 opacity (more visible)
        drift: (Math.random() - 0.5) * 0.4, // Gentle horizontal drift
      }));
    };

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width || window.innerWidth;
      canvas.height = rect.height || window.innerHeight;
      // Recreate particles after resize
      createParticles();
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation loop
    const animate = () => {
      if (!enabled || !hasUnlockedDays) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Update position
        particle.y += particle.speed;
        particle.x += particle.drift;

        // Reset if off screen
        if (particle.y > canvas.height) {
          particle.y = -10;
          particle.x = Math.random() * canvas.width;
        }
        if (particle.x < -10) {
          particle.x = canvas.width + 10;
        }
        if (particle.x > canvas.width + 10) {
          particle.x = -10;
        }

        // Draw with blurred glow effect
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        
        // Create glow effect with blur - purple/blue gradient matching theme
        ctx.shadowBlur = 8;
        ctx.shadowColor = particle.id % 3 === 0 
          ? 'rgba(59, 130, 246, 0.6)' // Soft blue glow
          : 'rgba(147, 51, 234, 0.6)'; // Soft purple glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        
        // Draw soft circle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
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
  }, [enabled, hasUnlockedDays]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[1] w-full h-full"
        style={{ mixBlendMode: 'screen' }}
      />
      {hasUnlockedDays && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEnabled(!enabled)}
          className="fixed top-20 right-4 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-purple-200 dark:border-purple-800 hover:bg-white dark:hover:bg-gray-900 shadow-sm"
          title={enabled ? 'Disable snowfall' : 'Enable snowfall'}
        >
          <Snowflake 
            className={`w-4 h-4 transition-opacity ${enabled ? 'opacity-100 text-purple-600' : 'opacity-40 text-gray-400'}`}
          />
        </Button>
      )}
    </>
  );
}

