const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parseDayBook } = require('./parser.cjs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// Cache the parsed data in-memory, reload if requested
let cachedData = null;

app.get('/api/data', (req, res) => {
  const forceReload = req.query.reload === 'true';
  const cachePath = "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\excel_parsed_cache.json";

  if (forceReload) {
    console.log("Forced reload requested. Parsing Daybook Excel...");
    try {
      cachedData = parseDayBook();
      fs.writeFileSync(cachePath, JSON.stringify(cachedData, null, 2), 'utf8');
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to parse Excel file", details: err.message });
    }
  } else if (!cachedData) {
    if (fs.existsSync(cachePath)) {
      console.log("Loading Excel parse results from cache...");
      try {
        cachedData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      } catch (e) {
        console.error("Failed to read Excel cache, parsing fresh...", e);
      }
    }
    
    if (!cachedData) {
      console.log("No cache found. Parsing Daybook Excel...");
      try {
        cachedData = parseDayBook();
        fs.writeFileSync(cachePath, JSON.stringify(cachedData, null, 2), 'utf8');
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to parse Excel file", details: err.message });
      }
    }
  }

  res.json(cachedData);
});

// Compare Excel totals and Tally totals for reconciliation
app.get('/api/reconciliation', (req, res) => {
  const xmlPath = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\Documents\\Antigravity\\Hotel\\vouchers.xml";
  
  if (!fs.existsSync(xmlPath)) {
    return res.json({ error: "Tally vouchers.xml not found. Please export vouchers first." });
  }

  try {
    // Basic fast parser for vouchers.xml to avoid heavy xml2js parsing overhead
    const xmlText = fs.readFileSync(xmlPath, 'utf8');
    
    // Parse vouchers using regex for speed
    const voucherMatches = xmlText.match(/<VOUCHER[^>]*>[\s\S]*?<\/VOUCHER>/g) || [];
    const tallyVouchers = [];

    const dateRegex = /<DATE[^>]*>([^<]+)<\/DATE>/;
    const vchTypeRegex = /VCHTYPE="([^"]+)"/;
    const vchNoRegex = /<VOUCHERNUMBER>([^<]+)<\/VOUCHERNUMBER>/;
    const partyRegex = /<PARTYLEDGERNAME[^>]*>([^<]+)<\/PARTYLEDGERNAME>/;
    const amountRegex = /<AMOUNT[^>]*>([^<]+)<\/AMOUNT>/;

    voucherMatches.forEach(vch => {
      const dateMatch = vch.match(dateRegex);
      const typeMatch = vch.match(vchTypeRegex);
      const noMatch = vch.match(vchNoRegex);
      const partyMatch = vch.match(partyRegex);
      const amountMatch = vch.match(amountRegex);

      if (dateMatch && amountMatch) {
        const rawDate = dateMatch[1];
        const formattedDate = `20${rawDate.slice(2, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
        
        tallyVouchers.push({
          date: formattedDate,
          rawDate,
          vchType: typeMatch ? typeMatch[1] : "",
          vchNo: noMatch ? noMatch[1] : "",
          party: partyMatch ? partyMatch[1].replace(/&amp;/g, '&') : "",
          amount: Math.abs(parseFloat(amountMatch[1])) || 0
        });
      }
    });

    // Load Excel parsed data
    const excelData = cachedData || parseDayBook();
    if (!cachedData) cachedData = excelData;

    const discrepancies = [];

    // Group Tally by Date and VchType
    const tallyByDate = {};
    tallyVouchers.forEach(v => {
      if (!tallyByDate[v.date]) {
        tallyByDate[v.date] = [];
      }
      tallyByDate[v.date].push(v);
    });

    // Reconcile each day from Excel
    Object.keys(excelData.dailySummary).forEach(dateStr => {
      // Tally only goes up to 2026-06-04. Skip reconciliation for later dates
      if (new Date(dateStr) > new Date("2026-06-04")) {
        return;
      }

      const daySummary = excelData.dailySummary[dateStr];
      const dayTally = tallyByDate[dateStr] || [];

      // 1. Room Sales totals
      if (daySummary.roomSalesTotal > 0) {
        // Find matching aggregated vouchers in Tally: Room Direct Cash, Room Direct Online, Treebo Paid
        // Let's compare the sum of sales in Tally for that day with Excel total
        const tallySalesSum = dayTally
          .filter(v => v.vchType === 'Sales' && (v.party === 'Room Direct Cash' || v.party === 'Room Direct Online' || v.party === 'Treebo Paid'))
          .reduce((sum, v) => sum + v.amount, 0);

        const excelSalesSum = daySummary.roomSalesTotal;

        if (Math.abs(tallySalesSum - excelSalesSum) > 0.05) {
          discrepancies.push({
            date: dateStr,
            sheetName: daySummary.sheetName,
            category: "Room Sales",
            excel: excelSalesSum,
            tally: tallySalesSum,
            diff: excelSalesSum - tallySalesSum,
            status: tallySalesSum > 0 ? "Mismatched" : "Missing in Tally"
          });
        }
      }

      // 2. Food Sales totals
      if (daySummary.foodSalesTotal > 0) {
        const tallyFoodSum = dayTally
          .filter(v => v.vchType === 'Sales' && (v.party === 'Food Direct Cash' || v.party === 'Food Direct Online'))
          .reduce((sum, v) => sum + v.amount, 0);

        // Add B2B individual bills
        const tallyB2BFoodSum = dayTally
          .filter(v => v.vchType === 'Sales' && v.vchNo && /^\d+$/.test(v.vchNo))
          .reduce((sum, v) => sum + v.amount, 0);

        const tallyTotalFood = tallyFoodSum + tallyB2BFoodSum;
        const excelFoodSum = daySummary.foodSalesTotal;

        if (Math.abs(tallyTotalFood - excelFoodSum) > 0.05) {
          discrepancies.push({
            date: dateStr,
            sheetName: daySummary.sheetName,
            category: "Food Sales",
            excel: excelFoodSum,
            tally: tallyTotalFood,
            diff: excelFoodSum - tallyTotalFood,
            status: tallyTotalFood > 0 ? "Mismatched" : "Missing in Tally"
          });
        }
      }

      // 3. Expenses (Payments)
      // Check if total count or sum of payments match
      const tallyPaymentsSum = dayTally.filter(v => v.vchType === 'Payment').reduce((sum, v) => sum + v.amount, 0);
      const excelExpensesSum = daySummary.expensesTotal;

      if (Math.abs(tallyPaymentsSum - excelExpensesSum) > 0.05) {
        discrepancies.push({
          date: dateStr,
          sheetName: daySummary.sheetName,
          category: "Expenses",
          excel: excelExpensesSum,
          tally: tallyPaymentsSum,
          diff: excelExpensesSum - tallyPaymentsSum,
          status: tallyPaymentsSum > 0 ? "Mismatched" : "Missing in Tally"
        });
      }

      // 4. Receipts
      const tallyReceiptsSum = dayTally.filter(v => v.vchType === 'Receipt').reduce((sum, v) => sum + v.amount, 0);
      const excelReceiptsSum = daySummary.receiptsTotal;

      if (Math.abs(tallyReceiptsSum - excelReceiptsSum) > 0.05) {
        discrepancies.push({
          date: dateStr,
          sheetName: daySummary.sheetName,
          category: "Receipts",
          excel: excelReceiptsSum,
          tally: tallyReceiptsSum,
          diff: excelReceiptsSum - tallyReceiptsSum,
          status: tallyReceiptsSum > 0 ? "Mismatched" : "Missing in Tally"
        });
      }
    });

    res.json({
      totalTallyVouchers: tallyVouchers.length,
      discrepanciesCount: discrepancies.length,
      discrepancies
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reconcile data", details: err.message });
  }
});

// Endpoint to save visual audit data for a single image file
app.post('/api/save-audit', (req, res) => {
  const { fileName, dateFolder, data } = req.body;
  if (!fileName) {
    return res.status(400).json({ error: "fileName is required" });
  }

  const auditPath = "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\visual_audit_results.json";
  let auditResults = {};
  if (fs.existsSync(auditPath)) {
    try {
      auditResults = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
    } catch (e) {
      console.error("Error reading visual_audit_results.json, resetting", e);
    }
  }

  auditResults[fileName] = {
    fileName,
    dateFolder,
    data,
    auditedAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(auditPath, JSON.stringify(auditResults, null, 2), 'utf8');
    res.json({ success: true, count: Object.keys(auditResults).length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to write audit results file", details: err.message });
  }
});

// Endpoint to retrieve already audited results
app.get('/api/get-audit', (req, res) => {
  const auditPath = "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\visual_audit_results.json";
  let auditResults = {};
  if (fs.existsSync(auditPath)) {
    try {
      auditResults = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
    } catch (e) {}
  }
  res.json(auditResults);
});

app.listen(PORT, () => {
  console.log(`Local Server running at http://localhost:${PORT}`);
});
