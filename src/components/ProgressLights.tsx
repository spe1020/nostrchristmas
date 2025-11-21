import { cn } from '@/lib/utils';

interface ProgressLightsProps {
  unlockedCount: number;
  totalDays: number;
}

export function ProgressLights({ unlockedCount, totalDays }: ProgressLightsProps) {
  const lights = Array.from({ length: totalDays }, (_, i) => ({
    day: i + 1,
    isUnlocked: i < unlockedCount,
  }));

  return (
    <div className="relative flex items-center justify-center gap-1.5 md:gap-2 py-4">
      {/* Subtle connecting wire */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent dark:via-purple-400/20" />
      
      {/* Lights */}
      <div className="relative flex items-center justify-center">
        {lights.map((light, index) => {
        const isUnlocked = light.isUnlocked;
        // Alternate colors for visual variety
        const colorClass = index % 4 === 0 
          ? 'bg-purple-400' 
          : index % 4 === 1 
          ? 'bg-pink-400' 
          : index % 4 === 2 
          ? 'bg-blue-400' 
          : 'bg-indigo-400';
        
        const glowColor = index % 4 === 0
          ? 'rgba(192, 132, 252, 0.6)'
          : index % 4 === 1
          ? 'rgba(244, 114, 182, 0.6)'
          : index % 4 === 2
          ? 'rgba(96, 165, 250, 0.6)'
          : 'rgba(129, 140, 248, 0.6)';

        return (
          <div
            key={light.day}
            className={cn(
              "w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300",
              isUnlocked 
                ? `${colorClass} animate-flicker shadow-lg` 
                : "bg-gray-600 dark:bg-gray-700 opacity-30"
            )}
            style={isUnlocked ? {
              boxShadow: `0 0 6px ${glowColor}, 0 0 12px ${glowColor}`,
            } : {}}
            title={`Day ${light.day}${isUnlocked ? ' (Unlocked)' : ' (Locked)'}`}
          />
        );
      })}
      </div>
    </div>
  );
}

