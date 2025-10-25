import {
	CandlestickSeries,
	ChartOptions,
	createChart,
	DeepPartial,
	CandlestickData,
	UTCTimestamp,
	IChartApi,
	ISeriesApi,
	LineData,
	LineSeries,
	Time,
	IPriceLine,
	createSeriesMarkers,
} from "lightweight-charts";

// Types
interface TimeframeConfig {
	id: string;
	interval: string;
	limit: number;
	label: string;
}

interface SwingPoint {
	price: number;
	timestamp: Time;
	type: "HH" | "LH" | "HL" | "LL";
	index: number;
	isHigh: boolean; // true for swing high, false for swing low
}

interface ChartInstance {
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
	seriesMarkers: any | null; // The markers primitive instance
}

interface ComparisonResult {
	latestHigh: number;
	previousHigh: number;
	latestLow: number;
	previousLow: number;
	highStructure: "HH" | "LH";
	lowStructure: "HL" | "LL";
	latestTime: Time;
}

// Timeframe configurations
const TIMEFRAMES: TimeframeConfig[] = [
	{ id: "1m", interval: "1m", limit: 500, label: "1 Minute" },
	{ id: "5m", interval: "5m", limit: 500, label: "5 Minutes" },
	{ id: "15m", interval: "15m", limit: 500, label: "15 Minutes" },
	{ id: "30m", interval: "30m", limit: 500, label: "30 Minutes" },
	{ id: "1h", interval: "1h", limit: 500, label: "1 Hour" },
	{ id: "4h", interval: "4h", limit: 500, label: "4 Hours" },
	{ id: "1d", interval: "1d", limit: 365, label: "Daily" },
	{ id: "1w", interval: "1w", limit: 200, label: "Weekly" },
];

// Chart configuration
const chartOptions: DeepPartial<ChartOptions> = {
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

// Store all chart instances
const chartInstances: ChartInstance[] = [];

// UI Elements
const loadingEl = document.getElementById("loading")!;
const errorMessageEl = document.getElementById("errorMessage")!;
const currentPriceEl = document.getElementById("currentPrice")!;
const priceChangeEl = document.getElementById("priceChange")!;
const comparisonPeriodEl = document.getElementById("comparisonPeriod") as HTMLSelectElement;
const lookbackPeriodEl = document.getElementById("lookbackPeriod") as HTMLSelectElement;
const toggleSwingBtn = document.getElementById("toggleSwingBtn")!;

// Global state
let globalFirstPrice = 0;
let globalLatestPrice = 0;
let comparisonPeriod = 5; // Default: lookback window for swing detection (5 candles left/right)
let swingStructureEnabled = true; // Toggle state
let lookbackPeriod = 200; // How many candles to analyze for swing structure

// Show/Hide loading
function showLoading(show: boolean) {
	loadingEl.style.display = show ? "block" : "none";
}

// Show error message
function showError(message: string) {
	errorMessageEl.textContent = message;
	errorMessageEl.style.display = "block";
	setTimeout(() => {
		errorMessageEl.style.display = "none";
	}, 5000);
}

// Detect if a candle at index is a swing high
function isSwingHigh(data: CandlestickData[], index: number, lookback: number): boolean {
	if (index < lookback || index >= data.length - lookback) {
		return false;
	}

	const currentHigh = data[index].high;

	// Check if current high is greater than all highs in lookback window (left and right)
	for (let i = index - lookback; i <= index + lookback; i++) {
		if (i !== index && data[i].high >= currentHigh) {
			return false;
		}
	}

	return true;
}

// Detect if a candle at index is a swing low
function isSwingLow(data: CandlestickData[], index: number, lookback: number): boolean {
	if (index < lookback || index >= data.length - lookback) {
		return false;
	}

	const currentLow = data[index].low;

	// Check if current low is less than all lows in lookback window (left and right)
	for (let i = index - lookback; i <= index + lookback; i++) {
		if (i !== index && data[i].low <= currentLow) {
			return false;
		}
	}

	return true;
}

// Detect all swing points and classify them
function detectSwingPoints(data: CandlestickData[], lookback: number, analyzePeriod: number): SwingPoint[] {
	const swingPoints: SwingPoint[] = [];
	
	// Only analyze the last 'analyzePeriod' candles
	const startIndex = Math.max(lookback, data.length - analyzePeriod);
	
	// Track previous swing points for comparison
	let previousSwingHigh: { price: number; index: number } | null = null;
	let previousSwingLow: { price: number; index: number } | null = null;

	// Detect all swing highs and lows
	for (let i = startIndex; i < data.length - lookback; i++) {
		// Check for swing high
		if (isSwingHigh(data, i, lookback)) {
			const currentPrice = data[i].high;
			let swingType: "HH" | "LH";

			if (previousSwingHigh === null) {
				// First swing high, default to HH
				swingType = "HH";
			} else {
				// Compare with previous swing high
				swingType = currentPrice > previousSwingHigh.price ? "HH" : "LH";
			}

			swingPoints.push({
				price: currentPrice,
				timestamp: data[i].time,
				type: swingType,
				index: i,
				isHigh: true,
			});

			previousSwingHigh = { price: currentPrice, index: i };
		}

		// Check for swing low
		if (isSwingLow(data, i, lookback)) {
			const currentPrice = data[i].low;
			let swingType: "HL" | "LL";

			if (previousSwingLow === null) {
				// First swing low, default to HL
				swingType = "HL";
			} else {
				// Compare with previous swing low
				swingType = currentPrice > previousSwingLow.price ? "HL" : "LL";
			}

			swingPoints.push({
				price: currentPrice,
				timestamp: data[i].time,
				type: swingType,
				index: i,
				isHigh: false,
			});

			previousSwingLow = { price: currentPrice, index: i };
		}
	}

	// Sort by index to maintain chronological order
	const sortedPoints = swingPoints.sort((a, b) => a.index - b.index);
	
	// Remove duplicate timestamps (same candle can't be both high and low in the line series)
	// Keep only the first occurrence of each timestamp
	const uniquePoints: SwingPoint[] = [];
	const seenTimes = new Set<Time>();
	
	for (const point of sortedPoints) {
		if (!seenTimes.has(point.timestamp)) {
			uniquePoints.push(point);
			seenTimes.add(point.timestamp);
		}
	}
	
	return uniquePoints;
}

// Fetch BTC data from Binance
async function fetchBTCData(
	interval: string,
	limit: number
): Promise<CandlestickData[]> {
	const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		return data.map((kline: any) => ({
			time: Math.floor(kline[0] / 1000) as UTCTimestamp,
			open: parseFloat(kline[1]),
			high: parseFloat(kline[2]),
			low: parseFloat(kline[3]),
			close: parseFloat(kline[4]),
		}));
	} catch (error) {
		console.error(`Error fetching ${interval} data:`, error);
		throw error;
	}
}

// Update individual chart price display
function updateChartPrice(
	priceElementId: string,
	data: CandlestickData[]
): void {
	if (data.length === 0) return;

	const priceElement = document.getElementById(priceElementId);
	if (!priceElement) return;

	const latestCandle = data[data.length - 1];
	const firstCandle = data[0];

	const priceChange = latestCandle.close - firstCandle.open;
	const isPositive = priceChange >= 0;

	priceElement.textContent = `${isPositive ? "+" : ""}${priceChange.toFixed(2)}`;
	priceElement.className = `chart-price ${isPositive ? "positive" : "negative"}`;
}

// Update global price display
function updateGlobalPrice() {
	if (globalLatestPrice === 0) return;

	currentPriceEl.textContent = `$${globalLatestPrice.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;

	const priceChange = globalLatestPrice - globalFirstPrice;
	const priceChangePercent =
		((priceChange / globalFirstPrice) * 100).toFixed(2);

	priceChangeEl.textContent = `${priceChange >= 0 ? "+" : ""}${priceChangePercent}%`;
	priceChangeEl.className = `price-change ${
		priceChange >= 0 ? "positive" : "negative"
	}`;

	currentPriceEl.style.color = priceChange >= 0 ? "#26a69a" : "#ef5350";
}

// Update swing analysis on chart
function updateSwingAnalysis(
	chartInstance: ChartInstance,
	data: CandlestickData[]
): void {
	// Remove existing price lines
	chartInstance.priceLines.forEach((line) => {
		chartInstance.candleSeries.removePriceLine(line);
	});
	chartInstance.priceLines = [];

	// If swing structure is disabled, clear everything and return
	if (!swingStructureEnabled) {
		chartInstance.swingLineSeries.setData([]);
		chartInstance.bullishLineSeries.setData([]);
		chartInstance.bearishLineSeries.setData([]);
		chartInstance.swingPoints = [];
		// Clear markers
		if (chartInstance.seriesMarkers) {
			chartInstance.seriesMarkers.setMarkers([]);
		}
		return;
	}

	// Get the lookback window and analysis period
	const lookback = comparisonPeriod;
	const analyzePeriod = Math.min(lookbackPeriod, data.length);
	
	if (data.length < lookback * 2 + 1) {
		return;
	}

	// Detect swing points
	const swingPoints = detectSwingPoints(data, lookback, analyzePeriod);
	chartInstance.swingPoints = swingPoints;

	// Create a single connecting line through all swing points (already sorted)
	const allPoints: LineData[] = swingPoints.map((point) => ({
		time: point.timestamp,
		value: point.price,
	}));

	// Set the main connecting line
	chartInstance.swingLineSeries.setData(allPoints);
	
	// Clear the colored lines (not needed for cleaner view)
	chartInstance.bullishLineSeries.setData([]);
	chartInstance.bearishLineSeries.setData([]);

	// No markers or horizontal lines for cleaner view
	// Just clear any existing markers
	if (chartInstance.seriesMarkers) {
		chartInstance.seriesMarkers.setMarkers([]);
	}
}

// Initialize a single chart
function initializeChart(timeframe: TimeframeConfig): ChartInstance | null {
	const containerId = `chart-${timeframe.id}`;
	const priceElementId = `price-${timeframe.id}`;
	const containerElement = document.getElementById(containerId);

	if (!containerElement) {
		console.error(`Container ${containerId} not found`);
		return null;
	}

	const containerRect = containerElement.getBoundingClientRect();
	const chartHeight = Math.max(350, containerRect.height - 10);

	const chart = createChart(containerId, {
		...chartOptions,
		width: containerRect.width,
		height: chartHeight,
	});

	// Add candlestick series
	const candleSeries = chart.addSeries(CandlestickSeries, {
		upColor: "#26a69a",
		downColor: "#ef5350",
		borderVisible: false,
		wickUpColor: "#26a69a",
		wickDownColor: "#ef5350",
		priceFormat: {
			type: "price",
			precision: 2,
			minMove: 0.01,
		},
	});

	// Add line series for connecting swing points (main structure line)
	const swingLineSeries = chart.addSeries(LineSeries, {
		color: "#2962ff",
		lineWidth: 2,
		lineStyle: 0, // Solid line
		crosshairMarkerVisible: true,
		lastValueVisible: false,
		priceLineVisible: false,
	});

	// Add bullish swing line series (green for HH and HL)
	const bullishLineSeries = chart.addSeries(LineSeries, {
		color: "#26a69a",
		lineWidth: 2,
		lineStyle: 0, // Solid line
		crosshairMarkerVisible: false,
		lastValueVisible: false,
		priceLineVisible: false,
	});

	// Add bearish swing line series (red for LH and LL)
	const bearishLineSeries = chart.addSeries(LineSeries, {
		color: "#ef5350",
		lineWidth: 2,
		lineStyle: 0, // Solid line
		crosshairMarkerVisible: false,
		lastValueVisible: false,
		priceLineVisible: false,
	});

	return {
		chart,
		candleSeries,
		swingLineSeries,
		bullishLineSeries,
		bearishLineSeries,
		timeframe,
		containerId,
		priceElementId,
		priceLines: [],
		swingPoints: [],
		seriesMarkers: null,
	};
}

// Load data for a single chart
async function loadChartData(chartInstance: ChartInstance): Promise<void> {
	try {
		const data = await fetchBTCData(
			chartInstance.timeframe.interval,
			chartInstance.timeframe.limit
		);

		if (data.length === 0) {
			throw new Error("No data received");
		}

		// Update candlestick chart
		chartInstance.candleSeries.setData(data);

		// Update swing analysis
		updateSwingAnalysis(chartInstance, data);

		// Update chart-specific price display
		updateChartPrice(chartInstance.priceElementId, data);

		// Update global price from 15m timeframe
		if (chartInstance.timeframe.id === "15m") {
			globalFirstPrice = data[0].open;
			globalLatestPrice = data[data.length - 1].close;
			updateGlobalPrice();
		}

		// Remove loading indicator
		const loadingIndicator = document
			.getElementById(chartInstance.containerId)
			?.querySelector(".chart-loading");
		if (loadingIndicator) {
			loadingIndicator.remove();
		}

		// Fit content
		setTimeout(() => {
			chartInstance.chart.timeScale().fitContent();
		}, 100);
	} catch (error) {
		console.error(
			`Error loading ${chartInstance.timeframe.label} data:`,
			error
		);
		showError(
			`Failed to load ${chartInstance.timeframe.label} data. Retrying...`
		);
	}
}

// Load all charts
async function loadAllCharts(): Promise<void> {
	showLoading(true);

	try {
		await Promise.all(
			chartInstances.map((chartInstance) => loadChartData(chartInstance))
		);
	} catch (error) {
		console.error("Error loading charts:", error);
		showError(
			"Failed to load some chart data. Please check your connection."
		);
	} finally {
		showLoading(false);
	}
}

// Update all swing analysis with new comparison period
function updateAllSwingAnalysis(): void {
	chartInstances.forEach((chartInstance) => {
		const data = chartInstance.candleSeries.data() as CandlestickData[];
		if (data.length > 0) {
			updateSwingAnalysis(chartInstance, data);
		}
	});
}

// Handle window resize
function handleResize() {
	chartInstances.forEach((chartInstance) => {
		const container = document.getElementById(chartInstance.containerId);
		if (container) {
			const rect = container.getBoundingClientRect();
			chartInstance.chart.applyOptions({
				width: rect.width,
				height: Math.max(350, rect.height - 10),
			});
		}
	});
}

// Initialize all charts
function initializeAllCharts() {
	TIMEFRAMES.forEach((timeframe) => {
		const chartInstance = initializeChart(timeframe);
		if (chartInstance) {
			chartInstances.push(chartInstance);
		}
	});
}

// Resize observer for individual containers
const resizeObserver = new ResizeObserver((entries) => {
	entries.forEach((entry) => {
		const containerId = entry.target.id;
		const chartInstance = chartInstances.find(
			(ci) => ci.containerId === containerId
		);
		if (chartInstance) {
			const rect = entry.target.getBoundingClientRect();
			chartInstance.chart.applyOptions({
				width: rect.width,
				height: Math.max(350, rect.height - 10),
			});
		}
	});
});

// Observe all chart containers
TIMEFRAMES.forEach((timeframe) => {
	const container = document.getElementById(`chart-${timeframe.id}`);
	if (container) {
		resizeObserver.observe(container);
	}
});

// Handle comparison period change
comparisonPeriodEl.addEventListener("change", (e) => {
	comparisonPeriod = parseInt((e.target as HTMLSelectElement).value);
	console.log(`Comparison period changed to: ${comparisonPeriod} candles`);
	updateAllSwingAnalysis();
});

// Handle lookback period change
lookbackPeriodEl.addEventListener("change", (e) => {
	lookbackPeriod = parseInt((e.target as HTMLSelectElement).value);
	console.log(`Lookback period changed to: ${lookbackPeriod} candles`);
	updateAllSwingAnalysis();
});

// Handle swing structure toggle
toggleSwingBtn.addEventListener("click", () => {
	swingStructureEnabled = !swingStructureEnabled;
	
	// Update button appearance
	if (swingStructureEnabled) {
		toggleSwingBtn.classList.add("active");
	} else {
		toggleSwingBtn.classList.remove("active");
	}
	
	// Update all charts
	updateAllSwingAnalysis();
	
	console.log(`Swing structure ${swingStructureEnabled ? "enabled" : "disabled"}`);
});

// Initialize everything
initializeAllCharts();

// Initial load
loadAllCharts();

// Auto-refresh every 30 seconds
setInterval(() => {
	if (!loadingEl.style.display || loadingEl.style.display === "none") {
		loadAllCharts();
	}
}, 30000);

// Handle window resize for layout changes
let resizeTimeout: number;
window.addEventListener("resize", () => {
	clearTimeout(resizeTimeout);
	resizeTimeout = window.setTimeout(handleResize, 250);
});
