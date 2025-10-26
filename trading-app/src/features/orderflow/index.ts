/**
 * Volume Profile Application
 * Main entry point following the multi-timeframe pattern
 */

import { VolumeProfileChart } from './components/VolumeProfileChart';
import { VolumeProfileManager } from './components/VolumeProfileManager';
import {
	AVAILABLE_SYMBOLS,
	TIME_RANGE_OPTIONS,
	DEFAULT_PRICE_LEVELS,
	DEFAULT_SYMBOL,
	DEFAULT_TIME_RANGE,
	DEFAULT_DISPLAY_MODE,
	MAX_LIVE_TRADES_DISPLAY,
	MAX_TRADE_BUFFER_SIZE,
} from './constants';
import { TradeData, VolumeProfileMetrics } from './utils/types';

// UI Elements
const loadingEl = document.getElementById('loading')!;
const errorMessageEl = document.getElementById('errorMessage')!;
const statusDotEl = document.getElementById('statusDot')!;
const statusTextEl = document.getElementById('statusText')!;
const symbolSelectEl = document.getElementById('symbolSelect') as HTMLSelectElement;
const toggleLiveBtn = document.getElementById('toggleLiveBtn')!;
const snapshotBtn = document.getElementById('snapshotBtn')!;
const modeIndicatorEl = document.getElementById('modeIndicator')!;
const metricsContainerEl = document.getElementById('metricsContainer')!;
const liveTradesListEl = document.getElementById('liveTradesList')!;
const totalTradesCountEl = document.getElementById('totalTradesCount')!;
const showingTradesCountEl = document.getElementById('showingTradesCount')!;
const buySellRatioEl = document.getElementById('buySellRatio')!;

// Filter Elements
const filterSideEl = document.getElementById('filterSide') as HTMLSelectElement;
const filterMakerEl = document.getElementById('filterMaker') as HTMLSelectElement;
const filterMinVolumeEl = document.getElementById('filterMinVolume') as HTMLInputElement;
const filterMinTotalEl = document.getElementById('filterMinTotal') as HTMLInputElement;
const filterMinPriceEl = document.getElementById('filterMinPrice') as HTMLInputElement;
const filterMaxPriceEl = document.getElementById('filterMaxPrice') as HTMLInputElement;
const filterLimitEl = document.getElementById('filterLimit') as HTMLSelectElement;
const clearFiltersBtn = document.getElementById('clearFiltersBtn')!;

// Global state
let vpChart: VolumeProfileChart | null = null;
let vpManager: VolumeProfileManager | null = null;

// Option 3: Only store filtered trades
let allRawTrades: TradeData[] = []; // All trades (for stats)
let filteredTradesList: TradeData[] = []; // Only trades matching filters
let displaySnapshot: TradeData[] = []; // Fixed snapshot for display
let isSnapshotMode: boolean = false;

/**
 * Show/Hide loading
 */
function showLoading(show: boolean): void {
	loadingEl.style.display = show ? 'flex' : 'none';
}

/**
 * Show error message
 */
function showError(message: string): void {
	errorMessageEl.textContent = message;
	errorMessageEl.style.display = 'block';
	setTimeout(() => {
		errorMessageEl.style.display = 'none';
	}, 5000);
}

/**
 * Update status indicator
 */
function updateStatus(text: string, isConnected: boolean): void {
	statusTextEl.textContent = text;
	statusDotEl.className = 'status-dot';
	if (isConnected) {
		statusDotEl.classList.add('connected');
	} else {
		statusDotEl.classList.add('loading');
	}
}

/**
 * Update metrics display
 */
function updateMetrics(metrics: VolumeProfileMetrics): void {
	const priceChangeClass = metrics.priceChange >= 0 ? 'positive' : 'negative';
	
	metricsContainerEl.innerHTML = `
		<div class="metric-card">
			<div class="metric-label">Current Price</div>
			<div class="metric-value price-value">$${metrics.currentPrice.toLocaleString('en-US', {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})}</div>
			<div class="metric-subtext ${priceChangeClass}">
				${metrics.priceChange >= 0 ? '+' : ''}${metrics.priceChangePercent.toFixed(2)}%
			</div>
		</div>

		<div class="metric-card">
			<div class="metric-label">24h High</div>
			<div class="metric-value">${metrics.high24h ? '$' + metrics.high24h.toLocaleString() : 'N/A'}</div>
		</div>

		<div class="metric-card">
			<div class="metric-label">24h Low</div>
			<div class="metric-value">${metrics.low24h ? '$' + metrics.low24h.toLocaleString() : 'N/A'}</div>
		</div>

		<div class="metric-card">
			<div class="metric-label">24h Volume</div>
			<div class="metric-value">${metrics.volume24h?.toFixed(0).toLocaleString() || 'N/A'}</div>
			<div class="metric-subtext">BTC</div>
		</div>
	`;
}

/**
 * Check if a trade matches current filter criteria
 */
function tradeMatchesFilters(t: TradeData): boolean {
	const filterSide = filterSideEl.value;
	const filterMaker = filterMakerEl.value;
	const minVolume = parseFloat(filterMinVolumeEl.value) || 0;
	const minTotal = parseFloat(filterMinTotalEl.value) || 0;
	const minPrice = parseFloat(filterMinPriceEl.value) || 0;
	const maxPrice = parseFloat(filterMaxPriceEl.value) || Infinity;

	// Filter by side
	if (filterSide !== 'all' && t.side.toLowerCase() !== filterSide) {
		return false;
	}

	// Filter by maker/taker
	if (filterMaker === 'maker' && !t.isMaker) return false;
	if (filterMaker === 'taker' && t.isMaker) return false;

	// Filter by volume (BTC)
	if (t.volume < minVolume) return false;

	// Filter by total USD value (price * volume)
	const total = t.price * t.volume;
	if (total < minTotal) return false;

	// Filter by price range
	if (t.price < minPrice || t.price > maxPrice) return false;

	return true;
}

/**
 * Get trades to display (respects limit)
 */
function getDisplayTrades(): TradeData[] {
	const limit = parseInt(filterLimitEl.value) || 100;
	const dataset = isSnapshotMode ? displaySnapshot : filteredTradesList;
	return dataset.slice(0, limit);
}

function updateTradeStats(): void {
	// Use the appropriate dataset
	const dataset = isSnapshotMode ? displaySnapshot : filteredTradesList;
	
	const totalTrades = dataset.length;
	const buyTrades = dataset.filter(t => t.side.toLowerCase() === 'buy').length;
	const sellTrades = dataset.filter(t => t.side.toLowerCase() === 'sell').length;
	const ratio = sellTrades > 0 ? (buyTrades / sellTrades).toFixed(2) : '0.00';

	totalTradesCountEl.textContent = totalTrades.toLocaleString();
	buySellRatioEl.textContent = ratio;
	buySellRatioEl.style.color = parseFloat(ratio) > 1 ? '#26a69a' : '#ef5350';

	// Update showing count
	const displayCount = getDisplayTrades().length;
	showingTradesCountEl.textContent = displayCount.toLocaleString();
	
	// Log stats
	console.log(`📊 Trades: ${displayCount}/${totalTrades} shown after filters (${isSnapshotMode ? 'SNAPSHOT' : 'LIVE'} mode)`);
}

function updateLiveTrades(trade: TradeData): void {
	// 1. Always add to raw buffer (for statistics)
	allRawTrades.unshift(trade);
	if (allRawTrades.length > MAX_TRADE_BUFFER_SIZE) {
		allRawTrades = allRawTrades.slice(0, MAX_TRADE_BUFFER_SIZE);
	}
	
	// 2. Only add if it matches current filters
	if (!isSnapshotMode && tradeMatchesFilters(trade)) {
		filteredTradesList.unshift(trade);
		
		// Keep filtered list manageable (but don't remove matching trades too aggressively)
		if (filteredTradesList.length > MAX_TRADE_BUFFER_SIZE * 2) {
			filteredTradesList = filteredTradesList.slice(0, MAX_TRADE_BUFFER_SIZE * 2);
		}
		
		renderTrades();
		updateTradeStats();
	}
	// If in snapshot mode or doesn't match filter, do nothing
}

/**
 * Take a snapshot of current trades
 */
function takeSnapshot(): void {
	displaySnapshot = [...filteredTradesList]; // Copy current filtered trades
	isSnapshotMode = true;
	
	// Update UI
	snapshotBtn.textContent = '🔓 Unfreeze';
	snapshotBtn.style.background = '#ef5350';
	modeIndicatorEl.textContent = '📸 FROZEN';
	modeIndicatorEl.style.color = '#9c27b0';
	modeIndicatorEl.style.borderColor = '#9c27b0';
	
	console.log(`📸 Snapshot taken: ${displaySnapshot.length} trades frozen`);
	
	renderTrades();
	updateTradeStats();
}

/**
 * Exit snapshot mode and return to live
 */
function exitSnapshot(): void {
	isSnapshotMode = false;
	displaySnapshot = [];
	
	// Update UI
	snapshotBtn.textContent = '📸 Freeze View';
	snapshotBtn.style.background = '#9c27b0';
	modeIndicatorEl.textContent = '🔴 LIVE MODE';
	modeIndicatorEl.style.color = '#26a69a';
	modeIndicatorEl.style.borderColor = '#2b2b43';
	
	console.log('🔴 Returned to live mode');
	
	renderTrades();
	updateTradeStats();
}

function renderTrades(): void {
	// Get trades to display (already filtered!)
	const tradesToDisplay = getDisplayTrades();

	if (tradesToDisplay.length === 0) {
		liveTradesListEl.innerHTML = `
			<tr>
				<td colspan="6" style="text-align: center; padding: 40px; color: #787b86;">
					No trades match the current filters<br/>
					<small style="color: #666;">Try adjusting your filters or clearing them</small>
				</td>
			</tr>
		`;
		return;
	}

	liveTradesListEl.innerHTML = tradesToDisplay
		.map((t) => {
			const side = t.side.toLowerCase();
			const time = typeof t.tradeTime === 'number' 
				? new Date(t.tradeTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
				: new Date(t.tradeTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
			
			const total = t.price * t.volume;

			return `
			<tr class="${side}">
				<td class="trade-time">${time}</td>
				<td class="trade-price ${side}">$${t.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
				<td class="trade-volume">${t.volume.toFixed(6)}</td>
				<td class="trade-volume">$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
				<td><span class="trade-maker ${t.isMaker ? 'maker' : ''}">${t.isMaker ? 'Maker' : 'Taker'}</span></td>
				<td class="trade-side ${side}">${side.toUpperCase()}</td>
			</tr>
		`;
		})
		.join('');
}

/**
 * Initialize the application
 */
async function initialize(): Promise<void> {
	showLoading(true);

	try {
		// Populate symbol selector
		symbolSelectEl.innerHTML = AVAILABLE_SYMBOLS.map(
			(sym) =>
				`<option value="${sym.symbol}" ${sym.symbol === DEFAULT_SYMBOL ? 'selected' : ''}>${sym.label}</option>`
		).join('');


		// Create chart
		vpChart = new VolumeProfileChart({
			container: 'chartContainer',
		});

		vpManager = vpChart.getManager();

		// Setup callbacks
		vpManager.onMetrics((metrics) => {
			updateMetrics(metrics);
		});

		vpManager.onStatus((status, isConnected) => {
			updateStatus(status, isConnected);
		});

		vpManager.onTrade((trade) => {
			updateLiveTrades(trade);
		});

		// Load initial data
		await vpChart.loadData();

		// Setup event listeners
		setupEventListeners();

		console.log('✓ Application initialized');
	} catch (error) {
		console.error('Error initializing application:', error);
		showError('Failed to initialize application. Please refresh the page.');
	} finally {
		showLoading(false);
	}
}

/**
 * Setup all event listeners
 */
function setupEventListeners(): void {
	// Symbol change
	symbolSelectEl.addEventListener('change', (e) => {
		const symbol = (e.target as HTMLSelectElement).value;
		vpManager?.updateSettings({ symbol });
		// Clear all buffers when symbol changes
		allRawTrades = [];
		filteredTradesList = [];
		displaySnapshot = [];
		isSnapshotMode = false;
		renderTrades();
		updateTradeStats();
		console.log(`Symbol changed to: ${symbol}`);
	});

	// Toggle live mode
	toggleLiveBtn.addEventListener('click', () => {
		if (!vpManager) return;

		if (vpManager.isLive()) {
			vpManager.stopLiveMode();
			toggleLiveBtn.textContent = '▶️ Start Live';
			toggleLiveBtn.classList.remove('danger');
			toggleLiveBtn.classList.add('secondary');
			snapshotBtn.disabled = true;
		} else {
			vpManager.startLiveMode();
			toggleLiveBtn.textContent = '⏸️ Stop Live';
			toggleLiveBtn.classList.remove('secondary');
			toggleLiveBtn.classList.add('danger');
			snapshotBtn.disabled = false;
		}
	});

	// Snapshot mode toggle
	snapshotBtn.addEventListener('click', () => {
		if (isSnapshotMode) {
			exitSnapshot();
		} else {
			takeSnapshot();
		}
	});

	// Filter changes - rebuild filtered list from raw data
	const rebuildFiltered = () => {
		// Rebuild filtered list from all raw trades
		filteredTradesList = allRawTrades.filter(tradeMatchesFilters);
		renderTrades();
		updateTradeStats();
		console.log('🔄 Filters changed, rebuilt filtered list');
	};
	
	filterSideEl.addEventListener('change', rebuildFiltered);
	filterMakerEl.addEventListener('change', rebuildFiltered);
	filterMinVolumeEl.addEventListener('input', rebuildFiltered);
	filterMinTotalEl.addEventListener('input', rebuildFiltered);
	filterMinPriceEl.addEventListener('input', rebuildFiltered);
	filterMaxPriceEl.addEventListener('input', rebuildFiltered);
	filterLimitEl.addEventListener('change', renderTrades);

	// Clear filters button
	clearFiltersBtn.addEventListener('click', () => {
		filterSideEl.value = 'all';
		filterMakerEl.value = 'all';
		filterMinVolumeEl.value = '0';
		filterMinTotalEl.value = '0';
		filterMinPriceEl.value = '';
		filterMaxPriceEl.value = '';
		filterLimitEl.value = '100';
		
		// Rebuild filtered list with no filters
		filteredTradesList = [...allRawTrades];
		renderTrades();
		updateTradeStats();
		console.log('✓ Filters cleared, showing all trades');
	});
}

/**
 * Handle window resize
 */
let resizeTimeout: number;
window.addEventListener('resize', () => {
	clearTimeout(resizeTimeout);
	resizeTimeout = window.setTimeout(() => {
		vpChart?.resize();
		console.log('Window resized');
	}, 250);
});

// Initialize the application
initialize();

// Expose for debugging
if (typeof window !== 'undefined') {
	(window as any).vpChart = vpChart;
	(window as any).vpManager = vpManager;
}

