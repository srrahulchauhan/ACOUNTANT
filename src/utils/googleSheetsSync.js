/**
 * Google Sheets Online Real-time Sync Engine for RC Accountant
 * Connects directly to Google Apps Script Webhook endpoint
 * Syncs tabs: "Bank Accounts", "Bank Transactions", "Bank Transfers",
 * "Customer Bank Accounts", "Customer Bank Transactions", "Customer Bank Transfers",
 * "Customers", "Loans", "Payments", "Daily Expenses"
 */

const GOOGLE_SHEETS_URL_KEY = 'rc_google_sheets_webhook_url';
const SYNC_LOGS_KEY = 'rc_google_sheets_sync_logs';

export const googleSheetsSync = {
  // Get configured Webhook URL
  getWebhookUrl() {
    try {
      return localStorage.getItem(GOOGLE_SHEETS_URL_KEY) || '';
    } catch {
      return '';
    }
  },

  // Save Webhook URL
  setWebhookUrl(url) {
    try {
      localStorage.setItem(GOOGLE_SHEETS_URL_KEY, (url || '').trim());
      window.dispatchEvent(new Event('googleSheetsConfigUpdated'));
    } catch (e) {
      console.error('Failed to save Google Sheets URL', e);
    }
  },

  // Send single action / record to Google Sheet
  async sendToGoogleSheet(action, tabName, data) {
    const url = this.getWebhookUrl();
    if (!url) {
      // If no webhook URL configured, we silently succeed locally
      return { success: false, reason: 'NO_WEBHOOK_CONFIGURED' };
    }

    try {
      const payload = {
        timestamp: new Date().toISOString(),
        action: action, // 'CREATE' | 'UPDATE' | 'DELETE' | 'TRANSFER' | 'SYNC_ALL'
        tabName: tabName, // 'Bank Accounts' | 'Bank Transactions' | 'Bank Transfers' | 'Customer Bank Accounts' | 'Customer Bank Transactions' | 'Customer Bank Transfers' | 'Customers' | 'Loans' | 'Payments' | 'Daily Expenses'
        data: data,
      };

      // Use standard fetch (no-cors mode handles Google Apps Script redirect cleanly)
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      this.logSync(tabName, action, true);
      return { success: true };
    } catch (error) {
      console.warn('Google Sheets Sync Network Note:', error);
      this.logSync(tabName, action, false, error.message);
      return { success: false, error: error.message };
    }
  },

  syncTabToGoogleSheet(tabName, items) {
    return this.sendToGoogleSheet('UPDATE_TAB', tabName, items);
  },

  // Full Batch Sync of all modules to Google Sheets
  async syncAllToGoogleSheet(allData) {
    const url = this.getWebhookUrl();
    if (!url) {
      return { success: false, message: 'Please enter your Google Apps Script Webhook URL in Settings.' };
    }

    try {
      const payload = {
        timestamp: new Date().toISOString(),
        action: 'SYNC_ALL',
        data: allData,
      };

      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      this.logSync('All Tabs', 'SYNC_ALL', true);
      return { success: true, message: 'All data successfully dispatched to Google Sheets!' };
    } catch (err) {
      console.error('Batch sync error:', err);
      this.logSync('All Tabs', 'SYNC_ALL', false, err.message);
      return { success: false, message: 'Sync failed: ' + err.message };
    }
  },

  // Record Sync Log locally for status monitoring
  logSync(tabName, action, success, errorMsg = '') {
    try {
      const logs = JSON.parse(localStorage.getItem(SYNC_LOGS_KEY) || '[]');
      const newLog = {
        id: Date.now().toString(),
        tabName,
        action,
        success,
        errorMsg,
        time: new Date().toISOString(),
      };
      const updatedLogs = [newLog, ...logs].slice(0, 30);
      localStorage.setItem(SYNC_LOGS_KEY, JSON.stringify(updatedLogs));
      window.dispatchEvent(new Event('googleSheetsSyncLogsUpdated'));
    } catch (e) {
      console.error('Log sync error:', e);
    }
  },

  getSyncLogs() {
    try {
      return JSON.parse(localStorage.getItem(SYNC_LOGS_KEY) || '[]');
    } catch {
      return [];
    }
  },

  // Sample Google Apps Script code snippet for user convenience
  getAppsScriptTemplate() {
    return `// =================================================================
// RC ACCOUNTANT - GOOGLE APPS SCRIPT WEBHOOK BACKEND
// Paste this code into Extensions > Apps Script in your Google Spreadsheet
// Deploy as Web App -> Execute as: Me -> Who has access: Anyone
// =================================================================

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = contents.action;
    var tabName = contents.tabName;
    var data = contents.data;

    if (action === "SYNC_ALL") {
      if (data.bankAccounts) writeSheetData(ss, "Bank Accounts", data.bankAccounts);
      if (data.bankTransactions) writeSheetData(ss, "Bank Transactions", data.bankTransactions);
      if (data.bankTransfers) writeSheetData(ss, "Bank Transfers", data.bankTransfers);
      if (data.customerBankAccounts) writeSheetData(ss, "Customer Bank Accounts", data.customerBankAccounts);
      if (data.customerBankTransactions) writeSheetData(ss, "Customer Bank Transactions", data.customerBankTransactions);
      if (data.customerBankTransfers) writeSheetData(ss, "Customer Bank Transfers", data.customerBankTransfers);
      if (data.customers) writeSheetData(ss, "Customers", data.customers);
      if (data.loans) writeSheetData(ss, "Loans", data.loans);
      if (data.payments) writeSheetData(ss, "Payments", data.payments);
      if (data.expenses) writeSheetData(ss, "Daily Expenses", data.expenses);
    } else if (tabName) {
      if (Array.isArray(data)) {
        writeSheetData(ss, tabName, data);
      } else {
        appendOrUpdateRow(ss, tabName, data, action);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function writeSheetData(ss, sheetName, items) {
  if (!items || !items.length) return;
  var sheet = getOrCreateSheet(ss, sheetName);
  sheet.clear();
  
  var keys = Object.keys(items[0]);
  var rows = [keys];
  for (var i = 0; i < items.length; i++) {
    var row = [];
    for (var j = 0; j < keys.length; j++) {
      var val = items[i][keys[j]];
      row.push(typeof val === 'object' ? JSON.stringify(val) : val);
    }
    rows.push(row);
  }
  sheet.getRange(1, 1, rows.length, keys.length).setValues(rows);
  sheet.getRange(1, 1, 1, keys.length).setFontWeight("bold").setBackground("#e2e8f0");
}

function appendOrUpdateRow(ss, sheetName, item, action) {
  var sheet = getOrCreateSheet(ss, sheetName);
  var keys = Object.keys(item);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(keys);
    sheet.getRange(1, 1, 1, keys.length).setFontWeight("bold").setBackground("#e2e8f0");
  }
  var row = [];
  for (var i = 0; i < keys.length; i++) {
    var val = item[keys[i]];
    row.push(typeof val === 'object' ? JSON.stringify(val) : val);
  }
  sheet.appendRow(row);
}`;
  }
};
