/**
 * Volume Profile Example
 * 
 * This example demonstrates how to create a volume profile chart
 * from trade data with columns: Trade Time, Price, Volume, Is Maker, Side
 */

import { VolumeProfileChart, createVolumeProfileFromData } from './components/VolumeProfileChart';
import { TradeData } from './utils/types';
import { VolumeProfileProcessor } from './utils/volumeProfileProcessor';

/**
 * Example 1: Create volume profile from sample trade data
 */
export function example1_BasicVolumeProfile() {
	// Sample trade data - replace with your actual data
	const trades: TradeData[] = [
		{ tradeTime: Date.now() - 3600000, price: 50000, volume: 0.5, isMaker: true, side: 'buy' },
		{ tradeTime: Date.now() - 3500000, price: 50100, volume: 0.3, isMaker: false, side: 'sell' },
		{ tradeTime: Date.now() - 3400000, price: 50050, volume: 0.8, isMaker: true, side: 'buy' },
		{ tradeTime: Date.now() - 3300000, price: 50150, volume: 0.2, isMaker: false, side: 'sell' },
		{ tradeTime: Date.now() - 3200000, price: 50000, volume: 1.2, isMaker: true, side: 'buy' },
		{ tradeTime: Date.now() - 3100000, price: 49950, volume: 0.6, isMaker: false, side: 'sell' },
		{ tradeTime: Date.now() - 3000000, price: 50050, volume: 0.9, isMaker: true, side: 'buy' },
		{ tradeTime: Date.now() - 2900000, price: 50100, volume: 0.4, isMaker: false, side: 'sell' },
	];

	// Create chart with volume profile
	const chart = createVolumeProfileFromData('chart-container', trades, {
		volumeProfileOptions: {
			buyColor: 'rgba(0, 200, 0, 0.7)',
			sellColor: 'rgba(200, 0, 0, 0.7)',
			separateBuySell: false, // Set to true to show buy/sell separately
		},
		processorConfig: {
			numPriceLevels: 30,
			separateBuySell: true,
		},
	});

	return chart;
}

/**
 * Example 2: Advanced usage with manual chart setup
 */
export function example2_AdvancedVolumeProfile() {
	// Create chart instance
	const chart = new VolumeProfileChart({
		container: 'chart-container',
		seriesType: 'line',
		chartOptions: {
			width: 800,
			height: 600,
			layout: {
				background: { color: '#1e222d' },
				textColor: '#d1d4dc',
			},
		},
		volumeProfileOptions: {
			buyColor: 'rgba(0, 200, 0, 0.7)',
			sellColor: 'rgba(200, 0, 0, 0.7)',
			separateBuySell: true, // Show buy and sell volumes separately
		},
	});

	// Load your trade data
	const trades = loadTradeDataFromCSV(); // Your function to load data

	// Add volume profile
	chart.addVolumeProfileFromTrades(trades, {
		numPriceLevels: 50,
		tickSize: 10, // Fixed tick size
		separateBuySell: true,
	});

	// Set some price data for the chart (optional)
	const lineData = [
		{ time: Math.floor(Date.now() / 1000) - 3600, value: 50000 },
		{ time: Math.floor(Date.now() / 1000) - 1800, value: 50100 },
		{ time: Math.floor(Date.now() / 1000), value: 50050 },
	];
	chart.setSeriesData(lineData);

	// Fit content
	chart.fitContent();

	return chart;
}

/**
 * Example 3: Multiple volume profiles for different time periods
 */
export function example3_MultipleProfiles() {
	const chart = new VolumeProfileChart({
		container: 'chart-container',
		seriesType: 'line',
		volumeProfileOptions: {
			separateBuySell: true,
		},
	});

	// Load trade data
	const trades = loadTradeDataFromCSV();

	// Create volume profiles for every hour (3600000 ms)
	const profiles = chart.addMultipleProfiles(
		trades,
		3600000, // 1 hour time window
		{
			numPriceLevels: 30,
		}
	);

	console.log(`Created ${profiles.length} volume profiles`);

	chart.fitContent();
	return chart;
}

/**
 * Example 4: Calculate volume profile metrics
 */
export function example4_VolumeProfileMetrics() {
	const trades: TradeData[] = loadTradeDataFromCSV();

	// Process trade data
	const vpData = VolumeProfileProcessor.processTradeData(trades, {
		numPriceLevels: 50,
	});

	// Calculate Point of Control (price with highest volume)
	const poc = VolumeProfileProcessor.calculatePOC(vpData.profile);
	console.log('Point of Control (POC):', poc);

	// Calculate Value Area (70% of volume)
	const valueArea = VolumeProfileProcessor.calculateValueArea(vpData.profile, 0.7);
	console.log('Value Area:', valueArea);

	// Create chart with the data
	const chart = new VolumeProfileChart({
		container: 'chart-container',
		seriesType: 'line',
	});
	chart.addVolumeProfile(vpData);
	chart.fitContent();

	return { chart, poc, valueArea };
}

/**
 * Example 5: Loading data from CSV
 */
export function example5_LoadFromCSV(csvText: string) {
	// Parse CSV (assuming first row is header)
	const lines = csvText.trim().split('\n');
	const headers = lines[0].split(',');

	const trades: TradeData[] = lines.slice(1).map(line => {
		const values = line.split(',');
		return {
			tradeTime: values[0], // Trade Time
			price: parseFloat(values[1]), // Price
			volume: parseFloat(values[2]), // Volume (Quantity)
			isMaker: values[3].toLowerCase() === 'true', // Is Maker
			side: values[4].trim().toLowerCase() as 'buy' | 'sell', // Side
		};
	});

	// Create chart
	const chart = createVolumeProfileFromData('chart-container', trades, {
		volumeProfileOptions: {
			separateBuySell: true,
		},
		processorConfig: {
			numPriceLevels: 40,
		},
	});

	return chart;
}

/**
 * Example 6: Loading data from JSON
 */
export function example6_LoadFromJSON(jsonData: any[]) {
	const trades: TradeData[] = jsonData.map(item => ({
		tradeTime: item['Trade Time'] || item.tradeTime,
		price: parseFloat(item.Price || item.price),
		volume: parseFloat(item['Volume (Quantity)'] || item.volume),
		isMaker: item['Is Maker'] === true || item.isMaker === true,
		side: (item.Side || item.side).toLowerCase() as 'buy' | 'sell',
	}));

	const chart = createVolumeProfileFromData('chart-container', trades);
	return chart;
}

/**
 * Helper function to load trade data from CSV file
 */
function loadTradeDataFromCSV(): TradeData[] {
	// This is a placeholder - replace with actual CSV loading logic
	// You can use FileReader API or fetch() to load CSV data
	return [
		{ tradeTime: Date.now() - 3600000, price: 50000, volume: 0.5, isMaker: true, side: 'buy' },
		{ tradeTime: Date.now() - 3500000, price: 50100, volume: 0.3, isMaker: false, side: 'sell' },
		// ... more data
	];
}

/**
 * Example 7: Real-time updates
 */
export function example7_RealTimeUpdates() {
	const chart = new VolumeProfileChart({
		container: 'chart-container',
		seriesType: 'line',
	});

	let tradeBuffer: TradeData[] = [];

	// Function to add new trade
	function addTrade(trade: TradeData) {
		tradeBuffer.push(trade);

		// Update volume profile every 100 trades or every 5 seconds
		if (tradeBuffer.length >= 100) {
			updateVolumeProfile();
		}
	}

	function updateVolumeProfile() {
		if (tradeBuffer.length === 0) return;

		// Clear existing profiles
		chart.clearVolumeProfiles();

		// Add new profile with updated data
		chart.addVolumeProfileFromTrades(tradeBuffer, {
			numPriceLevels: 50,
		});
	}

	// Set up periodic updates
	setInterval(updateVolumeProfile, 5000);

	return { chart, addTrade };
}

/**
 * Export all examples as a demo object
 */
export const VolumeProfileExamples = {
	basicExample: example1_BasicVolumeProfile,
	advancedExample: example2_AdvancedVolumeProfile,
	multipleProfiles: example3_MultipleProfiles,
	withMetrics: example4_VolumeProfileMetrics,
	fromCSV: example5_LoadFromCSV,
	fromJSON: example6_LoadFromJSON,
	realTime: example7_RealTimeUpdates,
};

