/**
 * VolumeProfileChart - Simplified chart wrapper
 * Follows the pattern of TimeframeChart for consistency
 */

import { createChart, IChartApi, ISeriesApi, LineSeries } from 'lightweight-charts';
import { VolumeProfileManager } from './VolumeProfileManager';
import { VolumeProfileSettings } from '../utils/types';
import { DEFAULT_CHART_CONFIG } from '../constants';

export interface VolumeProfileChartOptions {
	container: string | HTMLElement;
	chartOptions?: any;
	seriesOptions?: any;
	settings?: Partial<VolumeProfileSettings>;
}

/**
 * VolumeProfileChart - Chart wrapper with integrated manager
 */
export class VolumeProfileChart {
	private chart: IChartApi;
	private series: ISeriesApi<'Line'>;
	private manager: VolumeProfileManager;
	private container: HTMLElement;

	constructor(options: VolumeProfileChartOptions) {
		// Get container
		this.container = typeof options.container === 'string'
			? document.getElementById(options.container) || document.body
			: options.container;

		// Create chart
		this.chart = createChart(this.container, {
			...DEFAULT_CHART_CONFIG,
			...options.chartOptions,
		});

		// Add line series
		this.series = this.chart.addSeries(LineSeries, {
			color: '#2962ff',
			lineWidth: 2,
			...options.seriesOptions,
		});

		// Create manager
		this.manager = new VolumeProfileManager();
		this.manager.initialize(this.chart, this.series);

		// Apply settings if provided
		if (options.settings) {
			this.manager.updateSettings(options.settings);
		}
	}

	/**
	 * Get the chart instance
	 */
	getChart(): IChartApi {
		return this.chart;
	}

	/**
	 * Get the series instance
	 */
	getSeries(): ISeriesApi<'Line'> {
		return this.series;
	}

	/**
	 * Get the manager instance
	 */
	getManager(): VolumeProfileManager {
		return this.manager;
	}

	/**
	 * Load data
	 */
	async loadData(): Promise<void> {
		await this.manager.loadData();
		this.fitContent();
	}

	/**
	 * Fit content to viewport
	 */
	fitContent(): void {
		this.chart.timeScale().fitContent();
	}

	/**
	 * Resize the chart
	 */
	resize(width?: number, height?: number): void {
		if (width && height) {
			this.chart.resize(width, height);
		} else {
			this.chart.resize(
				this.container.clientWidth,
				this.container.clientHeight
			);
		}
	}

	/**
	 * Destroy the chart and clean up
	 */
	destroy(): void {
		this.manager.destroy();
		this.chart.remove();
	}
}

