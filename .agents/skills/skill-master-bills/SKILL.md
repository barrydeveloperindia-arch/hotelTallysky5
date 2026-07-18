---
name: skill-master-bills
description: Strict logic and rules for parsing and testing Master Bills.
---

# Master Bills Extraction Rule

When parsing Master Bills, you MUST strictly extract ONLY the following fields:
1. `Guest Name`
2. `Invoice Date` (This becomes the Tally Voucher Date)
3. `Bill No` (This becomes the Tally Voucher No)
4. `GST` (If present)
5. `Room No`
6. `CGST` and `SGST`
7. `Total Room Rent/OTH` and `Room Rent(Inc Taxes)`

### Business Logic
- The Room No MUST be normalized. Single/double digits (e.g., `2`, `02`) become `102`.
- You MUST match the Guest Name, Room No, or Bill No with the `NEW DAYBOOK-2026.xlsx` file.
- The objective of matching with the Excel daybook is to find their exact payment mode (Cash, UPI, Card, Treebo Paid).
- This payment data will be structured as a **Journal Voucher** in the Tally Import.
  - Cash -> Debit: `CASH`
  - UPI/Card -> Debit: `CONSUMER`
  - Treebo -> Debit: `Treebo Paid`
  - Credit: `[Guest Name]`
- If you find `ENGLABS INDIA PVT LTD` in the guest name, it is STRICTLY B2B regardless of whether a GST number is present.

### Tests to Run
- Verify every Master Bill in the folder is successfully extracted into JSON.
- Verify `Total Room Rent` + `CGST` + `SGST` mathematically equals `Room Rent(Inc Taxes)`.
