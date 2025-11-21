import { useSeoMeta } from '@unhead/react';
import { useState, useEffect } from 'react';
import { AdventCalendarTile, type TileState } from '@/components/AdventCalendarTile';
import { AdventDayModal, DayContent } from '@/components/AdventDayModal';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { useOpenedDays } from '@/hooks/useOpenedDays';
import { Calendar } from 'lucide-react';
import { Snowfall } from '@/components/Snowfall';
import { ChristmasLights } from '@/components/ChristmasLights';
import { WinterNightBackground } from '@/components/WinterNightBackground';
import { ProgressLights } from '@/components/ProgressLights';

interface AdventData {
  days: DayContent[];
}

const Index = () => {
  const [adventData, setAdventData] = useState<AdventData | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayContent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const { isDayOpened, markDayAsOpened } = useOpenedDays();

  useSeoMeta({
    title: 'Nostr Advent Calendar 2024',
    description: 'Discover something new about Nostr every day this December! A 24-day journey through the decentralized social protocol.',
  });

  // Load advent calendar data
  useEffect(() => {
    fetch('/advent-data.json?v=' + Date.now()) // Cache busting to ensure fresh data
      .then(res => res.json())
      .then(data => setAdventData(data))
      .catch(err => {
        console.error('Failed to load advent data:', err);
        toast({
          title: 'Error',
          description: 'Failed to load advent calendar data',
          variant: 'destructive',
        });
      });
  }, [toast]);

  // Check if a day is unlocked based on current date
  const isDayUnlocked = (unlockDate: string): boolean => {
    const now = new Date();
    const unlock = new Date(unlockDate);
    // Reset time to compare dates only
    now.setHours(0, 0, 0, 0);
    unlock.setHours(0, 0, 0, 0);
    return now >= unlock;
  };

  // Check if a day is today
  const isToday = (unlockDate: string): boolean => {
    const now = new Date();
    const unlock = new Date(unlockDate);
    now.setHours(0, 0, 0, 0);
    unlock.setHours(0, 0, 0, 0);
    return now.getTime() === unlock.getTime();
  };

  // Calculate tile state
  const getTileState = (dayContent: DayContent): TileState => {
    if (!isDayUnlocked(dayContent.unlockDate)) {
      return 'locked';
    }
    if (isToday(dayContent.unlockDate) && !isDayOpened(dayContent.day)) {
      return 'today';
    }
    if (isDayOpened(dayContent.day)) {
      return 'opened';
    }
    // Past day that hasn't been opened yet - treat as "today" for now
    // (could be changed to a separate "available" state if needed)
    return 'today';
  };

  const handleTileClick = (dayContent: DayContent) => {
    setSelectedDay(dayContent);
    setIsModalOpen(true);
    // Mark day as opened when modal is opened
    markDayAsOpened(dayContent.day);
  };

  const handleZap = () => {
    // Placeholder zap function - will be enhanced later
    toast({
      title: 'Zap Request',
      description: 'Zap functionality will be implemented soon! ⚡',
    });
  };

  if (!adventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300 dark:text-gray-400">Loading advent calendar...</p>
        </div>
      </div>
    );
  }

  // Check if any days are unlocked
  const hasUnlockedDays = adventData.days.some(day => isDayUnlocked(day.unlockDate));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950 relative">
      {/* Winter Night Background Effects */}
      <WinterNightBackground />
      
      {/* Snowfall Effect */}
      <Snowfall hasUnlockedDays={hasUnlockedDays} />
      
      {/* Header */}
      <header className="border-b border-indigo-800/30 dark:border-indigo-700/30 bg-slate-900/60 dark:bg-slate-950/60 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Nostr Advent Calendar
                </h1>
                <p className="text-sm text-gray-300 dark:text-gray-400">December 2024</p>
              </div>
            </div>
            <LoginArea className="max-w-60" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12 space-y-4">
          <ChristmasLights />
          <h2 className="text-4xl md:text-5xl font-bold text-white dark:text-white">
            Discover Nostr This December
          </h2>
          <p className="text-xl text-gray-200 dark:text-gray-300 max-w-2xl mx-auto">
            Unlock a new insight about the decentralized social protocol every day leading up to Christmas!
          </p>
          {user && (
            <p className="text-sm text-purple-300 dark:text-purple-400 flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Logged in as Nostr user - Send zaps to support content creators!
            </p>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4 max-w-6xl mx-auto">
          {adventData.days.map((day) => (
            <AdventCalendarTile
              key={day.day}
              day={day.day}
              state={getTileState(day)}
              onClick={() => handleTileClick(day)}
            />
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center space-y-4">
          <p className="text-gray-300 dark:text-gray-400">
            {adventData.days.filter(d => isDayUnlocked(d.unlockDate)).length} of 24 days unlocked
          </p>
          <ProgressLights 
            unlockedCount={adventData.days.filter(d => isDayUnlocked(d.unlockDate)).length}
            totalDays={24}
          />
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Built with ❤️ on Nostr
          </p>
        </div>
      </main>

      {/* Day Content Modal */}
      <AdventDayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dayContent={selectedDay}
        onZap={handleZap}
      />
    </div>
  );
};

export default Index;
