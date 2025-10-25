import { CandlestickData } from "lightweight-charts";
import { SwingPoint } from "../types";

/**
 * Detect if a candle at index is a swing high
 */
function isSwingHigh(
	data: CandlestickData[],
	index: number,
	lookback: number
): boolean {
	if (index < lookback || index >= data.length - lookback) {
		return false;
	}

	const currentHigh = data[index].high;

	for (let i = index - lookback; i <= index + lookback; i++) {
		if (i !== index && data[i].high >= currentHigh) {
			return false;
		}
	}

	return true;
}

/**
 * Detect if a candle at index is a swing low
 */
function isSwingLow(
	data: CandlestickData[],
	index: number,
	lookback: number
): boolean {
	if (index < lookback || index >= data.length - lookback) {
		return false;
	}

	const currentLow = data[index].low;

	for (let i = index - lookback; i <= index + lookback; i++) {
		if (i !== index && data[i].low <= currentLow) {
			return false;
		}
	}

	return true;
}

/**
 * Detect all swing points and classify them
 */
export function detectSwingPoints(
	data: CandlestickData[],
	lookback: number,
	analyzePeriod: number
): SwingPoint[] {
	const swingPoints: SwingPoint[] = [];

	const startIndex = Math.max(lookback, data.length - analyzePeriod);

	let previousSwingHigh: { price: number; index: number } | null = null;
	let previousSwingLow: { price: number; index: number } | null = null;

	for (let i = startIndex; i < data.length - lookback; i++) {
		// Check for swing high
		if (isSwingHigh(data, i, lookback)) {
			const currentPrice = data[i].high;
			let swingType: "HH" | "LH";

			if (previousSwingHigh === null) {
				swingType = "HH";
			} else {
				swingType = currentPrice > previousSwingHigh.price ? "HH" : "LH";
			}

			swingPoints.push({
				price: currentPrice,
				timestamp: data[i].time,
				type: swingType,
				index: i,
				isHigh: true,
			});

			previousSwingHigh = { price: currentPrice, index: i };
		}

		// Check for swing low
		if (isSwingLow(data, i, lookback)) {
			const currentPrice = data[i].low;
			let swingType: "HL" | "LL";

			if (previousSwingLow === null) {
				swingType = "HL";
			} else {
				swingType = currentPrice > previousSwingLow.price ? "HL" : "LL";
			}

			swingPoints.push({
				price: currentPrice,
				timestamp: data[i].time,
				type: swingType,
				index: i,
				isHigh: false,
			});

			previousSwingLow = { price: currentPrice, index: i };
		}
	}

	const sortedPoints = swingPoints.sort((a, b) => a.index - b.index);

	// Remove duplicate timestamps
	const uniquePoints: SwingPoint[] = [];
	const seenTimes = new Set();

	for (const point of sortedPoints) {
		if (!seenTimes.has(point.timestamp)) {
			uniquePoints.push(point);
			seenTimes.add(point.timestamp);
		}
	}

	return uniquePoints;
}


