/**
 * Binance API Client
 * Connects to Binance public API to fetch real-time trade data
 * Docs: https://binance-docs.github.io/apidocs/spot/en/
 */

import { TradeData } from './types';
import { BINANCE_CONFIG } from '../constants';

export interface BinanceTrade {
	id: number;
	price: string;
	qty: string;
	quoteQty: string;
	time: number;
	isBuyerMaker: boolean;
	isBestMatch: boolean;
}

export interface BinanceAggTrade {
	a: number; // Aggregate tradeId
	p: string; // Price
	q: string; // Quantity
	f: number; // First tradeId
	l: number; // Last tradeId
	T: number; // Timestamp
	m: boolean; // Was the buyer the maker?
	M: boolean; // Was the trade the best price match?
}

export interface BinanceAPIConfig {
	baseUrl?: string;
	symbol?: string;
	limit?: number;
}

export class BinanceAPI {
	private baseUrl: string;
	private symbol: string;

	constructor(config: BinanceAPIConfig = {}) {
		this.baseUrl = config.baseUrl || BINANCE_CONFIG.BASE_URL;
		this.symbol = config.symbol || 'BTCUSDT';
	}

	/**
	 * Fetch recent trades
	 * @param limit Number of trades to fetch (max 1000)
	 */
	async fetchRecentTrades(limit: number = 1000): Promise<TradeData[]> {
		try {
			const maxLimit = Math.min(limit, BINANCE_CONFIG.MAX_TRADES_PER_REQUEST);
			const url = `${this.baseUrl}/api/v3/trades?symbol=${this.symbol}&limit=${maxLimit}`;
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
			}

			const trades: BinanceTrade[] = await response.json();
			return this.transformBinanceTrades(trades);
		} catch (error) {
			console.error('Error fetching Binance trades:', error);
			throw error;
		}
	}

	/**
	 * Fetch aggregate trades (more efficient for large datasets)
	 * @param limit Number of trades (max 1000)
	 * @param startTime Optional start time in ms
	 * @param endTime Optional end time in ms
	 */
	async fetchAggTrades(
		limit: number = 1000,
		startTime?: number,
		endTime?: number
	): Promise<TradeData[]> {
		try {
			const maxLimit = Math.min(limit, BINANCE_CONFIG.MAX_TRADES_PER_REQUEST);
			let url = `${this.baseUrl}/api/v3/aggTrades?symbol=${this.symbol}&limit=${maxLimit}`;
			
			if (startTime) {
				url += `&startTime=${startTime}`;
			}
			if (endTime) {
				url += `&endTime=${endTime}`;
			}

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
			}

			const trades: BinanceAggTrade[] = await response.json();
			return this.transformAggTrades(trades);
		} catch (error) {
			console.error('Error fetching Binance aggregate trades:', error);
			throw error;
		}
	}

	/**
	 * Fetch historical trades for a specific time range
	 * Can fetch more than 1000 trades by making multiple requests
	 */
	async fetchHistoricalTrades(
		startTime: number,
		endTime: number,
		maxTrades: number = 5000
	): Promise<TradeData[]> {
		const allTrades: TradeData[] = [];
		let currentStartTime = startTime;
		const limit = 1000;

		while (allTrades.length < maxTrades && currentStartTime < endTime) {
			const trades = await this.fetchAggTrades(limit, currentStartTime, endTime);
			
			if (trades.length === 0) break;
			
			allTrades.push(...trades);
			
			// Update start time to the last trade's time + 1ms
			const lastTrade = trades[trades.length - 1];
			currentStartTime = (typeof lastTrade.tradeTime === 'number' 
				? lastTrade.tradeTime 
				: new Date(lastTrade.tradeTime).getTime()) + 1;

			// If we got less than limit, we've reached the end
			if (trades.length < limit) break;

			// Small delay to avoid rate limits
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		return allTrades.slice(0, maxTrades);
	}

	/**
	 * Fetch trades for last N hours
	 */
	async fetchTradesLastHours(hours: number, maxTrades: number = 5000): Promise<TradeData[]> {
		const endTime = Date.now();
		const startTime = endTime - (hours * 60 * 60 * 1000);
		return this.fetchHistoricalTrades(startTime, endTime, maxTrades);
	}

	/**
	 * Transform Binance trade format to our TradeData format
	 */
	private transformBinanceTrades(binanceTrades: BinanceTrade[]): TradeData[] {
		return binanceTrades.map(trade => ({
			tradeTime: trade.time,
			price: parseFloat(trade.price),
			volume: parseFloat(trade.qty),
			isMaker: trade.isBuyerMaker,
			side: trade.isBuyerMaker ? 'sell' : 'buy', // If buyer is maker, it's a sell order
		}));
	}

	/**
	 * Transform Binance aggregate trades to our TradeData format
	 */
	private transformAggTrades(aggTrades: BinanceAggTrade[]): TradeData[] {
		return aggTrades.map(trade => ({
			tradeTime: trade.T,
			price: parseFloat(trade.p),
			volume: parseFloat(trade.q),
			isMaker: trade.m,
			side: trade.m ? 'sell' : 'buy', // If buyer is maker, it's a sell order
		}));
	}

	/**
	 * Get current price
	 */
	async getCurrentPrice(): Promise<number> {
		try {
			const url = `${this.baseUrl}/api/v3/ticker/price?symbol=${this.symbol}`;
			const response = await fetch(url);
			const data = await response.json();
			return parseFloat(data.price);
		} catch (error) {
			console.error('Error fetching current price:', error);
			throw error;
		}
	}

	/**
	 * Get 24h ticker stats
	 */
	async get24hStats() {
		try {
			const url = `${this.baseUrl}/api/v3/ticker/24hr?symbol=${this.symbol}`;
			const response = await fetch(url);
			const data = await response.json();
			return {
				priceChange: parseFloat(data.priceChange),
				priceChangePercent: parseFloat(data.priceChangePercent),
				weightedAvgPrice: parseFloat(data.weightedAvgPrice),
				lastPrice: parseFloat(data.lastPrice),
				volume: parseFloat(data.volume),
				quoteVolume: parseFloat(data.quoteVolume),
				highPrice: parseFloat(data.highPrice),
				lowPrice: parseFloat(data.lowPrice),
				openPrice: parseFloat(data.openPrice),
				count: data.count,
			};
		} catch (error) {
			console.error('Error fetching 24h stats:', error);
			throw error;
		}
	}
}

/**
 * WebSocket connection for real-time trades
 */
export class BinanceWebSocket {
	private ws: WebSocket | null = null;
	private symbol: string;
	private baseUrl: string;
	private onTradeCallback: ((trade: TradeData) => void) | null = null;

	constructor(symbol: string = 'BTCUSDT', baseUrl?: string) {
		this.symbol = symbol.toLowerCase();
		this.baseUrl = baseUrl || BINANCE_CONFIG.WS_BASE_URL;
	}

	/**
	 * Connect to Binance WebSocket and stream trades
	 */
	connect(onTrade: (trade: TradeData) => void) {
		this.onTradeCallback = onTrade;
		const wsUrl = `${this.baseUrl}/ws/${this.symbol}@trade`;

		this.ws = new WebSocket(wsUrl);

		this.ws.onopen = () => {
			console.log('✅ Connected to Binance WebSocket');
		};

		this.ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				const trade: TradeData = {
					tradeTime: data.T,
					price: parseFloat(data.p),
					volume: parseFloat(data.q),
					isMaker: data.m,
					side: data.m ? 'sell' : 'buy',
				};
				
				if (this.onTradeCallback) {
					this.onTradeCallback(trade);
				}
			} catch (error) {
				console.error('Error parsing WebSocket message:', error);
			}
		};

		this.ws.onerror = (error) => {
			console.error('❌ WebSocket error:', error);
		};

		this.ws.onclose = () => {
			console.log('🔌 WebSocket connection closed');
		};
	}

	/**
	 * Disconnect from WebSocket
	 */
	disconnect() {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	/**
	 * Check if connected
	 */
	isConnected(): boolean {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
	}
}

