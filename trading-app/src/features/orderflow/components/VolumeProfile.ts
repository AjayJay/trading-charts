import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	AutoscaleInfo,
	Coordinate,
	IChartApi,
	ISeriesApi,
	ISeriesPrimitive,
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	Logical,
	Time,
} from 'lightweight-charts';

interface VolumeProfileItem {
	y: Coordinate | null;
	width: number;
	isBuy?: boolean; // Optional: to distinguish buy/sell volume
}

interface VolumeProfileRendererData {
	x: Coordinate | null;
	top: Coordinate | null;
	columnHeight: number;
	width: number;
	items: VolumeProfileItem[];
	buyColor: string;
	sellColor: string;
}

export interface VolumeProfileDataPoint {
	price: number;
	vol: number;
	buyVol?: number; // Optional: for separate buy volume
	sellVol?: number; // Optional: for separate sell volume
}

export interface VolumeProfileData {
	time: Time;
	profile: VolumeProfileDataPoint[];
	width: number;
}

export interface VolumeProfileOptions {
	buyColor?: string;
	sellColor?: string;
	backgroundColor?: string;
	separateBuySell?: boolean; // Whether to show buy/sell volumes separately
}

// Helper function for pixel-perfect positioning
function positionsBox(
	position1: number,
	position2: number,
	pixelRatio: number
): { position: number; length: number } {
	const scaledPosition1 = Math.round(position1 * pixelRatio);
	const scaledPosition2 = Math.round(position2 * pixelRatio);
	return {
		position: scaledPosition1,
		length: scaledPosition2 - scaledPosition1,
	};
}

class VolumeProfileRenderer implements IPrimitivePaneRenderer {
	_data: VolumeProfileRendererData;

	constructor(data: VolumeProfileRendererData) {
		this._data = data;
	}

	draw(target: CanvasRenderingTarget2D) {
		target.useBitmapCoordinateSpace(scope => {
			if (this._data.x === null || this._data.top === null) {
				console.warn('Volume Profile: No position data', this._data);
				return;
			}
			const ctx = scope.context;
			const horizontalPositions = positionsBox(
				this._data.x,
				this._data.x + this._data.width,
				scope.horizontalPixelRatio
			);
			const verticalPositions = positionsBox(
				this._data.top,
				this._data.top - this._data.columnHeight * this._data.items.length,
				scope.verticalPixelRatio
			);

			// Draw background
			ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
			ctx.fillRect(
				horizontalPositions.position,
				verticalPositions.position,
				horizontalPositions.length,
				verticalPositions.length
			);

			// Draw volume bars
			this._data.items.forEach(row => {
				if (row.y === null) return;
				const itemVerticalPos = positionsBox(
					row.y,
					row.y - this._data.columnHeight,
					scope.verticalPixelRatio
				);
				const itemHorizontalPos = positionsBox(
					this._data.x!,
					this._data.x! + row.width,
					scope.horizontalPixelRatio
				);

				// Use buy/sell colors if specified
				ctx.fillStyle = row.isBuy !== undefined
					? (row.isBuy ? this._data.buyColor : this._data.sellColor)
					: 'rgba(80, 80, 255, 0.8)';

				ctx.fillRect(
					itemHorizontalPos.position,
					itemVerticalPos.position,
					itemHorizontalPos.length,
					itemVerticalPos.length - 2 // 1 pixel gap to close gaps
				);
			});
		});
	}
}

class VolumeProfilePaneView implements IPrimitivePaneView {
	_source: VolumeProfile;
	_x: Coordinate | null = null;
	_width: number = 6;
	_columnHeight: number = 0;
	_top: Coordinate | null = null;
	_items: VolumeProfileItem[] = [];

	constructor(source: VolumeProfile) {
		this._source = source;
	}

	update() {
		const data = this._source._vpData;
		const series = this._source._series;
		const timeScale = this._source._chart.timeScale();
		const options = this._source._options;

		this._x = timeScale.timeToCoordinate(data.time);
		this._width = timeScale.options().barSpacing * data.width;

		const y1 =
			series.priceToCoordinate(data.profile[0].price) ?? (0 as Coordinate);
		const y2 =
			series.priceToCoordinate(data.profile[1].price) ??
			(timeScale.height() as Coordinate);
		this._columnHeight = Math.max(1, y1 - y2);

		// Calculate max volume for normalization
		const maxVolume = data.profile.reduce(
			(acc, item) => Math.max(acc, item.vol),
			0
		);

		this._top = y1;

		// Create items based on whether we're separating buy/sell
		if (options.separateBuySell && data.profile[0].buyVol !== undefined) {
			this._items = data.profile.flatMap(row => {
				const items: VolumeProfileItem[] = [];
				const buyWidth = ((this._width * (row.buyVol || 0)) / maxVolume);
				const sellWidth = ((this._width * (row.sellVol || 0)) / maxVolume);

				// Add buy volume bar (on the right)
				if (buyWidth > 0) {
					items.push({
						y: series.priceToCoordinate(row.price),
						width: buyWidth,
						isBuy: true,
					});
				}

				// Add sell volume bar (on the left)
				if (sellWidth > 0) {
					items.push({
						y: series.priceToCoordinate(row.price),
						width: sellWidth,
						isBuy: false,
					});
				}

				return items;
			});
		} else {
			this._items = data.profile.map(row => ({
				y: series.priceToCoordinate(row.price),
				width: (this._width * row.vol) / maxVolume,
			}));
		}
	}

	renderer() {
		return new VolumeProfileRenderer({
			x: this._x,
			top: this._top,
			columnHeight: this._columnHeight,
			width: this._width,
			items: this._items,
			buyColor: this._source._options.buyColor || 'rgba(0, 200, 0, 0.7)',
			sellColor: this._source._options.sellColor || 'rgba(200, 0, 0, 0.7)',
		});
	}
}

export class VolumeProfile implements ISeriesPrimitive<Time> {
	_chart: IChartApi;
	_series: ISeriesApi<'Line'>;
	_vpData: VolumeProfileData;
	_minPrice: number;
	_maxPrice: number;
	_paneViews: VolumeProfilePaneView[];
	_options: VolumeProfileOptions;

	constructor(
		chart: IChartApi,
		series: ISeriesApi<'Line'>,
		vpData: VolumeProfileData,
		options: VolumeProfileOptions = {}
	) {
		this._chart = chart;
		this._series = series;
		this._vpData = vpData;
		this._options = {
			buyColor: options.buyColor || 'rgba(0, 200, 0, 0.7)',
			sellColor: options.sellColor || 'rgba(200, 0, 0, 0.7)',
			backgroundColor: options.backgroundColor || 'rgba(0, 0, 255, 0.1)',
			separateBuySell: options.separateBuySell || false,
		};
		this._minPrice = Infinity;
		this._maxPrice = -Infinity;
		this._vpData.profile.forEach(vpData => {
			if (vpData.price < this._minPrice) this._minPrice = vpData.price;
			if (vpData.price > this._maxPrice) this._maxPrice = vpData.price;
		});
		this._paneViews = [new VolumeProfilePaneView(this)];
	}

	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
	}

	updateData(vpData: VolumeProfileData) {
		this._vpData = vpData;
		this._minPrice = Infinity;
		this._maxPrice = -Infinity;
		this._vpData.profile.forEach(vpData => {
			if (vpData.price < this._minPrice) this._minPrice = vpData.price;
			if (vpData.price > this._maxPrice) this._maxPrice = vpData.price;
		});
		this.updateAllViews();
	}

	// Ensures that the VP is within autoScale
	autoscaleInfo(
		startTimePoint: Logical,
		endTimePoint: Logical
	): AutoscaleInfo | null {
		const vpCoordinate = this._chart
			.timeScale()
			.timeToCoordinate(this._vpData.time);
		if (vpCoordinate === null) return null;
		const vpIndex = this._chart.timeScale().coordinateToLogical(vpCoordinate);
		if (vpIndex === null) return null;
		if (endTimePoint < vpIndex || startTimePoint > vpIndex + this._vpData.width)
			return null;
		return {
			priceRange: {
				minValue: this._minPrice,
				maxValue: this._maxPrice,
			},
		};
	}

	paneViews() {
		return this._paneViews;
	}
}

