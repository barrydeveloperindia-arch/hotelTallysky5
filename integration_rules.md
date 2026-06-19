# Hotel Tally Prime Integration Rules

This document details the accounting rules and mappings for importing room stays and food bills into Tally Prime.

---

## 1. Room Stays (Master Bills)

* **Direct Bookings (Walk-ins)**: Stays on invoices marked as "Master Bills" represent direct hotel bookings (B2C).
* **Ledger Mapping (Guest-wise)**:
  * **No** direct channel grouping like `Room Direct Cash` or `Room Direct Online` will be used as the party ledger.
  * Every room stay must be posted under a ledger created with the **Guest's Name** (e.g., `TARUN GOYAL`, `VIKAS SHARMA`).
  * Direct guests are created under the parent group `Hotel Guests - Direct`.
* **Revenue Mappings**:
  * Unregistered B2C sales go to the **`Sale 5% Haryana B2C`** revenue ledger.
* **Cost Allocations**:
  * **No Guest Cost Centres** under category `Guests` will be created or used since guest names are now recorded directly as debtors/ledgers.
  * Allocate the stay revenue only to the **`Rooms`** Cost Category and the specific **Room Cost Centre** (e.g., `Room 20`).

---

## 2. Payments & Settlement (Journal Vouchers)

* **Receipt/Payment JVs**: For stays that are cleared, a clearing Journal Voucher (type: `Journal`) must be posted:
  * **Debit**: `Cash` (for Cash payments) and/or `CONSUMER` (for UPI/online/card payments - do **not** use `Credit Card Payment` ledger).
  * **Credit**: Guest's Name.
* **Narration**: Every clearing Journal Voucher must specify the exact payment method in its narration field, along with the customer's phone/contact number (if printed on the physical bill/invoice):
  * Cash payments -> **`Paid Cash - Contact: [Phone]`**
  * UPI/online payments -> **`Paid Online - Contact: [Phone]`**
  * Credit/Debit Card payments -> **`Paid Credit Card - Contact: [Phone]`**
  * *Note: If no phone number is available on the bill, just write `Paid Cash`, `Paid Online`, or `Paid Credit Card`.*

* **Pending Payments**: If the daybook Excel/physical sheet lists a stay as "Pending":
  * Post only the Sales Invoice.
  * **Do not** post any payment JV. The balance will remain outstanding on the guest's ledger.
* **Treebo Paid**: Master Bills are direct stays; they are only settled via Cash or Consumer (UPI), and **never** via `Treebo Paid`.


---

## 3. GST & B2B Customers

* **B2B Classification**: Any customer invoice containing a GSTIN or representing a business entity (e.g., `ENGLABS INDIA PVT LTD`) must be entered as a **B2B sale**.
* **Englabs**: Bills for Englabs will **always** be entered as B2B.
* **B2B Revenue Ledger**: B2B sales go to the **`SALES B2B 5% HARYANA`** revenue ledger.
* **Place of Supply (POS)**: 
  * The **Place of Supply will always be Haryana** for all bookings, stays, and bills, even if the customer's GSTIN/billing address belongs to another state (like Delhi, Punjab, etc.).
  * Consequently, **all sales will charge CGST (2.5%) and SGST (2.5%)**. We will **never** charge IGST.
* **GST Lookups**: If an invoice has only a GST number written on it:
  * Use the online search tool to search the GSTIN on public registry tools.
  * Retrieve the registered company name, registered business address, state, and pincode.
  * Create the ledger in Tally with these official details under parent group `Hotel Guests - Direct` (or the appropriate parent group).

---

## 4. Complementary Food & Amenity Bills

* **No Stay Deductions**: Complementary food or amenity bill amounts are **never** deducted from room stay sales. Room stays are entered at their full value.
* **Amenities (Dental kits, Water bottles, etc.)**: Complementary amenities given to guests are treated exactly like complementary food bills. We **never** use the `Treebo Paid Food Complementary` or `TREEBO HOTELS` ledgers for these.
* **Ignore GST & Use Rounded Basic Amount**: 
  * For all complementary food/amenity bills, the **GST amount is ignored completely**. 
  * Only the **basic subtotal amount (item totals)** is used and rounded to the nearest rupee.
* **Separately Recorded via JVs**: Every complementary food or amenity bill (marked with "CL" or "Table CL") must be recorded guest-wise using two Journal Vouchers:
  1. **JV 1 (Consumption - Stock Out)**:
     * **Debit**: Guest's Name ledger (rounded basic amount).
     * **Credit**: `FOC Food Consumption` ledger (exact basic item-wise subtotal, e.g., `Dental kit` or specific food items).
     * **Credit/Debit**: `ROUND OFF` (basic amount rounding difference).
  2. **JV 2 (Clearing - Expense)**:
     * **Debit**: `Complementary Food Expense` ledger (rounded basic amount; allocated to **`Rooms`** category and the specific **Room Cost Centre**, e.g., `Room 10`).
     * **Credit**: Guest's Name ledger (rounded basic amount; clearing the guest's ledger balance to zero).



---

## 5. Treebo Bookings (Treebo Sky5)

* **General B2C Treebo Stays**:
  * Post the sales invoice under the specific **Guest's Name** as the party ledger.
  * Use the **`Sale 5% Haryana B2C`** revenue ledger.
  * Settle the balance via a clearing JV based on payment mode:
    * Prepaid through Treebo: Debit **`Treebo Paid`**, credit Guest ledger.
    * Paid at hotel: Debit **`Cash`** or **`CONSUMER`** (UPI), credit Guest ledger.
* **B2B Treebo Stays (with GSTIN)**:
  * If a Treebo Sky5 invoice contains a customer GSTIN, treat it as a **B2B sale**.
  * Post the sales invoice under the **Customer's Company/Guest ledger name** with their GST details.
  * Use the **`SALES B2B 5% HARYANA`** revenue ledger.
  * Place of Supply remains **Haryana** (charge CGST 2.5% and SGST 2.5%).
  * Settle the balance via a clearing JV: Debit **`Treebo Paid`** (if prepaid through Treebo), or **`Cash`** / **`CONSUMER`** (if paid at hotel), and credit the Customer's Company/Guest ledger.

---

## 6. Treebo Corporate Stays (Treebo Hospitality Ventures)

* **B2B Stays**: Stays billed directly to `Treebo Hospitality Ventures Private Limited` are B2B stays.
* **Party Ledger**: **`TREEBO HOTELS`**.
* **Revenue Ledger**: **`SALES B2B 5% HARYANA`**.
* **Place of Supply**: Place of Supply is always **Haryana** (charge CGST 2.5% and SGST 2.5%).
* **Settlement JV**: Settle the company's ledger balance via a clearing JV:
  * **Debit**: **`Treebo Paid`** (prepaid), or **`Cash`**, or **`CONSUMER`** (UPI) depending on the payment mode.
  * **Credit**: **`TREEBO HOTELS`**.



