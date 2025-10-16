/**
 * Sitemap Parser Utility
 * Discovers and parses sitemap.xml files for comprehensive site crawling
 */

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  priority?: number;
  changefreq?: string;
}

export interface RobotsInfo {
  sitemaps: string[];
  disallowedPaths: string[];
}

/**
 * Parse robots.txt to find sitemap URLs and disallowed paths
 */
export async function parseRobotsTxt(baseUrl: string): Promise<RobotsInfo> {
  const robotsUrl = new URL('/robots.txt', baseUrl).toString();
  const sitemaps: string[] = [];
  const disallowedPaths: string[] = [];

  try {
    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': 'Consently-Scanner/1.0 (Cookie Compliance Scanner)',
      },
    });

    if (!response.ok) {
      console.log('No robots.txt found');
      return { sitemaps, disallowedPaths };
    }

    const robotsText = await response.text();
    const lines = robotsText.split('\n');

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      
      // Extract sitemap URLs
      if (trimmed.startsWith('sitemap:')) {
        const sitemapUrl = line.substring(line.indexOf(':') + 1).trim();
        if (sitemapUrl) {
          sitemaps.push(sitemapUrl);
        }
      }
      
      // Extract disallowed paths
      if (trimmed.startsWith('disallow:')) {
        const path = line.substring(line.indexOf(':') + 1).trim();
        if (path && path !== '/') {
          disallowedPaths.push(path);
        }
      }
    }

    console.log(`Found ${sitemaps.length} sitemap(s) in robots.txt`);
    return { sitemaps, disallowedPaths };
    
  } catch (error) {
    console.warn('Failed to parse robots.txt:', error);
    return { sitemaps, disallowedPaths };
  }
}

/**
 * Parse XML sitemap and extract URLs
 */
export async function parseSitemapXML(sitemapUrl: string): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];

  try {
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'Consently-Scanner/1.0 (Cookie Compliance Scanner)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status}`);
    }

    const xmlText = await response.text();
    
    // Check if this is a sitemap index (contains <sitemapindex>)
    if (xmlText.includes('<sitemapindex')) {
      return await parseSitemapIndex(xmlText, sitemapUrl);
    }

    // Parse regular sitemap with <urlset>
    return parseSitemapUrlset(xmlText);
    
  } catch (error) {
    console.error(`Failed to parse sitemap ${sitemapUrl}:`, error);
    return entries;
  }
}

/**
 * Parse sitemap index (which references multiple sitemaps)
 */
async function parseSitemapIndex(xmlText: string, baseUrl: string): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];
  
  // Extract <loc> tags within <sitemap> tags
  const sitemapRegex = /<sitemap>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/sitemap>/g;
  const matches = xmlText.matchAll(sitemapRegex);

  const sitemapUrls: string[] = [];
  for (const match of matches) {
    const url = match[1].trim();
    if (url) {
      sitemapUrls.push(url);
    }
  }

  console.log(`Sitemap index contains ${sitemapUrls.length} sub-sitemaps`);

  // Recursively parse each sitemap (limit to prevent abuse)
  const maxSitemaps = 10;
  for (const sitemapUrl of sitemapUrls.slice(0, maxSitemaps)) {
    try {
      const subEntries = await parseSitemapXML(sitemapUrl);
      entries.push(...subEntries);
    } catch (error) {
      console.warn(`Failed to parse sub-sitemap ${sitemapUrl}:`, error);
    }
  }

  return entries;
}

/**
 * Parse regular sitemap with urlset
 */
function parseSitemapUrlset(xmlText: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  // Extract <url> blocks
  const urlRegex = /<url>([\s\S]*?)<\/url>/g;
  const urlMatches = xmlText.matchAll(urlRegex);

  for (const urlMatch of urlMatches) {
    const urlBlock = urlMatch[1];
    
    // Extract fields
    const locMatch = urlBlock.match(/<loc>(.*?)<\/loc>/);
    const lastmodMatch = urlBlock.match(/<lastmod>(.*?)<\/lastmod>/);
    const priorityMatch = urlBlock.match(/<priority>(.*?)<\/priority>/);
    const changefreqMatch = urlBlock.match(/<changefreq>(.*?)<\/changefreq>/);

    if (locMatch && locMatch[1]) {
      const entry: SitemapEntry = {
        url: locMatch[1].trim(),
      };

      if (lastmodMatch && lastmodMatch[1]) {
        entry.lastmod = lastmodMatch[1].trim();
      }

      if (priorityMatch && priorityMatch[1]) {
        entry.priority = parseFloat(priorityMatch[1].trim());
      }

      if (changefreqMatch && changefreqMatch[1]) {
        entry.changefreq = changefreqMatch[1].trim();
      }

      entries.push(entry);
    }
  }

  return entries;
}

/**
 * Discover all URLs for a website using multiple strategies
 */
export async function discoverSiteUrls(
  baseUrl: string,
  maxUrls: number = 100
): Promise<SitemapEntry[]> {
  const allUrls = new Map<string, SitemapEntry>();
  const parsedUrl = new URL(baseUrl);
  const baseDomain = parsedUrl.hostname;

  console.log(`Starting URL discovery for ${baseUrl}`);

  // Strategy 1: Parse robots.txt
  const robotsInfo = await parseRobotsTxt(baseUrl);

  // Strategy 2: Try common sitemap locations
  const commonSitemapPaths = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap-index.xml',
    '/sitemap1.xml',
    '/post-sitemap.xml',
    '/page-sitemap.xml',
  ];

  // Add sitemaps from robots.txt
  const sitemapUrls = [...robotsInfo.sitemaps];

  // Add common sitemap URLs (if not already in robots.txt)
  for (const path of commonSitemapPaths) {
    const sitemapUrl = new URL(path, baseUrl).toString();
    if (!sitemapUrls.includes(sitemapUrl)) {
      sitemapUrls.push(sitemapUrl);
    }
  }

  // Parse all sitemaps
  for (const sitemapUrl of sitemapUrls) {
    try {
      const entries = await parseSitemapXML(sitemapUrl);
      
      // Filter to same domain only
      for (const entry of entries) {
        try {
          const entryUrl = new URL(entry.url);
          if (entryUrl.hostname === baseDomain) {
            allUrls.set(entry.url, entry);
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    } catch (error) {
      // Sitemap doesn't exist or failed to parse, continue
      console.log(`Skipping sitemap ${sitemapUrl}`);
    }
  }

  // Sort by priority (if available) and limit
  const sortedUrls = Array.from(allUrls.values())
    .sort((a, b) => {
      // Sort by priority (higher first), then by lastmod (newer first)
      if (a.priority !== undefined && b.priority !== undefined) {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
      }
      
      if (a.lastmod && b.lastmod) {
        return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime();
      }
      
      return 0;
    });

  const limitedUrls = sortedUrls.slice(0, maxUrls);

  console.log(`Discovered ${allUrls.size} total URLs, returning top ${limitedUrls.length}`);

  return limitedUrls;
}

/**
 * Filter URLs based on patterns and robots.txt rules
 */
export function filterUrls(
  urls: SitemapEntry[],
  disallowedPaths: string[] = [],
  excludePatterns: RegExp[] = []
): SitemapEntry[] {
  return urls.filter(entry => {
    const url = entry.url;
    
    // Check against disallowed paths from robots.txt
    for (const disallowed of disallowedPaths) {
      if (url.includes(disallowed)) {
        return false;
      }
    }
    
    // Check against exclude patterns
    for (const pattern of excludePatterns) {
      if (pattern.test(url)) {
        return false;
      }
    }
    
    // Exclude common non-HTML resources
    const excludedExtensions = /\.(pdf|jpg|jpeg|png|gif|svg|ico|css|js|xml|json|zip|tar|gz|mp4|mp3|woff|woff2|ttf|eot)$/i;
    if (excludedExtensions.test(url)) {
      return false;
    }
    
    // Exclude URL fragments and javascript: links
    if (url.includes('#') || url.startsWith('javascript:') || url.startsWith('mailto:')) {
      return false;
    }
    
    return true;
  });
}

/**
 * Normalize URL for deduplication
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Remove trailing slash
    let pathname = parsed.pathname;
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }
    
    // Sort query parameters
    const params = new URLSearchParams(parsed.search);
    const sortedParams = new URLSearchParams(
      Array.from(params.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    );
    
    // Reconstruct URL without fragment
    return `${parsed.protocol}//${parsed.hostname}${pathname}${sortedParams.toString() ? '?' + sortedParams.toString() : ''}`;
  } catch (e) {
    return url;
  }
}
