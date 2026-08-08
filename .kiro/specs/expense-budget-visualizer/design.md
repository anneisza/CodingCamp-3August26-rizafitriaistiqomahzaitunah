# Design Document

## Feature: Expense & Budget Visualizer

---

## Overview

The Expense & Budget Visualizer is a single-page web application that runs entirely in the browser with no build step and no backend. Users record spending transactions (name, amount, category), review them in a scrollable list, watch a live running balance, and see a pie chart that breaks spending down by category. Everything is stored in Local Storage so data survives page refreshes.

The entire application ships as three files:

```
index.html      – markup and Chart.js CDN reference
css/style.css   – all visual styles
js/app.js       – all runtime behaviour
```

No frameworks, no transpilers, no package managers. Opening `index.html` directly from the file system in any modern browser is sufficient.

### Key Design Decisions

- **No module bundler.** A single `<script src="js/app.js">` tag keeps the project zero-dependency from a tooling perspective. ES module syntax is avoided so the file can load from a `file://` origin without CORS restrictions.
- **Chart.js via CDN.** Chart.js is loaded from a `<script>` tag. The chart instance is stored in a module-level variable and destroyed/recreated on each update to avoid the "canvas already in use" error.
- **Immutable-style state.** All mutations go through a central `state` object and a single `render()` coordinator. This makes it straightforward to reason about correctness and write tests against pure functions extracted from the module.
- **Defensive Local Storage access.** Every read/write is wrapped in a try/catch so a sandboxed or private-mode browser does not crash the application.

---

## Architecture

The application follows a simple unidirectional data flow:

```
User Action
    │
    ▼
Event Handler (in app.js)
    │  mutates
    ▼
State Object  ──── saveToStorage() ───► Local Storage
    │
    │  read by
    ▼
render() coordinator
    ├── renderBalance()
    ├── renderList()
    └── renderChart()
```

### Module Structure (js/app.js)

```
app.js
├── Constants
│   └── CATEGORIES, STORAGE_KEY
├── State
│   └── { transactions: [] }
├── Storage
│   ├── loadFromStorage()
│   └── saveToStorage()
├── Validation
│   ├── validateTransaction(name, amount, category)
│   └── formatCurrency(amount)
├── Business Logic
│   ├── calculateBalance(transactions)
│   └── buildChartData(transactions)
├── Rendering
│   ├── render()           – orchestrates all renders
│   ├── renderBalance()
│   ├── renderList()
│   └── renderChart()
├── Event Handlers
│   ├── handleFormSubmit(event)
│   └── handleDelete(id)
└── Bootstrap
    └── init()             – called on DOMContentLoaded
```

All functions in the Validation and Business Logic groups are **pure functions** (no side effects, no DOM access). This makes them independently testable without a browser environment.

---

## Components and Interfaces

### 1. HTML Structure (`index.html`)

```
<body>
  <div class="container">
    <header>
      <h1>Expense & Budget Visualizer</h1>
      <div id="balance-display">              <!-- Balance component -->
        <span class="balance-label">Total Spent</span>
        <span id="balance-amount">$0.00</span>
      </div>
    </header>

    <main>
      <section class="input-section">
        <form id="transaction-form">          <!-- Input_Form -->
          <input  id="item-name"   type="text"   />
          <input  id="item-amount" type="number" min="0.01" step="0.01" />
          <select id="item-category">
            <option value="">Select category</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Fun">Fun</option>
          </select>
          <button type="submit">Add Transaction</button>

          <!-- Inline validation errors -->
          <span id="error-name"     class="error hidden"></span>
          <span id="error-amount"   class="error hidden"></span>
          <span id="error-category" class="error hidden"></span>
        </form>
      </section>

      <section class="visual-section">
        <canvas id="spending-chart"></canvas>  <!-- Chart -->
        <p id="chart-empty" class="hidden">No transactions yet.</p>
      </section>

      <section class="list-section">
        <ul id="transaction-list"></ul>        <!-- Transaction_List -->
        <p id="list-empty" class="hidden">No transactions added yet.</p>
      </section>
    </main>

    <!-- Storage warning banner (hidden by default) -->
    <div id="storage-warning" class="warning hidden">
      Local Storage is unavailable. Data will not persist between sessions.
    </div>
  </div>
</body>
```

### 2. Validation Module

```js
/**
 * Validates raw form values.
 * @param {string} name     – Item Name field value
 * @param {string} amount   – Amount field value (raw string from input)
 * @param {string} category – Category dropdown value
 * @returns {{ valid: boolean, errors: { name?: string, amount?: string, category?: string } }}
 */
function validateTransaction(name, amount, category)
```

Rules enforced:
- `name`: non-empty after trimming
- `amount`: parses to a finite number AND is strictly greater than 0
- `category`: one of `['Food', 'Transport', 'Fun']`

### 3. Business Logic Functions

```js
/**
 * Sums all transaction amounts.
 * @param {Transaction[]} transactions
 * @returns {number}
 */
function calculateBalance(transactions)

/**
 * Aggregates amounts by category for Chart.js consumption.
 * @param {Transaction[]} transactions
 * @returns {{ labels: string[], data: number[], colors: string[] } | null}
 * Returns null when transactions is empty (triggers empty-state UI).
 */
function buildChartData(transactions)

/**
 * Formats a number as a currency string.
 * @param {number} amount
 * @returns {string}  e.g. "$12.50"
 */
function formatCurrency(amount)
```

### 4. Storage Module

```js
/**
 * Reads transactions from Local Storage.
 * @returns {Transaction[]}  – empty array if nothing stored or on error
 */
function loadFromStorage()

/**
 * Writes transactions to Local Storage.
 * @param {Transaction[]} transactions
 */
function saveToStorage(transactions)
```

Both functions are wrapped in try/catch. On failure, `loadFromStorage` returns `[]` and shows the storage warning banner; `saveToStorage` silently fails (data remains in memory).

### 5. Rendering Functions

| Function | DOM target | Trigger |
|---|---|---|
| `renderBalance()` | `#balance-amount` | Every `render()` call |
| `renderList()` | `#transaction-list` | Every `render()` call |
| `renderChart()` | `#spending-chart` | Every `render()` call |
| `render()` | orchestrates all three | After every state change |

`renderChart()` calls `chart.destroy()` before creating a new Chart.js instance to prevent canvas conflicts.

---

## Data Models

### Transaction Object

```js
/**
 * @typedef {Object} Transaction
 * @property {string} id        – UUID (crypto.randomUUID() or Date.now() fallback)
 * @property {string} name      – Item name (trimmed, non-empty)
 * @property {number} amount    – Positive finite number
 * @property {string} category  – One of: 'Food' | 'Transport' | 'Fun'
 * @property {number} timestamp – Unix ms timestamp (Date.now())
 */
```

### Application State

```js
const state = {
  /** @type {Transaction[]} */
  transactions: [],
};
```

### Local Storage Schema

Key: `'expense-budget-visualizer-transactions'`

Value: JSON-serialized `Transaction[]` array.

```json
[
  {
    "id": "1720000000000",
    "name": "Lunch",
    "amount": 12.50,
    "category": "Food",
    "timestamp": 1720000000000
  }
]
```

### Chart Data Structure

Produced by `buildChartData()` and passed directly to Chart.js:

```js
{
  labels: ['Food', 'Transport', 'Fun'],   // only non-zero categories
  data:   [45.00, 20.00, 15.00],          // summed amounts
  colors: ['#FF6384', '#36A2EB', '#FFCE56']
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Adding a transaction grows the transaction list

*For any* existing list of transactions and any valid transaction (non-empty name, positive amount, valid category), adding the transaction must result in the list length increasing by exactly 1 and the new transaction appearing in the list.

**Validates: Requirements 1.2**

---

### Property 2: Invalid inputs are rejected

*For any* combination of form inputs where at least one field is empty/blank or the amount is non-positive, the validator must reject the submission and return at least one error message identifying the offending field(s).

**Validates: Requirements 1.3, 1.4**

---

### Property 3: Every transaction renders in the list with correct fields

*For any* non-empty list of transactions, the rendered list must contain one entry per transaction, each showing the correct item name, the amount formatted to exactly two decimal places, and the correct category label.

**Validates: Requirements 2.1, 3.1**

---

### Property 4: Deleting a transaction removes it and adjusts the balance

*For any* list of two or more transactions, deleting a randomly chosen transaction must result in: (a) the deleted transaction no longer appearing in the list, (b) the list length decreasing by exactly 1, and (c) the new balance equaling the previous balance minus the deleted transaction's amount.

**Validates: Requirements 3.2, 3.3, 4.2, 4.3**

---

### Property 5: Balance equals the sum of all transaction amounts

*For any* collection of transactions with arbitrary amounts, `calculateBalance` must return a value equal to the arithmetic sum of every transaction's `amount` field.

**Validates: Requirements 4.1, 4.2**

---

### Property 6: Currency formatter always produces a valid currency string

*For any* finite non-negative number, `formatCurrency` must return a string that starts with a `$` symbol and contains exactly two digits after the decimal point.

**Validates: Requirements 4.4**

---

### Property 7: Chart data contains exactly one segment per non-empty category

*For any* non-empty list of transactions spanning one or more categories, `buildChartData` must return a result whose `labels` array contains exactly the set of categories that have at least one transaction — no more, no less — and whose `data` array values sum to the total of all transaction amounts.

**Validates: Requirements 5.1, 5.5**

---

### Property 8: Transaction serialization round-trip preserves data

*For any* collection of valid transactions, serializing to JSON and deserializing back must produce a collection that is deeply equal to the original — all `id`, `name`, `amount`, `category`, and `timestamp` fields intact.

**Validates: Requirements 6.1, 6.2**

---

## Error Handling

### Validation Errors (user input)

- Shown inline, adjacent to the offending field, via `<span class="error">` elements.
- Errors are cleared on each new submission attempt before re-validation.
- Form submission is blocked via `event.preventDefault()` when any field is invalid.

### Local Storage Errors

- `loadFromStorage` and `saveToStorage` are wrapped in try/catch.
- On read failure: `state.transactions` starts as `[]`; the `#storage-warning` banner becomes visible.
- On write failure: the error is silently swallowed — data stays in memory for the current session; no crash.

### Empty Chart State

- When `buildChartData` receives an empty array it returns `null`.
- `renderChart()` checks for `null`, hides the canvas, shows `#chart-empty`, and skips Chart.js instantiation entirely.

### Chart.js Canvas Conflict

- The current Chart.js instance is stored in a module-level variable `let chartInstance = null`.
- Before creating a new chart, `renderChart()` calls `chartInstance.destroy()` if the variable is non-null.

### Missing DOM Elements

- `init()` checks that required DOM elements exist before attaching event listeners. A missing element logs a `console.error` and skips that listener rather than throwing.

---

## Testing Strategy

### Approach

Because the application is built with vanilla JS and no bundler, tests are run in a lightweight Node.js environment (e.g., Vitest or Jest with `jsdom`) that can import the pure-function exports from `js/app.js`. DOM-dependent functions are tested by setting up a minimal `jsdom` environment.

### Pure Function Unit Tests (example-based)

Target the stateless helper functions:

| Function | What to test |
|---|---|
| `validateTransaction` | All-valid input passes; each individual field empty fails; zero/negative amount fails; non-category value fails |
| `calculateBalance` | Empty list → 0; single item; multiple items with decimals |
| `buildChartData` | Empty list → null; single category; multiple categories; percentages sum to 100 |
| `formatCurrency` | 0 → "$0.00"; integer → "$5.00"; decimal → "$12.34" |

### Property-Based Tests

Use [fast-check](https://github.com/dubzzz/fast-check) (MIT-licensed, no native deps, works in Node.js without a browser). Each property test runs a minimum of **100 iterations**.

Each test is tagged with a comment in the format:
`// Feature: expense-budget-visualizer, Property {N}: {property_text}`

| Property | Generator inputs | Assertion |
|---|---|---|
| P1: Adding grows list | Random valid transaction object | `list.length` increases by 1; new item in list |
| P2: Invalid inputs rejected | Random inputs with at least one invalid field | `validateTransaction` returns `valid: false` with ≥1 error |
| P3: List renders correctly | Random `Transaction[]` | Each item appears with correct name, `$X.XX` format, category |
| P4: Delete adjusts balance | Random `Transaction[]` (length ≥ 2), random index | List shrinks by 1; balance decreases by deleted amount |
| P5: Balance equals sum | Random positive `number[]` as amounts | `calculateBalance` returns `amounts.reduce((a, b) => a + b, 0)` |
| P6: Currency format valid | Random non-negative finite number | Output matches `/^\$\d+\.\d{2}$/` |
| P7: Chart data segments | Random `Transaction[]` with 1–3 categories | Labels = distinct categories present; data values sum = total |
| P8: Serialization round-trip | Random `Transaction[]` | `JSON.parse(JSON.stringify(arr))` deep-equals original |

### Integration / Smoke Tests

- Open `index.html` from a `file://` URL in each target browser (Chrome, Firefox, Edge, Safari) and manually verify:
  - Page loads without console errors
  - Add → list/balance/chart update
  - Delete → list/balance/chart update
  - Refresh → data persists
  - Private/sandboxed mode → warning banner appears, app still works

### Responsive Layout

- Use browser DevTools device emulation at 375 px, 768 px, and 1024 px widths to verify no horizontal scroll and correct element reflow.

### Accessibility Checks

- All form inputs have associated `<label>` elements.
- Error messages use `aria-live="polite"` so screen readers announce validation failures.
- The chart canvas has an `aria-label` describing its purpose.
