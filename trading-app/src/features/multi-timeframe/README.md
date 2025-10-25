# Multi-Timeframe Chart Analysis

A powerful, modular multi-timeframe chart analysis application for Bitcoin with resizable charts, dynamic add/delete functionality, and persistent layout.

## Features

### 🎯 Core Features

- **Resizable Charts**: Drag the resize handle at the bottom of each chart to adjust height
- **Add/Delete Charts**: Add new charts with any timeframe or delete existing ones
- **Timeframe Selection**: Change the timeframe of any chart on the fly
- **Swing Structure Analysis**: Toggle swing structure detection with customizable parameters
- **Persistent Layout**: Your chart configuration is saved and restored automatically
- **Auto-refresh**: Real-time data updates every 30 seconds
- **Responsive Grid**: Automatically adjusts to screen size

### 📊 Available Timeframes

- 1 Minute, 3 Minutes, 5 Minutes
- 15 Minutes, 30 Minutes
- 1 Hour, 2 Hours, 4 Hours, 6 Hours, 12 Hours
- Daily, 3 Days
- Weekly, Monthly

## Architecture

### Modular Structure

```text
multi-timeframe/
├── types.ts                    # TypeScript interfaces and types
├── constants.ts                # Configuration constants
├── utils/
│   ├── dataFetcher.ts         # Binance API data fetching
│   ├── swingAnalysis.ts       # Swing point detection algorithms
│   └── storage.ts             # LocalStorage persistence
├── components/
│   ├── TimeframeChart.ts      # Individual chart management
│   └── ChartManager.ts        # Global chart orchestration
├── index.html                  # Main UI
├── index.ts                    # Application entry point
└── README.md                   # Documentation
```text
### Component Responsibilities

#### 1. **TimeframeChart** (`components/TimeframeChart.ts`)

Manages individual chart instances with the following capabilities:

- Chart creation and initialization
- Data loading and visualization
- Swing structure analysis
- Price display updates
- Chart resizing
- Timeframe switching
- Chart destruction

#### Key Methods

```typescript
// Load data for the chart
async loadData(): Promise<void>

// Resize the chart
resize(width: number, height: number): void

// Update analysis settings
updateSettings(settings: {
  swingStructureEnabled?: boolean;
  comparisonPeriod?: number;
  lookbackPeriod?: number;
}): void

// Change timeframe
async changeTimeframe(timeframe: TimeframeConfig): Promise<void>

// Destroy the chart
destroy(): void
```text
#### 2. **ChartManager** (`components/ChartManager.ts`)

Orchestrates all chart instances and manages the grid layout:

- Chart lifecycle management (add/remove)
- State persistence to localStorage
- Global settings propagation
- Bulk operations (reload all charts)
- Resize handling
- Grid layout management

#### Key Methods

```typescript
// Initialize with saved or default state
async initialize(): Promise<void>

// Add a new chart
async addChart(
  timeframe: TimeframeConfig,
  id?: string,
  width?: number,
  height?: number
): Promise<string>

// Remove a chart
removeChart(id: string): void

// Change chart timeframe
async changeChartTimeframe(
  chartId: string,
  timeframeId: string
): Promise<void>

// Reload all charts
async reloadAll(): Promise<void>

// Update global settings
updateSettings(settings: {
  swingStructureEnabled?: boolean;
  comparisonPeriod?: number;
  lookbackPeriod?: number;
}): void
```text
### Data Flow

```text
User Action
    ↓
index.ts (Event Handlers)
    ↓
ChartManager (Orchestration)
    ↓
TimeframeChart (Individual Chart)
    ↓
Utils (Data Fetching, Analysis)
    ↓
LightweightCharts (Rendering)
```text
## Usage

### Adding a New Chart

1. Click the **"Add Chart"** button in the header
2. Select a timeframe from the modal
3. Click **"Add Chart"** to confirm

### Deleting a Chart

1. Hover over any chart
2. Click the **X** button in the chart header

### Changing Timeframe

1. Click the timeframe dropdown in any chart header
2. Select a new timeframe

### Resizing Charts

1. Hover over any chart
2. Drag the resize handle at the bottom to adjust height

### Swing Structure Settings

- **Toggle**: Click the "Swing Structure" button to enable/disable
- **Lookback Window**: Number of candles to compare for swing detection (3-10)
- **Analyze Last**: How many recent candles to analyze (50-500)

## LocalStorage Persistence

The application automatically saves your layout to localStorage:

- Chart IDs and positions
- Selected timeframes
- Chart dimensions
- Grid configuration

**Storage Key:** `multi-timeframe-grid-state`

To reset to defaults, clear browser localStorage or delete specific charts and add new ones.

## Extending the Application

### Adding New Timeframes

Edit `constants.ts`:

```typescript
export const AVAILABLE_TIMEFRAMES: TimeframeConfig[] = [
  // Add new timeframe
  { id: "15s", interval: "15s", limit: 1000, label: "15 Seconds" },
  // ...existing timeframes
];
```text
### Adding New Indicators

Create a new utility in `utils/`:

```typescript
// utils/myIndicator.ts
export function calculateMyIndicator(data: CandlestickData[]) {
  // Implementation
}
```text
Use in `TimeframeChart.ts`:

```typescript
import { calculateMyIndicator } from "../utils/myIndicator";

// In updateSwingAnalysis or create a new method
const indicators = calculateMyIndicator(data);
// Add to chart
```text
### Customizing Chart Appearance

Modify `constants.ts` → `DEFAULT_CHART_OPTIONS`:

```typescript
export const DEFAULT_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  layout: {
    background: { color: "#YOUR_COLOR" },
    textColor: "#YOUR_COLOR",
  },
  // ...other options
};
```text
### Adding New Data Sources

Create a new fetcher in `utils/`:

```typescript
// utils/dataFetcher.ts
export async function fetchETHData(
  interval: string,
  limit: number
): Promise<CandlestickData[]> {
  // Implementation
}
```text
Update `TimeframeChart` to accept a data source parameter.

## Best Practices

### Performance

- **Lazy Loading**: Charts are loaded asynchronously
- **ResizeObserver**: Efficient resize handling without polling
- **Debouncing**: Window resize events are debounced
- **Memoization**: Consider memoizing expensive calculations

### State Management

- All chart state is managed through `ChartManager`
- LocalStorage provides persistence across sessions
- State updates trigger automatic saves

### Error Handling

- Try-catch blocks around all async operations
- User-friendly error messages
- Graceful degradation on API failures

### Code Organization

- One responsibility per module
- Clear separation of concerns
- Reusable utilities
- Type-safe interfaces

## Troubleshooting

### Charts Not Loading

- Check browser console for errors
- Verify Binance API is accessible
- Check network connectivity

### Layout Not Saving

- Verify localStorage is enabled
- Check browser storage quota
- Clear storage and try again

### Performance Issues

- Reduce number of charts
- Decrease lookback period
- Disable swing structure analysis

## Future Enhancements

### Potential Features

- [ ] Drag and drop to reorder charts
- [ ] Custom grid layouts (1x1, 2x2, 3x3, etc.)
- [ ] Export chart configurations
- [ ] Multiple symbol support (ETH, BNB, etc.)
- [ ] Chart templates
- [ ] Drawing tools
- [ ] Alert system
- [ ] Chart synchronization (crosshair sync)
- [ ] Full-screen mode for individual charts
- [ ] Dark/Light theme toggle

### Architecture Improvements

- [ ] State management library (Redux, Zustand)
- [ ] WebSocket for real-time updates
- [ ] Service worker for offline support
- [ ] Chart virtualization for 50+ charts
- [ ] Undo/Redo functionality

## API Reference

### Types

#### TimeframeConfig

```typescript
interface TimeframeConfig {
  id: string;          // Unique identifier
  interval: string;    // Binance API interval
  limit: number;       // Number of candles to fetch
  label: string;       // Display label
}
```text
#### ChartInstance

```typescript
interface ChartInstance {
  id: string;
  chart: IChartApi;
  candleSeries: ISeriesApi<"Candlestick">;
  swingLineSeries: ISeriesApi<"Line">;
  bullishLineSeries: ISeriesApi<"Line">;
  bearishLineSeries: ISeriesApi<"Line">;
  timeframe: TimeframeConfig;
  containerId: string;
  priceElementId: string;
  priceLines: IPriceLine[];
  swingPoints: SwingPoint[];
  seriesMarkers: any | null;
  width?: number;
  height?: number;
}
```text
#### SwingPoint

```typescript
interface SwingPoint {
  price: number;       // Swing price level
  timestamp: Time;     // Time of swing
  type: "HH" | "LH" | "HL" | "LL";  // Swing type
  index: number;       // Candle index
  isHigh: boolean;     // True for high, false for low
}
```text
## License

Part of the lightweight-charts project.

## Contributing

Follow the project's contribution guidelines when adding features or fixing bugs.

