import { useQuery } from '@tanstack/react-query';

export interface AppMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  url: string;
}

/**
 * Hook to fetch metadata from an app's website URL
 * Attempts to extract Open Graph tags, meta tags, and favicon
 */
export function useAppMetadata(url: string | undefined) {
  return useQuery<AppMetadata>({
    queryKey: ['app-metadata', url ?? ''],
    queryFn: async ({ signal }) => {
      if (!url) {
        throw new Error('URL is required');
      }

      try {
        // Use a CORS proxy to fetch the page
        // In production, you might want to use your own backend endpoint
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl, { 
          signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) 
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract Open Graph tags
        const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
        const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
        const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');

        // Fallback to regular meta tags
        const title = ogTitle || doc.querySelector('title')?.textContent || '';
        const description = ogDescription || 
          doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';

        // Get favicon
        const favicon = 
          doc.querySelector('link[rel="icon"]')?.getAttribute('href') ||
          doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
          doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') ||
          '/favicon.ico';

        // Resolve relative URLs
        const baseUrl = new URL(url);
        const resolveUrl = (href: string | null | undefined): string | undefined => {
          if (!href) return undefined;
          try {
            return new URL(href, baseUrl).href;
          } catch {
            return href.startsWith('http') ? href : `${baseUrl.origin}${href}`;
          }
        };

        return {
          title: title.trim(),
          description: description.trim(),
          image: resolveUrl(ogImage),
          favicon: resolveUrl(favicon),
          url,
        };
      } catch (error) {
        console.warn(`Failed to fetch metadata for ${url}:`, error);
        // Return minimal metadata on error
        return {
          title: new URL(url).hostname,
          description: '',
          url,
        };
      }
    },
    enabled: !!url,
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    retry: 1,
  });
}

