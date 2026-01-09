/**
 * Backfill Script: Scan all existing widget domains
 * 
 * This script scans all domains that have active widgets but no cookie scan data.
 * Useful for existing customers who configured widgets before the scanning feature.
 * 
 * Usage:
 *   npx tsx scripts/backfill-scan-widget-domains.ts [--dry-run] [--limit=N]
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WidgetDomain {
  widget_id: string;
  domain: string;
  user_id: string;
  created_at: string;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

  console.log('🔍 Backfill Script: Scanning Widget Domains');
  console.log('==========================================\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no scans will be triggered)' : 'LIVE'}`);
  console.log(`Limit: ${limit || 'No limit'}\n`);

  // Get all active widget configs
  console.log('📊 Fetching active widget configurations...');
  let query = supabase
    .from('widget_configs')
    .select('widget_id, domain, user_id, created_at')
    .eq('is_active', true)
    .not('domain', 'is', null)
    .order('created_at', { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: widgets, error: widgetsError } = await query;

  if (widgetsError) {
    console.error('❌ Error fetching widgets:', widgetsError);
    process.exit(1);
  }

  if (!widgets || widgets.length === 0) {
    console.log('ℹ️  No active widgets found');
    process.exit(0);
  }

  console.log(`✅ Found ${widgets.length} active widgets\n`);

  // Normalize domain function
  const normalizeDomain = (domain: string) => {
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  };

  // Check which domains need scanning
  const domainsToScan: WidgetDomain[] = [];
  const domainsWithScans: string[] = [];
  const domainsInProgress: string[] = [];

  console.log('🔎 Checking scan status for each domain...\n');

  for (const widget of widgets) {
    const normalizedDomain = normalizeDomain(widget.domain);
    
    // Check if scan exists
    const { data: scans } = await supabase
      .from('cookie_scan_history')
      .select('scan_id, scan_status, website_url')
      .eq('scan_status', 'completed')
      .order('completed_at', { ascending: false });

    const matchingScan = scans?.find((scan: any) => {
      const scanDomain = normalizeDomain(scan.website_url);
      return scanDomain === normalizedDomain || 
             scanDomain.includes(normalizedDomain) || 
             normalizedDomain.includes(scanDomain);
    });

    if (matchingScan) {
      domainsWithScans.push(widget.domain);
      console.log(`✓ ${widget.domain} - Already scanned`);
    } else {
      // Check if scan is in progress
      const { data: pendingScans } = await supabase
        .from('cookie_scan_history')
        .select('scan_id')
        .eq('website_url', widget.domain)
        .in('scan_status', ['pending', 'in_progress'])
        .limit(1);

      if (pendingScans && pendingScans.length > 0) {
        domainsInProgress.push(widget.domain);
        console.log(`⏳ ${widget.domain} - Scan in progress`);
      } else {
        domainsToScan.push(widget);
        console.log(`🔴 ${widget.domain} - Needs scanning`);
      }
    }
  }

  console.log('\n📈 Summary:');
  console.log(`   Already scanned: ${domainsWithScans.length}`);
  console.log(`   In progress: ${domainsInProgress.length}`);
  console.log(`   Need scanning: ${domainsToScan.length}\n`);

  if (domainsToScan.length === 0) {
    console.log('✅ All domains have been scanned!');
    process.exit(0);
  }

  if (dryRun) {
    console.log('🏃 DRY RUN - Would scan the following domains:');
    domainsToScan.forEach(w => console.log(`   - ${w.domain}`));
    console.log('\nRun without --dry-run to execute scans');
    process.exit(0);
  }

  // Trigger scans
  console.log('🚀 Triggering scans...\n');
  
  const scanUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/cookies/scan`
    : 'http://localhost:3000/api/cookies/scan';

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < domainsToScan.length; i++) {
    const widget = domainsToScan[i];
    const progress = `[${i + 1}/${domainsToScan.length}]`;
    
    try {
      console.log(`${progress} Scanning ${widget.domain}...`);
      
      const response = await fetch(scanUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Request': 'true'
        },
        body: JSON.stringify({
          url: widget.domain.startsWith('http') ? widget.domain : `https://${widget.domain}`,
          scanDepth: 'shallow',
          userId: widget.user_id
        })
      });

      if (response.ok) {
        successCount++;
        console.log(`${progress} ✅ ${widget.domain} - Scan triggered`);
      } else {
        failCount++;
        const error = await response.text();
        console.log(`${progress} ❌ ${widget.domain} - Failed: ${error}`);
      }

      // Rate limiting - wait 2 seconds between scans
      if (i < domainsToScan.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      failCount++;
      console.log(`${progress} ❌ ${widget.domain} - Error: ${error}`);
    }
  }

  console.log('\n📊 Final Results:');
  console.log(`   ✅ Successfully triggered: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📈 Total processed: ${domainsToScan.length}\n`);

  console.log('✨ Backfill complete!');
  console.log('ℹ️  Note: Scans are running in the background and may take a few minutes to complete.');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
