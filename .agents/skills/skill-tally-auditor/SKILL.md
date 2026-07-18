---
name: skill-tally-auditor
description: Strict gatekeeper skill that audits ledgers, items, and bill counts before importing to Tally.
---

# Tally Perfect Import & Auditing Rule

This is the most critical strict rule in the pipeline. **BEFORE** any XML is sent to Tally, the agent MUST run a strict validation pass.

### 1. Count Validation
- The script MUST count every single PDF file inside the day's folder (e.g., `01.07.26`).
- It MUST compare this count exactly to the number of processed JSON records.
- If even 1 bill is missing from the JSON, the import MUST HALT and throw an alert stating which file was skipped.

### 2. Tally Masters Validation
- The script MUST read the `tally_masters.xml` (or query Tally API) to get a list of all currently existing Ledgers and Items.
- It MUST verify that every Ledger used in the JSON exists in Tally.
  - Allowed default ledgers: `Sale 5% Haryana B2C`, `SALES B2B 5% HARYANA`, `Output Cgst 2.5%`, `Output Sgst 2.5%`, `ROUND OFF`, `CASH`, `CONSUMER`, `Treebo Paid`, `Walk-In Customer`, `FOC Food Consumption`, `Complementary Food Expense`.
- **New Guest Rule**: If a guest name ledger does NOT exist, the script is allowed to dynamically create it under `Sundry Debtors`.
  - B2C: `Maintain balances bill-by-bill`: `No`, `Country`: `India`, `State`: `Haryana`, `Registration Type`: `Unregistered/Consumer`.
  - B2B: `Registration Type`: `Regular`, State extracted from Bill.

### 3. XML Validation
- Verify every Debit exactly matches the sum of Credits.
- No XML can be imported if there is an imbalance.

If ANY test fails, the system halts. Tally must never receive a pending or broken voucher.
