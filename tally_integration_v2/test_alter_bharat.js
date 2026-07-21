const fs = require('fs');

const xml = `<ENVELOPE>
    <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
    </HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>Hotel Sky 5 2026-27</SVCURRENTCOMPANY>
                </STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <LEDGER NAME="BHARAT BHUSHAN" ACTION="Alter">
                        <NAME>BHARAT BHUSHAN</NAME>
                        <PARENT>Sundry Debtors</PARENT>
                        <ISBILLWISEON>No</ISBILLWISEON>
                        <LEDMAILINGDETAILS.LIST>
                            <APPLICABLEFROM>20240401</APPLICABLEFROM>
                            <MAILINGNAME>BHARAT BHUSHAN</MAILINGNAME>
                            <STATE>Haryana</STATE>
                            <COUNTRY>India</COUNTRY>
                        </LEDMAILINGDETAILS.LIST>
                        <LEDGSTREGDETAILS.LIST>
                            <APPLICABLEFROM>20240401</APPLICABLEFROM>
                            <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>
                            <PLACEOFSUPPLY>Haryana</PLACEOFSUPPLY>
                            <GSTIN>06OVXPS4147G1ZL</GSTIN>
                        </LEDGSTREGDETAILS.LIST>
                        <PARTYGSTIN>06OVXPS4147G1ZL</PARTYGSTIN>
                    </LEDGER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

fs.writeFileSync('Alter_Bharat.xml', xml);
console.log('Alter_Bharat.xml generated.');
