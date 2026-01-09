# Backfill Cookie Scanning for Existing Widgets

## Problem

Existing customers who configured cookie consent banners before the scanning feature was introduced don't have cookie data. Their widgets show "No cookies scanned yet" messages, which provides a poor user experience.

## Solution

We've implemented a multi-layered approach:

### 1. **Automatic Background Scanning** (Implemented)

When a widget loads and no scan data exists for its domain:
- The widget API automatically triggers a background scan
- Scan runs asynchronously without blocking the widget
- Prevents duplicate scans (checks for pending/in-progress scans)
- Rate-limited to once per 24 hours per domain

**Location:** `app/api/cookies/widget-public/[widgetId]/route.ts`

### 2. **Backfill Script** (Manual Execution)

For bulk scanning of all existing widget domains:

```bash
# Dry run - see what would be scanned
npx tsx scripts/backfill-scan-widget-domains.ts --dry-run

# Scan all domains
npx tsx scripts/backfill-scan-widget-domains.ts

# Limit to first N domains
npx tsx scripts/backfill-scan-widget-domains.ts --limit=50
```

**Features:**
- Checks which domains already have scans
- Skips domains with pending/in-progress scans
- Rate-limited (2 seconds between scans)
- Progress reporting
- Dry-run mode for testing

### 3. **UI Prompt** (Implemented)

In the widget settings page (`/dashboard/cookies/widget`):
- Shows a prominent banner when no cookies are detected
- Provides a direct link to the cookie scanner
- Explains the benefit of scanning

## Usage Guide

### For New Deployments

Run the backfill script once after deploying:

```bash
# Test first
npx tsx scripts/backfill-scan-widget-domains.ts --dry-run

# Execute
npx tsx scripts/backfill-scan-widget-domains.ts
```

### For Ongoing Operations

The automatic background scanning handles new widgets automatically. No manual intervention needed.

### Monitoring

Check scan status:

```sql
-- See scan statistics
SELECT 
  scan_status,
  COUNT(*) as count
FROM cookie_scan_history
GROUP BY scan_status;

-- Find widgets without scans
SELECT 
  wc.widget_id,
  wc.domain,
  wc.created_at
FROM widget_configs wc
LEFT JOIN cookie_scan_history csh 
  ON csh.website_url = wc.domain 
  AND csh.scan_status = 'completed'
WHERE wc.is_active = true
  AND csh.scan_id IS NULL
ORDER BY wc.created_at DESC;
```

## Technical Details

### Domain Matching

The system uses fuzzy domain matching to handle variations:
- `consently.in` matches `www.consently.in`
- `https://consently.in` matches `consently.in`
- Case-insensitive matching
- Handles trailing slashes

### Scan Depth

Background scans use `shallow` depth to:
- Complete faster
- Reduce server load
- Still capture most cookies

Users can run deeper scans manually if needed.

### Rate Limiting

- Background scans: Once per 24 hours per domain
- Backfill script: 2 seconds between scans
- Prevents overwhelming the scanning service

## Troubleshooting

### "Scan already in progress"

Wait for the current scan to complete (usually 1-5 minutes).

### "Recent scan exists"

A scan was completed within the last 24 hours. The system prevents duplicate scans.

### Scan fails

Check:
1. Domain is accessible
2. Domain format is correct (no typos)
3. Server has internet access
4. Scanning service is operational

### Cookies still not showing

1. Check if scan completed successfully:
   ```sql
   SELECT * FROM cookie_scan_history 
   WHERE website_url = 'your-domain.com' 
   ORDER BY created_at DESC LIMIT 1;
   ```

2. Clear widget cache (cache TTL is 60 seconds)

3. Check domain matching in logs

## Migration Checklist

- [ ] Deploy code with background scanning
- [ ] Run backfill script with `--dry-run`
- [ ] Review dry-run results
- [ ] Execute backfill script
- [ ] Monitor scan completion
- [ ] Verify widgets show cookie data
- [ ] Check error logs for failures
- [ ] Re-run backfill for any failures

## Future Improvements

- [ ] Admin dashboard for scan status
- [ ] Webhook notifications when scans complete
- [ ] Automatic re-scanning on schedule
- [ ] Scan queue management UI
- [ ] Bulk scan API endpoint
