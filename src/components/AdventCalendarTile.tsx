import { cn } from '@/lib/utils';
import { Lock, Check } from 'lucide-react';

export type TileState = 'locked' | 'today' | 'opened';

interface AdventCalendarTileProps {
  day: number;
  state: TileState;
  onClick: () => void;
}

export function AdventCalendarTile({ day, state, onClick }: AdventCalendarTileProps) {
  const isClickable = state !== 'locked';

  // Base styles for all tiles
  const base = cn(
    "relative aspect-square rounded-xl border-2 transition-all duration-300",
    "flex flex-col items-center justify-center gap-2"
  );

  // State-specific styling
  const stylesByState = cn(
    state === 'locked' && [
      "bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800",
      "border-gray-400 dark:border-gray-600",
      "cursor-not-allowed opacity-50",
      "backdrop-blur-[2px]",
      "brightness-75",
    ],
    state === 'today' && [
      "bg-gradient-to-br from-purple-500 to-pink-500",
      "border-yellow-300 dark:border-yellow-400",
      "shadow-lg",
      "ring-2 ring-yellow-200 dark:ring-yellow-700 ring-opacity-60",
      "shadow-yellow-200/50 dark:shadow-yellow-900/50",
      "cursor-pointer",
    ],
    state === 'opened' && [
      "bg-gradient-to-br from-purple-500 to-pink-500",
      "border-purple-300 dark:border-purple-400",
      "shadow-md",
      "cursor-pointer",
    ]
  );

  // Hover effects (only for today & opened)
  const hover = state === 'locked' 
    ? "" 
    : "hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/40";

  // Click/press feedback (only for today & opened)
  const active = state === 'locked' 
    ? "" 
    : "active:scale-95 active:brightness-110";

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={cn(base, stylesByState, hover, active)}
    >
      {/* Day Number */}
      <span className={cn(
        "text-3xl font-bold drop-shadow-md",
        state === 'locked' 
          ? "text-gray-500 dark:text-gray-400" 
          : "text-white"
      )}>
        {day}
      </span>

      {/* State-specific icon */}
      <div className="absolute bottom-2 right-2">
        {state === 'locked' && (
          <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
        {state === 'opened' && (
          <Check className="w-5 h-5 text-white/90 bg-green-500 rounded-full p-0.5" />
        )}
      </div>

      {/* Shimmer effect for today and opened tiles */}
      {state !== 'locked' && (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent",
            state === 'today' && "animate-shimmer"
          )} />
        </div>
      )}
    </button>
  );
}
