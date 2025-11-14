#!/usr/bin/env tsx

/**
 * Documentation Organization Script
 * 
 * This script organizes all markdown documentation files into a structured
 * directory hierarchy within the docs/ folder.
 * 
 * Usage:
 *   npm run organize-docs
 *   or
 *   tsx scripts/organize-docs.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface DocCategory {
  name: string;
  description: string;
  keywords: string[];
  subfolder: string;
}

const DOC_CATEGORIES: DocCategory[] = [
  {
    name: 'Guides',
    description: 'Implementation guides, configuration guides, and how-to documentation',
    keywords: ['guide', 'implementation', 'configuration', 'how-to', 'instructions'],
    subfolder: 'guides'
  },
  {
    name: 'Fixes',
    description: 'Bug fixes, patches, and diagnostic reports',
    keywords: ['fix', 'patch', 'diagnostic', 'issue', 'bug', 'error'],
    subfolder: 'fixes'
  },
  {
    name: 'Summaries',
    description: 'Implementation summaries, production reports, and status updates',
    keywords: ['summary', 'report', 'status', 'production', 'implementation'],
    subfolder: 'summaries'
  },
  {
    name: 'Setup',
    description: 'Getting started, setup instructions, and onboarding documentation',
    keywords: ['setup', 'start', 'getting', 'onboarding', 'quick'],
    subfolder: 'setup'
  },
  {
    name: 'Features',
    description: 'Feature documentation, enhancements, and new functionality',
    keywords: ['feature', 'enhancement', 'improvement', 'new', 'addition'],
    subfolder: 'features'
  },
  {
    name: 'Architecture',
    description: 'System architecture, design decisions, and technical deep-dives',
    keywords: ['architecture', 'design', 'system', 'technical', 'analysis', 'scalability'],
    subfolder: 'architecture'
  }
];

const ROOT_DOCS_TO_MOVE = [
  'CONSENT_FIXES.md',
  'CONSENT_ID_IMPLEMENTATION_GUIDE.md',
  'CONTACT_PAGE_CONSENT_FIX.md',
  'CROSS_DEVICE_CONSENT_IMPLEMENTATION.md',
  'DISPLAY_RULE_MODAL_REDESIGN.md',
  'DPDPA_PURPOSES_DIAGNOSTIC.md',
  'IMPLEMENTATION_SUMMARY.md',
  'OAUTH_CONFIGURATION_GUIDE.md',
  'ONBOARDING_FLOW_FIX.md',
  'PRODUCTION_FIXES_SUMMARY.md',
  'UI_UX_IMPROVEMENTS_SUMMARY.md',
  'WIDGET_MIGRATION_INSTRUCTIONS.md',
];

const KEEP_IN_ROOT = [
  'README.md',
  'SETUP.md',
  'START_HERE.md',
];

function categorizeDoc(filename: string): string {
  const lowerName = filename.toLowerCase();
  
  for (const category of DOC_CATEGORIES) {
    if (category.keywords.some(keyword => lowerName.includes(keyword))) {
      return category.subfolder;
    }
  }
  
  // Default to summaries if no match
  return 'summaries';
}

function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
  }
}

function moveFile(source: string, dest: string): void {
  if (!fs.existsSync(source)) {
    console.log(`⚠ Skipping (not found): ${source}`);
    return;
  }
  
  if (fs.existsSync(dest)) {
    console.log(`⚠ Skipping (already exists): ${dest}`);
    return;
  }
  
  ensureDirectory(path.dirname(dest));
  fs.renameSync(source, dest);
  console.log(`✓ Moved: ${path.basename(source)} → docs/${path.relative('docs', dest)}`);
}

function organizeRootDocs(): void {
  console.log('\n📁 Organizing root-level documentation...\n');
  
  for (const doc of ROOT_DOCS_TO_MOVE) {
    const sourcePath = path.join(process.cwd(), doc);
    const category = categorizeDoc(doc);
    const destPath = path.join(process.cwd(), 'docs', category, doc);
    
    moveFile(sourcePath, destPath);
  }
}

function organizeDocsFolder(): void {
  console.log('\n📁 Organizing docs/ folder...\n');
  
  const docsDir = path.join(process.cwd(), 'docs');
  const files = fs.readdirSync(docsDir);
  
  for (const file of files) {
    if (file.endsWith('.md') && file !== 'README.md' && file !== 'INDEX.md') {
      const filePath = path.join(docsDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile()) {
        const category = categorizeDoc(file);
        const destPath = path.join(docsDir, category, file);
        
        // Only move if not already in a category folder
        if (!filePath.includes(path.sep + category + path.sep)) {
          moveFile(filePath, destPath);
        }
      }
    }
  }
}

function generateIndex(): void {
  console.log('\n📝 Generating documentation index...\n');
  
  const docsDir = path.join(process.cwd(), 'docs');
  const indexPath = path.join(docsDir, 'INDEX.md');
  
  let indexContent = `# 📚 Consently Documentation Index

> **Last Updated:** ${new Date().toLocaleDateString()}
> 
> This index is automatically generated. Run \`npm run organize-docs\` to regenerate.

## 📖 Quick Navigation

- **[Getting Started](./setup/)** - Setup guides and getting started documentation
- **[Implementation Guides](./guides/)** - Step-by-step implementation guides
- **[Feature Documentation](./features/)** - Feature documentation and enhancements
- **[Bug Fixes & Patches](./fixes/)** - Bug fixes, diagnostics, and issue resolutions
- **[Implementation Summaries](./summaries/)** - Project summaries and status reports
- **[Architecture & Design](./architecture/)** - System architecture and technical deep-dives

---

## 📁 Documentation Structure

`;

  // Generate index for each category
  for (const category of DOC_CATEGORIES) {
    const categoryDir = path.join(docsDir, category.subfolder);
    
    if (!fs.existsSync(categoryDir)) {
      continue;
    }
    
    const files = fs.readdirSync(categoryDir)
      .filter(f => f.endsWith('.md'))
      .sort();
    
    if (files.length === 0) {
      continue;
    }
    
    indexContent += `### ${category.name}\n\n`;
    indexContent += `*${category.description}*\n\n`;
    
    for (const file of files) {
      const filePath = path.join(categoryDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '');
      
      indexContent += `- **[${title}](./${category.subfolder}/${file})**\n`;
    }
    
    indexContent += '\n';
  }
  
  // Add root-level docs
  indexContent += `### Root Documentation\n\n`;
  indexContent += `*Essential documentation kept in project root*\n\n`;
  
  for (const doc of KEEP_IN_ROOT) {
    const docPath = path.join(process.cwd(), doc);
    if (fs.existsSync(docPath)) {
      const content = fs.readFileSync(docPath, 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : doc.replace('.md', '');
      
      indexContent += `- **[${title}](../${doc})**\n`;
    }
  }
  
  indexContent += `\n---\n\n`;
  indexContent += `## 🔍 Search Tips\n\n`;
  indexContent += `- Use \`Cmd+F\` (Mac) or \`Ctrl+F\` (Windows) to search this index\n`;
  indexContent += `- Check the [Getting Started](./setup/) section for onboarding\n`;
  indexContent += `- Check [Implementation Guides](./guides/) for step-by-step instructions\n`;
  indexContent += `- Check [Bug Fixes](./fixes/) if you're troubleshooting issues\n\n`;
  indexContent += `## 📝 Contributing\n\n`;
  indexContent += `When adding new documentation:\n\n`;
  indexContent += `1. Place guides in \`docs/guides/\`\n`;
  indexContent += `2. Place fixes in \`docs/fixes/\`\n`;
  indexContent += `3. Place summaries in \`docs/summaries/\`\n`;
  indexContent += `4. Run \`npm run organize-docs\` to regenerate the index\n`;
  
  fs.writeFileSync(indexPath, indexContent);
  console.log(`✓ Generated index: docs/INDEX.md`);
}

function updateDocsReadme(): void {
  console.log('\n📝 Updating docs/README.md...\n');
  
  const readmePath = path.join(process.cwd(), 'docs', 'README.md');
  const indexPath = path.join(process.cwd(), 'docs', 'INDEX.md');
  
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const readmeContent = `# Consently Documentation

> 📚 **For the complete documentation index, see [INDEX.md](./INDEX.md)**

${indexContent.split('---')[1] || ''}

## Quick Links

- [Complete Documentation Index](./INDEX.md)
- [Getting Started](../SETUP.md)
- [Start Here](../START_HERE.md)
- [Main README](../README.md)
`;
    
    fs.writeFileSync(readmePath, readmeContent);
    console.log(`✓ Updated docs/README.md`);
  }
}

function main() {
  console.log('🚀 Starting documentation organization...\n');
  
  // Create category directories
  const docsDir = path.join(process.cwd(), 'docs');
  for (const category of DOC_CATEGORIES) {
    ensureDirectory(path.join(docsDir, category.subfolder));
  }
  
  // Organize root docs
  organizeRootDocs();
  
  // Organize docs folder
  organizeDocsFolder();
  
  // Generate index
  generateIndex();
  
  // Update README
  updateDocsReadme();
  
  console.log('\n✅ Documentation organization complete!\n');
  console.log('📚 View the index at: docs/INDEX.md');
  console.log('📖 View the README at: docs/README.md\n');
}

if (require.main === module) {
  main();
}

export { main };

