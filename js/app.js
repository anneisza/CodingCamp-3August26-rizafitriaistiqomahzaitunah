// Constants
const CATEGORIES = ['Food', 'Transport', 'Fun'];
const STORAGE_KEY = 'expense-budget-visualizer-transactions';

// Emoji map per category
const CATEGORY_EMOJI = { Food: '🍔', Transport: '🚌', Fun: '🎉' };

// Application State
const state = {
  /** @type {Transaction[]} */
  transactions: [],
  /** @type {string|null} — id of the transaction being edited, or null */
  editingId: null,
};

// Chart instance reference (destroyed and recreated on each render)
let chartInstance = null;

// --- Validation ---

/**
 * Validates raw form values before creating a transaction.
 *
 * @param {string} name     - Item Name field value
 * @param {string} amount   - Amount field value (raw string from input)
 * @param {string} category - Category dropdown value
 * @returns {{ valid: boolean, errors: { name?: string, amount?: string, category?: string } }}
 */
function validateTransaction(name, amount, category) {
  const errors = {};

  // R1.3: name must be non-empty after trimming
  if (!name || name.trim() === '') {
    errors.name = 'Item name is required.';
  }

  // R1.4: amount must parse to a finite number greater than 0
  const parsedAmount = parseFloat(amount);
  if (!isFinite(parsedAmount) || parsedAmount <= 0) {
    errors.amount = 'Amount must be a number greater than 0.';
  }

  // R1.3: category must be one of the defined CATEGORIES
  if (!CATEGORIES.includes(category)) {
    errors.category = 'Please select a valid category (Food, Transport, or Fun).';
  }

  const valid = Object.keys(errors).length === 0;
  return { valid, errors };
}

// --- Business Logic: Balance & Currency ---

/**
 * Sums all transaction amounts.
 * Returns 0 for an empty array.
 * Pure function — no side effects.
 *
 * @param {Transaction[]} transactions
 * @returns {number}
 */
function calculateBalance(transactions) {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * Formats a number as a currency string prefixed with '$'.
 * Uses toFixed(2) for exactly two decimal places.
 * Pure function — no side effects.
 *
 * @param {number} amount
 * @returns {string}  e.g. "$12.50"
 */
function formatCurrency(amount) {
  return '$' + amount.toFixed(2);
}

// Business Logic

/**
 * Aggregates transaction amounts by category for Chart.js consumption.
 * Pure function — no side effects, no DOM access.
 *
 * @param {Transaction[]} transactions
 * @returns {{ labels: string[], data: number[], colors: string[] } | null}
 *   Returns null when transactions is empty (triggers empty-state UI).
 */
function buildChartData(transactions) {
  if (!transactions || transactions.length === 0) {
    return null;
  }

  const CHART_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D'];

  // Aggregate amounts by category, preserving CATEGORIES order
  const totals = {};
  for (const tx of transactions) {
    if (totals[tx.category] === undefined) {
      totals[tx.category] = 0;
    }
    totals[tx.category] += tx.amount;
  }

  // Build result arrays — only include categories with amount > 0
  const labels = [];
  const data = [];
  const colors = [];

  for (let i = 0; i < CATEGORIES.length; i++) {
    const category = CATEGORIES[i];
    if (totals[category] && totals[category] > 0) {
      labels.push(category);
      data.push(totals[category]);
      colors.push(CHART_COLORS[i]);
    }
  }

  return { labels, data, colors };
}

// --- Storage ---

/**
 * Shows the storage warning banner (#storage-warning).
 */
function showStorageWarning() {
  const el = document.getElementById('storage-warning');
  if (el) el.classList.remove('hidden');
}

/**
 * Reads transactions from Local Storage.
 * Returns [] if nothing stored, parsing fails, or storage is unavailable.
 * R6.1, R6.2, R6.3, R6.4
 * @returns {Transaction[]}
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    showStorageWarning();
    return [];
  }
}

/**
 * Writes transactions to Local Storage.
 * Silently ignores errors (data stays in memory).
 * R6.1, R6.2
 * @param {Transaction[]} transactions
 */
function saveToStorage(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    // Silent failure — data persists in memory for this session
  }
}

// --- Rendering ---

function renderBalance() {
  const el = document.getElementById('balance-amount');
  if (el) {
    el.textContent = formatCurrency(calculateBalance(state.transactions));
  }
  const el2 = document.getElementById('tx-count');
  if (el2) {
    el2.textContent = state.transactions.length + (state.transactions.length === 1 ? ' transaction' : ' transactions');
  }
}

function renderList() {
  const ul = document.getElementById('transaction-list');
  const empty = document.getElementById('list-empty');
  if (!ul) return;
  ul.innerHTML = '';
  if (state.transactions.length === 0) {
    ul.classList.add('hidden');
    if (empty) empty.classList.remove('hidden');
    return;
  }
  ul.classList.remove('hidden');
  if (empty) empty.classList.add('hidden');
  for (const tx of state.transactions) {
    const li = document.createElement('li');
    if (state.editingId === tx.id) {
      li.classList.add('editing');
    }

    // Category icon
    const categoryLower = tx.category.toLowerCase();
    const icon = document.createElement('span');
    icon.className = 'item-icon ' + categoryLower;
    icon.textContent = CATEGORY_EMOJI[tx.category] || '';

    // Item name
    const name = document.createElement('span');
    name.className = 'item-name';
    name.textContent = tx.name;

    // Meta wrapper: amount + category badge + delete
    const meta = document.createElement('span');
    meta.className = 'item-meta';

    const amount = document.createElement('span');
    amount.className = 'item-amount';
    amount.textContent = formatCurrency(tx.amount);

    const category = document.createElement('span');
    category.className = 'item-category ' + categoryLower;
    category.textContent = tx.category;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.dataset.id = tx.id;

    meta.appendChild(amount);
    meta.appendChild(category);

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'edit-btn';
    editBtn.textContent = '✏️';
    editBtn.dataset.editId = tx.id;
    editBtn.setAttribute('aria-label', 'Edit transaction');

    meta.appendChild(editBtn);      // edit before delete
    meta.appendChild(deleteBtn);

    li.appendChild(icon);
    li.appendChild(name);
    li.appendChild(meta);
    ul.appendChild(li);
  }
}

function renderChart() {
  if (chartInstance !== null) {
    chartInstance.destroy();
    chartInstance = null;
  }
  const canvas = document.getElementById('spending-chart');
  const emptyMsg = document.getElementById('chart-empty');
  const chartData = buildChartData(state.transactions);
  if (!chartData) {
    if (canvas) canvas.classList.add('hidden');
    if (emptyMsg) emptyMsg.classList.remove('hidden');
    return;
  }
  if (canvas) canvas.classList.remove('hidden');
  if (emptyMsg) emptyMsg.classList.add('hidden');
  chartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: chartData.labels,
      datasets: [{
        data: chartData.data,
        backgroundColor: chartData.colors,
        borderWidth: 2,
        borderColor: 'rgba(15,12,41,0.6)',
        hoverBorderColor: '#fff',
        hoverBorderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'rgba(255,255,255,0.7)',
            padding: 16,
            font: { family: 'Inter', size: 12, weight: '600' },
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15,12,41,0.9)',
          titleColor: '#fff',
          bodyColor: 'rgba(255,255,255,0.7)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const value = context.parsed;
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              return '  ' + formatCurrency(value) + ' (' + pct + '%)';
            },
          },
        },
      },
      cutout: '65%',
    },
  });
}

// --- Render Orchestrator ---

/**
 * Coordinates all render sub-functions.
 * R4.2, R4.3, R5.2, R5.3
 */
function render() {
  renderBalance();
  renderList();
  renderChart();
}

// --- Event Handlers ---

/**
 * Pre-fills the form with the given transaction's data and switches to edit mode.
 * @param {string} id
 */
function enterEditMode(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;

  state.editingId = id;

  // Pre-fill form fields
  const nameInput = document.getElementById('item-name');
  const amountInput = document.getElementById('item-amount');
  const categoryInput = document.getElementById('item-category');
  if (nameInput) nameInput.value = tx.name;
  if (amountInput) amountInput.value = tx.amount;
  if (categoryInput) categoryInput.value = tx.category;

  // Update form UI
  const title = document.getElementById('form-title');
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  if (title) title.textContent = '✏️ Edit Expense';
  if (submitBtn) submitBtn.textContent = '💾 Save Changes';
  if (cancelBtn) cancelBtn.classList.remove('hidden');

  const form = document.getElementById('transaction-form');
  const section = document.querySelector('.input-section');
  if (form) form.classList.add('edit-mode');
  if (section) section.classList.add('edit-mode');

  // Highlight the item being edited in the list
  renderList();

  // Scroll form into view
  const formSection = document.querySelector('.input-section');
  if (formSection) formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Exits edit mode and resets the form to "add" state.
 */
function exitEditMode() {
  state.editingId = null;

  const form = document.getElementById('transaction-form');
  if (form) form.reset();

  // Clear errors
  ['error-name', 'error-amount', 'error-category'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.add('hidden'); }
  });

  // Restore form UI
  const title = document.getElementById('form-title');
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  if (title) title.textContent = '📝 Add Expense';
  if (submitBtn) submitBtn.textContent = '➕ Add Transaction';
  if (cancelBtn) cancelBtn.classList.add('hidden');

  const form2 = document.getElementById('transaction-form');
  const section = document.querySelector('.input-section');
  if (form2) form2.classList.remove('edit-mode');
  if (section) section.classList.remove('edit-mode');

  renderList();
}

/**
 * Handles the transaction form submit event.
 * R1.1, R1.2, R1.3, R1.4, R1.5, R4.2, R5.2, R6.1
 * @param {Event} event
 */
function handleFormSubmit(event) {
  event.preventDefault();

  // Reset all error spans
  const errorName = document.getElementById('error-name');
  const errorAmount = document.getElementById('error-amount');
  const errorCategory = document.getElementById('error-category');
  if (errorName) { errorName.textContent = ''; errorName.classList.add('hidden'); }
  if (errorAmount) { errorAmount.textContent = ''; errorAmount.classList.add('hidden'); }
  if (errorCategory) { errorCategory.textContent = ''; errorCategory.classList.add('hidden'); }

  const nameInput = document.getElementById('item-name');
  const amountInput = document.getElementById('item-amount');
  const categoryInput = document.getElementById('item-category');

  const name = nameInput ? nameInput.value : '';
  const amount = amountInput ? amountInput.value : '';
  const category = categoryInput ? categoryInput.value : '';

  const result = validateTransaction(name, amount, category);

  if (!result.valid) {
    if (result.errors.name && errorName) {
      errorName.textContent = result.errors.name;
      errorName.classList.remove('hidden');
    }
    if (result.errors.amount && errorAmount) {
      errorAmount.textContent = result.errors.amount;
      errorAmount.classList.remove('hidden');
    }
    if (result.errors.category && errorCategory) {
      errorCategory.textContent = result.errors.category;
      errorCategory.classList.remove('hidden');
    }
    return;
  }

  if (state.editingId) {
    // --- EDIT MODE: update the existing transaction in place ---
    state.transactions = state.transactions.map(tx => {
      if (tx.id !== state.editingId) return tx;
      return {
        ...tx,
        name: name.trim(),
        amount: parseFloat(amount),
        category,
      };
    });
    saveToStorage(state.transactions);
    exitEditMode();
    render();
  } else {
    // --- ADD MODE: create a new transaction ---
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString();

    const transaction = {
      id,
      name: name.trim(),
      amount: parseFloat(amount),
      category,
      timestamp: Date.now(),
    };

    state.transactions.push(transaction);
    saveToStorage(state.transactions);
    render();
    event.target.reset();
  }
}

/**
 * Removes the transaction with the given id from state and re-renders.
 * R3.2, R3.3, R3.4, R4.3, R5.3, R6.2
 * @param {string} id
 */
function handleDelete(id) {
  if (!window.confirm('Delete this transaction?')) return;
  state.transactions = state.transactions.filter(tx => tx.id !== id);
  saveToStorage(state.transactions);
  render();
}

// --- Bootstrap ---

/**
 * Initialises the application: loads stored data, attaches listeners, renders.
 * R6.3, R6.4, R7.1, R7.2, R7.3
 */
function init() {
  state.transactions = loadFromStorage();

  const form = document.getElementById('transaction-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  } else {
    console.error('init: #transaction-form not found');
  }

  const list = document.getElementById('transaction-list');
  if (list) {
    list.addEventListener('click', function(e) {
      // Delete
      if (e.target && e.target.matches('button[data-id]')) {
        handleDelete(e.target.dataset.id);
        return;
      }
      // Edit
      if (e.target && e.target.matches('button[data-edit-id]')) {
        enterEditMode(e.target.dataset.editId);
        return;
      }
    });
  } else {
    console.error('init: #transaction-list not found');
  }

  const cancelBtn = document.getElementById('cancel-edit-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', exitEditMode);
  }

  render();
}

document.addEventListener('DOMContentLoaded', init);
