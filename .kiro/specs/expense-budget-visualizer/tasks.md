# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement the Expense & Budget Visualizer as three plain files — `index.html`, `css/style.css`, and `js/app.js` — with no build tooling. The implementation follows the unidirectional data-flow architecture defined in the design: user actions trigger event handlers that mutate a central state object, which is then persisted to Local Storage and re-rendered by a `render()` coordinator.

---

## Tasks

- [x] 1. Create index.html with full page structure
  - Create `index.html` at the project root.
  - Add `<!DOCTYPE html>`, `<html lang="en">`, `<head>` with `<meta charset>`, viewport meta, `<title>`, and a `<link>` to `css/style.css`.
  - Add a `<div class="container">` wrapping a `<header>` and `<main>`.
  - Inside `<header>`: an `<h1>` title and a `<div id="balance-display">` containing `<span class="balance-label">Total Spent</span>` and `<span id="balance-amount">$0.00</span>`.
  - Inside `<main>`:
    - `<section class="input-section">` with `<form id="transaction-form">` containing:
      - `<label>` + `<input id="item-name" type="text">`
      - `<label>` + `<input id="item-amount" type="number" min="0.01" step="0.01">`
      - `<label>` + `<select id="item-category">` with a blank default option and options Food, Transport, Fun.
      - `<button type="submit">Add Transaction</button>`
      - `<span id="error-name" class="error hidden"></span>`
      - `<span id="error-amount" class="error hidden"></span>`
      - `<span id="error-category" class="error hidden"></span>`
    - `<section class="visual-section">` with `<canvas id="spending-chart" aria-label="Spending distribution pie chart" role="img"></canvas>` and `<p id="chart-empty" class="hidden">No transactions yet.</p>`
    - `<section class="list-section">` with `<ul id="transaction-list"></ul>` and `<p id="list-empty" class="hidden">No transactions added yet.</p>`
  - At the bottom of `<body>`: `<div id="storage-warning" class="warning hidden">` with the unavailability message.
  - Load Chart.js from CDN: `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>` before `<script src="js/app.js"></script>`.
  - Add `aria-live="polite"` to all three error `<span>` elements.
  - _Requirements: R1.1, R2.1, R2.3, R3.1, R4.1, R5.1, R5.4, R6.4, R7.2, R8.1, R8.2, R8.3_

- [x] 2. Create css/style.css with layout and visual design
  - [x] 2.1 Implement base layout and vertical page flow
    - Create `css/style.css`.
    - Style `.container` with a max-width (e.g. 640px), centered with `margin: 0 auto`, and comfortable horizontal padding.
    - Establish vertical stacking order: Balance (header) → Input Form → Chart → Transaction List using block-level or flexbox column layout.
    - Set `box-sizing: border-box` globally.
    - _Requirements: R8.1, R8.4_
  - [x] 2.2 Style the balance display, form, chart section, and list section
    - Style `#balance-display` to be visually prominent (larger font, distinct background or border).
    - Style `#transaction-form` inputs, select, and button with clear spacing, min `14px` font size, and a consistent color palette.
    - Style `.visual-section` so the chart canvas is centered and constrained to a reasonable height (e.g. max 300px).
    - Style `.list-section` with `max-height` and `overflow-y: auto` so the transaction list scrolls independently without pushing other sections.
    - Style `.error` spans in a warning color (e.g. red), and add `.hidden { display: none }` utility.
    - Style `#storage-warning` as a dismissable-looking banner in a muted warning color.
    - _Requirements: R2.2, R4.1, R4.4, R8.1, R8.4_
  - [x] 2.3 Add responsive breakpoint at 768px
    - Add `@media (max-width: 768px)` block.
    - Ensure all sections reflow to full width, no horizontal scroll.
    - Adjust font sizes, padding, and the chart container height as needed for small viewports.
    - _Requirements: R8.5_

- [x] 3. Create js/app.js — constants, state, and pure utility functions
  - [x] 3.1 Define constants and state object
    - Create `js/app.js`.
    - Declare `const CATEGORIES = ['Food', 'Transport', 'Fun']` and `const STORAGE_KEY = 'expense-budget-visualizer-transactions'`.
    - Declare `const state = { transactions: [] }`.
    - Declare module-level `let chartInstance = null`.
    - _Requirements: R1.1, R6.1_
  - [x] 3.2 Implement `validateTransaction(name, amount, category)`
    - Return `{ valid: true, errors: {} }` when all fields pass.
    - Return `{ valid: false, errors: { name?, amount?, category? } }` with a descriptive message for each failing field:
      - `name`: fails if trimmed value is empty.
      - `amount`: fails if the parsed number is not finite or is `<= 0`.
      - `category`: fails if value is not in `CATEGORIES`.
    - Function must be pure — no DOM access, no side effects.
    - _Requirements: R1.3, R1.4_
  - [ ]* 3.3 Write property test for `validateTransaction` (Property 2)
    - **Property 2: Invalid inputs are rejected**
    - Generate random inputs where at least one field is blank or amount ≤ 0.
    - Assert `validateTransaction` returns `valid: false` with at least one error key.
    - **Validates: Requirements R1.3, R1.4**
  - [x] 3.4 Implement `calculateBalance(transactions)` and `formatCurrency(amount)`
    - `calculateBalance`: reduce `transactions` to the sum of all `amount` fields; return `0` for an empty array.
    - `formatCurrency`: return a string formatted as `$X.XX` using `toFixed(2)` prefixed with `$`.
    - Both must be pure functions.
    - _Requirements: R4.1, R4.2, R4.3, R4.4_
  - [ ]* 3.5 Write property test for `calculateBalance` (Property 5)
    - **Property 5: Balance equals the sum of all transaction amounts**
    - Generate random arrays of positive numbers as amounts; build mock transaction objects.
    - Assert `calculateBalance(transactions) === amounts.reduce((a, b) => a + b, 0)`.
    - **Validates: Requirements R4.1, R4.2**
  - [ ]* 3.6 Write property test for `formatCurrency` (Property 6)
    - **Property 6: Currency formatter always produces a valid currency string**
    - Generate random non-negative finite numbers.
    - Assert output matches `/^\$\d+\.\d{2}$/`.
    - **Validates: Requirements R4.4**
  - [x] 3.7 Implement `buildChartData(transactions)`
    - Return `null` when `transactions` is empty.
    - Otherwise aggregate amounts by category (only categories with amount > 0 are included).
    - Return `{ labels: string[], data: number[], colors: string[] }` where `colors` maps to the fixed palette `['#FF6384', '#36A2EB', '#FFCE56']` by category index.
    - Must be a pure function.
    - _Requirements: R5.1, R5.5_
  - [ ]* 3.8 Write property test for `buildChartData` (Property 7)
    - **Property 7: Chart data contains exactly one segment per non-empty category**
    - Generate random non-empty `Transaction[]` spanning 1–3 categories.
    - Assert `labels` equals the set of categories present in the input.
    - Assert `data` values sum equals the total of all transaction amounts.
    - **Validates: Requirements R5.1, R5.5**

- [x] 4. Checkpoint — pure functions complete
  - Verify that `validateTransaction`, `calculateBalance`, `formatCurrency`, and `buildChartData` are all implemented and (if property tests were run) passing before continuing to DOM-dependent code.
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement storage and rendering functions in js/app.js
  - [x] 5.1 Implement `loadFromStorage()` and `saveToStorage(transactions)`
    - Wrap both in `try/catch`.
    - `loadFromStorage`: parse JSON from `localStorage.getItem(STORAGE_KEY)`; return `[]` on any error and call a helper that reveals `#storage-warning`.
    - `saveToStorage`: serialize `transactions` to JSON and call `localStorage.setItem(STORAGE_KEY, …)`; silently ignore errors.
    - _Requirements: R6.1, R6.2, R6.3, R6.4_
  - [ ]* 5.2 Write property test for serialization round-trip (Property 8)
    - **Property 8: Transaction serialization round-trip preserves data**
    - Generate random valid `Transaction[]`.
    - Assert `JSON.parse(JSON.stringify(arr))` deep-equals the original array.
    - **Validates: Requirements R6.1, R6.2**
  - [x] 5.3 Implement `renderBalance()`
    - Read `calculateBalance(state.transactions)`, format with `formatCurrency`, and set `#balance-amount` text content.
    - _Requirements: R4.1, R4.2, R4.3, R4.4_
  - [x] 5.4 Implement `renderList()`
    - Clear `#transaction-list`.
    - If `state.transactions` is empty, show `#list-empty` and hide the `<ul>`; otherwise hide `#list-empty` and render one `<li>` per transaction.
    - Each `<li>` shows: item name, `formatCurrency(amount)`, category label, and a delete `<button>` with `data-id` set to the transaction's `id`.
    - _Requirements: R2.1, R2.2, R2.3, R3.1_
  - [x] 5.5 Implement `renderChart()`
    - If `chartInstance` is non-null, call `chartInstance.destroy()` and set it to `null`.
    - Call `buildChartData(state.transactions)`.
    - If result is `null`, show `#chart-empty` and hide `#spending-chart`; return early.
    - Otherwise hide `#chart-empty`, show `#spending-chart`, and create a new `Chart` instance (type `'pie'`) using the labels, data, and colors; store it in `chartInstance`.
    - _Requirements: R5.1, R5.2, R5.3, R5.4, R5.5_
  - [x] 5.6 Implement `render()` orchestrator
    - Call `renderBalance()`, `renderList()`, and `renderChart()` in sequence.
    - _Requirements: R4.2, R4.3, R5.2, R5.3_

- [x] 6. Implement event handlers and bootstrap in js/app.js
  - [x] 6.1 Implement `handleFormSubmit(event)`
    - Call `event.preventDefault()`.
    - Clear all three error spans and remove `.hidden` from them; then re-add `.hidden` before re-validating (reset pattern).
    - Read values from `#item-name`, `#item-amount`, `#item-category`.
    - Call `validateTransaction`; if invalid, populate each error span with its message and remove `.hidden` from failing spans; return early.
    - Build a new `Transaction` object: `id` via `crypto.randomUUID()` (with `Date.now().toString()` fallback), `name` trimmed, `amount` parsed as `parseFloat`, `category`, `timestamp` as `Date.now()`.
    - Push to `state.transactions`; call `saveToStorage(state.transactions)`; call `render()`.
    - Reset the form with `event.target.reset()`.
    - _Requirements: R1.1, R1.2, R1.3, R1.4, R1.5, R4.2, R5.2, R6.1_
  - [ ]* 6.2 Write property test for adding a transaction (Property 1)
    - **Property 1: Adding a transaction grows the transaction list**
    - Generate a random valid transaction object and a random existing `Transaction[]`.
    - Push transaction into a copy of the array and assert length increased by 1 and the transaction is present.
    - **Validates: Requirements R1.2**
  - [x] 6.3 Implement `handleDelete(id)`
    - Show a `window.confirm` dialog; if the user cancels, return early.
    - Filter `state.transactions` to exclude the transaction with the matching `id`.
    - Call `saveToStorage(state.transactions)`; call `render()`.
    - _Requirements: R3.2, R3.3, R3.4, R4.3, R5.3, R6.2_
  - [ ]* 6.4 Write property test for deleting a transaction (Property 4)
    - **Property 4: Deleting a transaction removes it and adjusts the balance**
    - Generate a random `Transaction[]` of length ≥ 2 and a random index to delete.
    - Simulate deletion; assert list shrinks by 1, deleted item absent, and new balance = previous balance − deleted amount.
    - **Validates: Requirements R3.2, R3.3, R4.2, R4.3**
  - [x] 6.5 Implement `init()` and wire `DOMContentLoaded`
    - In `init()`: call `loadFromStorage()` and assign result to `state.transactions`; attach `handleFormSubmit` to `#transaction-form` submit event; attach a delegated click listener on `#transaction-list` that calls `handleDelete(id)` when a delete button is clicked; call `render()`.
    - For each required DOM element, log a `console.error` and skip attachment if the element is not found.
    - Register `init` as the `DOMContentLoaded` listener: `document.addEventListener('DOMContentLoaded', init)`.
    - _Requirements: R6.3, R6.4, R7.1, R7.2, R7.3_
  - [ ]* 6.6 Write property test for list rendering (Property 3)
    - **Property 3: Every transaction renders in the list with correct fields**
    - Generate a random non-empty `Transaction[]`; call `renderList()` in a jsdom environment.
    - Assert one `<li>` per transaction, each showing correct name, `$X.XX` amount, and category.
    - **Validates: Requirements R2.1, R3.1**

- [x] 7. Final checkpoint — integration complete
  - Open `index.html` directly in a browser and verify:
    - Page loads without console errors.
    - Adding a transaction updates the list, balance, and chart.
    - Deleting a transaction updates the list, balance, and chart.
    - Refreshing the page restores persisted data.
  - Ensure all automated tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP delivery.
- Property tests require `fast-check` and a test runner such as Vitest or Jest with `jsdom`; since there is no `package.json`, the test environment must be set up before running those sub-tasks.
- All core implementation tasks (unmarked) are required for a working application.
- Each task references specific requirements (R_._) for full traceability.
- The chart destroy/recreate pattern in `renderChart()` is critical to avoid Chart.js canvas conflicts.
- `crypto.randomUUID()` is available in all target browsers on secure contexts; the `Date.now()` fallback handles `file://` origins in older browsers.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["3.1"] },
    { "id": 1, "tasks": ["3.2", "3.4", "3.7", "2.1"] },
    { "id": 2, "tasks": ["3.3", "3.5", "3.6", "3.8", "2.2", "1"] },
    { "id": 3, "tasks": ["5.1", "5.3", "5.4", "5.5", "2.3"] },
    { "id": 4, "tasks": ["5.2", "5.6"] },
    { "id": 5, "tasks": ["6.1", "6.3", "6.5"] },
    { "id": 6, "tasks": ["6.2", "6.4", "6.6"] }
  ]
}
```
