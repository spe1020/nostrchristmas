import { useMemo } from 'react';
import { type NostrEvent } from '@nostrify/nostrify';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { cn } from '@/lib/utils';
import { NoteContent } from './NoteContent';
import { useNoteStats } from '@/hooks/useNoteStats';
import { MessageSquare, Heart, Zap } from 'lucide-react';

interface FeedNoteProps {
  event: NostrEvent;
  className?: string;
  showNested?: boolean;
  depth?: number;
}

/**
 * Enhanced note renderer for feeds that shows:
 * - Nested nevents as previews (supports up to 3 levels deep)
 * - Images/media inline
 * - Proper content rendering
 */
export function FeedNote({ event, className, showNested = true, depth = 0 }: FeedNoteProps) {
  const stats = useNoteStats(event);
  
  // Extract imeta tags for media
  const mediaUrls = useMemo(() => {
    const urls: Array<{ url: string; mimeType?: string; alt?: string }> = [];
    
    // Check for imeta tags (NIP-94)
    event.tags.forEach((tag) => {
      if (tag[0] === 'imeta') {
        let url = '';
        let mimeType = '';
        let alt = '';
        
        for (let i = 1; i < tag.length; i++) {
          const part = tag[i];
          if (part.startsWith('url ')) {
            url = part.substring(4);
          } else if (part.startsWith('m ')) {
            mimeType = part.substring(2);
          } else if (part.startsWith('alt ')) {
            alt = part.substring(4);
          }
        }
        
        if (url) {
          urls.push({ url, mimeType, alt });
        }
      }
    });
    
    // Also check content for image URLs
    const imageUrlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/gi;
    const contentMatches = event.content.match(imageUrlRegex);
    if (contentMatches) {
      contentMatches.forEach((url) => {
        if (!urls.some((m) => m.url === url)) {
          urls.push({ url });
        }
      });
    }
    
    return urls;
  }, [event]);

  // Extract nevent references from content
  const neventRefs = useMemo(() => {
    const refs: Array<{ nevent: string; eventId?: string; pubkey?: string }> = [];
    const neventRegex = /nostr:(nevent1|note1)([023456789acdefghjklmnpqrstuvwxyz]+)/g;
    let match;
    
    while ((match = neventRegex.exec(event.content)) !== null) {
      const nostrId = `${match[1]}${match[2]}`;
      try {
        const decoded = nip19.decode(nostrId);
        if (decoded.type === 'nevent') {
          const data = decoded.data;
          refs.push({
            nevent: nostrId,
            eventId: data.id,
            pubkey: 'pubkey' in data && typeof data.pubkey === 'string' ? data.pubkey : undefined,
          });
        } else if (decoded.type === 'note') {
          refs.push({
            nevent: nostrId,
            eventId: decoded.data as string,
            pubkey: undefined,
          });
        }
      } catch {
        // Skip invalid nevents
      }
    }
    
    return refs;
  }, [event.content]);

  // Create a modified event content that removes nevents (we'll render them separately)
  const contentWithoutNevents = useMemo(() => {
    let content = event.content;
    neventRefs.forEach((ref) => {
      content = content.replace(`nostr:${ref.nevent}`, '');
    });
    return content.trim();
  }, [event.content, neventRefs]);

  const modifiedEvent = useMemo(() => ({
    ...event,
    content: contentWithoutNevents,
  }), [event, contentWithoutNevents]);

  const isNested = depth > 0;
  const textSize = isNested ? 'text-xs' : 'text-sm';
  const spacing = isNested ? 'space-y-1' : 'space-y-2';

  return (
    <div className={cn(spacing, className)}>
      {/* Main content */}
      {contentWithoutNevents && (
        <div className={cn("text-gray-700 dark:text-gray-300 break-words", textSize)}>
          <NoteContent event={modifiedEvent} className={textSize} />
        </div>
      )}

      {/* Media/images */}
      {mediaUrls.length > 0 && (
        <div className={spacing}>
          {mediaUrls.map((media, idx) => {
            const isImage = media.mimeType?.startsWith('image/') || 
              /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(media.url);
            
            if (isImage) {
              return (
                <img
                  key={idx}
                  src={media.url}
                  alt={media.alt || 'Media attachment'}
                  className={cn(
                    "max-w-full rounded border border-gray-200 dark:border-gray-700",
                    isNested ? "max-h-32" : "max-h-48"
                  )}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Nested nevents */}
      {showNested && neventRefs.length > 0 && (
        <div className={cn("mt-2", spacing)}>
          {neventRefs.map((ref) => (
            <NestedEventPreview 
              key={ref.nevent} 
              nevent={ref.nevent} 
              eventId={ref.eventId} 
              pubkey={ref.pubkey}
              depth={depth}
            />
          ))}
        </div>
      )}

      {/* Stats: Reactions, Comments, Zaps */}
      {!isNested && (
        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Heart className="w-3.5 h-3.5" />
            <span>{stats.reactions}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{stats.comments}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Zap className="w-3.5 h-3.5" />
            <span>{stats.zaps}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Preview component for nested events (nevents)
 * Supports recursive nesting up to 3 levels deep
 */
function NestedEventPreview({ 
  nevent, 
  eventId, 
  pubkey,
  depth = 0 
}: { 
  nevent: string; 
  eventId?: string; 
  pubkey?: string;
  depth?: number;
}) {
  const { nostr } = useNostr();
  const maxDepth = 2; // Allow up to 3 levels total (0, 1, 2)

  const nestedEvent = useQuery({
    queryKey: ['nested-event', eventId || nevent],
    queryFn: async ({ signal }) => {
      if (!eventId) return null;

      const events = await nostr.query(
        [{ ids: [eventId], limit: 1 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]) },
      );

      return events[0] || null;
    },
    enabled: !!eventId && depth < maxDepth,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const author = useAuthor(nestedEvent.data?.pubkey || pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || metadata?.display_name || 
    (nestedEvent.data?.pubkey ? genUserName(nestedEvent.data.pubkey) : 'Nostr User');

  const isNested = depth > 0;
  const padding = isNested ? "p-1.5" : "p-2";
  const marginLeft = depth > 0 ? "ml-2" : "";
  const borderStyle = isNested ? "border-l-2" : "border";

  if (nestedEvent.isLoading) {
    return (
      <div className={cn(
        padding,
        "rounded border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50",
        marginLeft,
        borderStyle
      )}>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4 mb-1" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
      </div>
    );
  }

  if (!nestedEvent.data) {
    return (
      <div className={cn(
        padding,
        "rounded border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50",
        marginLeft,
        borderStyle
      )}>
        <Link to={`/${nevent}`} className="text-xs text-blue-500 hover:underline">
          View note: {nevent.slice(0, 20)}...
        </Link>
      </div>
    );
  }

  const nestedNote = nestedEvent.data;

  return (
    <div className={cn(
      padding,
      "rounded border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50",
      marginLeft,
      borderStyle
    )}>
      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
          {displayName}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
          {new Date(nestedNote.created_at * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
      {/* Use FeedNote recursively to show nested notes within nested notes */}
      <FeedNote event={nestedNote} showNested={depth < maxDepth} depth={depth + 1} />
    </div>
  );
}

