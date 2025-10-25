# Trading Application

A professional trading application built with Lightweight Charts, featuring advanced charting capabilities and market analysis tools.

## Features

### Live Features

- **Multi-Timeframe Analysis** - View Bitcoin across 8 timeframes simultaneously with swing structure detection

### Coming Soon

- Volume Profile Analysis
- Order Flow Analysis
- Custom Indicators Builder
- Market Scanner
- Strategy Backtesting

## Getting Started

### Prerequisites

Make sure the Lightweight Charts library is built:

```bash
cd ..
npm install
npm run build
```

### Installation

Install dependencies for the trading app:

```bash
cd trading-app
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

This will open the application at `http://localhost:3000`

### Build

Build for production:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```text
trading-app/
├── index.html              # Landing page with feature navigation
├── src/
│   └── features/           # Individual trading features
│       └── multi-timeframe/
│           ├── index.html
│           └── index.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Adding a New Feature

1. Create a new feature directory:

   ```bash
   mkdir -p src/features/your-feature
   ```

2. Add your feature files:
   - `index.html` - Feature HTML
   - `index.ts` - Feature TypeScript code

3. Add the feature to the landing page (`index.html`):

   ```html
   <div class="feature-card" onclick="window.location.href='src/features/your-feature/index.html'">
     <div class="feature-icon">🎯</div>
     <div class="feature-title">Your Feature Name</div>
     <div class="feature-description">
       Description of what your feature does...
     </div>
     <span class="feature-status status-live">● Live</span>
   </div>
   ```

4. Update `vite.config.ts` to include your feature in the build:

   ```typescript
   input: {
     main: resolve(__dirname, 'index.html'),
     yourFeature: resolve(__dirname, 'src/features/your-feature/index.html'),
   }
   ```

## Technologies

- **Lightweight Charts** - High-performance financial charting library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Binance API** - Real-time cryptocurrency data

## License

See the LICENSE file in the parent directory.
