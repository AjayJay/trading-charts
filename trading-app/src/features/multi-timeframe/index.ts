import { ChartManager } from "./components/ChartManager";
import { AVAILABLE_TIMEFRAMES, AUTO_REFRESH_INTERVAL } from "./constants";
import { fetchBTCData } from "./utils/dataFetcher";

// UI Elements
const loadingEl = document.getElementById("loading")!;
const errorMessageEl = document.getElementById("errorMessage")!;
const currentPriceEl = document.getElementById("currentPrice")!;
const priceChangeEl = document.getElementById("priceChange")!;
const comparisonPeriodEl = document.getElementById(
	"comparisonPeriod"
) as HTMLSelectElement;
const lookbackPeriodEl = document.getElementById(
	"lookbackPeriod"
) as HTMLSelectElement;
const toggleSwingBtn = document.getElementById("toggleSwingBtn")!;
const addChartBtn = document.getElementById("addChartBtn")!;
const addChartModal = document.getElementById("addChartModal")!;
const timeframeGrid = document.getElementById("timeframeGrid")!;
const modalCancelBtn = document.getElementById("modalCancelBtn")!;
const modalAddBtn = document.getElementById("modalAddBtn")!;

// Global state (price data only - ChartManager manages chart settings)
let globalFirstPrice = 0;
let globalLatestPrice = 0;
let selectedTimeframeForAdd: string | null = null;

// Initialize ChartManager
const chartManager = new ChartManager("chartsGrid");

/**
 * Show/Hide loading
 */
function showLoading(show: boolean) {
	loadingEl.style.display = show ? "block" : "none";
}

/**
 * Show error message
 */
function showError(message: string) {
	errorMessageEl.textContent = message;
	errorMessageEl.style.display = "block";
	setTimeout(() => {
		errorMessageEl.style.display = "none";
	}, 5000);
}

/**
 * Update global price display
 */
function updateGlobalPrice() {
	if (globalLatestPrice === 0) return;

	currentPriceEl.textContent = `$${globalLatestPrice.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;

	const priceChange = globalLatestPrice - globalFirstPrice;
	const priceChangePercent = ((priceChange / globalFirstPrice) * 100).toFixed(
		2
	);

	priceChangeEl.textContent = `${priceChange >= 0 ? "+" : ""}${priceChangePercent}%`;
	priceChangeEl.className = `price-change ${
		priceChange >= 0 ? "positive" : "negative"
	}`;

	currentPriceEl.style.color = priceChange >= 0 ? "#26a69a" : "#ef5350";
}

/**
 * Fetch and update global price
 */
async function fetchGlobalPrice() {
	try {
		const data = await fetchBTCData("15m", 100);
		if (data.length > 0) {
			globalFirstPrice = data[0].open;
			globalLatestPrice = data[data.length - 1].close;
			updateGlobalPrice();
		}
	} catch (error) {
		console.error("Error fetching global price:", error);
	}
}

/**
 * Initialize the application
 */
async function initialize() {
	showLoading(true);

	try {
		// Initialize chart manager
		await chartManager.initialize();

		// Fetch global price
		await fetchGlobalPrice();

		// Setup event listeners
		setupEventListeners();
	} catch (error) {
		console.error("Error initializing application:", error);
		showError("Failed to initialize application. Please refresh the page.");
	} finally {
		showLoading(false);
	}
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
	// Comparison period change - ChartManager is single source of truth
	comparisonPeriodEl.addEventListener("change", (e) => {
		const value = parseInt((e.target as HTMLSelectElement).value);
		console.log(`Comparison period changed to: ${value} candles`);
		chartManager.updateSettings({ comparisonPeriod: value });
	});

	// Lookback period change - ChartManager is single source of truth
	lookbackPeriodEl.addEventListener("change", (e) => {
		const value = parseInt((e.target as HTMLSelectElement).value);
		console.log(`Lookback period changed to: ${value} candles`);
		chartManager.updateSettings({ lookbackPeriod: value });
	});

	// Swing structure toggle - ChartManager is single source of truth
	toggleSwingBtn.addEventListener("click", () => {
		const currentSettings = chartManager.getSettings();
		const newState = !currentSettings.swingStructureEnabled;
		
		// Update UI based on new state
		if (newState) {
			toggleSwingBtn.classList.add("active");
		} else {
			toggleSwingBtn.classList.remove("active");
		}
		
		chartManager.updateSettings({ swingStructureEnabled: newState });
		console.log(`Swing structure ${newState ? "enabled" : "disabled"}`);
	});

	// Add chart button
	addChartBtn.addEventListener("click", openAddChartModal);

	// Modal cancel button
	modalCancelBtn.addEventListener("click", closeAddChartModal);

	// Modal add button
	modalAddBtn.addEventListener("click", addSelectedChart);

	// Click outside modal to close
	addChartModal.addEventListener("click", (e) => {
		if (e.target === addChartModal) {
			closeAddChartModal();
		}
	});
}

/**
 * Open add chart modal
 */
function openAddChartModal() {
	// Populate timeframe options
	timeframeGrid.innerHTML = "";

	AVAILABLE_TIMEFRAMES.forEach((timeframe) => {
		const option = document.createElement("div");
		option.className = "timeframe-option";
		option.textContent = timeframe.label;
		option.dataset.timeframeId = timeframe.id;

		option.addEventListener("click", () => {
			// Remove selected class from all options
			timeframeGrid
				.querySelectorAll(".timeframe-option")
				.forEach((opt) => opt.classList.remove("selected"));

			// Add selected class to clicked option
			option.classList.add("selected");
			selectedTimeframeForAdd = timeframe.id;
		});

		timeframeGrid.appendChild(option);
	});

	addChartModal.classList.add("active");
	selectedTimeframeForAdd = null;
}

/**
 * Close add chart modal
 */
function closeAddChartModal() {
	addChartModal.classList.remove("active");
	selectedTimeframeForAdd = null;
}

/**
 * Add selected chart
 */
async function addSelectedChart() {
	if (!selectedTimeframeForAdd) {
		showError("Please select a timeframe");
		return;
	}

	const timeframe = AVAILABLE_TIMEFRAMES.find(
		(tf) => tf.id === selectedTimeframeForAdd
	);

	if (!timeframe) {
		showError("Invalid timeframe selected");
		return;
	}

	closeAddChartModal();
	showLoading(true);

	try {
		await chartManager.addChart(timeframe);
		console.log(`Added chart: ${timeframe.label}`);
	} catch (error) {
		console.error("Error adding chart:", error);
		showError(`Failed to add ${timeframe.label} chart`);
	} finally {
		showLoading(false);
	}
}

/**
 * Auto-refresh all charts
 */
async function autoRefresh() {
	if (loadingEl.style.display && loadingEl.style.display !== "none") {
		return;
	}

	try {
		await Promise.all([chartManager.reloadAll(), fetchGlobalPrice()]);
		console.log("Auto-refresh completed");
	} catch (error) {
		console.error("Auto-refresh error:", error);
	}
}

// Initialize the application
initialize();

// Setup auto-refresh
setInterval(autoRefresh, AUTO_REFRESH_INTERVAL);

// Handle window resize
let resizeTimeout: number;
window.addEventListener("resize", () => {
	clearTimeout(resizeTimeout);
	resizeTimeout = window.setTimeout(() => {
		// The resize observer in ChartManager handles individual chart resizing
		console.log("Window resized");
	}, 250);
});

// Expose for debugging
if (typeof window !== "undefined") {
	(window as any).chartManager = chartManager;
}
