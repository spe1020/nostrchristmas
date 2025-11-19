import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Zap } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export interface DayContent {
  day: number;
  unlockDate: string;
  title: string;
  description: string;
  image: string;
  link: string;
}

interface AdventDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayContent: DayContent | null;
  onZap?: () => void;
}

export function AdventDayModal({ isOpen, onClose, dayContent, onZap }: AdventDayModalProps) {
  const { user } = useCurrentUser();

  if (!dayContent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {dayContent.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            Unlocked on {new Date(dayContent.unlockDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </DialogDescription>
        </DialogHeader>

        {/* Image */}
        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={dayContent.image}
            alt={dayContent.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Description */}
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {dayContent.description}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {dayContent.link && (
              <Button
                variant="default"
                className="flex-1"
                asChild
              >
                <a
                  href={dayContent.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  Learn More
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}

            {user && onZap && (
              <Button
                variant="outline"
                onClick={onZap}
                className="flex items-center gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
              >
                <Zap className="w-4 h-4 fill-current" />
                Send Zap
              </Button>
            )}
          </div>

          {!user && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              Log in with Nostr to send zaps ⚡
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
