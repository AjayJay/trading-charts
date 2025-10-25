# Troubleshooting

## Git Push Errors

### 1. ESLint Error for trading-app Files ✅ FIXED

**Error:**

```text
Parsing error: ESLint was configured to run on trading-app files using parserOptions.project
```

**Solution:**

This has been fixed by:

- Adding `trading-app/**` to `.eslintrc.cjs` excludedFiles
- Adding `/trading-app` to `.eslintignore`
- Creating a dedicated `.eslintrc.cjs` in the trading-app folder

### 2. Website TypeScript Error

**Error:**

```text
website/tsconfig.json:2:13 - error TS6053: File '@tsconfig/docusaurus/tsconfig.json' not found.
```

**Cause:**

Missing website dependencies (likely `@tsconfig/docusaurus` package).

**Solution:**

You need to run this in your terminal (outside of Cursor):

```bash
# Fix npm cache permissions (if needed)
sudo chown -R $(whoami) ~/.npm

# Install website dependencies
cd website
npm install
cd ..
```

Alternatively, if you don't need the website:

```bash
# Skip the website tsc check by modifying package.json scripts
# or just commit with --no-verify (not recommended for regular use)
git commit --no-verify -m "your message"
```

### 3. Git Authentication Error

**Error:**

```text
fatal: could not read Username for 'https://github.com': Device not configured
```

**Solution:**
This happens because git needs authentication. Push from your regular terminal:

```bash
cd /Users/ajaychobey/trading/code/lightweight-charts
git push
```

Or switch to SSH:

```bash
git remote set-url origin git@github.com:AjayJay/trading-charts.git
git push
```

## Quick Fix Summary

Run these commands in your terminal:

```bash
# 1. Fix npm cache (if needed)
sudo chown -R $(whoami) ~/.npm

# 2. Install website dependencies
cd website && npm install && cd ..

# 3. Try the git push again
git push
```

## Alternative: Skip Pre-commit Hooks (Not Recommended)

If you just want to push quickly without fixing the website:

```bash
git push --no-verify
```

**Note:** This skips the pre-commit hooks. Only use this temporarily!
