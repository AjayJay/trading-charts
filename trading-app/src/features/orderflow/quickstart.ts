/**
 * Quick Start Guide - BTC Volume Profile from Binance
 * 
 * This is the simplest way to get started with live BTC data
 */

import { createVolumeProfileFromData } from './components/VolumeProfileChart';
import { BinanceAPI, BinanceWebSocket } from './utils/binanceAPI';

/**
 * EXAMPLE 1: Basic BTC Volume Profile (One-liner!)
 * 
 * This fetches the last 1000 BTC trades and displays a volume profile
 */
export async function quickStartBasic() {
	// Fetch BTC trades from Binance
	const binance = new BinanceAPI({ symbol: 'BTCUSDT' });
	const trades = await binance.fetchRecentTrades(1000);

	// Create chart with volume profile
	const chart = createVolumeProfileFromData('chart-container', trades, {
		volumeProfileOptions: {
			separateBuySell: true, // Show buy/sell separately
		},
	});

	console.log('✅ Volume profile loaded with', trades.length, 'trades');
	return chart;
}

/**
 * EXAMPLE 2: Last 4 Hours of BTC Data
 */
export async function last4HoursBTC() {
	const binance = new BinanceAPI({ symbol: 'BTCUSDT' });
	
	// Fetch last 4 hours of trades (up to 5000 trades)
	const trades = await binance.fetchTradesLastHours(4, 5000);
	
	const chart = createVolumeProfileFromData('chart-container', trades, {
		volumeProfileOptions: {
			buyColor: 'rgba(0, 200, 0, 0.7)',
			sellColor: 'rgba(200, 0, 0, 0.7)',
			separateBuySell: true,
		},
		processorConfig: {
			numPriceLevels: 50,
		},
	});

	console.log('✅ Loaded', trades.length, 'trades from last 4 hours');
	return chart;
}

/**
 * EXAMPLE 3: Live Real-Time Updates
 * 
 * Stream live trades from Binance WebSocket and update the volume profile
 */
export async function liveRealTimeUpdates() {
	// First, load initial data
	const binance = new BinanceAPI({ symbol: 'BTCUSDT' });
	let allTrades = await binance.fetchTradesLastHours(1, 2000);

	const chart = createVolumeProfileFromData('chart-container', allTrades, {
		volumeProfileOptions: {
			separateBuySell: true,
		},
	});

	// Now start live feed
	const ws = new BinanceWebSocket('BTCUSDT');
	ws.connect((newTrade) => {
		// Add new trade to buffer
		allTrades.push(newTrade);
		
		// Keep only last 2000 trades
		if (allTrades.length > 2000) {
			allTrades = allTrades.slice(-2000);
		}

		// Update profile every 50 trades
		if (allTrades.length % 50 === 0) {
			chart.clearVolumeProfiles();
			chart.addVolumeProfileFromTrades(allTrades);
			console.log('📊 Updated with', allTrades.length, 'trades');
		}
	});

	console.log('✅ Live feed started!');
	return { chart, ws };
}

/**
 * EXAMPLE 4: ETH Volume Profile
 */
export async function ethVolumeProfile() {
	const binance = new BinanceAPI({ symbol: 'ETHUSDT' });
	const trades = await binance.fetchTradesLastHours(4, 5000);

	const chart = createVolumeProfileFromData('chart-container', trades, {
		volumeProfileOptions: {
			separateBuySell: true,
		},
	});

	console.log('✅ ETH volume profile loaded');
	return chart;
}

/**
 * EXAMPLE 5: Get Current BTC Price and Stats
 */
export async function getCurrentBTCStats() {
	const binance = new BinanceAPI({ symbol: 'BTCUSDT' });
	
	// Get current price
	const price = await binance.getCurrentPrice();
	console.log('Current BTC price:', price);

	// Get 24h stats
	const stats = await binance.get24hStats();
	console.log('24h Stats:', {
		high: stats.highPrice,
		low: stats.lowPrice,
		volume: stats.volume,
		priceChange: stats.priceChangePercent + '%',
	});

	return { price, stats };
}

// Make it easy to run from console
if (typeof window !== 'undefined') {
	(window as any).quickStartBTC = {
		basic: quickStartBasic,
		last4Hours: last4HoursBTC,
		live: liveRealTimeUpdates,
		eth: ethVolumeProfile,
		stats: getCurrentBTCStats,
	};
	console.log('💡 Quick start functions available: window.quickStartBTC');
}

