# Quick Start Guide - Multi-Timeframe Charts

## 🎉 What's New

Your multi-timeframe chart application now has powerful new features:

### ✨ Key Features

1. **📏 Resizable Charts**
   - Hover over any chart
   - Drag the resize handle (bottom center) up or down
   - Set custom heights for each chart

2. **➕ Add Charts**
   - Click "Add Chart" button in the header
   - Choose from 14 different timeframes
   - Instantly add new charts to your dashboard

3. **🗑️ Delete Charts**
   - Click the X button in any chart header
   - Remove charts you don't need

4. **⏱️ Change Timeframes**
   - Click the timeframe dropdown in any chart
   - Switch between timeframes without adding a new chart

5. **💾 Auto-Save Layout**
   - Your configuration is automatically saved
   - Refresh the page and your layout persists
   - Charts, sizes, and timeframes are all saved

## 🚀 How to Use

### Starting the App

```bash
cd trading-app
npm install
npm run dev
```text
Then navigate to: `http://localhost:3000/src/features/multi-timeframe/`

### Basic Operations

#### Add a New Chart

```text
1. Click "Add Chart" button (top right)
2. Select timeframe (e.g., "2 Hours")
3. Click "Add Chart" in modal
4. New chart appears instantly
```text
#### Resize a Chart

```text
1. Hover over any chart
2. Resize handle appears at bottom
3. Click and drag up/down
4. Release to save size
```text
#### Delete a Chart

```text
1. Find the X button in chart header (top right)
2. Click X
3. Chart is removed
4. Layout updates automatically
```text
#### Change Timeframe

```text
1. Click timeframe dropdown in chart header
2. Select new timeframe (e.g., "1 Hour" → "4 Hours")
3. Chart updates with new data
```text
#### Adjust Swing Settings

```text
1. Toggle "Swing Structure" button (on/off)
2. Change "Lookback Window" (3-10 candles)
3. Change "Analyze Last" (50-500 candles)
4. All charts update instantly
```text
## 🏗️ Architecture Overview

### Modular Design

```text
┌─────────────────────────────────────────┐
│           index.ts (Main App)           │
│  - Event handlers                       │
│  - Global state                         │
│  - UI coordination                      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│        ChartManager (Orchestrator)      │
│  - Add/remove charts                    │
│  - State persistence                    │
│  - Settings propagation                 │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      TimeframeChart (Individual)        │
│  - Chart rendering                      │
│  - Data loading                         │
│  - Resize handling                      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│           Utils (Helpers)               │
│  - Data fetching (Binance API)          │
│  - Swing analysis                       │
│  - Storage (localStorage)               │
└─────────────────────────────────────────┘
```text
### File Structure

```text
multi-timeframe/
├── types.ts                    # Type definitions
├── constants.ts                # Configuration
├── utils/
│   ├── dataFetcher.ts         # API calls
│   ├── swingAnalysis.ts       # Algorithms
│   └── storage.ts             # Persistence
├── components/
│   ├── TimeframeChart.ts      # Chart class
│   └── ChartManager.ts        # Manager class
├── index.html                  # UI
├── index.ts                    # Entry point
├── README.md                   # Full documentation
└── QUICKSTART.md              # This file
```text
## 🎨 Customization

### Change Default Timeframes

Edit `constants.ts`:

```typescript
export const DEFAULT_TIMEFRAMES = [
  "1m", "5m", "15m", "30m",  // Your preferred defaults
  "1h", "4h", "1d", "1w"
];
```text
### Adjust Grid Layout

Edit CSS in `index.html`:

```css
.charts-grid {
  grid-template-columns: repeat(4, 1fr); /* Change 4 to your preferred columns */
  gap: 10px; /* Adjust spacing */
}
```text
### Change Colors

Edit `constants.ts`:

```typescript
export const DEFAULT_CHART_OPTIONS = {
  layout: {
    background: { color: "#YOUR_BG_COLOR" },
    textColor: "#YOUR_TEXT_COLOR",
  },
  // ... more options
};
```text
## 🔧 Development Tips

### Debugging

The ChartManager is exposed globally:

```javascript
// In browser console
window.chartManager.getCharts() // View all charts
window.chartManager.reloadAll()  // Force reload all
```text
### Reset Layout

Clear saved state:

```javascript
// In browser console
localStorage.removeItem('multi-timeframe-grid-state')
location.reload()
```text
### Performance

For many charts (10+):

- Reduce "Analyze Last" to 100 candles
- Disable swing structure
- Use longer timeframes (4h, 1d, 1w)

## 📝 Code Reusability

### Using Components in Other Projects

#### Import ChartManager

```typescript
import { ChartManager } from './components/ChartManager';

const manager = new ChartManager('your-container-id');
await manager.initialize();
```text
#### Import TimeframeChart

```typescript
import { TimeframeChart } from './components/TimeframeChart';

const chart = new TimeframeChart(
  'container-id',
  { id: '1h', interval: '1h', limit: 500, label: '1 Hour' }
);
await chart.loadData();
```text
#### Import Utilities

```typescript
import { fetchBTCData } from './utils/dataFetcher';
import { detectSwingPoints } from './utils/swingAnalysis';
import { saveGridState, loadGridState } from './utils/storage';
```text
### Creating Custom Charts

```typescript
import { TimeframeChart } from './components/TimeframeChart';
import { AVAILABLE_TIMEFRAMES } from './constants';

// Create custom chart setup
const customChart = new TimeframeChart(
  'my-chart',
  AVAILABLE_TIMEFRAMES[0],
  800,  // width
  600   // height
);

// Customize settings
customChart.updateSettings({
  swingStructureEnabled: false,
  comparisonPeriod: 7,
  lookbackPeriod: 300
});

// Load data
await customChart.loadData();
```text
## 🐛 Common Issues

### Charts Not Displaying

- Check browser console for errors
- Verify container IDs are unique
- Ensure lightweight-charts is installed

### Layout Not Saving

- Check localStorage is enabled
- Clear cache and try again
- Verify storage quota not exceeded

### Slow Performance

- Reduce number of charts
- Lower "Analyze Last" setting
- Disable swing structure

## 💡 Pro Tips

1. **Quick Reset**: Delete all charts and add new ones to reset layout
2. **Save Configurations**: Export localStorage for backup
3. **Performance**: Use higher timeframes for smoother experience
4. **Screen Space**: Resize charts vertically to fit more on screen
5. **Focus Mode**: Delete unnecessary charts for cleaner view

## 📚 Next Steps

- Read full [README.md](./README.md) for architecture details
- Explore [constants.ts](./constants.ts) for configuration options
- Check [types.ts](./types.ts) for TypeScript interfaces
- Review [components/](./components/) for implementation details

## 🤝 Contributing

When adding features:

1. Follow the modular structure
2. Add types to `types.ts`
3. Add constants to `constants.ts`
4. Create reusable utilities in `utils/`
5. Update documentation

## 📞 Support

For issues or questions:

- Check browser console for errors
- Review README.md for detailed documentation
- Clear localStorage and restart
- Check Binance API status

---

**Happy Trading! 📈**

