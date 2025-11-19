import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Copy, Check, User } from 'lucide-react';
import { useAuthor } from '@/hooks/useAuthor';
import { useAuthorNotes } from '@/hooks/useAuthorNotes';
import { useAppMetadata } from '@/hooks/useAppMetadata';
import { useToast } from '@/hooks/useToast';
import { useState, useMemo } from 'react';
import { nip19 } from 'nostr-tools';
import { FeedNote } from '@/components/FeedNote';

export interface AppOfTheDay {
  url: string;
  // Optional fallback values if metadata fetch fails
  name?: string;
  summary?: string;
}

export interface PersonToFollow {
  pubkey: string;
}

export interface DayContent {
  day: number;
  unlockDate: string;
  title: string;
  // Learn section - short micro-teaching (40-60 words)
  learn: string;
  // Explore section - App of the Day
  app?: AppOfTheDay;
  // Connect section - Person to Follow
  person?: PersonToFollow;
}

interface AdventDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayContent: DayContent | null;
  onZap?: () => void;
}

export function AdventDayModal({ isOpen, onClose, dayContent }: AdventDayModalProps) {
  const { toast } = useToast();
  const [copiedNpub, setCopiedNpub] = useState<string | null>(null);

  const handleCopyNpub = async (npub: string) => {
    try {
      await navigator.clipboard.writeText(npub);
      setCopiedNpub(npub);
      toast({
        title: 'Copied!',
        description: 'npub copied to clipboard',
      });
      setTimeout(() => setCopiedNpub(null), 2000);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy npub',
        variant: 'destructive',
      });
    }
  };

  const handleFollowNostr = (npub: string) => {
    const nostrUrl = `nostr:${npub}`;
    window.open(nostrUrl, '_blank');
  };

  if (!dayContent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {dayContent.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            Day {dayContent.day} • {new Date(dayContent.unlockDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 w-full min-w-0">
          {/* Combined Learn + App Card */}
          <Card className="overflow-hidden w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">1️⃣ Learn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words min-w-0" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {dayContent.learn}
              </p>
              
              {/* App of the Day - inline in same card */}
              {dayContent.app && (
                <AppInline app={dayContent.app} />
              )}
            </CardContent>
          </Card>

          {/* Person to Follow - Condensed Card */}
          {dayContent.person && (
            <PersonCard
              person={dayContent.person}
              copiedNpub={copiedNpub}
              onCopyNpub={handleCopyNpub}
              onFollow={handleFollowNostr}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


function AppInline({ app }: { app: AppOfTheDay }) {
  const metadata = useAppMetadata(app.url);
  const appName = metadata.data?.title || app.name || new URL(app.url).hostname;
  const appDescription = metadata.data?.description || app.summary || '';
  const appImage = metadata.data?.image || metadata.data?.favicon;

  return (
    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        {appImage && !metadata.isLoading && (
          <img
            src={appImage}
            alt={appName}
            className="w-12 h-12 rounded object-cover flex-shrink-0 bg-gray-100 dark:bg-gray-800"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">🟣 App of the Day:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white break-words">{appName}</span>
          </div>
          {appDescription && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {appDescription}
            </p>
          )}
          <Button
            variant="default"
            size="sm"
            asChild
            className="h-7 text-xs"
          >
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1"
            >
              Try It
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function PersonCard({
  person,
  copiedNpub,
  onCopyNpub,
  onFollow,
}: {
  person: PersonToFollow;
  copiedNpub: string | null;
  onCopyNpub: (npub: string) => void;
  onFollow: (npub: string) => void;
}) {
  // Handle npub encoding - pubkey can be hex or npub
  const npubToShow = useMemo(() => {
    if (person.pubkey.startsWith('npub')) {
      return person.pubkey;
    }
    // Assume it's hex and encode it
    try {
      return nip19.npubEncode(person.pubkey);
    } catch {
      // If encoding fails, return as-is (might already be npub without prefix)
      return person.pubkey;
    }
  }, [person.pubkey]);

  // Get pubkey for useAuthor (needs hex)
  const pubkeyHex = useMemo(() => {
    if (person.pubkey.startsWith('npub')) {
      try {
        const decoded = nip19.decode(person.pubkey);
        if (decoded.type === 'npub') {
          return decoded.data as string;
        }
        if (decoded.type === 'nprofile') {
          const data = decoded.data;
          return typeof data === 'string' ? data : data.pubkey;
        }
      } catch {
        return person.pubkey;
      }
    }
    return person.pubkey;
  }, [person.pubkey]);

  const author = useAuthor(pubkeyHex);
  const notes = useAuthorNotes(pubkeyHex, 3); // Fetch last 3 notes
  const isLoading = author.isLoading;
  const isLoadingNotes = notes.isLoading;
  const metadata = author.data?.metadata;
  // Use real profile data from Nostr
  const displayName = metadata?.name || metadata?.display_name || 'Nostr User';
  const picture = metadata?.picture;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">👤 Person to Follow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Profile Header - Condensed */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
          ) : picture ? (
            <img
              src={picture}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {isLoading ? (
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
              ) : (
                displayName
              )}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-gray-700 dark:text-gray-300">
                {npubToShow.slice(0, 16)}...
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopyNpub(npubToShow)}
                className="h-6 text-xs px-2"
              >
                {copiedNpub === npubToShow ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onFollow(npubToShow)}
                className="h-6 text-xs px-2"
              >
                Follow
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Notes Feed - Horizontal Scroll */}
        <div className="border-t pt-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Recent Notes
          </h4>
          {isLoadingNotes ? (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 w-64 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                </div>
              ))}
            </div>
          ) : notes.data && notes.data.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-2 horizontal-scroll">
              {notes.data.map((note) => (
                <div
                  key={note.id}
                  className="flex-shrink-0 w-64 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                >
                  <FeedNote event={note} showNested={true} />
                  <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(note.created_at * 1000).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              No recent notes found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
