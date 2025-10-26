/**
 * Storage utilities for volume profile state persistence
 */

import { VolumeProfileState, VolumeProfileSettings } from './types';
import { STORAGE_KEYS, DEFAULT_SYMBOL, DEFAULT_TIME_RANGE, DEFAULT_PRICE_LEVELS, DEFAULT_DISPLAY_MODE } from '../constants';

/**
 * Save volume profile state to localStorage
 */
export function saveVolumeProfileState(state: VolumeProfileState): void {
	try {
		localStorage.setItem(STORAGE_KEYS.VP_STATE, JSON.stringify(state));
	} catch (error) {
		console.error('Error saving volume profile state:', error);
	}
}

/**
 * Load volume profile state from localStorage
 */
export function loadVolumeProfileState(): VolumeProfileState | null {
	try {
		const saved = localStorage.getItem(STORAGE_KEYS.VP_STATE);
		if (saved) {
			return JSON.parse(saved);
		}
	} catch (error) {
		console.error('Error loading volume profile state:', error);
	}
	return null;
}

/**
 * Clear volume profile state from localStorage
 */
export function clearVolumeProfileState(): void {
	try {
		localStorage.removeItem(STORAGE_KEYS.VP_STATE);
	} catch (error) {
		console.error('Error clearing volume profile state:', error);
	}
}

/**
 * Save volume profile settings to localStorage
 */
export function saveVolumeProfileSettings(settings: VolumeProfileSettings): void {
	try {
		localStorage.setItem(STORAGE_KEYS.VP_SETTINGS, JSON.stringify(settings));
	} catch (error) {
		console.error('Error saving volume profile settings:', error);
	}
}

/**
 * Load volume profile settings from localStorage
 */
export function loadVolumeProfileSettings(): VolumeProfileSettings {
	try {
		const saved = localStorage.getItem(STORAGE_KEYS.VP_SETTINGS);
		if (saved) {
			return JSON.parse(saved);
		}
	} catch (error) {
		console.error('Error loading volume profile settings:', error);
	}
	
	// Return default settings
	return {
		symbol: DEFAULT_SYMBOL,
		timeRange: DEFAULT_TIME_RANGE,
		numPriceLevels: DEFAULT_PRICE_LEVELS,
		displayMode: DEFAULT_DISPLAY_MODE,
		autoRefresh: false,
	};
}

/**
 * Clear volume profile settings from localStorage
 */
export function clearVolumeProfileSettings(): void {
	try {
		localStorage.removeItem(STORAGE_KEYS.VP_SETTINGS);
	} catch (error) {
		console.error('Error clearing volume profile settings:', error);
	}
}

