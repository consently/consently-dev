/**
 * Display Rules Diagnostic Script
 * 
 * This script helps diagnose issues with display rules where multiple purposes
 * are showing on a single page when only one should appear.
 * 
 * Usage: npx tsx scripts/diagnose-display-rules.ts <widgetId>
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseDisplayRules(widgetId: string) {
  console.log('\n🔍 Display Rules Diagnostic Tool');
  console.log('='.repeat(60));
  console.log(`Widget ID: ${widgetId}\n`);

  // 1. Fetch widget configuration
  const { data: widget, error: widgetError } = await supabase
    .from('dpdpa_widget_configs')
    .select('*')
    .eq('widget_id', widgetId)
    .single();

  if (widgetError || !widget) {
    console.error('❌ Error fetching widget:', widgetError);
    return;
  }

  console.log(`✅ Widget found: ${widget.name}`);
  console.log(`   Domain: ${widget.domain}`);
  console.log(`   Selected Activities: ${widget.selected_activities?.length || 0}`);
  console.log(`   Display Rules: ${widget.display_rules?.length || 0}\n`);

  // 2. Check display rules
  if (!widget.display_rules || widget.display_rules.length === 0) {
    console.warn('⚠️  No display rules configured');
    return;
  }

  console.log('📋 Display Rules Configuration:');
  console.log('='.repeat(60));

  for (const rule of widget.display_rules) {
    console.log(`\n🔹 Rule: ${rule.rule_name}`);
    console.log(`   ID: ${rule.id}`);
    console.log(`   URL Pattern: ${rule.url_pattern} (${rule.url_match_type})`);
    console.log(`   Active: ${rule.is_active ? '✅ Yes' : '❌ No'}`);
    console.log(`   Priority: ${rule.priority}`);
    console.log(`   Trigger: ${rule.trigger_type}`);
    
    // Check activities configuration
    if (!rule.activities || rule.activities.length === 0) {
      console.warn('   ⚠️  WARNING: No activities specified in rule!');
      console.warn('       This will show ALL activities from widget config');
    } else {
      console.log(`   Activities: ${rule.activities.length} specified`);
      
      // Fetch activity details
      const { data: activities } = await supabase
        .from('processing_activities')
        .select(`
          id,
          activity_name,
          activity_purposes(
            id,
            purpose_id,
            legal_basis,
            purposes(
              id,
              purpose_name,
              name
            )
          )
        `)
        .in('id', rule.activities);

      if (activities) {
        for (const activity of activities) {
          console.log(`\n   📦 Activity: ${activity.activity_name}`);
          console.log(`      ID: ${activity.id}`);
          console.log(`      Purposes: ${activity.activity_purposes?.length || 0}`);
          
          // Check if activity_purposes filtering is applied
          if (rule.activity_purposes && rule.activity_purposes[activity.id]) {
            const filteredPurposes = rule.activity_purposes[activity.id];
            console.log(`      🔽 FILTERED to ${filteredPurposes.length} purpose(s):`);
            
            for (const purposeId of filteredPurposes) {
              const purpose = activity.activity_purposes?.find(
                (ap: any) => ap.purpose_id === purposeId
              );
              if (purpose) {
                console.log(`         ✓ ${purpose.purposes?.name || 'Unknown'} (${purposeId})`);
              } else {
                console.warn(`         ⚠️  Purpose ${purposeId} not found in activity!`);
              }
            }
          } else {
            console.log(`      ⚠️  No purpose filtering - showing ALL purposes:`);
            if (activity.activity_purposes) {
              for (const ap of activity.activity_purposes) {
                console.log(`         • ${ap.purposes?.name || 'Unknown'}`);
              }
            }
          }
        }
      }
    }
  }

  // 3. Check for overlapping rules
  console.log('\n\n🔍 Checking for Overlapping Rules:');
  console.log('='.repeat(60));

  const activeRules = widget.display_rules.filter((r: any) => r.is_active);
  const urlPatterns = new Map<string, any[]>();

  for (const rule of activeRules) {
    const pattern = rule.url_pattern;
    if (!urlPatterns.has(pattern)) {
      urlPatterns.set(pattern, []);
    }
    urlPatterns.get(pattern)!.push(rule);
  }

  let hasOverlap = false;
  for (const [pattern, rules] of urlPatterns.entries()) {
    if (rules.length > 1) {
      hasOverlap = true;
      console.warn(`\n⚠️  Multiple rules match URL pattern: ${pattern}`);
      for (const rule of rules) {
        console.log(`   • ${rule.rule_name} (Priority: ${rule.priority})`);
      }
      console.log(`   → Only highest priority rule will be applied`);
    }
  }

  if (!hasOverlap) {
    console.log('✅ No overlapping URL patterns found');
  }

  // 4. Common Issues
  console.log('\n\n💡 Common Issues and Solutions:');
  console.log('='.repeat(60));

  let foundIssues = false;

  // Issue 1: Rules without activities
  const rulesWithoutActivities = activeRules.filter(
    (r: any) => !r.activities || r.activities.length === 0
  );
  if (rulesWithoutActivities.length > 0) {
    foundIssues = true;
    console.log('\n❌ ISSUE: Rules without specified activities');
    for (const rule of rulesWithoutActivities) {
      console.log(`   • ${rule.rule_name} - will show ALL activities`);
    }
    console.log('   ✅ FIX: Add "activities" array to each rule with only the activities to show');
  }

  // Issue 2: Rules without purpose filtering
  const rulesWithoutPurposeFilter = activeRules.filter(
    (r: any) => r.activities && r.activities.length > 0 && !r.activity_purposes
  );
  if (rulesWithoutPurposeFilter.length > 0) {
    foundIssues = true;
    console.log('\n⚠️  WARNING: Rules without purpose filtering');
    for (const rule of rulesWithoutPurposeFilter) {
      console.log(`   • ${rule.rule_name} - will show ALL purposes from selected activities`);
    }
    console.log('   💡 TIP: Add "activity_purposes" object to filter which purposes show per activity');
    console.log('   Example: { "activity_id_1": ["purpose_id_1"], "activity_id_2": ["purpose_id_2"] }');
  }

  // Issue 3: Multiple activities in single rule
  const rulesWithMultipleActivities = activeRules.filter(
    (r: any) => r.activities && r.activities.length > 1
  );
  if (rulesWithMultipleActivities.length > 0) {
    console.log('\n⚠️  INFO: Rules with multiple activities');
    for (const rule of rulesWithMultipleActivities) {
      console.log(`   • ${rule.rule_name} - shows ${rule.activities.length} activities`);
    }
    console.log('   💡 TIP: For page-specific consent, usually one activity per page is clearer');
    console.log('         Consider splitting into separate rules or using purpose filtering');
  }

  if (!foundIssues && rulesWithoutPurposeFilter.length === 0) {
    console.log('\n✅ No critical issues found!');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnostic complete\n');
}

// Main execution
const widgetId = process.argv[2];

if (!widgetId) {
  console.error('Usage: npx tsx scripts/diagnose-display-rules.ts <widgetId>');
  process.exit(1);
}

diagnoseDisplayRules(widgetId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

