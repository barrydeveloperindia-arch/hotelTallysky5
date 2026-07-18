---
name: skill-treebo-bills
description: Strict logic and rules for parsing and testing Treebo Bills.
---

# Treebo Bills Extraction Rule

When parsing Treebo Bills, you MUST strictly extract ONLY the following fields:
1. `Invoice No.`
2. `Invoice Date`
3. `Bill To` (Extract Guest Name from here)
4. If GST is present, extract: `Company Name`, `Address`, `State`, `Pincode`
5. `Basic Amount`
6. `CGST` and `SGST`
7. `Total Amount`

### Business Logic
- Treebo bills NEVER mention the Room Number on the bill itself.
- You MUST match the Guest Name and Invoice No with the `NEW DAYBOOK-2026.xlsx` file.
- When searching the daybook, look across past dates because the guest may have paid or checked in on a prior day.
- From the daybook, retrieve the missing `Room No` (e.g., convert `02` to `102`) and the Payment History.
- This payment history will be imported into Tally as a Journal Voucher (Debit `Treebo Paid` or `CASH`/`CONSUMER`, Credit `[Guest Name]`).

### Tests to Run
- Verify every Treebo Bill has been cross-referenced successfully in the daybook and assigned a Room Number.
- Verify `Basic Amount` + taxes matches `Total Amount`.
