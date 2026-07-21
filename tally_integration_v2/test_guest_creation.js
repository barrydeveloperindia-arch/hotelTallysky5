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
                    <LEDGER NAME="MR. TEST GUEST 2" ACTION="Create">
                        <NAME.LIST>
                            <NAME>MR. TEST GUEST 2</NAME>
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
                            <MAILINGNAME>MR. TEST GUEST 2</MAILINGNAME>
                            <STATE>Haryana</STATE>
                            <COUNTRY>India</COUNTRY>
                        </LEDMAILINGDETAILS.LIST>
                    </LEDGER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

fs.writeFileSync('Test_Guest_Creation_2.xml', xml);
console.log('Test_Guest_Creation_2.xml generated.');
