# GitHub Actions CI/CD Setup

## Current Status

✅ **CI workflow created**: `.github/workflows/ci.yml`

This workflow runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

## What It Does

### 1. Lint and Type Check
- Runs ESLint on all code
- Runs TypeScript type checking
- Ensures code quality

### 2. Build Application
- Builds Next.js for production
- Verifies build succeeds
- Uploads build artifacts

### 3. Security Scan
- Runs `npm audit` for vulnerabilities
- Scans for secrets in code
- Checks for security issues

## Required GitHub Secrets

Add these in: **Settings > Secrets and variables > Actions**

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## How to Enable

1. **Add secrets**:
   - Go to GitHub repo settings
   - Add the three secrets above
   
2. **Merge to main**:
   - Push `.github/workflows/ci.yml` to main
   - Workflow will run automatically

3. **View results**:
   - Go to **Actions** tab in GitHub
   - See workflow runs and results

## Workflow Status Badge

Add to README.md:

```markdown
[![CI](https://github.com/YOUR_ORG/consently-dev/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/consently-dev/actions/workflows/ci.yml)
```

## Local Testing

Test what CI will do:

```bash
# What CI runs:
npm ci          # Clean install
npm run lint    # Lint check
npm run type-check  # Type check  
npm run build   # Build app
npm audit       # Security audit
```

## Future Enhancements

Consider adding:
- Automated tests (`npm test`)
- E2E tests with Playwright
- Performance testing
- Lighthouse CI
- Automated deployment to staging
- Release notes generation

## Troubleshooting

### CI Failing on Type Check

Fix locally first:
```bash
npm run type-check
# Fix any errors shown
```

### CI Failing on Build

Missing environment variables:
- Ensure all secrets are added in GitHub
- Check secret names match exactly

### Security Scan Failing

```bash
# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

---

**Status**: Ready to use
**Last Updated**: January 9, 2026
