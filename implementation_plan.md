# June 1st Complementary Bills Import Plan

This plan details the integration of complementary food bills for the **June 1st, 2026** Daybook checkouts into Tally Prime. Following the user's direction, we will process only `POS-16032` at this stage and postpone `POS-16023` until its physical bill is located.

---

## User Review Required

> [!IMPORTANT]
> **Postponed Bill**: `POS-16023` (Varun, Room 06, ₹130.00) is postponed and excluded from this import run as per your direction, pending the discovery of its physical bill.
> Only `POS-16032` (Rahul Purohit, Room 10, ₹250.00) will be imported.

> [!NOTE]
> **Accounting Structure**:
> * **JV 1 (Consumption)**: Debits `RAHUL PUROHIT` (₹250.00), credits `FOC Food Consumption` (₹238.55, with item-wise stock allocations), and credits `ROUND OFF` (₹11.45) to balance.
> * **JV 2 (Clearing)**: Debits `Complementary Food Expense` (₹250.00, allocated to cost centre `Room 10` under cost category `Rooms`) and credits `RAHUL PUROHIT` (₹250.00) to clear the balance.

---

## Proposed Changes

### Integration Script

#### [NEW] [import_june1_complementary.cjs](file:///c:/Users/Administrator/OneDrive/MANGEMENT%20FILE/Documents/Antigravity/Hotel/import_june1_complementary.cjs)

This script will:
1. Verify/create the ledgers:
   - `FOC Food Consumption` (Parent: `Direct Incomes`, Cost Centres: No)
   - `Complementary Food Expense` (Parent: `Indirect Expenses`, Cost Centres: Yes)
2. Post the Sales Journal for `POS-16032` on date `20260602`:
   - Guest: `RAHUL PUROHIT` (Debit: ₹250.00)
   - Stock items (Credit: `FOC Food Consumption` total ₹238.55):
     - `Aloo Parantha` (qty: 1, rate: 57.14, amt: 57.14)
     - `Mix Parantha` (qty: 1, rate: 57.60, amt: 57.60)
     - `TEA` (qty: 1, rate: 38.10, amt: 38.10)
     - `Veg Sandwich` (qty: 1, rate: 85.71, amt: 85.71)
   - Round-off (Credit: `ROUND OFF` total ₹11.45)
3. Post the Clearing Journal for `POS-16032-CL` on date `20260602`:
   - Expense: `Complementary Food Expense` (Debit: ₹250.00, Cost Category: `Rooms`, Cost Centre: `Room 10`)
   - Guest: `RAHUL PUROHIT` (Credit: ₹250.00)

---

## Verification Plan

### Automated Verification
* Execute `import_june1_complementary.cjs` to verify ledger creations and voucher postings return `<CREATED>1</CREATED>`.

### Manual Verification
* Inspect Tally Prime:
  1. Ledger `RAHUL PUROHIT` to verify it has a matching debit of ₹250.00 and credit of ₹250.00, resulting in a net-zero balance for this food bill.
  2. Profit & Loss or Trial Balance to verify stock consumption in `FOC Food Consumption` and expense allocation in `Complementary Food Expense` under `Room 10`.
