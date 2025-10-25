import {
	createChart,
	CandlestickSeries,
	LineSeries,
	CandlestickData,
	LineData,
} from "lightweight-charts";
import { ChartInstance, TimeframeConfig } from "../types";
import { DEFAULT_CHART_OPTIONS, DEFAULT_CHART_HEIGHT } from "../constants";
import { fetchBTCData } from "../utils/dataFetcher";
import { detectSwingPoints } from "../utils/swingAnalysis";

/**
 * Calculate intelligent default chart width based on viewport and responsive breakpoints
 * Matches CSS media query breakpoints for accurate sizing
 */
function getDefaultChartWidth(): number {
	// Try to get the grid container width
	const gridContainer = document.getElementById('chartsGrid');
	const gridWidth = gridContainer?.clientWidth || window.innerWidth - 20;
	
	// Determine column count based on viewport width (matches CSS breakpoints)
	const viewportWidth = window.innerWidth;
	let columns: number;
	
	if (viewportWidth <= 768) {
		columns = 1; // Mobile: 1 column (100%)
	} else if (viewportWidth <= 1200) {
		columns = 2; // Tablet: 2 columns (50% each)
	} else if (viewportWidth <= 1600) {
		columns = 3; // Small desktop: 3 columns (33.333% each)
	} else {
		columns = 4; // Large desktop: 4 columns (25% each)
	}
	
	// Calculate width based on actual column count: (gridWidth / columns) - gap
	return Math.floor((gridWidth / columns) - 20);
}

/**
 * TimeframeChart - Manages an individual chart instance
 */
export class TimeframeChart {
	private chartInstance: ChartInstance;
	private containerElement: HTMLElement;
	private swingStructureEnabled: boolean = true;
	private comparisonPeriod: number = 5;
	private lookbackPeriod: number = 200;
	private onDeleteCallback?: (id: string) => void;
	private onTimeframeChangeCallback?: (
		id: string,
		timeframeId: string
	) => void;
	private retryCount: number = 0;
	private maxRetries: number = 3;
	private isDestroyed: boolean = false;

	constructor(
		containerId: string,
		timeframe: TimeframeConfig,
		width?: number,
		height?: number
	) {
		const container = document.getElementById(containerId);
		if (!container) {
			throw new Error(`Container ${containerId} not found`);
		}

		this.containerElement = container;

		// Use intelligent defaults based on viewport/grid size
		// Don't try to read from flexbox yet - layout hasn't completed
		const chartWidth = width || getDefaultChartWidth();
		const chartHeight = height || DEFAULT_CHART_HEIGHT;

		const chart = createChart(containerId, {
			...DEFAULT_CHART_OPTIONS,
			width: chartWidth,
			height: chartHeight,
		});

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

		const swingLineSeries = chart.addSeries(LineSeries, {
			color: "#2962ff",
			lineWidth: 2,
			lineStyle: 0,
			crosshairMarkerVisible: true,
			lastValueVisible: false,
			priceLineVisible: false,
		});

		const bullishLineSeries = chart.addSeries(LineSeries, {
			color: "#26a69a",
			lineWidth: 2,
			lineStyle: 0,
			crosshairMarkerVisible: false,
			lastValueVisible: false,
			priceLineVisible: false,
		});

		const bearishLineSeries = chart.addSeries(LineSeries, {
			color: "#ef5350",
			lineWidth: 2,
			lineStyle: 0,
			crosshairMarkerVisible: false,
			lastValueVisible: false,
			priceLineVisible: false,
		});

		this.chartInstance = {
			id: containerId,
			chart,
			candleSeries,
			swingLineSeries,
			bullishLineSeries,
			bearishLineSeries,
			timeframe,
			containerId,
			priceElementId: `price-${containerId}`,
			priceLines: [],
			swingPoints: [],
			seriesMarkers: null,
			width: chartWidth,
			height: chartHeight,
		};

		// Wait longer for flexbox layout to complete before adjusting to actual container size
		setTimeout(() => {
			// Check if chart was destroyed during the delay
			if (!this.isDestroyed) {
				this.adjustToContainerSize();
			}
		}, 300);
	}

	/**
	 * Adjust chart to actual container size after flexbox layout completes
	 */
	private adjustToContainerSize(): void {
		// Safety check: Don't adjust if chart is destroyed
		if (this.isDestroyed) {
			return;
		}

		const wrapper = this.containerElement.closest('.chart-wrapper') as HTMLElement;
		const chartContainer = this.containerElement.closest('.chart-container') as HTMLElement;
		
		if (!chartContainer || !wrapper) {
			console.warn('Container elements not found for chart adjustment');
			return;
		}

		// Wait for flexbox to finish layout
		const actualWidth = chartContainer.clientWidth;
		const actualHeight = chartContainer.clientHeight;

		// Only resize if we have valid dimensions and chart still exists
		if (actualWidth > 0 && actualHeight > 0 && !this.isDestroyed) {
			const finalWidth = Math.max(300, actualWidth - 2);
			const finalHeight = Math.max(300, actualHeight - 50);
			
			this.resize(finalWidth, finalHeight);
		}
	}

	/**
	 * Load data for this chart with retry mechanism
	 */
	async loadData(): Promise<void> {
		// Don't attempt to load if chart is destroyed
		if (this.isDestroyed) {
			return Promise.resolve();
		}

		try {
			const data = await fetchBTCData(
				this.chartInstance.timeframe.interval,
				this.chartInstance.timeframe.limit
			);

			if (data.length === 0) {
				throw new Error("No data received");
			}

			// Check again before setting data (might have been destroyed during fetch)
			if (this.isDestroyed) {
				return Promise.resolve();
			}

			this.chartInstance.candleSeries.setData(data);
			this.updateSwingAnalysis(data);
			this.updatePriceDisplay(data);

			setTimeout(() => {
				if (!this.isDestroyed) {
					this.chartInstance.chart.timeScale().fitContent();
				}
			}, 100);

			// Reset retry count on success
			this.retryCount = 0;
			return Promise.resolve();

		} catch (error) {
			console.error(
				`Error loading ${this.chartInstance.timeframe.label} data (attempt ${this.retryCount + 1}/${this.maxRetries}):`,
				error
			);

			// Don't retry if chart is destroyed
			if (this.isDestroyed) {
				return Promise.resolve();
			}

			// Retry with exponential backoff
			if (this.retryCount < this.maxRetries) {
				this.retryCount++;
				const delay = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
				
				console.log(`Retrying in ${delay}ms...`);
				await new Promise(resolve => setTimeout(resolve, delay));
				
				// Recursive retry
				return this.loadData();
			}

			// Max retries reached - show error state in chart
			this.showErrorState(error as Error);
			throw error;
		}
	}

	/**
	 * Show error state in the chart UI
	 */
	private showErrorState(error: Error): void {
		const priceElement = this.containerElement.querySelector(
			".chart-price"
		) as HTMLElement;
		if (priceElement) {
			priceElement.textContent = "⚠️ Failed";
			priceElement.className = "chart-price negative";
			priceElement.title = `Error: ${error.message}`;
		}

		// Log for debugging
		console.error(
			`Chart ${this.chartInstance.timeframe.label} failed after ${this.maxRetries} attempts:`,
			error
		);
	}

	/**
	 * Update swing analysis
	 */
	private updateSwingAnalysis(data: CandlestickData[]): void {
		this.chartInstance.priceLines.forEach((line) => {
			this.chartInstance.candleSeries.removePriceLine(line);
		});
		this.chartInstance.priceLines = [];

		if (!this.swingStructureEnabled) {
			this.chartInstance.swingLineSeries.setData([]);
			this.chartInstance.bullishLineSeries.setData([]);
			this.chartInstance.bearishLineSeries.setData([]);
			this.chartInstance.swingPoints = [];
			if (this.chartInstance.seriesMarkers) {
				this.chartInstance.seriesMarkers.setMarkers([]);
			}
			return;
		}

		const lookback = this.comparisonPeriod;
		const analyzePeriod = Math.min(this.lookbackPeriod, data.length);

		if (data.length < lookback * 2 + 1) {
			return;
		}

		const swingPoints = detectSwingPoints(data, lookback, analyzePeriod);
		this.chartInstance.swingPoints = swingPoints;

		const allPoints: LineData[] = swingPoints.map((point) => ({
			time: point.timestamp,
			value: point.price,
		}));

		this.chartInstance.swingLineSeries.setData(allPoints);
		this.chartInstance.bullishLineSeries.setData([]);
		this.chartInstance.bearishLineSeries.setData([]);

		if (this.chartInstance.seriesMarkers) {
			this.chartInstance.seriesMarkers.setMarkers([]);
		}
	}

	/**
	 * Update price display
	 */
	private updatePriceDisplay(data: CandlestickData[]): void {
		if (data.length === 0) return;

		const priceElement = this.containerElement.querySelector(
			".chart-price"
		) as HTMLElement;
		if (!priceElement) return;

		const latestCandle = data[data.length - 1];
		const firstCandle = data[0];

		const priceChange = latestCandle.close - firstCandle.open;
		const isPositive = priceChange >= 0;

		priceElement.textContent = `${isPositive ? "+" : ""}${priceChange.toFixed(2)}`;
		priceElement.className = `chart-price ${isPositive ? "positive" : "negative"}`;
	}

	/**
	 * Resize the chart
	 */
	resize(width: number, height: number): void {
		this.chartInstance.width = width;
		this.chartInstance.height = height;
		this.chartInstance.chart.applyOptions({
			width,
			height,
		});
	}

	/**
	 * Update settings
	 */
	updateSettings(settings: {
		swingStructureEnabled?: boolean;
		comparisonPeriod?: number;
		lookbackPeriod?: number;
	}): void {
		if (settings.swingStructureEnabled !== undefined) {
			this.swingStructureEnabled = settings.swingStructureEnabled;
		}
		if (settings.comparisonPeriod !== undefined) {
			this.comparisonPeriod = settings.comparisonPeriod;
		}
		if (settings.lookbackPeriod !== undefined) {
			this.lookbackPeriod = settings.lookbackPeriod;
		}

		const data = this.chartInstance.candleSeries.data() as CandlestickData[];
		if (data.length > 0) {
			this.updateSwingAnalysis(data);
		}
	}

	/**
	 * Change timeframe
	 */
	async changeTimeframe(timeframe: TimeframeConfig): Promise<void> {
		if (this.isDestroyed) return;
		
		// Reset retry count when changing timeframe
		this.retryCount = 0;
		
		this.chartInstance.timeframe = timeframe;
		const titleElement = this.containerElement.querySelector(
			".chart-title"
		) as HTMLElement;
		if (titleElement) {
			titleElement.textContent = timeframe.label;
		}
		await this.loadData();
	}

	/**
	 * Get chart instance
	 */
	getInstance(): ChartInstance {
		return this.chartInstance;
	}

	/**
	 * Get container element
	 */
	getContainer(): HTMLElement {
		return this.containerElement;
	}

	/**
	 * Destroy the chart and cleanup resources
	 */
	destroy(): void {
		// Mark as destroyed to prevent further operations
		this.isDestroyed = true;
		
		// Remove the chart
		this.chartInstance.chart.remove();
	}

	/**
	 * Set delete callback
	 */
	onDelete(callback: (id: string) => void): void {
		this.onDeleteCallback = callback;
	}

	/**
	 * Set timeframe change callback
	 */
	onTimeframeChange(callback: (id: string, timeframeId: string) => void): void {
		this.onTimeframeChangeCallback = callback;
	}

	/**
	 * Trigger delete
	 */
	triggerDelete(): void {
		if (this.onDeleteCallback) {
			this.onDeleteCallback(this.chartInstance.id);
		}
	}
}


