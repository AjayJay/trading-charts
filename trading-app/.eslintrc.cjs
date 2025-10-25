/** @type {import('eslint').Linter.Config} */
module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
	},
	extends: [
		'eslint:recommended',
	],
	env: {
		browser: true,
		es6: true,
	},
	rules: {
		// Basic rules for the trading app
		'no-console': 'off', // Allow console logs in trading app
		'no-unused-vars': 'warn',
	},
};

