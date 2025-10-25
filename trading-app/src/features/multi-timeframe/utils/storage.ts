import { GridState } from "../types";
import { STORAGE_KEY } from "../constants";

/**
 * Save grid state to localStorage
 */
export function saveGridState(state: GridState): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (error) {
		console.error("Failed to save grid state:", error);
	}
}

/**
 * Load grid state from localStorage
 */
export function loadGridState(): GridState | null {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		console.error("Failed to load grid state:", error);
	}
	return null;
}

/**
 * Clear grid state from localStorage
 */
export function clearGridState(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (error) {
		console.error("Failed to clear grid state:", error);
	}
}


