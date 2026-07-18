---
name: hotel-bill-parser
description: Automatically process, extract, and reconcile daily PDF sales bills (Master, Treebo, Food) with the NEW DAYBOOK-2026.xlsx payment sheet.
---

# Hotel Bill Parser Skill

This skill automates the complex parsing of hotel PDF bills and merges them with the exact payment data from the Daily Daybook Excel sheet.

## Triggering the Skill
When the user asks to "process hotel bills", "parse july bills", or similar, execute the following steps exactly as written. 

## Step 1: Pre-process Excel Data
Run the Node script `process_excel.js` located in `C:\Users\Administrator\OneDrive\MANGEMENT FILE\Documents\Antigravity\Hotel\tally_integration_v2\`.
This script extracts all guest names, check-in dates, check-out dates, invoice numbers, and payment structures (Cash, UPI, Card, Pending, Treebo Paid) and outputs them to `excel_data.json`.

## Step 2: Spawn Subagents for PDF Extraction
The Treebo bills in this system are purely image-based PDFs, meaning standard text extraction libraries fail. To overcome this, you MUST use the `invoke_subagent` tool.

Spawn one subagent per daily folder (e.g., `01.07.26`, `02.07.26`, up to `10.07.26`).

**Prompt for each Subagent:**
> "1. Use `list_dir` on `C:\Users\Administrator\OneDrive\MANGEMENT FILE\Documents\Antigravity\Hotel\Sales Bills\july\1JULY TO 10 JLUY\Daily Sale Repot june-26 pdf file\<DATE>`
> 2. Read EACH PDF using `view_file` (this gives you an image screenshot of the PDF).
> 3. Visually extract the bill details into a JSON array. 
>    - For Master Bills: Extract Guest Name, Invoice Date, Bill No, Total Room Rent, CGST, SGST, Total Amount.
>    - For Treebo Bills: Extract Invoice No, Guest Name, Date, Total Amount.
>    - For Food Bills: Extract Bill No, Date, Guest Name (or Table No if missing), Items, Basic Amount, CGST, SGST, Total Amount. If 'CL' is written anywhere, tag as Complementary.
> 4. Save the JSON using `write_to_file` to: `C:\Users\Administrator\OneDrive\MANGEMENT FILE\Documents\Antigravity\Hotel\tally_integration_v2\data_day_<DATE>.json`.
> 5. Reply when done."

## Step 3: Wait for Subagents
Do not proceed until all subagents have replied indicating completion. Check their JSON outputs to ensure data was formatted correctly.

## Step 4: Final Reconciliation
Run the Node script `combine_data.js` (which you should write if it doesn't exist, or run if it does).
This script will:
1. Load all the `data_day_<DATE>.json` files.
2. Load `excel_data.json`.
3. For each Treebo bill, look up the Guest Name or Invoice No in the Excel data to find the Room Number and correct payment breakdown.
4. For each Food bill, if 'PACKING' or no room number is present, look it up in the Excel data to find the payment breakdown.
5. Generate the final output `final_reconciled_sales.json` or `.csv`.

## Step 5: Present Results
Present a summary of the successfully processed bills and any discrepancies found to the user.
