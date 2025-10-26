/**
 * VolumeProfileManager - Orchestrates volume profile instances and live data
 * Follows the same pattern as ChartManager for consistency
 */

import { VolumeProfile, VolumeProfileData } from './VolumeProfile';
import { BinanceAPI, BinanceWebSocket } from '../utils/binanceAPI';
import { VolumeProfileProcessor } from '../utils/volumeProfileProcessor';
import { TradeData, VolumeProfileSettings, VolumeProfileMetrics } from '../utils/types';
import { saveVolumeProfileSettings, loadVolumeProfileSettings } from '../utils/storage';
import {
	DEFAULT_PRICE_LEVELS,
	DEFAULT_TIME_RANGE,
	MAX_TRADE_BUFFER_SIZE,
	LIVE_UPDATE_FREQUENCY,
	AUTO_REFRESH_INTERVAL,
} from '../constants';
import { IChartApi, ISeriesApi } from 'lightweight-charts';

/**
 * VolumeProfileManager - Manages volume profiles and live data streams
 */
export class VolumeProfileManager {
	private chart: IChartApi | null = null;
	private series: ISeriesApi<'Line'> | null = null;
	private volumeProfiles: VolumeProfile[] = [];
	private binanceAPI: BinanceAPI | null = null;
	private binanceWS: BinanceWebSocket | null = null;
	private tradeBuffer: TradeData[] = [];
	private settings: VolumeProfileSettings;
	private isLiveMode: boolean = false;
	private autoRefreshInterval: ReturnType<typeof setInterval> | null = null;
	private liveTradeCount: number = 0;

	// Callbacks
	private onMetricsUpdate: ((metrics: VolumeProfileMetrics) => void) | null = null;
	private onStatusChange: ((status: string, isConnected: boolean) => void) | null = null;
	private onTradeReceived: ((trade: TradeData) => void) | null = null;

	constructor() {
		// Load saved settings or use defaults
		this.settings = loadVolumeProfileSettings();
	}

	/**
	 * Initialize the manager with chart and series
	 */
	initialize(chart: IChartApi, series: ISeriesApi<'Line'>): void {
		this.chart = chart;
		this.series = series;
		
		// Initialize Binance API
		this.binanceAPI = new BinanceAPI({ symbol: this.settings.symbol });
		
		console.log('✓ VolumeProfileManager initialized');
	}

	/**
	 * Load historical data and create volume profile
	 */
	async loadData(): Promise<void> {
		if (!this.chart || !this.series || !this.binanceAPI) {
			throw new Error('Manager not initialized. Call initialize() first.');
		}

		try {
			this.updateStatus('Loading data...', false);

			// Fetch trades
			const trades = await this.binanceAPI.fetchTradesLastHours(
				this.settings.timeRange,
				5000
			);
			
			console.log(`✓ Fetched ${trades.length} trades`);

			// Store in buffer
			this.tradeBuffer = trades;

			// Create volume profile
			this.updateVolumeProfile();

			// Get 24h stats for metrics
			const stats = await this.binanceAPI.get24hStats();

			// Calculate metrics
			await this.calculateAndEmitMetrics(stats);

			this.updateStatus('Connected', true);

			// Setup auto-refresh if enabled
			if (this.settings.autoRefresh) {
				this.startAutoRefresh();
			}

		} catch (error) {
			console.error('Error loading data:', error);
			this.updateStatus('Error loading data', false);
			throw error;
		}
	}

	/**
	 * Update volume profile from current trade buffer
	 */
	private updateVolumeProfile(): void {
		if (!this.chart || !this.series || this.tradeBuffer.length === 0) {
			return;
		}

		// Clear existing profiles
		this.clearVolumeProfiles();

		// Process trades into volume profile
		const vpData = VolumeProfileProcessor.processTradeData(
			this.tradeBuffer,
			{
				numPriceLevels: this.settings.numPriceLevels,
				separateBuySell: this.settings.displayMode === 'separated',
			}
		);

		// Create volume profile
		const vp = new VolumeProfile(this.chart, this.series, vpData, {
			separateBuySell: this.settings.displayMode === 'separated',
		});

		console.log('✓ Volume Profile created:', {
			profileLength: vpData.profile.length,
			time: vpData.time,
			width: vpData.width,
			minPrice: Math.min(...vpData.profile.map(p => p.price)),
			maxPrice: Math.max(...vpData.profile.map(p => p.price)),
		});

		this.series.attachPrimitive(vp);
		this.volumeProfiles.push(vp);
		
		// Update all views to trigger rendering
		vp.updateAllViews();
		
		// Force chart update
		this.chart.timeScale().fitContent();
	}

	/**
	 * Calculate and emit metrics
	 */
	private async calculateAndEmitMetrics(stats?: any): Promise<void> {
		if (this.tradeBuffer.length === 0) return;

		// Process trade data for metrics
		const vpData = VolumeProfileProcessor.processTradeData(
			this.tradeBuffer,
			{
				numPriceLevels: this.settings.numPriceLevels,
			}
		);

		// Calculate POC and Value Area
		const poc = VolumeProfileProcessor.calculatePOC(vpData.profile);
		const valueArea = VolumeProfileProcessor.calculateValueArea(vpData.profile, 0.7);

		// Calculate price changes
		const firstTrade = this.tradeBuffer[0];
		const lastTrade = this.tradeBuffer[this.tradeBuffer.length - 1];
		const priceChange = lastTrade.price - firstTrade.price;
		const priceChangePercent = (priceChange / firstTrade.price) * 100;

		// Total volume
		const totalVolume = this.tradeBuffer.reduce((sum, t) => sum + t.volume, 0);

		const metrics: VolumeProfileMetrics = {
			currentPrice: lastTrade.price,
			priceChange,
			priceChangePercent,
			totalTrades: this.tradeBuffer.length,
			totalVolume,
			poc,
			valueAreaHigh: valueArea?.high || null,
			valueAreaLow: valueArea?.low || null,
			high24h: stats?.highPrice,
			low24h: stats?.lowPrice,
			volume24h: stats?.volume,
		};

		if (this.onMetricsUpdate) {
			this.onMetricsUpdate(metrics);
		}
	}

	/**
	 * Start live streaming mode
	 */
	startLiveMode(): void {
		if (this.isLiveMode) {
			console.warn('Live mode already active');
			return;
		}

		if (!this.binanceAPI) {
			throw new Error('Manager not initialized');
		}

		this.binanceWS = new BinanceWebSocket(this.settings.symbol);
		
		this.binanceWS.connect((trade) => {
			this.handleNewTrade(trade);
		});

		this.isLiveMode = true;
		this.liveTradeCount = 0;
		this.updateStatus('Live Streaming', true);
		
		console.log('✓ Live mode started');
	}

	/**
	 * Stop live streaming mode
	 */
	stopLiveMode(): void {
		if (!this.isLiveMode) {
			return;
		}

		if (this.binanceWS) {
			this.binanceWS.disconnect();
			this.binanceWS = null;
		}

		this.isLiveMode = false;
		this.updateStatus('Connected', true);
		
		console.log('✓ Live mode stopped');
	}

	/**
	 * Handle new trade from WebSocket
	 */
	private handleNewTrade(trade: TradeData): void {
		// Add to buffer
		this.tradeBuffer.push(trade);

		// Keep buffer size manageable
		if (this.tradeBuffer.length > MAX_TRADE_BUFFER_SIZE) {
			this.tradeBuffer = this.tradeBuffer.slice(-Math.floor(MAX_TRADE_BUFFER_SIZE / 2));
		}

		// Emit trade event
		if (this.onTradeReceived) {
			this.onTradeReceived(trade);
		}

		// Update profile every N trades
		this.liveTradeCount++;
		if (this.liveTradeCount >= LIVE_UPDATE_FREQUENCY) {
			this.updateVolumeProfile();
			this.calculateAndEmitMetrics();
			this.liveTradeCount = 0;
		}
	}

	/**
	 * Update settings
	 */
	updateSettings(newSettings: Partial<VolumeProfileSettings>): void {
		const needsReload = 
			newSettings.symbol && newSettings.symbol !== this.settings.symbol ||
			newSettings.timeRange && newSettings.timeRange !== this.settings.timeRange;

		// Update settings
		this.settings = { ...this.settings, ...newSettings };

		// Save to localStorage
		saveVolumeProfileSettings(this.settings);

		// Reinitialize Binance API if symbol changed
		if (newSettings.symbol) {
			this.binanceAPI = new BinanceAPI({ symbol: this.settings.symbol });
			
			// Restart live mode if active
			if (this.isLiveMode) {
				this.stopLiveMode();
				this.startLiveMode();
			}
		}

		// Reload data if needed
		if (needsReload) {
			this.loadData().catch(error => {
				console.error('Error reloading data:', error);
			});
		} else {
			// Just update the display
			this.updateVolumeProfile();
		}

		console.log('✓ Settings updated:', this.settings);
	}

	/**
	 * Get current settings
	 */
	getSettings(): VolumeProfileSettings {
		return { ...this.settings };
	}

	/**
	 * Clear all volume profiles
	 */
	clearVolumeProfiles(): void {
		if (!this.series) return;

		this.volumeProfiles.forEach(vp => {
			this.series!.detachPrimitive(vp);
		});
		
		this.volumeProfiles = [];
	}

	/**
	 * Refresh data (manual reload)
	 */
	async refresh(): Promise<void> {
		await this.loadData();
		console.log('✓ Data refreshed');
	}

	/**
	 * Start auto-refresh
	 */
	private startAutoRefresh(): void {
		if (this.autoRefreshInterval) {
			return;
		}

		this.autoRefreshInterval = setInterval(() => {
			if (!this.isLiveMode) {
				this.refresh().catch(error => {
					console.error('Auto-refresh error:', error);
				});
			}
		}, AUTO_REFRESH_INTERVAL);

		console.log('✓ Auto-refresh started');
	}

	/**
	 * Stop auto-refresh
	 */
	private stopAutoRefresh(): void {
		if (this.autoRefreshInterval) {
			clearInterval(this.autoRefreshInterval);
			this.autoRefreshInterval = null;
			console.log('✓ Auto-refresh stopped');
		}
	}

	/**
	 * Set metrics update callback
	 */
	onMetrics(callback: (metrics: VolumeProfileMetrics) => void): void {
		this.onMetricsUpdate = callback;
	}

	/**
	 * Set status change callback
	 */
	onStatus(callback: (status: string, isConnected: boolean) => void): void {
		this.onStatusChange = callback;
	}

	/**
	 * Set trade received callback
	 */
	onTrade(callback: (trade: TradeData) => void): void {
		this.onTradeReceived = callback;
	}

	/**
	 * Update status and emit event
	 */
	private updateStatus(status: string, isConnected: boolean): void {
		if (this.onStatusChange) {
			this.onStatusChange(status, isConnected);
		}
	}

	/**
	 * Check if live mode is active
	 */
	isLive(): boolean {
		return this.isLiveMode;
	}

	/**
	 * Get trade buffer
	 */
	getTrades(): TradeData[] {
		return [...this.tradeBuffer];
	}

	/**
	 * Cleanup and destroy
	 */
	destroy(): void {
		// Stop live mode
		this.stopLiveMode();

		// Stop auto-refresh
		this.stopAutoRefresh();

		// Clear profiles
		this.clearVolumeProfiles();

		// Clear references
		this.chart = null;
		this.series = null;
		this.binanceAPI = null;
		this.tradeBuffer = [];

		console.log('✓ VolumeProfileManager destroyed');
	}
}

