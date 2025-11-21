import { cn } from '@/lib/utils';

interface ChristmasLightsProps {
  className?: string;
}

export function ChristmasLights({ className }: ChristmasLightsProps) {
  // Create an array of lights with varying colors and delays for flickering
  const lights = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    color: i % 3 === 0 ? 'bg-purple-400' : i % 3 === 1 ? 'bg-pink-400' : 'bg-blue-400',
    delay: i * 0.12, // Stagger the animation
  }));

  return (
    <div className={cn("relative flex items-center justify-center mb-6", className)}>
      {/* Subtle wire connecting the lights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md h-px bg-gradient-to-r from-transparent via-purple-200/30 to-transparent dark:via-purple-800/30" />
      
      {/* Lights */}
      <div className="relative flex items-center justify-center gap-3">
        {lights.map((light) => (
          <div
            key={light.id}
            className={cn(
              "w-2 h-2 rounded-full relative",
              light.color,
              "animate-flicker"
            )}
            style={{
              animationDelay: `${light.delay}s`,
              boxShadow: light.id % 3 === 0
                ? '0 0 4px rgba(192, 132, 252, 0.6), 0 0 8px rgba(192, 132, 252, 0.4)'
                : light.id % 3 === 1
                ? '0 0 4px rgba(244, 114, 182, 0.6), 0 0 8px rgba(244, 114, 182, 0.4)'
                : '0 0 4px rgba(96, 165, 250, 0.6), 0 0 8px rgba(96, 165, 250, 0.4)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

