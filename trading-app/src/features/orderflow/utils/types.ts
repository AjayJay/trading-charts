/**
 * Trade data structure with columns:
 * - Trade Time
 * - Price
 * - Volume (Quantity)
 * - Is Maker
 * - Side
 */
export interface TradeData {
	tradeTime: number | string;
	price: number;
	volume: number;
	isMaker: boolean;
	side: 'buy' | 'sell' | 'BUY' | 'SELL';
}

/**
 * Aggregated volume at a specific price level
 */
export interface PriceLevelVolume {
	price: number;
	totalVolume: number;
	buyVolume: number;
	sellVolume: number;
	makerVolume: number;
	takerVolume: number;
	tradeCount: number;
}

/**
 * Configuration for volume profile aggregation
 */
export interface VolumeProfileConfig {
	numPriceLevels?: number;
	tickSize?: number;
	separateBuySell?: boolean;
	priceRange?: {
		min: number;
		max: number;
	};
}

/**
 * Volume profile state for persistence
 */
export interface VolumeProfileState {
	symbol: string;
	timeRange: number;
	numPriceLevels: number;
	displayMode: string;
	timestamp: number;
}

/**
 * Volume profile settings
 */
export interface VolumeProfileSettings {
	symbol: string;
	timeRange: number;
	numPriceLevels: number;
	displayMode: 'combined' | 'separated';
	autoRefresh: boolean;
}

/**
 * Symbol configuration
 */
export interface SymbolConfig {
	id: string;
	label: string;
	symbol: string;
}

/**
 * Volume profile metrics
 */
export interface VolumeProfileMetrics {
	currentPrice: number;
	priceChange: number;
	priceChangePercent: number;
	totalTrades: number;
	totalVolume: number;
	poc: number | null;
	valueAreaHigh: number | null;
	valueAreaLow: number | null;
	high24h?: number;
	low24h?: number;
	volume24h?: number;
}

