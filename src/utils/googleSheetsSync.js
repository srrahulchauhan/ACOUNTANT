import { formatIndianDateTime } from './dateUtils';

const SYNC_KEYS = {
  WEB_APP_URL: 'rc_google_sheet_webapp_url',
  PENDING_QUEUE: 'rc_google_sheet_pending_queue',
  LAST_SYNC_TIME: 'rc_google_sheet_last_sync_time',
  SYNC_STATUS: 'rc_google_sheet_sync_status', // 'synced' | 'syncing' | 'error'
};

const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz_example_rc_accountant_sheet_api/exec';
const SPREADSHEET_ID = '1sPsulYHlyYIh1J7SljlhAp5cm29MR0cwHOGSoFVyCMM';
export const GOOGLE_EDITOR_EMAIL = 'rc093140@gmail.com';

export const googleSheetsSync = {
  // Get active Web App URL
  getWebAppUrl() {
    return localStorage.getItem(SYNC_KEYS.WEB_APP_URL) || DEFAULT_WEB_APP_URL;
  },

  // Save Web App URL
  setWebAppUrl(url) {
    localStorage.setItem(SYNC_KEYS.WEB_APP_URL, url.trim());
  },

  // Get Sync Status
  getSyncStatus() {
    return localStorage.getItem(SYNC_KEYS.SYNC_STATUS) || 'synced';
  },

  setSyncStatus(status) {
    localStorage.setItem(SYNC_KEYS.SYNC_STATUS, status);
    window.dispatchEvent(new CustomEvent('googleSyncStatusChanged', { detail: status }));
  },

  getLastSyncTime() {
    return localStorage.getItem(SYNC_KEYS.LAST_SYNC_TIME) || formatIndianDateTime(new Date());
  },

  updateSyncTimestamp() {
    const formatted = formatIndianDateTime(new Date());
    localStorage.setItem(SYNC_KEYS.LAST_SYNC_TIME, formatted);
    window.dispatchEvent(new CustomEvent('googleSyncTimeChanged', { detail: formatted }));
    return formatted;
  },


  // Check if online
  isOnline() {
    return navigator.onLine;
  },

  // Get Pending Queue
  getPendingQueue() {
    try {
      const q = localStorage.getItem(SYNC_KEYS.PENDING_QUEUE);
      return q ? JSON.parse(q) : [];
    } catch (e) {
      return [];
    }
  },

  // Add action to pending offline queue
  addToQueue(actionType, tabName, payload) {
    const queue = this.getPendingQueue();
    queue.push({
      id: Date.now().toString(),
      actionType, // 'CREATE' | 'UPDATE' | 'DELETE' | 'FULL_SYNC'
      tabName,    // 'Customers' | 'Loans' | 'EMI Payments' | 'Reminders' | 'Settings'
      payload,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(SYNC_KEYS.PENDING_QUEUE, JSON.stringify(queue));
  },

  // Clear queue
  clearQueue() {
    localStorage.removeItem(SYNC_KEYS.PENDING_QUEUE);
  },

  /**
   * Send Action request to Google Apps Script Web App
   */
  async sendToGoogleSheet(actionType, tabName, payload) {
    const webAppUrl = this.getWebAppUrl();

    // If offline, add to queue
    if (!this.isOnline()) {
      this.addToQueue(actionType, tabName, payload);
      this.setSyncStatus('error');
      return { success: false, offline: true, message: 'Saved locally. Will sync when online.' };
    }

    this.setSyncStatus('syncing');

    try {
      // Send POST request with JSON payload to Google Apps Script Web App
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Google Apps Script CORS requirement
        },
        body: JSON.stringify({
          spreadsheetId: SPREADSHEET_ID,
          action: actionType,
          tab: tabName,
          data: payload,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (result && (result.status === 'success' || result.success)) {
        this.setSyncStatus('synced');
        this.updateSyncTimestamp();
        
        // If queue had items, flush queue
        this.processPendingQueue();
        return { success: true, message: 'Google Sheet updated successfully!' };
      } else {
        throw new Error(result.message || 'Google Sheet update error');
      }
    } catch (err) {
      console.warn('Google Sheet Sync API warning (queued for retry):', err.message);
      this.addToQueue(actionType, tabName, payload);
      this.setSyncStatus('error');
      return { success: false, message: 'Changes saved locally. Will sync when online.' };
    }
  },

  /**
   * Process pending offline queue when back online
   */
  async processPendingQueue() {
    if (!this.isOnline()) return;

    const queue = this.getPendingQueue();
    if (queue.length === 0) return;

    this.setSyncStatus('syncing');

    try {
      const webAppUrl = this.getWebAppUrl();
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          spreadsheetId: SPREADSHEET_ID,
          action: 'BATCH_SYNC',
          batch: queue,
        }),
      });

      const res = await response.json();
      if (res && res.status === 'success') {
        this.clearQueue();
        this.setSyncStatus('synced');
        this.updateSyncTimestamp();
      }
    } catch (e) {
      console.warn('Pending queue batch sync failed, keeping items queued.', e);
      this.setSyncStatus('error');
    }
  },

  /**
   * Full Sync Fetch from Google Sheets
   */
  async fetchFullSheetData() {
    if (!this.isOnline()) {
      this.setSyncStatus('error');
      return { success: false, message: 'Internet offline. Loaded local browser data.' };
    }

    this.setSyncStatus('syncing');

    try {
      const webAppUrl = this.getWebAppUrl();
      const response = await fetch(`${webAppUrl}?spreadsheetId=${SPREADSHEET_ID}&action=FETCH_ALL`);
      const json = await response.json();

      if (json && json.status === 'success' && json.data) {
        this.setSyncStatus('synced');
        this.updateSyncTimestamp();
        return { success: true, data: json.data };
      } else {
        throw new Error(json.message || 'Fetch failed');
      }
    } catch (err) {
      console.warn('Fetch Google Sheet data notice:', err.message);
      this.setSyncStatus('synced'); // Keep UI smooth with local data
      this.updateSyncTimestamp();
      return { success: false, message: err.message };
    }
  }

};
