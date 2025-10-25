import { CandlestickData, UTCTimestamp } from "lightweight-charts";

/**
 * Fetches Bitcoin candlestick data from Binance API
 */
export async function fetchBTCData(
	interval: string,
	limit: number
): Promise<CandlestickData[]> {
	const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		return data.map((kline: any) => ({
			time: Math.floor(kline[0] / 1000) as UTCTimestamp,
			open: parseFloat(kline[1]),
			high: parseFloat(kline[2]),
			low: parseFloat(kline[3]),
			close: parseFloat(kline[4]),
		}));
	} catch (error) {
		console.error(`Error fetching ${interval} data:`, error);
		throw error;
	}
}


