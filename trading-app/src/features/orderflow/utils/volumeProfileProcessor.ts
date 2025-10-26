import { Time } from 'lightweight-charts';
import { VolumeProfileData, VolumeProfileDataPoint } from '../components/VolumeProfile';
import { TradeData, PriceLevelVolume, VolumeProfileConfig } from './types';

/**
 * Process raw trade data into volume profile data for visualization
 */
export class VolumeProfileProcessor {
	/**
	 * Convert trade data array into volume profile data
	 * @param trades Array of trade data
	 * @param config Configuration options
	 * @returns Volume profile data ready for chart
	 */
	static processTradeData(
		trades: TradeData[],
		config: VolumeProfileConfig = {}
	): VolumeProfileData {
		if (trades.length === 0) {
			throw new Error('Trade data array is empty');
		}

		// Sort trades by time
		const sortedTrades = [...trades].sort((a, b) => {
			const timeA = typeof a.tradeTime === 'string'
				? new Date(a.tradeTime).getTime()
				: a.tradeTime;
			const timeB = typeof b.tradeTime === 'string'
				? new Date(b.tradeTime).getTime()
				: b.tradeTime;
			return timeA - timeB;
		});

		// Get price range
		const prices = sortedTrades.map(t => t.price);
		const minPrice = config.priceRange?.min ?? Math.min(...prices);
		const maxPrice = config.priceRange?.max ?? Math.max(...prices);

		// Calculate price levels
		const numLevels = config.numPriceLevels || 50;
		const tickSize = config.tickSize || (maxPrice - minPrice) / numLevels;

		// Aggregate volume by price levels
		const priceLevels = this.aggregateVolumeByPrice(
			sortedTrades,
			minPrice,
			maxPrice,
			tickSize
		);

		// Convert to volume profile format
		const profile: VolumeProfileDataPoint[] = priceLevels.map(level => ({
			price: level.price,
			vol: level.totalVolume,
			buyVol: level.buyVolume,
			sellVol: level.sellVolume,
		}));

		// Sort by price (ascending)
		profile.sort((a, b) => a.price - b.price);

		// Get the starting time (first trade time)
		const firstTradeTime = sortedTrades[0].tradeTime;
		const time = this.convertToChartTime(firstTradeTime);

		return {
			time,
			profile,
			width: 10, // Default width in bars
		};
	}

	/**
	 * Aggregate volume by price levels
	 */
	private static aggregateVolumeByPrice(
		trades: TradeData[],
		minPrice: number,
		maxPrice: number,
		tickSize: number
	): PriceLevelVolume[] {
		const priceLevelMap = new Map<number, PriceLevelVolume>();

		// Initialize price levels
		const numLevels = Math.ceil((maxPrice - minPrice) / tickSize);
		for (let i = 0; i <= numLevels; i++) {
			const price = minPrice + i * tickSize;
			priceLevelMap.set(price, {
				price,
				totalVolume: 0,
				buyVolume: 0,
				sellVolume: 0,
				makerVolume: 0,
				takerVolume: 0,
				tradeCount: 0,
			});
		}

		// Aggregate trades into price levels
		trades.forEach(trade => {
			// Find the nearest price level
			const levelIndex = Math.round((trade.price - minPrice) / tickSize);
			const priceLevel = minPrice + levelIndex * tickSize;

			const level = priceLevelMap.get(priceLevel);
			if (level) {
				level.totalVolume += trade.volume;
				level.tradeCount += 1;

				// Aggregate by side
				const isBuy = trade.side.toLowerCase() === 'buy';
				if (isBuy) {
					level.buyVolume += trade.volume;
				} else {
					level.sellVolume += trade.volume;
				}

				// Aggregate by maker/taker
				if (trade.isMaker) {
					level.makerVolume += trade.volume;
				} else {
					level.takerVolume += trade.volume;
				}
			}
		});

		// Filter out empty levels and convert to array
		return Array.from(priceLevelMap.values()).filter(
			level => level.totalVolume > 0
		);
	}

	/**
	 * Convert timestamp to chart time format
	 */
	private static convertToChartTime(timestamp: number | string): Time {
		const time = typeof timestamp === 'string'
			? new Date(timestamp).getTime()
			: timestamp;

		// Convert to seconds and return as Time
		return Math.floor(time / 1000) as Time;
	}

	/**
	 * Process multiple time periods to create multiple volume profiles
	 */
	static processMultipleProfiles(
		trades: TradeData[],
		timeWindowMs: number,
		config: VolumeProfileConfig = {}
	): VolumeProfileData[] {
		if (trades.length === 0) {
			return [];
		}

		// Sort trades by time
		const sortedTrades = [...trades].sort((a, b) => {
			const timeA = typeof a.tradeTime === 'string'
				? new Date(a.tradeTime).getTime()
				: a.tradeTime;
			const timeB = typeof b.tradeTime === 'string'
				? new Date(b.tradeTime).getTime()
				: b.tradeTime;
			return timeA - timeB;
		});

		// Group trades by time windows
		const timeWindows = this.groupByTimeWindow(sortedTrades, timeWindowMs);

		// Process each time window
		return timeWindows.map(windowTrades =>
			this.processTradeData(windowTrades, config)
		);
	}

	/**
	 * Group trades by time windows
	 */
	private static groupByTimeWindow(
		trades: TradeData[],
		windowMs: number
	): TradeData[][] {
		if (trades.length === 0) return [];

		const windows: TradeData[][] = [];
		let currentWindow: TradeData[] = [];

		const getTime = (trade: TradeData) =>
			typeof trade.tradeTime === 'string'
				? new Date(trade.tradeTime).getTime()
				: trade.tradeTime;

		const startTime = getTime(trades[0]);
		let windowStartTime = startTime;

		trades.forEach(trade => {
			const tradeTime = getTime(trade);
			if (tradeTime - windowStartTime >= windowMs) {
				if (currentWindow.length > 0) {
					windows.push(currentWindow);
				}
				currentWindow = [trade];
				windowStartTime = tradeTime;
			} else {
				currentWindow.push(trade);
			}
		});

		// Add the last window
		if (currentWindow.length > 0) {
			windows.push(currentWindow);
		}

		return windows;
	}

	/**
	 * Calculate Point of Control (POC) - price level with highest volume
	 */
	static calculatePOC(profile: VolumeProfileDataPoint[]): number | null {
		if (profile.length === 0) return null;

		const maxVolumePoint = profile.reduce((max, point) =>
			point.vol > max.vol ? point : max
		);

		return maxVolumePoint.price;
	}

	/**
	 * Calculate Value Area (VA) - price range containing 70% of volume
	 */
	static calculateValueArea(
		profile: VolumeProfileDataPoint[],
		percentage: number = 0.7
	): { low: number; high: number } | null {
		if (profile.length === 0) return null;

		const totalVolume = profile.reduce((sum, point) => sum + point.vol, 0);
		const targetVolume = totalVolume * percentage;

		// Find POC
		const pocIndex = profile.findIndex(
			point => point.price === this.calculatePOC(profile)
		);
		if (pocIndex === -1) return null;

		let accumulatedVolume = profile[pocIndex].vol;
		let lowIndex = pocIndex;
		let highIndex = pocIndex;

		// Expand around POC until we reach target volume
		while (accumulatedVolume < targetVolume) {
			const canExpandLow = lowIndex > 0;
			const canExpandHigh = highIndex < profile.length - 1;

			if (!canExpandLow && !canExpandHigh) break;

			const lowVolume = canExpandLow ? profile[lowIndex - 1].vol : 0;
			const highVolume = canExpandHigh ? profile[highIndex + 1].vol : 0;

			if (lowVolume > highVolume && canExpandLow) {
				lowIndex--;
				accumulatedVolume += lowVolume;
			} else if (canExpandHigh) {
				highIndex++;
				accumulatedVolume += highVolume;
			}
		}

		return {
			low: profile[lowIndex].price,
			high: profile[highIndex].price,
		};
	}
}

