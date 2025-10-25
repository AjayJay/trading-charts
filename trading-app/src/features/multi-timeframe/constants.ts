import { DeepPartial, ChartOptions } from "lightweight-charts";
import { TimeframeConfig } from "./types";

export const AVAILABLE_TIMEFRAMES: TimeframeConfig[] = [
	{ id: "1m", interval: "1m", limit: 500, label: "1 Minute" },
	{ id: "3m", interval: "3m", limit: 500, label: "3 Minutes" },
	{ id: "5m", interval: "5m", limit: 500, label: "5 Minutes" },
	{ id: "15m", interval: "15m", limit: 500, label: "15 Minutes" },
	{ id: "30m", interval: "30m", limit: 500, label: "30 Minutes" },
	{ id: "1h", interval: "1h", limit: 500, label: "1 Hour" },
	{ id: "2h", interval: "2h", limit: 500, label: "2 Hours" },
	{ id: "4h", interval: "4h", limit: 500, label: "4 Hours" },
	{ id: "6h", interval: "6h", limit: 500, label: "6 Hours" },
	{ id: "12h", interval: "12h", limit: 500, label: "12 Hours" },
	{ id: "1d", interval: "1d", limit: 365, label: "Daily" },
	{ id: "3d", interval: "3d", limit: 365, label: "3 Days" },
	{ id: "1w", interval: "1w", limit: 200, label: "Weekly" },
	{ id: "1M", interval: "1M", limit: 120, label: "Monthly" },
];

export const DEFAULT_TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];

export const DEFAULT_CHART_OPTIONS: DeepPartial<ChartOptions> = {
	layout: {
		background: { color: "#131722" },
		textColor: "#d1d4dc",
	},
	grid: {
		vertLines: { color: "#1e222d" },
		horzLines: { color: "#1e222d" },
	},
	crosshair: {
		mode: 1,
		vertLine: {
			color: "#758696",
			width: 1,
			style: 3,
			labelBackgroundColor: "#2962ff",
		},
		horzLine: {
			color: "#758696",
			width: 1,
			style: 3,
			labelBackgroundColor: "#2962ff",
		},
	},
	timeScale: {
		borderColor: "#2a2e39",
		timeVisible: true,
		secondsVisible: false,
	},
	rightPriceScale: {
		borderColor: "#2a2e39",
		scaleMargins: {
			top: 0.15,
			bottom: 0.15,
		},
	},
	width: 0,
	height: 0,
};

export const MIN_CHART_WIDTH = 300;
export const MIN_CHART_HEIGHT = 250;
export const DEFAULT_CHART_HEIGHT = 400;
export const STORAGE_KEY = "multi-timeframe-grid-state";
export const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

// Swing detection defaults
// - Lookback: Number of candles to check BEFORE the current candle
// - Forward: Number of candles to check AFTER the current candle
// Lower forward values = more real-time detection (but may repaint)
// Higher forward values = more confirmed swings (but delayed)
export const DEFAULT_LOOKBACK_PERIOD = 5;
export const DEFAULT_FORWARD_PERIOD = 5;

// Chart scale modes (like TradingView)
export const SCALE_MODES = {
	REGULAR: 'normal' as const,
	LOGARITHMIC: 'logarithmic' as const,
	PERCENTAGE: 'percentage' as const,
	INDEXED: 'indexed' as const,
};

// Default scale settings
export const DEFAULT_SCALE_SETTINGS = {
	mode: SCALE_MODES.REGULAR,
	position: 'right' as const,
	invertScale: false,
	autoScale: true,
	visible: true,
};


