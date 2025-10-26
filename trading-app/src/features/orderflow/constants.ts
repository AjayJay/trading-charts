/**
 * Volume Profile Constants
 * Configuration values for volume profile visualization
 */

/**
 * Default number of price levels for volume aggregation
 */
export const DEFAULT_PRICE_LEVELS = 50;

/**
 * Default width of volume profile in number of bars
 */
export const DEFAULT_VP_WIDTH = 10;

/**
 * Default time window for volume profile (4 hours in milliseconds)
 */
export const DEFAULT_TIME_WINDOW_MS = 4 * 60 * 60 * 1000;

/**
 * Auto-refresh interval for live data (5 seconds)
 */
export const AUTO_REFRESH_INTERVAL = 5000;

/**
 * Maximum number of trades to keep in buffer for real-time updates
 * Fixed size - trades don't get removed, just capped at this number
 */
export const MAX_TRADE_BUFFER_SIZE = 1000;

/**
 * Update volume profile every N trades in live mode
 */
export const LIVE_UPDATE_FREQUENCY = 50;

/**
 * Maximum number of live trades to display in UI
 */
export const MAX_LIVE_TRADES_DISPLAY = 15;

/**
 * Available trading symbols
 */
export const AVAILABLE_SYMBOLS = [
	{ id: 'BTCUSDT', label: 'BTC/USDT', symbol: 'BTCUSDT' },
	{ id: 'ETHUSDT', label: 'ETH/USDT', symbol: 'ETHUSDT' },
	{ id: 'BNBUSDT', label: 'BNB/USDT', symbol: 'BNBUSDT' },
	{ id: 'SOLUSDT', label: 'SOL/USDT', symbol: 'SOLUSDT' },
	{ id: 'XRPUSDT', label: 'XRP/USDT', symbol: 'XRPUSDT' },
] as const;

/**
 * Default symbol to use
 */
export const DEFAULT_SYMBOL = 'BTCUSDT';

/**
 * Time range options (in hours)
 */
export const TIME_RANGE_OPTIONS = [
	{ value: 1, label: 'Last 1 Hour' },
	{ value: 4, label: 'Last 4 Hours' },
	{ value: 8, label: 'Last 8 Hours' },
	{ value: 24, label: 'Last 24 Hours' },
] as const;

/**
 * Default time range (hours)
 */
export const DEFAULT_TIME_RANGE = 4;

/**
 * Display mode options
 */
export const DISPLAY_MODES = {
	COMBINED: 'combined',
	SEPARATED: 'separated',
} as const;

/**
 * Default display mode
 */
export const DEFAULT_DISPLAY_MODE = DISPLAY_MODES.SEPARATED;

/**
 * Color scheme for volume profile
 */
export const COLOR_SCHEME = {
	BUY_COLOR: 'rgba(38, 166, 154, 0.7)',
	SELL_COLOR: 'rgba(239, 83, 80, 0.7)',
	BACKGROUND_COLOR: 'rgba(0, 0, 255, 0.1)',
	POC_LINE_COLOR: 'rgba(255, 193, 7, 0.8)',
	VALUE_AREA_COLOR: 'rgba(33, 150, 243, 0.2)',
} as const;

/**
 * Value area percentage (70% of volume)
 */
export const VALUE_AREA_PERCENTAGE = 0.7;

/**
 * Binance API configuration
 */
export const BINANCE_CONFIG = {
	BASE_URL: 'https://api.binance.com',
	WS_BASE_URL: 'wss://stream.binance.com:9443',
	MAX_TRADES_PER_REQUEST: 1000,
	MAX_HISTORICAL_TRADES: 5000,
} as const;

/**
 * Chart configuration defaults
 */
export const DEFAULT_CHART_CONFIG = {
	autoSize: true,
	layout: {
		background: { color: '#131722' },
		textColor: '#d1d4dc',
	},
	grid: {
		vertLines: { color: '#1e222d' },
		horzLines: { color: '#1e222d' },
	},
	crosshair: {
		mode: 1,
	},
	rightPriceScale: {
		borderColor: '#2b2b43',
	},
	timeScale: {
		borderColor: '#2b2b43',
		timeVisible: true,
		secondsVisible: false,
	},
} as const;

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
	VP_STATE: 'volumeProfile_state',
	VP_SETTINGS: 'volumeProfile_settings',
} as const;

