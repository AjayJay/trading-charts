import { IChartApi, ISeriesApi, IPriceLine, Time } from "lightweight-charts";

export interface TimeframeConfig {
	id: string;
	interval: string;
	limit: number;
	label: string;
}

export interface SwingPoint {
	price: number;
	timestamp: Time;
	type: "HH" | "LH" | "HL" | "LL";
	index: number;
	isHigh: boolean;
}

export interface ChartInstance {
	id: string;
	chart: IChartApi;
	candleSeries: ISeriesApi<"Candlestick">;
	swingLineSeries: ISeriesApi<"Line">;
	bullishLineSeries: ISeriesApi<"Line">;
	bearishLineSeries: ISeriesApi<"Line">;
	timeframe: TimeframeConfig;
	containerId: string;
	priceElementId: string;
	priceLines: IPriceLine[];
	swingPoints: SwingPoint[];
	seriesMarkers: any | null;
	width?: number;
	height?: number;
}

export interface ChartLayout {
	id: string;
	timeframeId: string;
	width?: number;
	height?: number;
	order: number;
}

export interface GridState {
	charts: ChartLayout[];
	columns: number;
}


