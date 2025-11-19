import { type NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch recent kind 1 (text note) events from a specific author
 */
export function useAuthorNotes(pubkey: string | undefined, limit: number = 5) {
  const { nostr } = useNostr();

  return useQuery<NostrEvent[]>({
    queryKey: ['author-notes', pubkey ?? '', limit],
    queryFn: async ({ signal }) => {
      if (!pubkey) {
        return [];
      }

      const events = await nostr.query(
        [{ kinds: [1], authors: [pubkey], limit }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) },
      );

      // Sort by created_at descending (newest first)
      return events.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!pubkey,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    retry: 1,
  });
}

