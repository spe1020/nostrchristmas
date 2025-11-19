import { useSeoMeta } from '@unhead/react';
import { useState, useEffect } from 'react';
import { AdventCalendarTile } from '@/components/AdventCalendarTile';
import { AdventDayModal, DayContent } from '@/components/AdventDayModal';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { Calendar } from 'lucide-react';

interface AdventData {
  days: DayContent[];
}

const Index = () => {
  const [adventData, setAdventData] = useState<AdventData | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayContent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useCurrentUser();
  const { toast } = useToast();

  useSeoMeta({
    title: 'Nostr Advent Calendar 2024',
    description: 'Discover something new about Nostr every day this December! A 24-day journey through the decentralized social protocol.',
  });

  // Load advent calendar data
  useEffect(() => {
    fetch('/advent-data.json')
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
    return now >= unlock;
  };

  const handleTileClick = (dayContent: DayContent) => {
    setSelectedDay(dayContent);
    setIsModalOpen(true);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading advent calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Nostr Advent Calendar
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">December 2024</p>
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
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Discover Nostr This December
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Unlock a new insight about the decentralized social protocol every day leading up to Christmas!
          </p>
          {user && (
            <p className="text-sm text-purple-600 dark:text-purple-400 flex items-center justify-center gap-2">
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
              isUnlocked={isDayUnlocked(day.unlockDate)}
              onClick={() => handleTileClick(day)}
            />
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            {adventData.days.filter(d => isDayUnlocked(d.unlockDate)).length} of 24 days unlocked
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
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
