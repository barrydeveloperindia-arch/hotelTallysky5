# June 4th Daybook & Sales Bills Import Plan

This plan details the integration of room stays, payment vouchers, and food bills from the **June 4th, 2026** Daybook sheet and physical bills folder into Tally Prime.

---

## User Review Required

> [!IMPORTANT]
> **Key Integration Rules Implemented**:
> 1. **Guest-wise Ledgers**: Stays and payments will be posted under the guest's name (e.g., `RAJESH KUMAR`, `VIJAY`, etc.) under the parent group `Hotel Guests - Direct`.
> 2. **No Guest Cost Centres**: The revenue stays will be allocated ONLY to the `Rooms` category and Room Cost Centres (e.g., `Room 07`). We will **not** use the `Guests` cost category or guest cost centres.
> 3. **Complementary Food Bills**: Ignore GST entirely. The basic subtotal is rounded to the nearest integer and entered via a two-JV transaction (consumption and clearing).
> 4. **Card Payments**: Stays or food bills paid via card (such as Shushil Kumar Shukla's stay and food bill) will use the ledger **`CONSUMER`** for clearing.
> 5. **Postponed Bill Located**: The postponed bill `POS-16023` (Varun, Room 6, ₹280.00 total, ₹267.00 basic) has been found in the June 4th folder and will be imported as a complementary bill under June 2nd.
> 6. **Narration and Phone Numbers**: Clearing JVs will include the guest's contact number (if printed on the stay invoice) in the narration field along with the payment mode (e.g., `Paid Online - Contact: 9813382129`).

---

## Proposed Changes

### Integration Script

#### [NEW] [import_june4_daybook.cjs](file:///c:/Users/Administrator/OneDrive/MANGEMENT%20FILE/Documents/Antigravity/Hotel/import_june4_daybook.cjs)

This script will post the following vouchers in Tally:

### 1. Room Stay Sales Invoices (June 4th & 5th)
* **Direct Stays (B2C)**:
  * **Manoj Kumar (`11929`)** - Date `20260604`: ₹1,200.00 (Room 04)
  * **Rajesh Kumar (`11930`)** - Date `20260604`: ₹1,600.00 (Room 07)
  * **Nitesh Kumar (`11931`)** - Date `20260604`: ₹1,000.00 (Room 17)
  * **Pardeep (`11932`)** - Date `20260604`: ₹1,500.00 (Room 08)
  * **Pardeep Kumar (`11933`)** - Date `20260604`: ₹1,200.00 (Room 17)
  * **Vijay (`11934`)** - Date `20260604`: ₹2,200.00 (Rooms 19 & 20)
  * **Harsh Kumar (`11937`)** - Date `20260605`: ₹2,000.00 (Room 08)
  * **Shushil Kumar Shukla (`11939`)** - Date `20260605`: ₹1,300.00 (Room 11)
  * **Inder Singh (`11940`)** - Date `20260605`: ₹1,200.00 (Room 17)
  * **Dilbag Singh (`11938`)** - Date `20260605`: ₹3,600.00 (Room 10) (Guest name and B2C)
* **Treebo Stay (B2C)**:
  * **Nishkant Sharma (`180962826-000244`)** - Date `20260605`: ₹1,976.65 (Room 01) -> Billed to `NISHKANT SHARMA` (Revenue ledger: `Sale 5% Haryana B2C`).

### 2. Payment Settlement Journal Vouchers (June 4th & 5th)
* **PAY-11929** (Manoj Kumar): Debit `Cash` ₹1,200.00 | Credit `Manoj Kumar` ₹1,200.00 (Narration: `Paid Cash`)
* **PAY-11930** (Rajesh Kumar): Debit `CONSUMER` ₹1,600.00 | Credit `Rajesh Kumar` ₹1,600.00 (Narration: `Paid Online - Contact: 9458942438`)
* **PAY-11931** (Nitesh Kumar): Debit `CONSUMER` ₹1,000.00 | Credit `Nitesh Kumar` ₹1,000.00 (Narration: `Paid Online - Contact: 9996380774`)
* **PAY-11932** (Pardeep): Debit `Cash` ₹1,500.00 | Credit `Pardeep` ₹1,500.00 (Narration: `Paid Cash`)
* **PAY-11933** (Pardeep Kumar): Debit `CONSUMER` ₹1,200.00 | Credit `Pardeep Kumar` ₹1,200.00 (Narration: `Paid Online`)
* **PAY-11934** (Vijay): Debit `CONSUMER` ₹2,200.00 | Credit `Vijay` ₹2,200.00 (Narration: `Paid Online`)
* **PAY-11937** (Harsh Kumar): Debit `CONSUMER` ₹2,000.00 | Credit `Harsh Kumar` ₹2,000.00 (Narration: `Paid Online - Contact: 8054467919`)
* **PAY-11939** (Shushil Kumar Shukla): Debit `CONSUMER` ₹1,300.00 | Credit `Shushil Kumar Shukla` ₹1,300.00 (Narration: `Paid Credit Card - Contact: 977429898`)
* **PAY-11940** (Inder Singh): Debit `CONSUMER` ₹1,200.00 | Credit `Inder Singh` ₹1,200.00 (Narration: `Paid Online - Contact: 9813382129`)
* **PAY-DILBAG-ADV** (Dilbag Singh): Debit `Cash` ₹3,600.00 | Credit `DILBAG SINGH` ₹3,600.00 (Narration: `Paid Cash`)
* **PAY-180962826-000244** (Nishkant Sharma): Debit `Treebo Paid` ₹1,976.65 | Credit `NISHKANT SHARMA` ₹1,976.65 (Narration: `Paid Online - Contact: +912067137555`)


### 3. Food Sales Invoices (June 4th & 5th)
* **B2C Paid Food Invoices**:
  * **POS-16073** (Rajesh Kumar): ₹110.00 (UPI)
  * **POS-16080** (Vijay): ₹210.00 (UPI)
  * **POS-16081** (Shushil Kumar): ₹85.00 (Card)
  * **POS-16084** (Nishkant Sharma): ₹30.00 (Card)
  * **POS-16083** (Inder Singh) - June 4th: ₹580.00 (UPI)
  * **POS-16087** (Inder Singh) - June 5th: ₹660.00 (UPI)
  * **POS-16070** (Varun) - June 4th: ₹40.00 (UPI)
  * **POS-16086** (Varun) - June 5th: ₹110.00 (Cash)
  * *All paid food bills will have matching payment JVs to clear guest/room balances.*

* **B2B Unpaid Food Invoices (Directors / Walk-in)**:
  * **POS-16077** (MD Sir): ₹20.00 (Disha) -> Unpaid
  * **POS-16076** (Englabs) - B2B: ₹40.00 (Disha) -> Unpaid
  * **POS-16075** (Swati): ₹80.00 (Disha) -> Unpaid
  * **POS-16078** (Shreeya): ₹63.00 (Disha) -> Unpaid
  * **POS-16074** (Vijay Sir): ₹60.00 (Disha) -> Unpaid
  * **POS-16069** (A&A Staff): ₹75.00 (Disha) -> Unpaid

### 4. Complementary / FOC Food JVs (June 2nd & 4th)
* **POS-16023** (Varun - postponed) - Date `20260602`:
  * Consumption JV: Debit `VARUN` ₹267.00 | Credit `FOC Food Consumption` ₹266.68 | Credit `ROUND OFF` ₹0.32
  * Clearing JV: Debit `Complementary Food Expense` (Room 06) ₹267.00 | Credit `VARUN` ₹267.00
* **POS-16030** (Varun) - Date `20260602`:
  * Consumption JV: Debit `VARUN` ₹124.00 | Credit `FOC Food Consumption` ₹123.81 | Credit `ROUND OFF` ₹0.19
  * Clearing JV: Debit `Complementary Food Expense` (Room 06) ₹124.00 | Credit `VARUN` ₹124.00
* **POS-16052** (Varun) - Date `20260603`:
  * Consumption JV: Debit `VARUN` ₹74.00 | Credit `FOC Food Consumption` ₹74.04 | Debit `ROUND OFF` ₹0.04
  * Clearing JV: Debit `Complementary Food Expense` (Room 02) ₹74.00 | Credit `VARUN` ₹74.00

---

## Verification Plan

### Automated Tests
* Run `import_june4_daybook.cjs` and verify Tally Prime returns `<CREATED>1</CREATED>` for stays, food bills, settlements, and FOC journals.

### Manual Verification
* Inspect Tally Prime:
  1. Verify Guest Ledgers (e.g. `RAJESH KUMAR`, `VIJAY`) have stay debit matching payment credit.
  2. Verify B2B `TREEBO HOTELS` has stay debit (Invoice 244) matching payment credit (PAY-244).
  3. Verify directors' ledgers show correct unpaid balances.
  4. Verify complementary food expense allocation under room cost centres.
