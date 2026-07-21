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
                    <LEDGER NAME="ZINDAGI TECHNOLOGIES PVT LTD" ACTION="Create">
                        <NAME.LIST>
                            <NAME>ZINDAGI TECHNOLOGIES PVT LTD</NAME>
                        </NAME.LIST>
                        <PARENT>Sundry Debtors</PARENT>
                        <ISBILLWISEON>No</ISBILLWISEON>
                        <AFFECTSSTOCK>No</AFFECTSSTOCK>
                        
                        <LEDGSTREGDETAILS.LIST>
                            <APPLICABLEFROM>20240401</APPLICABLEFROM>
                            <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>
                            <PLACEOFSUPPLY>Delhi</PLACEOFSUPPLY>
                            <GSTIN>07AABCZ5169P1ZJ</GSTIN>
                        </LEDGSTREGDETAILS.LIST>
                        <PARTYGSTIN>07AABCZ5169P1ZJ</PARTYGSTIN>
                        
                        <LEDMAILINGDETAILS.LIST>
                            <APPLICABLEFROM>20240401</APPLICABLEFROM>
                            <MAILINGNAME>ZINDAGI TECHNOLOGIES PVT LTD</MAILINGNAME>
                            <ADDRESS.LIST>
                                <ADDRESS>301,302,303,309, THIRD FLOOR, BAKSHI HOUSE 40-41, NEHRU PLACE, NEW DELHI, Delhi - 110019</ADDRESS>
                            </ADDRESS.LIST>
                            <STATE>Delhi</STATE>
                            <COUNTRY>India</COUNTRY>
                            <PINCODE>110019</PINCODE>
                        </LEDMAILINGDETAILS.LIST>
                    </LEDGER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

fs.writeFileSync('Test_B2B_Creation.xml', xml);
console.log('Test_B2B_Creation.xml generated.');
