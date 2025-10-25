# Migration from Debug Folder

## Why the Move?

The `debug/` folder is specifically designed for testing and debugging the Lightweight Charts library itself. Your trading application is a **production application**, not a debug tool, so it deserves its own dedicated space!

## What Changed?

### Old Structure (in debug folder)

```text
debug/
├── default/
│   ├── index.html          # Landing page
│   └── index.ts
└── playground/
    └── btc-multi-timeframe.d/
        ├── index.html      # Multi-timeframe feature
        └── index.ts
```

### New Structure (dedicated app)

```text
trading-app/                 # Your own dedicated folder!
├── index.html              # Landing page
├── package.json            # Independent dependencies
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Build config
├── setup.sh                # Quick setup script
├── README.md               # Documentation
└── src/
    └── features/
        └── multi-timeframe/
            ├── index.html  # Multi-timeframe feature
            └── index.ts
```

## Benefits of the New Structure

1. **🎯 Clear Purpose** - Separate from library debugging/testing
2. **📦 Independent** - Your app has its own package.json and dependencies
3. **🔧 Proper Tooling** - Dedicated build system with Vite
4. **📁 Scalable** - Easy to add new features in `src/features/`
5. **🚀 Production Ready** - Can be deployed as a standalone application
6. **📝 Better Documentation** - Dedicated README and setup guide

## Files You Can Delete (Optional)

Since your trading app has been moved, you can optionally clean up the debug folder:

```bash
# Only if you don't need these anymore
rm -rf debug/default/index.html  # (kept the original simple example in index.ts)
rm -rf debug/playground/btc-multi-timeframe.d/
```

**Note:** The debug folder still serves its original purpose for testing the library, so keep the folder structure itself.

## Quick Start

### Option 1: Using the Setup Script (Recommended)

```bash
cd trading-app
./setup.sh
```

### Option 2: Manual Setup

```bash
# Build the parent library first
cd /path/to/lightweight-charts
npm install
npm run build

# Then setup the trading app
cd trading-app
npm install
npm run dev
```

## Accessing Your App

1. **Landing Page**: Open `http://localhost:3000` (or `trading-app/index.html` directly)
2. **Multi-Timeframe**: Click on the "Multi-Timeframe Analysis" card
3. **Back Button**: Use the back button to return to the landing page

## Adding More Features

When you want to add a new feature:

1. Create the feature directory:

   ```bash
   mkdir -p src/features/your-new-feature
   ```

2. Add your files:

   ```text
   src/features/your-new-feature/
   ├── index.html
   └── index.ts
   ```

3. Add to the landing page and vite config (see README.md)

## Notes

- The trading app still uses the Lightweight Charts library from the parent folder
- Any changes to the library require rebuilding (`npm run build` in parent)
- Your trading app code is now properly organized and ready for version control
- The app can be deployed independently once built

## Need Help?

Check the `README.md` in the trading-app folder for detailed documentation!
