# Requirements Document

## Introduction

The Expense & Budget Visualizer is a single-page web application built with plain HTML, CSS, and vanilla JavaScript. It enables users to track personal expenses by category, view a running total balance, and visualize spending distribution through a pie chart. All data is persisted client-side via the browser's Local Storage API — no backend or build tooling is required. The application must function as a standalone web page in any modern browser.

## Glossary

- **Application**: The single-page Expense & Budget Visualizer web application.
- **Transaction**: A single expense record consisting of a name, an amount, and a category.
- **Transaction_List**: The scrollable on-screen list that displays all recorded Transactions.
- **Input_Form**: The HTML form containing the Item Name, Amount, and Category fields used to create a new Transaction.
- **Category**: One of the predefined spending labels — Food, Transport, or Fun — assigned to a Transaction.
- **Balance**: The computed total of all Transaction amounts, displayed at the top of the Application.
- **Chart**: The pie chart rendered by Chart.js that shows the spending distribution across Categories.
- **Storage**: The browser's Local Storage API used to persist Transaction data between sessions.
- **Validator**: The client-side logic responsible for checking Input_Form field values before submission.

---

## Requirements

### Requirement 1: Transaction Input

**User Story:** As a user, I want to enter an expense item with a name, amount, and category, so that I can record individual spending transactions.

#### Acceptance Criteria

1. THE Input_Form SHALL contain a text field for Item Name, a numeric field for Amount, and a dropdown selector for Category with options Food, Transport, and Fun.
2. WHEN the user submits the Input_Form with all fields correctly filled, THE Application SHALL create a new Transaction and add it to the Transaction_List.
3. WHEN the user submits the Input_Form with one or more empty fields, THE Validator SHALL prevent submission and display an inline error message identifying each empty field.
4. WHEN the user submits the Input_Form with an Amount value that is not a positive number, THE Validator SHALL prevent submission and display an inline error message stating that Amount must be a positive number.
5. WHEN a Transaction is successfully added, THE Input_Form SHALL reset all fields to their default empty state.

---

### Requirement 2: Transaction List Display

**User Story:** As a user, I want to see all my recorded transactions in a scrollable list, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display every recorded Transaction with its Item Name, Amount formatted to two decimal places, and Category label.
2. WHILE the number of visible Transactions exceeds the visible height of the Transaction_List container, THE Transaction_List SHALL remain scrollable without affecting the layout of the rest of the page.
3. WHEN the Transaction_List contains no Transactions, THE Application SHALL display a placeholder message indicating that no transactions have been added yet.

---

### Requirement 3: Transaction Deletion

**User Story:** As a user, I want to delete a transaction from the list, so that I can correct mistakes or remove unwanted entries.

#### Acceptance Criteria

1. THE Transaction_List SHALL render a delete control for each Transaction.
2. WHEN the user activates the delete control for a Transaction, THE Application SHALL remove that Transaction from the Transaction_List.
3. WHEN a Transaction is deleted, THE Balance SHALL update immediately to reflect the removal.
4. WHEN a Transaction is deleted, THE Chart SHALL update immediately to reflect the removal.

---

### Requirement 4: Total Balance Display

**User Story:** As a user, I want to see a total balance at the top of the page, so that I can know my cumulative spending at a glance.

#### Acceptance Criteria

1. THE Application SHALL display the Balance prominently at the top of the page.
2. WHEN a Transaction is added, THE Balance SHALL update to include the new Transaction amount without requiring a page reload.
3. WHEN a Transaction is deleted, THE Balance SHALL update to exclude the deleted Transaction amount without requiring a page reload.
4. THE Balance SHALL be formatted as a currency value with two decimal places and a currency symbol.

---

### Requirement 5: Spending Distribution Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL render as a pie chart displaying one segment per Category that has at least one Transaction.
2. WHEN a Transaction is added, THE Chart SHALL re-render automatically to reflect the updated spending distribution.
3. WHEN a Transaction is deleted, THE Chart SHALL re-render automatically to reflect the updated spending distribution.
4. WHEN all Transactions are removed, THE Chart SHALL display a neutral empty state rather than rendering a broken or empty chart.
5. THE Chart SHALL label each segment with the Category name and the corresponding percentage of total spending.

---

### Requirement 6: Data Persistence

**User Story:** As a user, I want my transactions to be saved between browser sessions, so that I do not lose my data when I close or refresh the page.

#### Acceptance Criteria

1. WHEN a Transaction is added, THE Storage SHALL write the updated Transaction collection to Local Storage.
2. WHEN a Transaction is deleted, THE Storage SHALL write the updated Transaction collection to Local Storage.
3. WHEN the Application loads, THE Application SHALL read the Transaction collection from Local Storage and populate the Transaction_List, Balance, and Chart with the stored data.
4. IF Local Storage is unavailable or reading from Local Storage fails, THEN THE Application SHALL display a warning message and continue operating with an empty Transaction collection in memory.

---

### Requirement 7: Browser Compatibility

**User Story:** As a user, I want the application to work in any modern browser without installation, so that I can use it anywhere.

#### Acceptance Criteria

1. THE Application SHALL render and function correctly in the current stable versions of Chrome, Firefox, Edge, and Safari.
2. THE Application SHALL operate as a standalone HTML file that can be opened directly in a browser without a web server.
3. THE Application SHALL use only standard browser APIs available in all target browsers without requiring polyfills.

---

### Requirement 8: Layout and Visual Design

**User Story:** As a user, I want a clean, readable interface with clear visual hierarchy, so that I can use the application without confusion.

#### Acceptance Criteria

1. THE Application SHALL organize all UI elements — Input_Form, Balance, Chart, and Transaction_List — within a single scrollable page using a consistent visual layout.
2. THE Application SHALL apply styles exclusively through a single CSS file located at `css/style.css`.
3. THE Application SHALL apply behavior exclusively through a single JavaScript file located at `js/app.js`.
4. THE Application SHALL use typography and spacing that ensures all text is legible at default browser font sizes.
5. WHEN the viewport width is 768 pixels or below, THE Application SHALL reflow the layout so that no horizontal scrolling is required.
