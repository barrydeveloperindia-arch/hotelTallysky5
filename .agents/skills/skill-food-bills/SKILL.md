---
name: skill-food-bills
description: Strict logic and rules for parsing and testing Food Bills.
---

# Food Bills Extraction Rule

When parsing Food Bills, you MUST strictly extract ONLY the following fields:
1. `Bill No.`
2. `PACKING` (if present)
3. `Date`
4. `Guest Name`
5. `Table No.`
6. All Food Items (Name, Qty, Rate, GST%, Amt)
7. `Basic Amount`, `CGST`, `SGST`, `Total Amount`

### Business Logic
- **Walk-in Customer Logic**: If there is NO Room Number, check if "PACKING" is written or check the "Table No". If no room number can be deduced, this is a Direct Walk-In sale.
  - Walk-in sales are imported by Debiting the `Guest Name` (e.g., SWATI). If no guest name is provided at all, debit `Walk-In Customer`.
- **Complementary (CL) Logic**: Check EVERY bill for the exact string "CL". If found, it is a Complementary Food Expense. It does NOT go as a Sale.
  - It generates **Two Journal Vouchers**:
  - Voucher 1: Debit `[Guest Name]`, Credit `FOC Food Consumption`. For the Credit leg, attach Inventory Items, AND for each item, attach the Cost Centre `Expenses` -> `Kitchen Expenses` (Cr).
  - Voucher 2: Debit `Complementary Food Expense` (Cost Centre: `Rooms` -> `Room [X]`), Credit `[Guest Name]`.
- All standard food sales require Cost Category splitting.

### Food Bill Tally XML Structure
- Food Bills MUST be exported as **Accounting Voucher View** in Tally XML.
- You MUST NOT use a `Discount Allowed` ledger. 
- Explicit POS discounts MUST be injected as a **Negative Inventory Item** (`<STOCKITEMNAME>Discount</STOCKITEMNAME>`) with a negative `<AMOUNT>`. The attached Cost Centres will inherit this negative amount (Debit).
- The `CATEGORYALLOCATIONS.LIST` for `Rooms` and `Expenses` MUST be placed **INSIDE** the `<INVENTORYALLOCATIONS.LIST>` of each food item and discount item, NOT attached directly to the Sales Ledger.
- Each food item (and discount item) must allocate 100% of its amount to `Rooms` (Room No / Walk-in Guest) and 100% of its amount to `Expenses` (Kitchen Expenses).
- Any tiny rounding differences MUST flow into the `ROUND OFF` ledger.

### Tests to Run
- Verify all Walk-in bills strictly use `Walk-In Customer`.
- Verify every CL bill perfectly maps to exactly 2 Journal Vouchers.
