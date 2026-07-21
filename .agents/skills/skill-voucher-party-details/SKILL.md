---
name: skill-voucher-party-details
description: >-
  Strict rules for explicitly injecting Party and Consignee details into the VOUCHER block for Tally Prime XML integration.
---

# Tally Prime Voucher Party Details

## Overview
When generating Sales Vouchers (Rooms or Food bills) for Tally Prime via XML, Tally does NOT automatically pull the Consignee/Party details (State, Country, GSTIN) from the Ledger Master into the Voucher Alteration screen. This skill ensures that all vouchers properly display Party Details in Tally's UI.

## Dependencies
- This skill works in tandem with `skill-guest-ledgers` to ensure both the Ledger Master and the Voucher contain the correct GST and Address details.

## Workflow

### 1. Inject Party Details at the Voucher Level
Whenever you write code to generate a `<VOUCHER>` block for Tally XML, you MUST explicitly inject the following tags at the root level of the `<VOUCHER>` (at the same level as `<PARTYLEDGERNAME>`):

```xml
<PARTYNAME>GUEST_NAME_HERE</PARTYNAME>
<BASICBUYERNAME>GUEST_NAME_HERE</BASICBUYERNAME>
<STATENAME>GUEST_STATE_HERE</STATENAME>
<COUNTRYOFRESIDENCE>India</COUNTRYOFRESIDENCE>
<GSTREGISTRATIONTYPE>Regular_OR_Unregistered/Consumer</GSTREGISTRATIONTYPE>
<PLACEOFSUPPLY>GUEST_STATE_HERE</PLACEOFSUPPLY>
```

### 2. Inject B2B GSTIN at the Voucher Level
If the guest is B2B (has a GST Number), you MUST also explicitly inject the `<PARTYGSTIN>` tag inside the `<VOUCHER>` block:

```xml
<PARTYGSTIN>GST_NUMBER_HERE</PARTYGSTIN>
```

### 3. Inject Consignee Details at the Voucher Level
To ensure the "Ship To" / Consignee details are also filled, inject:

```xml
<CONSIGNEENAME>GUEST_NAME_HERE</CONSIGNEENAME>
<CONSIGNEESTATENAME>GUEST_STATE_HERE</CONSIGNEESTATENAME>
<CONSIGNEECOUNTRYNAME>India</CONSIGNEECOUNTRYNAME>
```

## Common Mistakes
- **Assuming Ledger Details carry over:** Developers often assume that if a Ledger has a State and GSTIN, Tally will auto-fill the voucher's party details during XML import. **It will not.** You must duplicate the State, Country, and GSTIN directly into the `<VOUCHER>` block.
- **Putting these tags inside ALLLEDGERENTRIES.LIST:** These tags belong directly under `<VOUCHER>`, NOT inside the ledger allocation list.
