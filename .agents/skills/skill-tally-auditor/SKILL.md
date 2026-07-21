---
name: skill-tally-auditor
description: Strict gatekeeper skill that audits ledgers, items, and bill counts before importing to Tally.
---

# Tally Perfect Import & Auditing Rule

This is the most critical strict rule in the pipeline. **BEFORE** any XML is sent to Tally, the agent MUST run a strict validation pass.

### 1. Missing Core Ledgers Check
The script must first check if a set of hardcoded critical ledgers exist in Tally (e.g. `Sale 5% Haryana B2C`, `Round Off`). If any are missing, it throws a fatal error because these must be manually configured in Tally first.

### 2. Dynamic Guest Ledger Validation
It iterates through the JSON sales array. For every `guestName` (except `Walk-in Customer` or `CL`), it searches the Tally Masters XML. 
**CRITICAL RULE**: It is not enough to just check if the ledger name exists. The auditor MUST validate the XML block of the existing ledger. If it finds `<STATE/>`, `<COUNTRY/>`, or missing/empty `<LEDGSTREGDETAILS.LIST>`, the ledger is considered invalid and incomplete. 
If the guest is completely missing OR invalid, it adds the guest to the `missingGuests` array so the XML generator can create or overwrite (alter) them with proper nested fields.

### 3. Dynamic Stock Item Validation
- It MUST verify that every Item used in the JSON exists in Tally. If the Item is missing, it must be added to a `missingItems` list for the XML generator to create it with the correct Unit of Measure (UoM).

### 4. Count Validation
- The script MUST count every single PDF file inside the day's folder (e.g., `01.07.26`).
- It MUST compare this count exactly to the number of processed JSON records.
- If even 1 bill is missing from the JSON, the import MUST HALT and throw an alert stating which file was skipped.

### 3. XML Validation
- Verify every Debit exactly matches the sum of Credits.
- No XML can be imported if there is an imbalance.

If ANY test fails, the system halts. Tally must never receive a pending or broken voucher.
