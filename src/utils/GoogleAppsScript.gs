/**
 * Google Apps Script for RC Accountant
 * Spreadsheet ID: 1sPsulYHlyYIh1J7SljlhAp5cm29MR0cwHOGSoFVyCMM
 * 
 * Instructions:
 * 1. Open https://docs.google.com/spreadsheets/d/1sPsulYHlyYIh1J7SljlhAp5cm29MR0cwHOGSoFVyCMM/edit
 * 2. Click Extensions > Apps Script
 * 3. Replace all code in Code.gs with this script.
 * 4. Click Deploy > New deployment > Select type: Web app.
 * 5. Execute as: "Me", Who has access: "Anyone".
 * 6. Click Deploy and copy the Web App URL into RC Accountant Settings!
 */

const SPREADSHEET_ID = "1sPsulYHlyYIh1J7SljlhAp5cm29MR0cwHOGSoFVyCMM";

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  if (action === "FETCH_ALL") {
    var result = {
      customers: getSheetRows(ss, "Customers"),
      loans: getSheetRows(ss, "Loans"),
      payments: getSheetRows(ss, "EMI Payments"),
      reminders: getSheetRows(ss, "Reminders"),
      settings: getSheetRows(ss, "Settings")
    };
    return createJsonResponse({ status: "success", data: result });
  }
  
  return createJsonResponse({ status: "success", message: "RC Accountant Google Apps Script Web App Active" });
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var tabName = payload.tab;
    var data = payload.data;

    if (action === "BATCH_SYNC" && payload.batch) {
      for (var i = 0; i < payload.batch.length; i++) {
        var item = payload.batch[i];
        processSingleAction(ss, item.actionType, item.tabName, item.payload);
      }
      return createJsonResponse({ status: "success", message: "Batch synced successfully" });
    }

    processSingleAction(ss, action, tabName, data);
    return createJsonResponse({ status: "success", message: "Sheet updated successfully" });

  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function processSingleAction(ss, action, tabName, data) {
  if (!tabName) return;
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    createHeaderRow(sheet, tabName);
  }

  if (action === "CREATE") {
    sheet.appendRow(formatRowData(tabName, data));
  } else if (action === "UPDATE") {
    updateRowById(sheet, data.id, formatRowData(tabName, data));
  } else if (action === "DELETE") {
    deleteRowById(sheet, data.id);
  }
}

function formatRowData(tabName, obj) {
  if (!obj) return [];
  if (tabName === "Customers") {
    return [obj.id, obj.name, obj.phone, obj.email, obj.address, obj.panAadhaar, obj.dob, obj.employment, obj.monthlyIncome, obj.profilePhoto || "", obj.createdAt];
  } else if (tabName === "Loans") {
    return [obj.id, obj.customerId, obj.customerName, obj.loanName, obj.type, obj.totalAmount, obj.interestRate, obj.emiAmount, obj.tenureMonths, obj.startDate, obj.dueDate, obj.status];
  } else if (tabName === "EMI Payments") {
    return [obj.id, obj.loanId, obj.customerId, obj.customerName, obj.amount, obj.dueDate, obj.paidDate || "", obj.paymentMethod || "", obj.lateFee || 0, obj.status, obj.notes || ""];
  } else if (tabName === "Reminders") {
    return [obj.id, obj.customerId, obj.loanId, obj.date, obj.type, obj.status, obj.notes || ""];
  }
  return Object.values(obj);
}

function createHeaderRow(sheet, tabName) {
  if (tabName === "Customers") {
    sheet.appendRow(["Customer ID", "Name", "Mobile", "Email", "Address", "PAN/Aadhaar", "DOB", "Occupation", "Monthly Income", "Photo URL", "Created Date"]);
  } else if (tabName === "Loans") {
    sheet.appendRow(["Loan ID", "Customer ID", "Customer Name", "Loan Name", "Loan Type", "Loan Amount", "Interest Rate", "EMI Amount", "Tenure", "Start Date", "Due Date", "Status"]);
  } else if (tabName === "EMI Payments") {
    sheet.appendRow(["Payment ID", "Loan ID", "Customer ID", "Customer Name", "EMI Amount", "Due Date", "Payment Date", "Payment Method", "Late Fee", "Status", "Notes"]);
  } else if (tabName === "Reminders") {
    sheet.appendRow(["Reminder ID", "Customer ID", "Loan ID", "Date", "Type", "Status", "Notes"]);
  }
}

function updateRowById(sheet, id, newRowValues) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.getRange(i + 1, 1, 1, newRowValues.length).setValues([newRowValues]);
      return;
    }
  }
  sheet.appendRow(newRowValues);
}

function deleteRowById(sheet, id) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

function getSheetRows(ss, tabName) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var rowObj = {};
    for (var j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = data[i][j];
    }
    rows.push(rowObj);
  }
  return rows;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
