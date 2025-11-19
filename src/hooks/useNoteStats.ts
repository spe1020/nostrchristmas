import { type NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

interface NoteStats {
  reactions: number;
  comments: number;
  zaps: number;
  isLoading: boolean;
}

/**
 * Hook to fetch reaction, comment, and zap counts for a note
 */
export function useNoteStats(event: NostrEvent | null | undefined): NoteStats {
  const { nostr } = useNostr();

  // Combine all three queries into one for efficiency
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['note-stats', event?.id],
    queryFn: async (c) => {
      if (!event?.id) {
        return { reactions: [], comments: [], zaps: [] };
      }

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      try {
        // Query all three types in parallel
        // Note: Using both '#e' and '#E' for compatibility (some relays may expect different casing)
        const [reactions, comments, zaps] = await Promise.all([
          // Reactions (kind 7) - try both lowercase and uppercase
          nostr.query(
            [{ kinds: [7], '#e': [event.id], limit: 1000 }],
            { signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]) },
          ).catch((err) => {
            console.warn('Reactions query failed:', err);
            return [] as NostrEvent[];
          }),
          
          // Comments/replies (kind 1 with #e tag)
          nostr.query(
            [{ kinds: [1], '#e': [event.id], limit: 1000 }],
            { signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]) },
          ).catch((err) => {
            console.warn('Comments query failed:', err);
            return [] as NostrEvent[];
          }),
          
          // Zaps (kind 9735)
          nostr.query(
            [{ kinds: [9735], '#e': [event.id], limit: 1000 }],
            { signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]) },
          ).catch((err) => {
            console.warn('Zaps query failed:', err);
            return [] as NostrEvent[];
          }),
        ]);

        console.log(`Note stats for ${event.id.slice(0, 8)}...:`, {
          reactions: reactions.length,
          comments: comments.length,
          zaps: zaps.length,
        });

        return { reactions, comments, zaps };
      } catch (error) {
        console.error('Error fetching note stats:', error);
        return { reactions: [], comments: [], zaps: [] };
      }
    },
    enabled: !!event?.id,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });

  return {
    reactions: statsData?.reactions?.length ?? 0,
    comments: statsData?.comments?.length ?? 0,
    zaps: statsData?.zaps?.length ?? 0,
    isLoading,
  };
}

