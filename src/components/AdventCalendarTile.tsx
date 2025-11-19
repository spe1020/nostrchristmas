import { cn } from '@/lib/utils';
import { Lock, Unlock } from 'lucide-react';

interface AdventCalendarTileProps {
  day: number;
  isUnlocked: boolean;
  onClick: () => void;
}

export function AdventCalendarTile({ day, isUnlocked, onClick }: AdventCalendarTileProps) {
  return (
    <button
      onClick={isUnlocked ? onClick : undefined}
      disabled={!isUnlocked}
      className={cn(
        "relative aspect-square rounded-xl border-2 transition-all duration-300",
        "flex flex-col items-center justify-center gap-2",
        "hover:scale-105 active:scale-95",
        isUnlocked
          ? "bg-gradient-to-br from-purple-500 to-pink-500 border-purple-300 shadow-lg hover:shadow-xl cursor-pointer"
          : "bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 border-gray-400 dark:border-gray-600 cursor-not-allowed opacity-75"
      )}
    >
      {/* Day Number */}
      <span className="text-3xl font-bold text-white drop-shadow-md">
        {day}
      </span>

      {/* Lock/Unlock Icon */}
      <div className="absolute bottom-2 right-2">
        {isUnlocked ? (
          <Unlock className="w-5 h-5 text-white/80" />
        ) : (
          <Lock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        )}
      </div>

      {/* Shimmer effect for unlocked tiles */}
      {isUnlocked && (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      )}
    </button>
  );
}
