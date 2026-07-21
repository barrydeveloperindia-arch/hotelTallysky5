# Global Project Rules

## 1. Documentation Preservation (Do Not Forget Old Plans)
Whenever you are asked to update an implementation plan (`implementation_plan.md`) or any architectural document, you MUST:
1. First use `view_file` to read the current contents of the document.
2. Carefully **MERGE** or **APPEND** the new requirements into the existing document.
3. **NEVER** completely overwrite the document from scratch, as this causes previously approved logic, formatting rules, and context to be lost.

## 2. Strict Tally Auditing
Before generating any XML payload for Tally or attempting an import:
1. You must cross-reference all extracted Ledgers and Items against the Tally Masters (`tally_masters.xml`).
2. You must ensure the total number of processed JSON records exactly matches the total number of source PDF bills.
3. Halt and alert the user immediately if any Ledger/Item is missing from Tally, or if any bill is missing from the extraction.

## 3. Strict Folder Isolation
All work, scripts, and temporary files generated during a session MUST be isolated into a dedicated timestamped or versioned folder (e.g., `tally_integration_v2`) within the project, unless explicitly editing global configuration files.

## 4. Strict Business Logic
- **Room Numbers**: Single or double digit room numbers (e.g., 2, 02) must be translated to 100s (e.g., 102).
- **Complementary (CL)**: Any food bill containing the exact string "CL" must not be pushed as a standard Sale. It must be processed as 2 Journal Vouchers.

## 5. Global Synchronization (Super AI Rule)
Whenever ANY business logic, rule, or requirement is changed by the user, you MUST exhaustively update ALL linked files simultaneously. If you update the `implementation_plan.md`, you MUST also update the corresponding `SKILL.md` files, Node.js scripts, and JSON schemas in the exact same turn. Never leave an updated rule stranded in just one document.

## 6. Anti-Duplicate XML (Idempotent Import)
To prevent duplicate entries in Tally upon re-imports, the system MUST ALWAYS use `ACTION="Create"` and explicitly inject a deterministic `<GUID>` and `<REMOTEID>` into every voucher. In newer versions of Tally Prime, using `ACTION="Alter"` on a non-existent voucher causes a "Cannot delete unnamed object: VOUCHER!" exception. By using `ACTION="Create"` combined with a `<REMOTEID>`, Tally performs an upsert: it creates the voucher if it doesn't exist, and alters it if the REMOTEID is already present. This guarantees Tally overwrites the existing entry instead of duplicating it.

## 7. Room Sales Master Logic (Accounting Voucher View + Inventory Item)
Whenever generating Room Sales (Master Bills and Treebo Bills) in Tally XML:
- The voucher MUST be structured as an **Accounting Voucher View** (`OBJVIEW="Accounting Voucher View"`).
- Inside the Sales Ledger entry (e.g., `Sale 5% Haryana B2C`), an `INVENTORYALLOCATIONS.LIST` MUST be embedded.
- The Stock Item Name MUST strictly be `Room No:-`.
- **CRITICAL MULTIPLE ROOMS RULE**: Even if the guest booked multiple rooms (e.g., Room 106 and 107), the `ACTUALQTY` and `BILLEDQTY` for the `Room No:-` stock item MUST ALWAYS be exactly ` 1 Nos`. 
- The Rate and Amount for the `Room No:-` stock item MUST match the total Basic Amount for the voucher.
- The `CATEGORYALLOCATIONS.LIST` (distributing the amount across Room cost centres) MUST also be embedded within the same Sales Ledger block. If multiple rooms are present, the Basic Amount is split equally across those Room Cost Centres, but the Stock Item quantity remains `1 Nos`.

## 8. Food Sales Logic (Inventory Item Category Allocations & Discounts)
Whenever generating Food Bills in Tally XML:
- You MUST NOT use a `Discount Allowed` ledger.
- If there is an explicit discount in the bill, it MUST be injected as a **Negative Inventory Item** (e.g. `<STOCKITEMNAME>Discount</STOCKITEMNAME>`) with a negative `<AMOUNT>`. Its Cost Centre Allocations MUST also be negative so they become Debits (Dr) in Tally.
- Any tiny rounding differences MUST flow into the `ROUND OFF` ledger.
- The `CATEGORYALLOCATIONS.LIST` for `Rooms` and `Expenses` MUST be placed **INSIDE** the `<INVENTORYALLOCATIONS.LIST>` of each food/discount item, NOT attached directly to the Sales Ledger.
- Each food item (and discount item) must allocate 100% of its amount to `Rooms` (Room No / Walk-in Guest) and 100% of its amount to `Expenses` (Kitchen Expenses).

## 9. Guest Ledger Auto-Creation Rules (Sundry Debtors)
When generating XML for missing Guest Ledgers (Sundry Debtors) in Tally Prime, flat tags are ignored. You MUST use nested list structures:
- `Maintain balances bill-by-bill` (`<ISBILLWISEON>`) MUST ALWAYS be `No`.
- For State and Country, you MUST inject a `<LEDMAILINGDETAILS.LIST>` block containing `<STATE>` (e.g., Haryana), `<COUNTRY>` (India), and optionally `<ADDRESS.LIST>` and `<PINCODE>`.
- For B2B/Corporate Guests with Address, inject `<ADDRESS.LIST>` containing `<ADDRESS>` inside `<LEDMAILINGDETAILS.LIST>`.
- For GST Registration Type, you MUST inject a `<LEDGSTREGDETAILS.LIST>` block containing `<GSTREGISTRATIONTYPE>` (e.g., Unregistered/Consumer or Regular) and `<PLACEOFSUPPLY>` (State Name).
- **CRITICAL B2B RULE**: For B2B Guests, their GST Number MUST be injected as `<GSTIN>` INSIDE the `<LEDGSTREGDETAILS.LIST>` block. Flat `<PARTYGSTIN>` alone will leave the Tally UI GST field empty.
- NEVER use flat `<STATENAME>` or `<COUNTRYOFRESIDENCE>` at the root of the `<LEDGER>`, as Tally Prime will leave the fields blank ("Not Applicable").

## 10. Voucher Party Details (Accounting Voucher View)
When generating Sales Vouchers (Rooms or Food) in Tally Prime, Tally will NOT automatically pull the State/Country/GST from the Ledger into the Voucher's "Party Details" (Consignee) screen. 
You MUST explicitly inject the Party Details directly inside the `<VOUCHER>` block (at the same level as `<PARTYLEDGERNAME>`):
- `<PARTYNAME>`, `<BASICBUYERNAME>`, `<CONSIGNEENAME>`
- `<STATENAME>` and `<CONSIGNEESTATENAME>` (e.g., Haryana)
- `<COUNTRYOFRESIDENCE>` and `<CONSIGNEECOUNTRYNAME>` (e.g., India)
- `<GSTREGISTRATIONTYPE>` (e.g., Regular or Unregistered/Consumer)
- `<PLACEOFSUPPLY>` (State name)
- For B2B guests, `<PARTYGSTIN>` MUST also be explicitly injected in the VOUCHER block.

## 11. B2B Sales Ledger Assignment
When generating Sales Vouchers in Tally Prime, you MUST dynamically assign the correct Sales Ledger based on whether the guest is B2B or B2C.
- If the guest has a GST Number (`isB2B = true`) or is a corporate client (e.g. `ENGLABS`), the Sales Ledger MUST be named `SALES B2B 5% HARYANA` (or the respective 12% B2B variant).
- You MUST NOT use `Sale 5% Haryana B2C` for a B2B guest.
- This applies to both Master Bills (Room Sales) and Food Bills.

## 12. Validating Existing Tally Ledgers (Auditor Rule)
When the Tally Auditor checks `tally_masters.xml` for missing guests, it MUST NOT simply check if the ledger name exists. 
It MUST also validate the contents of the existing ledger block. If an existing guest ledger has an empty `<STATE/>`, an empty `<COUNTRY/>`, or a missing/empty `<LEDGSTREGDETAILS.LIST>`, it MUST be marked as invalid and added to the `missingGuests` list so that the XML Generator can overwrite (Alter) it with the correct nested Mailing and GST details.
