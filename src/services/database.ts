import { InspectionRecord } from '../types';

const GAS_API_URL = "https://script.google.com/macros/s/AKfycbz0KDvCH2vcCtxvETw9XntJ4uFi1PyWOiaQAsSqA1iL3cpfuEuhgW8NyMO2Nbfbtsebog/exec";
const SHEET_ID = "1iSGxeBQx-LB0tNycfWo_xBQ6JLk_Dp8AGif0HkiPXBI";
const SHEET_NAME = "OEE_logs";
const CACHE_KEY = "am_records";
const CACHE_TIME_KEY = "am_records_last_sync";
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

export const DatabaseService = {
  getLocalRecords(): InspectionRecord[] {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading localStorage:", e);
      return [];
    }
  },

  setLocalRecords(records: InspectionRecord[]) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(records));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn("Storage quota exceeded or disabled:", e);
    }
  },

  async fetchRecords(forceRefresh = false): Promise<{ data: InspectionRecord[]; synced: boolean }> {
    const localData = this.getLocalRecords();
    const lastSync = parseInt(localStorage.getItem(CACHE_TIME_KEY) || "0", 10);
    const isCacheValid = Date.now() - lastSync < CACHE_EXPIRY_MS;

    if (!forceRefresh && isCacheValid && localData.length > 0) {
      return { data: localData, synced: false };
    }

    try {
      const requestUrl = `${GAS_API_URL}?action=getAllRecords&sheetId=${encodeURIComponent(SHEET_ID)}&sheetName=${encodeURIComponent(SHEET_NAME)}&_t=${Date.now()}`;
      const res = await fetch(requestUrl, {
        method: "GET",
        mode: "cors",
        redirect: "follow",
        headers: { "Accept": "application/json" }
      });

      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const parsed = await res.json();

      if (Array.isArray(parsed)) {
        const cleaned: InspectionRecord[] = parsed
          .filter((r: any) => r && (r.datetime || r['ข้อมูลวันที่']))
          .map((r: any) => ({
            id: r.id || (Math.random().toString(36).slice(2, 9)),
            recordType: 'oee' as const,
            machine: r.machine ?? r['เครื่องจักร'] ?? 'เครื่องบรรจุ 1Kg No.1',
            datetime: r.datetime ?? r['ข้อมูลวันที่'] ?? new Date().toISOString(),
            reportDate: r.reportDate ?? r['ข้อมูลวันที่'] ?? new Date().toISOString().slice(0, 10),
            shift: r.shift ?? r['shift'] ?? 'A',
            shiftType: r.shiftType ?? r['shift duration type'] ?? '8h',
            operator: r.operator ?? r['ชื่อผู้บันทึก'] ?? '-',
            speed: Number(r.speed ?? r['Speed Actual'] ?? 0),
            tempFront: null,
            tempFrontMin: null,
            tempFrontMax: null,
            tfStatus: 'pass',
            tempBack: null,
            tempBackMin: null,
            tempBackMax: null,
            tbStatus: 'pass',
            tempMid: null,
            tempMidMin: null,
            tempMidMax: null,
            tmStatus: 'pass',
            timeFrontBack: null,
            timeFrontBackMin: null,
            timeFrontBackMax: null,
            timeFbStatus: 'pass',
            timeMid: null,
            timeMidMin: null,
            timeMidMax: null,
            timeMStatus: 'pass',
            lot: 'pass',
            teflon: 'pass',
            packSealTop: 'pass',
            packSealMid: 'pass',
            packSealBot: 'pass',
            hole: 'pass',
            targetKg: Number(r.targetKg ?? r['Target'] ?? 15000),
            actualKg: Number(r.actualKg ?? r['Actual'] ?? 12500),
            goodKg: Number(r.goodKg ?? r['Good'] ?? 12500),
            rejectKg: Number(r.rejectKg ?? r['Reject'] ?? 0),
            breakdownMin: Number(r.breakdownMin ?? r['BD'] ?? 0),
            notes: r.notes ?? ''
          }))
          .sort((a: any, b: any) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

        this.setLocalRecords(cleaned);
        return { data: cleaned, synced: true };
      }
      return { data: localData, synced: false };
    } catch (err) {
      console.warn("Network fetch failed, fallback to local storage:", err);
      return { data: localData, synced: false };
    }
  },

  async submitRecord(record: InspectionRecord, sheetName: string = "OEE_logs"): Promise<any> {
    const current = this.getLocalRecords();
    current.unshift(record);
    this.setLocalRecords(current);

    const planTimeVal = record.shiftType === '12h' ? 720 : 480;
    const bdVal = record.breakdownMin || 0;
    const runTimeVal = Math.max(0, planTimeVal - bdVal);
    const speedStdVal = 34.67;
    const speedSetVal = 45.00;
    const speedActVal = record.speed || 38.5;
    const targetVal = record.targetKg || (speedStdVal * runTimeVal);
    const goodVal = record.goodKg || 12500;
    const rejectVal = record.rejectKg || 0;
    const actualVal = record.actualKg || (goodVal + rejectVal);

    const params = new URLSearchParams({
      action: "saveRecord",
      sheetId: SHEET_ID,
      sheetName: sheetName,
      datetime: record.datetime || new Date().toISOString(),
      reportDate: record.reportDate || new Date().toISOString().slice(0, 10),
      machine: record.machine || "",
      shift: record.shift || "A",
      shiftType: record.shiftType || "8h",
      operator: record.operator || "",
      planTime: String(planTimeVal),
      runTime: String(runTimeVal),
      bd: String(bdVal),
      speedStd: String(speedStdVal),
      speedSet: String(speedSetVal),
      speedActual: String(speedActVal),
      target: String(targetVal),
      actual: String(actualVal),
      good: String(goodVal),
      reject: String(rejectVal)
    });

    const targetUrl = `${GAS_API_URL}?${params.toString()}`;
    console.log("📤 Submitting record via GET URL params:", targetUrl);

    try {
      await fetch(targetUrl, {
        method: "GET",
        mode: "no-cors"
      });

      console.log("📥 Submit ping sent successfully via GET");
      return { success: true };
    } catch (err) {
      console.error("❌ Failed to sync record to Google Sheet:", err);
      throw err;
    }
  },

  async fetchSealTempRecords(): Promise<InspectionRecord[]> {
    const sealSheetId = "1tZ1hkPBVpSQ_ffab0j940IU20GUAj5zIv--eREu5V9Y";
    const sealSheetName = "TPM_Logs";
    const sealGasUrl = "https://script.google.com/macros/s/AKfycby0tMGCk5-0gXw1hwmnAwYN_FDLjSDsU5bd3s2kXtboL7jIak0HGgTPF6uZOg6yC5D2wA/exec";

    try {
      const requestUrl = `${sealGasUrl}?action=getAllRecords&sheetId=${encodeURIComponent(sealSheetId)}&sheetName=${encodeURIComponent(sealSheetName)}&_t=${Date.now()}`;
      const res = await fetch(requestUrl, {
        method: "GET",
        mode: "cors",
        redirect: "follow",
        headers: { "Accept": "application/json" }
      });

      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const parsed = await res.json();

      if (Array.isArray(parsed)) {
        const cleaned = parsed
          .filter((r: any) => r && (r.datetime || r['ข้อมูลวันที่']))
          .map((r: any) => ({
            id: r.id || (Math.random().toString(36).slice(2, 9)),
            recordType: 'sealTemp' as const,
            machine: r.machine ?? r['เครื่องจักร'] ?? 'เครื่องบรรจุ 1Kg No.1',
            datetime: r.datetime ?? r['ข้อมูลวันที่'] ?? new Date().toISOString(),
            reportDate: r.reportDate ?? r['ข้อมูลวันที่'] ?? new Date().toISOString().slice(0, 10),
            shift: r.shift ?? 'A',
            shiftType: r.shiftType ?? r['shift duration type'] ?? '8h',
            operator: r.operator ?? r['ชื่อผู้บันทึก'] ?? '-',
            speed: Number(r.speed ?? 0),
            tempFront: Number(r.tempFront ?? r['อุณหภูมิหน้า'] ?? 0),
            tempFrontMin: 175,
            tempFrontMax: 210,
            tfStatus: 'pass',
            tempBack: Number(r.tempBack ?? r['อุณหภูมิหลัง'] ?? 0),
            tempBackMin: 175,
            tempBackMax: 210,
            tbStatus: 'pass',
            tempMid: Number(r.tempMid ?? r['อุณหภูมิกลาง'] ?? 0),
            tempMidMin: 175,
            tempMidMax: 210,
            tmStatus: 'pass',
            timeFrontBack: null,
            timeFrontBackMin: null,
            timeFrontBackMax: null,
            timeFbStatus: 'pass',
            timeMid: null,
            timeMidMin: null,
            timeMidMax: null,
            timeMStatus: 'pass',
            lot: r.lot ?? 'pass',
            teflon: r.teflon ?? 'pass',
            packSealTop: r.packSealTop ?? 'pass',
            packSealMid: r.packSealMid ?? 'pass',
            packSealBot: r.packSealBot ?? 'pass',
            hole: r.hole ?? 'pass',
            targetKg: null,
            actualKg: null,
            goodKg: null,
            rejectKg: null,
            breakdownMin: 0,
            notes: r.notes ?? ''
          }))
          .sort((a: any, b: any) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

        return cleaned;
      }
      return [];
    } catch (err) {
      console.warn("Failed to fetch Seal Temp records from TPM_Logs:", err);
      return [];
    }
  },

  async submitSealTempRecord(record: InspectionRecord): Promise<any> {
    const sealSheetId = "1tZ1hkPBVpSQ_ffab0j940IU20GUAj5zIv--eREu5V9Y";
    const sealSheetName = "TPM_Logs";
    const sealGasUrl = "https://script.google.com/macros/s/AKfycby0tMGCk5-0gXw1hwmnAwYN_FDLjSDsU5bd3s2kXtboL7jIak0HGgTPF6uZOg6yC5D2wA/exec";

    const params = new URLSearchParams({
      action: "saveRecord",
      sheetId: sealSheetId,
      sheetName: sealSheetName,
      datetime: record.datetime || new Date().toISOString(),
      reportDate: record.reportDate || new Date().toISOString().slice(0, 10),
      machine: record.machine || "",
      shift: record.shift || "A",
      shiftType: record.shiftType || "8h",
      operator: record.operator || "",
      tempFront: String(record.tempFront ?? ''),
      tempBack: String(record.tempBack ?? ''),
      tempMid: String(record.tempMid ?? ''),
      lot: record.lot || 'pass',
      teflon: record.teflon || 'pass',
      packSealTop: record.packSealTop || 'pass',
      packSealMid: record.packSealMid || 'pass',
      packSealBot: record.packSealBot || 'pass',
      hole: record.hole || 'pass',
      notes: record.notes || ''
    });

    const targetUrl = `${sealGasUrl}?${params.toString()}`;
    console.log("📤 Submitting Seal Temp record to TPM_Logs:", targetUrl);

    try {
      await fetch(targetUrl, {
        method: "GET",
        mode: "no-cors"
      });
      return { success: true };
    } catch (err) {
      console.error("❌ Failed to sync Seal Temp record:", err);
      throw err;
    }
  },

  async fetchFilmRollRecords(): Promise<any[]> {
    const filmSheetId = "1RZKQqR3hGMA4aRnUrCTrXDkRDo0tOqutdEo1PKnYm-0";
    const filmSheetName = "FilmRoll_logs";
    const gasUrl = "https://script.google.com/macros/s/AKfycbxhbORz5XB6pjqDaQWLt0cV7kuxC_YArKfh5a5veeRdXWSCvBRbhknlJkuY6LNiqUcO-w/exec";

    try {
      const requestUrl = `${gasUrl}?action=getAllRecords&sheetId=${encodeURIComponent(filmSheetId)}&sheetName=${encodeURIComponent(filmSheetName)}&_t=${Date.now()}`;
      const res = await fetch(requestUrl, {
        method: "GET",
        mode: "cors",
        redirect: "follow",
        headers: { "Accept": "application/json" }
      });

      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const parsed = await res.json();

      if (Array.isArray(parsed)) {
        return parsed
          .filter((r: any) => r && (r.datetime || r['date'] || r['ข้อมูลวันที่']))
          .map((r: any) => ({
            id: r.id || (Math.random().toString(36).slice(2, 9)),
            machine: r.machine ?? r['เครื่องจักร'] ?? 'เครื่องบรรจุ 1Kg No.1',
            operator: r.operator ?? r['Operator'] ?? '-',
            shift: r.shift ?? r['กะ'] ?? 'A',
            shiftType: r.shiftType ?? r['Duration shift'] ?? '8h',
            supplier: r.supplier ?? r['Supplier'] ?? 'TG',
            filmDate: r.filmDate ?? r['date'] ?? new Date().toLocaleDateString(),
            changeTime: r.changeTime ?? r['เวลาเปลี่ยนม้วนฟิล์ม'] ?? '00:00',
            tagPhoto: r.tagPhoto ?? r['รูปป้าย Tag'] ?? null,
            datetime: r.datetime ?? new Date().toISOString()
          }))
          .sort((a: any, b: any) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      }
      return [];
    } catch (err) {
      console.warn("Failed to fetch Film Roll records:", err);
      return [];
    }
  },

  async submitFilmRollRecord(record: any): Promise<any> {
    const filmSheetId = "1RZKQqR3hGMA4aRnUrCTrXDkRDo0tOqutdEo1PKnYm-0";
    const filmSheetName = "FilmRoll_logs";
    const gasUrl = "https://script.google.com/macros/s/AKfycbxhbORz5XB6pjqDaQWLt0cV7kuxC_YArKfh5a5veeRdXWSCvBRbhknlJkuY6LNiqUcO-w/exec";

    const payload = {
      action: "saveRecord",
      sheetId: filmSheetId,
      sheetName: filmSheetName,
      datetime: record.datetime || new Date().toISOString(),
      filmDate: record.filmDate || new Date().toLocaleDateString(),
      machine: record.machine || "",
      operator: record.operator || "",
      shift: record.shift || "A",
      shiftType: record.shiftType || "8h",
      supplier: record.supplier || "TG",
      changeTime: record.changeTime || "",
      tagPhoto: record.tagPhoto || ""
    };

    console.log("📤 Submitting Film Roll record via POST JSON payload to FilmRoll_logs...");

    try {
      await fetch(gasUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });
      console.log("📥 Film roll POST request dispatched successfully");
      return { success: true };
    } catch (err) {
      console.error("❌ Failed to sync Film Roll record:", err);
      throw err;
    }
  }
};
