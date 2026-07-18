---
name: skill-anti-duplicate
description: Strict rules to prevent duplicate voucher creation in Tally during re-imports.
---

# Tally Anti-Duplicate XML Rule

This is a Super AI strict rule to ensure that if the user imports the same day's XML twice (due to an error, a fix, or an exception), Tally **WILL NOT** create duplicate vouchers.

### How to Ensure Idempotency in Tally XML

1. **Vouchers Must Have a Deterministic Identity**:
   Every voucher must inject a deterministic `<GUID>` and `<REMOTEID>`. The ID should be based on the source bill number and voucher type (e.g., `HotelSky5-Sales-12345`).

2. **ACTION="Create" is the Upsert Pattern**:
   In older scripts, we used `ACTION="Alter"`. However, in newer versions of Tally Prime, using `ACTION="Alter"` on a non-existent voucher causes a `Cannot delete unnamed object: VOUCHER!` exception. 
   Instead, **always use `ACTION="Create"` combined with a `<REMOTEID>`**. Tally treats this as an Upsert:
   - If the `REMOTEID` does not exist, Tally **Creates** it.
   - If the `REMOTEID` already exists, Tally **Alters (overwrites)** it without duplicating.
   - The GUID should be deterministic based on the bill.
   - Format: `<VOUCHER REMOTEID="HotelSky5-[VOUCHER_TYPE]-[BILL_NO]" VCHTYPE="[TYPE]" ACTION="Alter">`
   - Inside the `<VOUCHER>` tag, include: `<GUID>HotelSky5-[VOUCHER_TYPE]-[BILL_NO]</GUID>`

### Tests to Run
- Verify every `<VOUCHER>` tag in the generated XML uses `ACTION="Alter"`.
- Verify every `<VOUCHER>` tag contains a deterministic `REMOTEID` and `<GUID>`.
- Any AI reading this rule must instantly scan existing generator scripts (like `generate_tally_xml.js`) and patch them if they use `ACTION="Create"`.
