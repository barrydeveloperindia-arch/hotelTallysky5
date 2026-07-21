---
name: skill-guest-ledgers
description: Strict logic and XML blueprints for auto-creating Guest Ledgers (Sundry Debtors) in Tally Prime.
---

# Skill: Guest Ledgers (Sundry Debtors)

This skill dictates how Guest Ledgers MUST be auto-created in Tally Prime. Tally Prime ignores flat ledger tags for State, Country, and GST details, requiring them to be nested inside specific LIST blocks.

## Core Rules
1. **Bill-by-Bill**: `<ISBILLWISEON>` MUST be `No`.
2. **Mailing Details (State & Country)**: MUST use `<LEDMAILINGDETAILS.LIST>`.
3. **GST Details (Registration Type & POS)**: MUST use `<LEDGSTREGDETAILS.LIST>`.

## XML Blueprint for B2C Guests (Unregistered)
When creating a standard walk-in or B2C guest, inject the following exactly:

```xml
<LEDGER NAME="GUEST_NAME_HERE" ACTION="Create">
    <NAME.LIST>
        <NAME>GUEST_NAME_HERE</NAME>
    </NAME.LIST>
    <PARENT>Sundry Debtors</PARENT>
    <ISBILLWISEON>No</ISBILLWISEON>
    <AFFECTSSTOCK>No</AFFECTSSTOCK>
    
    <LEDGSTREGDETAILS.LIST>
        <APPLICABLEFROM>20240401</APPLICABLEFROM>
        <GSTREGISTRATIONTYPE>Unregistered/Consumer</GSTREGISTRATIONTYPE>
        <PLACEOFSUPPLY>Haryana</PLACEOFSUPPLY>
    </LEDGSTREGDETAILS.LIST>
    
    <LEDMAILINGDETAILS.LIST>
        <APPLICABLEFROM>20240401</APPLICABLEFROM>
        <MAILINGNAME>GUEST_NAME_HERE</MAILINGNAME>
        <STATE>Haryana</STATE>
        <COUNTRY>India</COUNTRY>
    </LEDMAILINGDETAILS.LIST>
</LEDGER>
```

## XML Blueprint for B2B Guests (Regular/Corporate)
For B2B guests, the `<PARTYGSTIN>` tag must be added, and Registration Type changes to `Regular`:

```xml
<LEDGER NAME="COMPANY_NAME_HERE" ACTION="Create">
    <NAME.LIST>
        <NAME>COMPANY_NAME_HERE</NAME>
    </NAME.LIST>
    <PARENT>Sundry Debtors</PARENT>
    <ISBILLWISEON>No</ISBILLWISEON>
    <AFFECTSSTOCK>No</AFFECTSSTOCK>
    
    <LEDGSTREGDETAILS.LIST>
        <APPLICABLEFROM>20240401</APPLICABLEFROM>
        <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>
        <PLACEOFSUPPLY>GUEST_STATE_NAME</PLACEOFSUPPLY>
        <GSTIN>GUEST_GST_NUMBER</GSTIN>
    </LEDGSTREGDETAILS.LIST>
    <PARTYGSTIN>GUEST_GST_NUMBER</PARTYGSTIN>
    
    <LEDMAILINGDETAILS.LIST>
        <APPLICABLEFROM>20240401</APPLICABLEFROM>
        <MAILINGNAME>COMPANY_NAME_HERE</MAILINGNAME>
        <ADDRESS.LIST>
            <ADDRESS>COMPANY_FULL_ADDRESS_HERE</ADDRESS>
        </ADDRESS.LIST>
        <STATE>GUEST_STATE_NAME</STATE>
        <COUNTRY>India</COUNTRY>
        <PINCODE>COMPANY_PINCODE</PINCODE>
    </LEDMAILINGDETAILS.LIST>
</LEDGER>
```
