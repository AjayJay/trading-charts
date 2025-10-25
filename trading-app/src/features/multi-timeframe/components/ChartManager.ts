import { TimeframeChart } from "./TimeframeChart";
import { GridState, TimeframeConfig, ChartLayout } from "../types";
import {
	AVAILABLE_TIMEFRAMES,
	DEFAULT_TIMEFRAMES,
	MIN_CHART_HEIGHT,
	DEFAULT_CHART_HEIGHT,
} from "../constants";
import { saveGridState, loadGridState } from "../utils/storage";

/**
 * ChartManager - Orchestrates all chart instances and grid layout
 */
export class ChartManager {
	private charts: Map<string, TimeframeChart> = new Map();
	private gridContainer: HTMLElement;
	private nextChartId: number = 1;
	private swingStructureEnabled: boolean = true;
	private comparisonPeriod: number = 5;
	private lookbackPeriod: number = 200;
	private observers: Map<string, ResizeObserver> = new Map();
	private eventListeners: Map<string, Array<{ element: HTMLElement; type: string; handler: EventListener }>> = new Map();

	constructor(gridContainerId: string) {
		const container = document.getElementById(gridContainerId);
		if (!container) {
			throw new Error(`Grid container ${gridContainerId} not found`);
		}
		this.gridContainer = container;
	}

	/**
	 * Initialize with default or saved state
	 */
	async initialize(): Promise<void> {
		const savedState = loadGridState();

		if (savedState && savedState.charts.length > 0) {
			await this.loadFromState(savedState);
		} else {
			await this.loadDefaultCharts();
		}
	}

	/**
	 * Load default charts
	 */
	private async loadDefaultCharts(): Promise<void> {
		const promises = DEFAULT_TIMEFRAMES.map(async (timeframeId) => {
			const timeframe = AVAILABLE_TIMEFRAMES.find(
				(tf) => tf.id === timeframeId
			);
			if (timeframe) {
				await this.addChart(timeframe);
			}
		});

		await Promise.all(promises);
	}

	/**
	 * Load charts from saved state
	 */
	private async loadFromState(state: GridState): Promise<void> {
		const sortedCharts = state.charts.sort((a, b) => a.order - b.order);

		const promises = sortedCharts.map(async (layout) => {
			const timeframe = AVAILABLE_TIMEFRAMES.find(
				(tf) => tf.id === layout.timeframeId
			);
			if (timeframe) {
				await this.addChart(
					timeframe,
					layout.id,
					layout.width,
					layout.height
				);
			}
		});

		await Promise.all(promises);
	}

	/**
	 * Add a new chart
	 */
	async addChart(
		timeframe: TimeframeConfig,
		id?: string,
		width?: number,
		height?: number
	): Promise<string> {
		const chartId = id || `chart-${this.nextChartId++}`;

		// Create container element and append to DOM
		const containerEl = this.createChartContainer(chartId, timeframe, width, height);
		this.gridContainer.appendChild(containerEl);

		// CRITICAL: Wait for browser to layout flexbox items before creating chart
		// This ensures the container has proper dimensions when TimeframeChart constructor runs
		await new Promise(resolve => setTimeout(resolve, 100));

		// Create chart instance (constructor will set initial size)
		const chart = new TimeframeChart(
			chartId,
			timeframe,
			width,
			height || DEFAULT_CHART_HEIGHT
		);

		// Set callbacks
		chart.onDelete((id) => this.removeChart(id));

		// Apply current settings
		chart.updateSettings({
			swingStructureEnabled: this.swingStructureEnabled,
			comparisonPeriod: this.comparisonPeriod,
			lookbackPeriod: this.lookbackPeriod,
		});

		// Store chart in map BEFORE loading data
		this.charts.set(chartId, chart);

		// Load data FIRST, then setup resize observer
		// This prevents resize observer from firing during initial data load
		try {
			await chart.loadData();
			
			// Setup resize observer AFTER data is loaded
			this.setupResizeObserver(chartId);
		} catch (error) {
			console.error(`Failed to load chart ${chartId}:`, error);
		}

		// Save state
		this.saveState();

		return chartId;
	}

	/**
	 * Remove a chart
	 */
	removeChart(id: string): void {
		const chart = this.charts.get(id);
		if (!chart) return;

		// Cleanup ResizeObserver to prevent memory leak
		const observer = this.observers.get(id);
		if (observer) {
			observer.disconnect();
			this.observers.delete(id);
		}

		// Cleanup event listeners to prevent memory leak
		const listeners = this.eventListeners.get(id);
		if (listeners) {
			listeners.forEach(({ element, type, handler }) => {
				element.removeEventListener(type, handler);
			});
			this.eventListeners.delete(id);
		}

		// Destroy chart instance
		chart.destroy();

		// Remove the WRAPPER element (the outer flex item that occupies space)
		// getContainer() returns .chart-content
		// .closest('.chart-wrapper') gets the outer wrapper
		const wrapper = chart.getContainer().closest('.chart-wrapper');
		if (wrapper) {
			wrapper.remove();
		}

		// Remove from map
		this.charts.delete(id);

		// Save state
		this.saveState();
	}

	/**
	 * Change chart timeframe
	 */
	async changeChartTimeframe(
		chartId: string,
		timeframeId: string
	): Promise<void> {
		const chart = this.charts.get(chartId);
		if (!chart) return;

		const timeframe = AVAILABLE_TIMEFRAMES.find((tf) => tf.id === timeframeId);
		if (!timeframe) return;

		try {
			await chart.changeTimeframe(timeframe);
			this.saveState();
		} catch (error) {
			console.error(`Failed to change timeframe for ${chartId}:`, error);
		}
	}

	/**
	 * Reload all charts
	 */
	async reloadAll(): Promise<void> {
		const promises = Array.from(this.charts.values()).map((chart) =>
			chart.loadData()
		);
		await Promise.all(promises);
	}

	/**
	 * Update global settings
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

		// Update all charts
		this.charts.forEach((chart) => {
			chart.updateSettings(settings);
		});
	}

	/**
	 * Create chart container HTML
	 */
	private createChartContainer(
		chartId: string,
		timeframe: TimeframeConfig,
		savedWidth?: number,
		savedHeight?: number
	): HTMLElement {
		const wrapper = document.createElement("div");
		wrapper.className = "chart-wrapper";
		
		// Apply saved dimensions if available
		if (savedWidth) {
			wrapper.style.width = `${savedWidth}px`;
		}
		if (savedHeight) {
			wrapper.style.height = `${savedHeight}px`;
		}

		wrapper.innerHTML = `
			<div class="chart-container">
				<div class="chart-header">
					<div class="chart-title-group">
						<select class="chart-timeframe-select" data-chart-id="${chartId}">
							${AVAILABLE_TIMEFRAMES.map(
								(tf) =>
									`<option value="${tf.id}" ${tf.id === timeframe.id ? "selected" : ""}>${tf.label}</option>`
							).join("")}
						</select>
					</div>
					<div class="chart-actions">
						<span class="chart-price">--</span>
						<button class="chart-delete-btn" data-chart-id="${chartId}" title="Delete Chart">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
							</svg>
						</button>
					</div>
				</div>
				<div class="chart-content" id="${chartId}"></div>
				<div class="chart-resize-handle" data-chart-id="${chartId}" title="Resize chart (both directions)">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M14 10L14 14L10 14M6 2L2 2L2 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M2 10L2 14L6 14M10 2L14 2L14 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
					</svg>
				</div>
			</div>
		`;

		// Track event listeners for cleanup
		const listeners: Array<{ element: HTMLElement; type: string; handler: EventListener }> = [];

		// Add event listeners with tracking
		const deleteBtn = wrapper.querySelector(
			".chart-delete-btn"
		) as HTMLButtonElement;
		const deleteHandler = () => this.removeChart(chartId);
		deleteBtn.addEventListener("click", deleteHandler);
		listeners.push({ element: deleteBtn, type: 'click', handler: deleteHandler });

		const timeframeSelect = wrapper.querySelector(
			".chart-timeframe-select"
		) as HTMLSelectElement;
		const timeframeHandler = (e: Event) => {
			const target = e.target as HTMLSelectElement;
			this.changeChartTimeframe(chartId, target.value);
		};
		timeframeSelect.addEventListener("change", timeframeHandler);
		listeners.push({ element: timeframeSelect, type: 'change', handler: timeframeHandler });

		// Store listeners for cleanup later
		this.eventListeners.set(chartId, listeners);

		return wrapper;
	}


	/**
	 * Setup resize observer for container width/height changes
	 * This handles both CSS resize and window resize
	 */
	private setupResizeObserver(chartId: string): void {
		const chart = this.charts.get(chartId);
		if (!chart) return;

		const wrapper = chart.getContainer().closest(".chart-wrapper") as HTMLElement;
		if (!wrapper) return;

		let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

		const observer = new ResizeObserver((entries) => {
			if (resizeTimeout) clearTimeout(resizeTimeout);
			
			resizeTimeout = setTimeout(() => {
				for (const entry of entries) {
					const container = wrapper.querySelector(".chart-container") as HTMLElement;
					
					if (!container) return;
					
					// Calculate actual available space
					const width = container.clientWidth - 2; // Subtract border
					const height = container.clientHeight - 50; // Subtract header height
					
					if (width > 0 && height > 0) {
						chart.resize(width, height);
					}
				}
			}, 50); // Debounce resize
		});

		observer.observe(wrapper);
		
		// Store observer for cleanup on chart removal
		this.observers.set(chartId, observer);
		
		// Save state when resize completes
		let saveTimeout: ReturnType<typeof setTimeout> | null = null;
		const mouseUpHandler = () => {
			if (saveTimeout) clearTimeout(saveTimeout);
			saveTimeout = setTimeout(() => {
				this.saveState();
			}, 500);
		};
		
		wrapper.addEventListener('mouseup', mouseUpHandler);
		
		// Track this event listener for cleanup
		const existingListeners = this.eventListeners.get(chartId) || [];
		existingListeners.push({ element: wrapper, type: 'mouseup', handler: mouseUpHandler });
		this.eventListeners.set(chartId, existingListeners);
	}

	/**
	 * Save current state to localStorage
	 */
	private saveState(): void {
		const charts: ChartLayout[] = [];
		let order = 0;

		this.charts.forEach((chart) => {
			const instance = chart.getInstance();
			const wrapper = chart.getContainer().closest(".chart-wrapper") as HTMLElement;
			
			// Save wrapper dimensions for CSS resize
			const wrapperWidth = wrapper ? wrapper.offsetWidth : instance.width;
			const wrapperHeight = wrapper ? wrapper.offsetHeight : instance.height;
			
			charts.push({
				id: instance.id,
				timeframeId: instance.timeframe.id,
				width: wrapperWidth,
				height: wrapperHeight,
				order: order++,
			});
		});

		const state: GridState = {
			charts,
			columns: 4,
		};

		saveGridState(state);
	}

	/**
	 * Get all charts
	 */
	getCharts(): Map<string, TimeframeChart> {
		return this.charts;
	}

	/**
	 * Get available timeframes
	 */
	getAvailableTimeframes(): TimeframeConfig[] {
		return AVAILABLE_TIMEFRAMES;
	}

	/**
	 * Get current settings (single source of truth)
	 */
	getSettings() {
		return {
			swingStructureEnabled: this.swingStructureEnabled,
			comparisonPeriod: this.comparisonPeriod,
			lookbackPeriod: this.lookbackPeriod,
		};
	}
}


