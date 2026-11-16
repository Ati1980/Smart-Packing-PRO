/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Boxes, ClipboardEdit, Clock, TrendingUp,
  UserCheck, Factory, ShieldCheck, Gauge,
  ListCheck, RotateCcw, Save, RotateCw, FileSpreadsheet,
  CalendarDays, CheckCircle2, Box, Check,
  ChevronDown, ChevronUp, Thermometer, Sparkles, GaugeCircle,
  Cpu, Layers, Zap, Activity, Wrench, Shield, CheckSquare,
  ClipboardList, ShieldAlert, Award, Camera, ImagePlus
} from 'lucide-react';
import Chart from 'chart.js/auto';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Machine, InspectionRecord } from './types';
import { DatabaseService } from './services/database';

const MACHINES: (Machine & { icon: any; badgeColor: string })[] = [
  { id: 1, name: 'เครื่องบรรจุ 1Kg No.1', color: '#ef4444', icon: Cpu, badgeColor: 'bg-red-50 text-red-600 border-red-200' },
  { id: 2, name: 'เครื่องบรรจุ 1Kg No.2', color: '#f59e0b', icon: Layers, badgeColor: 'bg-amber-50 text-amber-600 border-amber-200' },
  { id: 3, name: 'เครื่องบรรจุ 1Kg No.3', color: '#eab308', icon: Zap, badgeColor: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  { id: 4, name: 'เครื่องบรรจุ 1Kg No.4', color: '#10b981', icon: Activity, badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 5, name: 'เครื่องบรรจุ 1Kg No.5', color: '#3b82f6', icon: GaugeCircle, badgeColor: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 6, name: 'เครื่องบรรจุ 1Kg No.6', color: '#8b5cf6', icon: Box, badgeColor: 'bg-purple-50 text-purple-600 border-purple-200' },
  { id: 7, name: 'เครื่องบรรจุ 1Kg No.7', color: '#ec4899', icon: Sparkles, badgeColor: 'bg-pink-50 text-pink-600 border-pink-200' }
];

const MACHINE_DEFAULTS: Record<number, any> = {
  1: {
    group1: { tempFront: [175, 210], tempBack: [175, 210], tempMid: [175, 210], timeFrontBack: null, timeMid: null },
    group2: { tempFront: [170, 190], tempBack: [170, 190], tempMid: [170, 185], timeFrontBack: null, timeMid: null }
  },
  2: { tempFront: [175, 210], tempBack: [175, 210], tempMid: [175, 210], timeFrontBack: null, timeMid: null },
  3: { tempFront: [175, 190], tempBack: [175, 190], tempMid: [165, 185], timeFrontBack: [80, 350], timeMid: [120, 320] },
  4: { tempFront: [170, 185], tempBack: [170, 185], tempMid: [170, 185], timeFrontBack: [150, 1300], timeMid: [150, 900] },
  5: { tempFront: [160, 180], tempBack: [160, 180], tempMid: [165, 175], timeFrontBack: [150, 1300], timeMid: [150, 900] },
  6: { tempFront: [160, 180], tempBack: [160, 180], tempMid: [165, 175], timeFrontBack: [110, 350], timeMid: [120, 320] },
  7: { tempFront: [145, 170], tempBack: [145, 170], tempMid: [150, 175], timeFrontBack: [110, 350], timeMid: [120, 320] }
};

const MACHINE_SPEED_SPECS: Record<number, { std: number; set: number }> = {
  1: { std: 34.67, set: 45.00 },
  2: { std: 34.67, set: 45.00 },
  3: { std: 32.00, set: 40.00 },
  4: { std: 24.00, set: 35.00 },
  5: { std: 24.00, set: 35.00 },
  6: { std: 17.00, set: 22.00 },
  7: { std: 23.50, set: 25.00 }
};

const INSPECTORS = [
  { name: "นายอนิวัฒน์ ทองลาด", emoji: "👨‍💻", color: "#ef4444", badge: "bg-red-50 text-red-700 border-red-200" },
  { name: "นายประจักร์ น้อยมูล", emoji: "🦸‍♂️", color: "#f59e0b", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "นายภานุพงค์ นามวิเศษ", emoji: "🧙‍♂️", color: "#10b981", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { name: "นายวัชรากร ขวัญเฉลิม", emoji: "🥷", color: "#8b5cf6", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  { name: "นายกิตติภัส สีสังชุม", emoji: "🤖", color: "#3b82f6", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  { name: "นายมงคล ติวสร้อย", emoji: "🐯", color: "#ec4899", badge: "bg-pink-50 text-pink-700 border-pink-200" },
  { name: "นายอำนาจ ทิพย์โพธิ์ศรี", emoji: "🦊", color: "#f97316", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  { name: "นายอดิศักดิ์ มณีจันทร์", emoji: "🦁", color: "#eab308", badge: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  { name: "นายปริวัฒน์ ทองมูล", emoji: "🚀", color: "#6366f1", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" }
];

const pad = (n: number) => String(n).padStart(2, '0');
const isToday = (dt?: string) => {
  if (!dt) return false;
  const d = new Date(dt);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

const matchesDateFilter = (recDateStr: string, filterDateStr: string) => {
  if (!filterDateStr) return true;
  if (!recDateStr) return false;
  const [fY, fM, fD] = filterDateStr.split('-');
  const cleanRec = recDateStr.replace(/\//g, '-');
  if (cleanRec.includes(filterDateStr)) return true;
  if (fY && fM && fD) {
    if (cleanRec.includes(`${fD}-${fM}-${fY}`) || cleanRec.includes(`${parseInt(fD)}/${parseInt(fM)}/${fY}`)) return true;
  }
  return false;
};

const formatDDMMYYYY = (dtStr?: string) => {
  if (!dtStr) return '-';
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return dtStr;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const SpeedometerGauge = ({ value, label, color, subLabel, cardBg }: { value: number; label: string; color: string; subLabel: string; cardBg: string }) => {
  const radius = 55;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg flex flex-col items-center justify-between ${cardBg}`}>
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-black text-slate-900 font-display flex items-center gap-1.5"><Award className="w-4 h-4 text-blue-600" /> {label}</span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${value >= 80 ? 'bg-emerald-500/20 text-emerald-800' : value >= 60 ? 'bg-amber-500/20 text-amber-800' : 'bg-rose-500/20 text-rose-800'}`}>
          {value >= 80 ? 'Optimal' : value >= 60 ? 'Warning' : 'Critical'}
        </span>
      </div>
      <div className="relative w-32 h-32 flex items-center justify-center my-1">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            strokeWidth="14"
            className="stroke-slate-200 fill-none"
          />
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            strokeWidth="14"
            stroke={color}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
            className="fill-none"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            key={value}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-black font-mono tracking-tighter text-slate-900"
          >
            {value}%
          </motion.span>
          <span className="text-[10px] font-bold text-slate-500">{subLabel}</span>
        </div>
      </div>
      <div className="w-full text-center text-[11px] font-semibold text-slate-500 mt-1">
        Target: ≥ 85%
      </div>
    </div>
  );
};

const recordOk = (r: InspectionRecord) => {
  return r.tfStatus !== 'fail' && r.tbStatus !== 'fail' && r.tmStatus !== 'fail' &&
         r.timeFbStatus !== 'fail' && r.timeMStatus !== 'fail' &&
         (r.lot === 'pass' || r.lot === 'ผ่าน') &&
         r.teflon === 'pass' && r.packSealTop === 'pass' && r.packSealMid === 'pass' &&
         r.packSealBot === 'pass' && r.hole === 'pass';
};

const getMaintenanceInsights = (machineName: string, recs: InspectionRecord[]) => {
  const mRecs = recs.filter(r => r.machine === machineName);
  if (mRecs.length === 0) {
    return {
      level: 'optimal',
      title: 'สถานะเครื่องจักร: ปกติ (ยังไม่มีข้อมูลประวัติเพียงพอ)',
      advice: 'เริ่มบันทึกข้อมูลการตรวจสอบสม่ำเสมอเพื่อเปิดใช้งานระบบวิเคราะห์แนวโน้มอัจฉริยะ'
    };
  }

  const recent = mRecs.slice(0, 5);
  const failCount = recent.filter(r => !recordOk(r)).length;

  if (failCount >= 2) {
    return {
      level: 'critical',
      title: '🚨 คำเตือนด่วน: ตรวจพบความผิดพลาดบ่อยครั้งในรอบล่าสุด',
      advice: 'แนะนำให้หยุดเครื่องชั่วคราวเพื่อตรวจสอบชุดซีลความร้อน (Thermal Seal) และฮีตเตอร์ทันที'
    };
  } else if (failCount === 1) {
    return {
      level: 'warning',
      title: '⚠️ เฝ้าระวัง: พบค่าหลุดสเปค 1 รายการในรอบล่าสุด',
      advice: 'ควรตรวจสอบอุณหภูมิฮีตเตอร์และสภาพเทปล่อนกันติดบริเวณก้านซีล'
    };
  } else {
    return {
      level: 'optimal',
      title: '✨ สภาพเครื่องจักรยอดเยี่ยม (Optimal Condition)',
      advice: 'ค่าอุณหภูมิและความเร็วอยู่ในเกณฑ์มาตรฐานสเปคต่อเนื่อง ไม่มีแนวโน้มความผิดปกติ'
    };
  }
};

const getMachineSpec = (mName: string) => {
  const found = MACHINES.find(m => m.name === mName);
  const id = found ? found.id : 1;
  return MACHINE_SPEED_SPECS[id] || { std: 34.67, set: 45.00 };
};

const computeOperatorData = (opName: string, records: InspectionRecord[], dashFilterMachine: string, dashFilterDate: string, dashFilterShift: string, dashFilterOperator: string) => {
  const insRecs = records.filter(r => {
    if (r.operator !== opName) return false;
    if (dashFilterDate) {
      const matchDatetime = r.datetime && r.datetime.startsWith(dashFilterDate);
      const matchReportDate = r.reportDate && r.reportDate === dashFilterDate;
      if (!matchDatetime && !matchReportDate) return false;
    }
    if (dashFilterShift !== 'all' && r.shift !== dashFilterShift) return false;
    if (dashFilterMachine !== 'all' && r.machine !== dashFilterMachine) return false;
    return true;
  });

  const fallbackRecs = records.filter(r => r.operator === opName);
  const activeRecs = insRecs.length > 0 ? insRecs : fallbackRecs;

  let machineNames = Array.from(new Set(activeRecs.map(r => r.machine || 'เครื่องบรรจุ 1Kg No.1')));
  if (dashFilterMachine !== 'all') {
    machineNames = machineNames.filter(mName => mName === dashFilterMachine);
  }

  const machineRows = machineNames.map(mName => {
    const subRecs = activeRecs.filter(r => r.machine === mName);
    const subCount = subRecs.length || 1;
    const subPlan = subRecs.reduce((acc, r) => acc + (r.shiftType === '12h' ? 720 : 480), 0) || (subCount * 480);
    const subBd = subRecs.reduce((acc, r) => acc + (r.breakdownMin ?? 0), 0);
    const subRun = Math.max(0, subPlan - subBd);
    const spec = getMachineSpec(mName);
    const subSpeedStd = spec.std;
    const subSpeedSet = spec.set;
    const subSpeedAct = subRecs.length > 0 ? subRecs.reduce((acc, r) => acc + (r.speed || subSpeedSet), 0) / subRecs.length : subSpeedSet;
    const subGood = subRecs.reduce((acc, r) => acc + (r.goodKg ?? 0), 0) || (subCount * 1100);
    const subReject = subRecs.reduce((acc, r) => acc + (r.rejectKg ?? 0), 0) || Math.round(subGood * 0.002);
    const subAction = subRecs.reduce((acc, r) => acc + (r.actualKg ?? (r.goodKg || 0) + (r.rejectKg || 0)), 0) || (subGood + subReject);
    const subTarget = subRecs.reduce((acc, r) => acc + (r.targetKg ?? 4000), 0) || (subSpeedStd * subRun);
    const subMe = subPlan > 0 ? (subRun / subPlan) * 100 : 100;
    const subPerf = subSpeedSet > 0 ? (subSpeedAct / subSpeedSet) * 100 : 100;
    const subQual = subAction > 0 ? (subGood / subAction) * 100 : 100;
    const subOee = (subMe * subPerf * subQual) / 10000;

    return {
      name: mName,
      planTime: subPlan,
      bd: subBd,
      runTime: subRun,
      speedStd: subSpeedStd,
      speedSet: subSpeedSet,
      speedAct: subSpeedAct,
      target: subTarget,
      actual: subAction,
      good: subGood,
      reject: subReject,
      me: subMe,
      perf: subPerf,
      quality: subQual,
      oee: subOee
    };
  });

  const planTime = machineRows.reduce((acc, m) => acc + m.planTime, 0);
  const bd = machineRows.reduce((acc, m) => acc + m.bd, 0);
  const runTime = machineRows.reduce((acc, m) => acc + m.runTime, 0);
  const target = machineRows.reduce((acc, m) => acc + m.target, 0);
  const actual = machineRows.reduce((acc, m) => acc + m.actual, 0);
  const good = machineRows.reduce((acc, m) => acc + m.good, 0);
  const reject = machineRows.reduce((acc, m) => acc + m.reject, 0);

  const speedStd = machineRows.length > 0 ? machineRows.reduce((acc, m) => acc + m.speedStd, 0) / machineRows.length : 34.67;
  const speedSet = machineRows.length > 0 ? machineRows.reduce((acc, m) => acc + m.speedSet, 0) / machineRows.length : 45.00;
  const speedAct = machineRows.length > 0 ? machineRows.reduce((acc, m) => acc + m.speedAct, 0) / machineRows.length : 45.00;

  const me = planTime > 0 ? (runTime / planTime) * 100 : 100;
  const perf = speedSet > 0 ? (speedAct / speedSet) * 100 : 100;
  const quality = actual > 0 ? (good / actual) * 100 : 100;
  const oee = (me * perf * quality) / 10000;

  return {
    operatorName: opName,
    planTime,
    bd,
    runTime,
    target,
    actual,
    good,
    reject,
    speedStd,
    speedSet,
    speedAct,
    me,
    perf,
    quality,
    oee,
    machineRows
  };
};

export default function App() {
  const [currentView, setCurrentView] = useState<'form' | 'oee' | 'film' | 'historyHub' | 'historySeal' | 'historyOee' | 'historyFilm' | 'dashboard'>('form');
  const [selectedMachine, setSelectedMachine] = useState<number>(1);
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [sealTempRecords, setSealTempRecords] = useState<InspectionRecord[]>([]);

  useEffect(() => {
    DatabaseService.fetchSealTempRecords().then(data => {
      if (data && data.length > 0) {
        setSealTempRecords(data);
      }
    });
    DatabaseService.fetchFilmRollRecords().then(data => {
      if (data && data.length > 0) {
        setFilmRecords(data);
      }
    });
  }, []);
  const [clockString, setClockString] = useState<string>('');
  const [currentISO, setCurrentISO] = useState<string>(new Date().toISOString());

  // Film Roll States
  const [filmMachine, setFilmMachine] = useState<number>(1);
  const [filmOperator, setFilmOperator] = useState<string>('');
  const [filmShift, setFilmShift] = useState<string>('A');
  const [filmShiftType, setFilmShiftType] = useState<'8h' | '12h'>('8h');
  const [filmSupplier, setFilmSupplier] = useState<string>('TG');
  const [filmDate, setFilmDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [filmChangeTime, setFilmChangeTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [filmTagPhoto, setFilmTagPhoto] = useState<string | null>(null);
  const [filmLot, setFilmLot] = useState<string>('');
  const [filmThickness, setFilmThickness] = useState<string>('');
  const [filmWidth, setFilmWidth] = useState<string>('');
  const [filmStatus, setFilmStatus] = useState<string>('pass');
  const [filmRecords, setFilmRecords] = useState<any[]>([]);
  const filmCameraInputRef = useRef<HTMLInputElement | null>(null);
  const filmGalleryInputRef = useRef<HTMLInputElement | null>(null);

  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      mediaStreamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.warn("getUserMedia failed, falling back to file input capture:", err);
      setShowCameraModal(false);
      filmCameraInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFilmTagPhoto(dataUrl);
        showToast('ถ่ายภาพป้าย Tag สำเร็จ ✔');
      }
    }
    stopCamera();
  };

  const handleFilmPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilmTagPhoto(reader.result as string);
        showToast('แนบรูปป้าย tag ม้วนฟิล์มเรียบร้อย ✔');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Form State
  const [shift, setShift] = useState<string>('A');
  const [shiftType, setShiftType] = useState<'8h' | '12h'>('8h');
  const [operator, setOperator] = useState<string>('');
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [speed, setSpeed] = useState<string>('');
  const [no1Group, setNo1Group] = useState<'group1' | 'group2'>('group1');

  const [tempFront, setTempFront] = useState<string>('');
  const [tempBack, setTempBack] = useState<string>('');
  const [tempMid, setTempMid] = useState<string>('');
  const [timeFrontBack, setTimeFrontBack] = useState<string>('');
  const [timeMid, setTimeMid] = useState<string>('');

  const [limits, setLimits] = useState({
    tempFront: [175, 210],
    tempBack: [175, 210],
    tempMid: [175, 210],
    timeFrontBack: null as number[] | null,
    timeMid: null as number[] | null
  });

  const [qc, setQc] = useState({
    lot: null as string | null,
    teflon: null as string | null,
    packSealTop: null as string | null,
    packSealMid: null as string | null,
    packSealBot: null as string | null,
    hole: null as string | null
  });

  const [notes, setNotes] = useState<string>('');
  const [targetKg, setTargetKg] = useState<string>('');
  const [actualKg, setActualKg] = useState<string>('');
  const [goodKg, setGoodKg] = useState<string>('');
  const [rejectKg, setRejectKg] = useState<string>('');
  const [showSpecsModal, setShowSpecsModal] = useState<boolean>(false);
  const [customSpeedSpecs, setCustomSpeedSpecs] = useState<Record<number, { std: number; set: number }>>(MACHINE_SPEED_SPECS);
  const [showLimitEditor, setShowLimitEditor] = useState<boolean>(false);
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState<boolean>(false);

  const [breakdownMin, setBreakdownMin] = useState<string>('0');
  const [planTime, setPlanTime] = useState<string>('480');
  const [runTime, setRunTime] = useState<string>('480');
  const [speedStd, setSpeedStd] = useState<string>('34.67');
  const [speedSet, setSpeedSet] = useState<string>('45.00');

  useEffect(() => {
    const pt = shiftType === '12h' ? '720' : '480';
    setPlanTime(pt);
  }, [shiftType]);

  useEffect(() => {
    const rt = Math.max(0, (parseFloat(planTime) || 0) - (parseFloat(breakdownMin) || 0));
    setRunTime(String(rt));
  }, [planTime, breakdownMin]);

  useEffect(() => {
    const spec = customSpeedSpecs[selectedMachine] || { std: 34.67, set: 45.00 };
    setSpeedStd(String(spec.std));
    setSpeedSet(String(spec.set));
  }, [selectedMachine, customSpeedSpecs]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalDesc, setModalDesc] = useState<string>('');

  // History filters
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [filterMachine, setFilterMachine] = useState<string>('all');

  // Seal Temp History Filters
  const [sealFilterDate, setSealFilterDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [sealFilterMachine, setSealFilterMachine] = useState<string>('all');
  const [sealFilterShift, setSealFilterShift] = useState<string>('all');
  const [sealFilterOperator, setSealFilterOperator] = useState<string>('all');

  // OEE History Filters
  const [oeeFilterDate, setOeeFilterDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [oeeFilterMachine, setOeeFilterMachine] = useState<string>('all');
  const [oeeFilterShift, setOeeFilterShift] = useState<string>('all');
  const [oeeFilterOperator, setOeeFilterOperator] = useState<string>('all');

  // Film Roll History Filters
  const [filmHistFilterDate, setFilmHistFilterDate] = useState<string>('');
  const [filmHistFilterMachine, setFilmHistFilterMachine] = useState<string>('all');
  const [filmHistFilterShift, setFilmHistFilterShift] = useState<string>('all');
  const [filmHistFilterOperator, setFilmHistFilterOperator] = useState<string>('all');
  const [filmHistFilterSupplier, setFilmHistFilterSupplier] = useState<string>('all');

  // Dashboard Table Filters
  const [dashFilterDate, setDashFilterDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dashFilterShift, setDashFilterShift] = useState<string>('all');
  const [dashFilterOperator, setDashFilterOperator] = useState<string>('all');
  const [dashFilterMachine, setDashFilterMachine] = useState<string>('all');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const filteredDashRecords = records.filter(r => {
    if (dashFilterDate) {
      const matchDatetime = r.datetime && r.datetime.startsWith(dashFilterDate);
      const matchReportDate = r.reportDate && r.reportDate === dashFilterDate;
      if (!matchDatetime && !matchReportDate) return false;
    }
    if (dashFilterShift !== 'all' && r.shift !== dashFilterShift) return false;
    if (dashFilterOperator !== 'all' && r.operator !== dashFilterOperator) return false;
    if (dashFilterMachine !== 'all' && r.machine !== dashFilterMachine) return false;
    return true;
  });

  // Charts refs
  const speedChartRef = useRef<HTMLCanvasElement | null>(null);
  const tempChartRef = useRef<HTMLCanvasElement | null>(null);
  const speedChartInstance = useRef<Chart | null>(null);
  const tempChartInstance = useRef<Chart | null>(null);

  // Clock effect
  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setCurrentISO(d.toISOString());
      setClockString(`${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial records fetch
  useEffect(() => {
    setRecords(DatabaseService.getLocalRecords());
    DatabaseService.fetchRecords().then(res => {
      setRecords(res.data);
    });
  }, []);

  // Apply machine defaults when selectedMachine or no1Group changes
  useEffect(() => {
    const isNo12 = selectedMachine === 1 || selectedMachine === 2;
    let defs = selectedMachine === 1 ? MACHINE_DEFAULTS[1][no1Group] : MACHINE_DEFAULTS[selectedMachine];

    if (defs) {
      setLimits({
        tempFront: defs.tempFront || [0, 0],
        tempBack: defs.tempBack || [0, 0],
        tempMid: defs.tempMid || [0, 0],
        timeFrontBack: isNo12 ? null : defs.timeFrontBack,
        timeMid: isNo12 ? null : defs.timeMid
      });
    }
  }, [selectedMachine, no1Group]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const checkRange = (valStr: string, min: number, max: number) => {
    if (!valStr.trim()) return 'unknown';
    if (valStr.includes('-')) {
      const parts = valStr.split('-').map(s => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return (parts[0] >= min && parts[1] <= max) ? 'pass' : 'fail';
      }
    } else {
      const v = parseFloat(valStr);
      if (!isNaN(v)) {
        return (v >= min && v <= max) ? 'pass' : 'fail';
      }
    }
    return 'unknown';
  };

  const tfStatus = checkRange(tempFront, limits.tempFront[0], limits.tempFront[1]);
  const tbStatus = checkRange(tempBack, limits.tempBack[0], limits.tempBack[1]);
  const tmStatus = checkRange(tempMid, limits.tempMid[0], limits.tempMid[1]);
  const timeFbStatus = limits.timeFrontBack ? checkRange(timeFrontBack, limits.timeFrontBack[0], limits.timeFrontBack[1]) : 'pass';
  const timeMStatus = limits.timeMid ? checkRange(timeMid, limits.timeMid[0], limits.timeMid[1]) : 'pass';



  const handleOeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operator.trim() || !reportDate || !planTime.trim() || !runTime.trim() || breakdownMin.trim() === '' || !speedStd.trim() || !speedSet.trim() || !speed.trim() || targetKg.trim() === '' || actualKg.trim() === '' || goodKg.trim() === '' || rejectKg.trim() === '') {
      showToast('กรุณากรอกข้อมูล OEE ให้ครบทุกหัวข้อ (ยกเว้นหมายเหตุ)');
      return;
    }
    const m = MACHINES.find(item => item.id === selectedMachine)!;

    const newRec: InspectionRecord = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      recordType: 'oee',
      machine: m.name,
      datetime: currentISO,
      shift,
      shiftType,
      operator,
      reportDate,
      speed: parseFloat(speedSet) || 0,
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
      targetKg: parseFloat(targetKg) || null,
      actualKg: parseFloat(actualKg) || null,
      goodKg: parseFloat(goodKg) || null,
      rejectKg: parseFloat(rejectKg) || null,
      breakdownMin: parseFloat(breakdownMin) || 0,
      notes
    };

    const updated = [newRec, ...records];
    setRecords(updated);
    DatabaseService.setLocalRecords(updated);

    setModalDesc(`บันทึกข้อมูล OEE ของ ${m.name} ลง Sheet OEE_logs เรียบร้อยแล้ว`);
    setShowModal(true);

    setTargetKg('');
    setActualKg('');
    setGoodKg('');
    setRejectKg('');
    setBreakdownMin('0');
    setNotes('');

    try {
      await DatabaseService.submitRecord(newRec, "OEE_logs");
      showToast('ซิงค์ข้อมูล OEE ลง Google Sheet (OEE_logs) สำเร็จ ✔');
    } catch {
      showToast('บันทึกลงแคชในเครื่องแล้ว (รอซิงค์เมื่อออนไลน์)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operator.trim() || !speed.trim() || !tempFront.trim() || !tempBack.trim() || !tempMid.trim()) {
      showToast('กรุณากรอกข้อมูลผู้ตรวจสอบ ความเร็ว และอุณหภูมิให้ครบทุกช่อง');
      return;
    }
    if (selectedMachine > 2 && (!timeFrontBack.trim() || !timeMid.trim())) {
      showToast('กรุณากรอกค่าแช่จอหน้า-หลัง และแช่จอกลาง (ms)');
      return;
    }
    if (!qc.lot || !qc.teflon || !qc.packSealTop || !qc.packSealMid || !qc.packSealBot || !qc.hole) {
      showToast('กรุณาเลือกผลการตรวจสอบ QC ให้ครบทุกหัวข้อ');
      return;
    }
    const m = MACHINES.find(item => item.id === selectedMachine)!;

    const newRec: InspectionRecord = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      recordType: 'sealTemp',
      machine: m.name,
      datetime: currentISO,
      shift,
      shiftType,
      operator,
      reportDate,
      speed: parseFloat(speed) || 0,
      tempFront: parseFloat(tempFront) || null,
      tempFrontMin: limits.tempFront[0],
      tempFrontMax: limits.tempFront[1],
      tfStatus,
      tempBack: parseFloat(tempBack) || null,
      tempBackMin: limits.tempBack[0],
      tempBackMax: limits.tempBack[1],
      tbStatus,
      tempMid: parseFloat(tempMid) || null,
      tempMidMin: limits.tempMid[0],
      tempMidMax: limits.tempMid[1],
      tmStatus,
      timeFrontBack: (selectedMachine === 1 || selectedMachine === 2) ? null : timeFrontBack.trim() || null,
      timeFrontBackMin: limits.timeFrontBack?.[0] || null,
      timeFrontBackMax: limits.timeFrontBack?.[1] || null,
      timeFbStatus,
      timeMid: (selectedMachine === 1 || selectedMachine === 2) ? null : timeMid.trim() || null,
      timeMidMin: limits.timeMid?.[0] || null,
      timeMidMax: limits.timeMid?.[1] || null,
      timeMStatus,
      lot: qc.lot,
      teflon: qc.teflon,
      packSealTop: qc.packSealTop,
      packSealMid: qc.packSealMid,
      packSealBot: qc.packSealBot,
      hole: qc.hole,
      targetKg: parseFloat(targetKg) || null,
      actualKg: parseFloat(actualKg) || null,
      goodKg: parseFloat(goodKg) || null,
      rejectKg: parseFloat(rejectKg) || null,
      breakdownMin: parseFloat(breakdownMin) || 0,
      notes
    };

    const updated = [newRec, ...records];
    setRecords(updated);
    DatabaseService.setLocalRecords(updated);

    setModalDesc(`บันทึกข้อมูล ${m.name} และซิงค์เรียบร้อยแล้ว`);
    setShowModal(true);

    // Reset inputs
    setSpeed('');
    setTempFront('');
    setTempBack('');
    setTempMid('');
    setTimeFrontBack('');
    setTimeMid('');
    setQc({ lot: null, teflon: null, packSealTop: null, packSealMid: null, packSealBot: null, hole: null });
    setTargetKg('');
    setActualKg('');
    setGoodKg('');
    setRejectKg('');
    setBreakdownMin('0');
    setNotes('');

    const updatedSeal = [newRec, ...sealTempRecords];
    setSealTempRecords(updatedSeal);

    try {
      await DatabaseService.submitSealTempRecord(newRec);
      showToast('ซิงค์ข้อมูลลง Google Sheet (TPM_Logs) สำเร็จ ✔');
    } catch {
      showToast('บันทึกลงแคชในเครื่องแล้ว (รอซิงค์เมื่อออนไลน์)');
    }
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(records.map(r => ({
      'Machine': r.machine,
      'Datetime': formatDDMMYYYY(r.datetime),
      'Shift': r.shift,
      'Inspector': r.operator,
      'Speed (bag/min)': r.speed,
      'Temp Front/Top': r.tempFront,
      'Temp Back/Bot': r.tempBack,
      'Temp Mid': r.tempMid,
      'Lot Check': r.lot,
      'Teflon Check': r.teflon,
      'PackSeal Top': r.packSealTop,
      'PackSeal Mid': r.packSealMid,
      'PackSeal Bot': r.packSealBot,
      'Hole Position': r.hole,
      'Breakdown (min)': r.breakdownMin ?? 0,
      'Notes': r.notes
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "InspectionRecords");
    XLSX.writeFile(wb, `SmartPackingPRO_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('ส่งออกไฟล์ Excel สำเร็จ ✔');
  };

  const handleExportDashboardExcel = () => {
    const recordOperators = Array.from(new Set(filteredDashRecords.map(r => r.operator).filter(Boolean)));
    const activeOperators = recordOperators.length > 0 ? recordOperators : INSPECTORS.map(i => i.name);
    const displayOperators = activeOperators.filter(opName => {
      if (dashFilterOperator !== 'all' && opName !== dashFilterOperator) return false;
      return true;
    });

    const exportRows: any[] = [];
    let totalPlanTime = 0;
    let totalRunTime = 0;
    let totalBd = 0;
    let totalTarget = 0;
    let totalAction = 0;
    let totalGood = 0;
    let totalReject = 0;
    let sumOee = 0;
    let sumPerf = 0;
    let sumMe = 0;
    let sumQual = 0;
    let rowCount = 0;

    displayOperators.forEach(opName => {
      const insRecs = filteredDashRecords.filter(r => r.operator === opName);
      const fallbackRecs = records.filter(r => r.operator === opName);
      const activeRecs = insRecs.length > 0 ? insRecs : fallbackRecs;
      if (activeRecs.length === 0 && (dashFilterDate || dashFilterShift !== 'all' || dashFilterOperator !== 'all' || dashFilterMachine !== 'all')) return;

      let machineNames = Array.from(new Set(activeRecs.map(r => r.machine || 'เครื่องบรรจุ 1Kg No.1')));
      if (dashFilterMachine !== 'all') {
        machineNames = machineNames.filter(mName => mName === dashFilterMachine);
      }
      if (machineNames.length === 0 && activeRecs.length === 0) return;

      const recCount = activeRecs.length || 1;
      const planTimeVal = activeRecs.reduce((acc, r) => acc + (r.shiftType === '12h' ? 720 : 480), 0) || (recCount * 480);
      const bdVal = activeRecs.reduce((acc, r) => acc + (r.breakdownMin ?? 0), 0);
      const runTimeVal = Math.max(0, planTimeVal - bdVal);
      const mePct = planTimeVal > 0 ? (runTimeVal / planTimeVal) * 100 : 100;
      const speedStdVal = 34.67;
      const speedSetVal = 45.00;
      const goodVal = activeRecs.reduce((acc, r) => acc + (r.goodKg ?? 0), 0) || (recCount * 1250);
      const rejectVal = activeRecs.reduce((acc, r) => acc + (r.rejectKg ?? 0), 0) || Math.round(goodVal * 0.002);
      const actionVal = activeRecs.reduce((acc, r) => acc + (r.actualKg ?? (r.goodKg || 0) + (r.rejectKg || 0)), 0) || (goodVal + rejectVal);
      const targetVal = activeRecs.reduce((acc, r) => acc + (r.targetKg ?? 15000), 0) || (speedStdVal * runTimeVal);
      const qualPct = actionVal > 0 ? (goodVal / actionVal) * 100 : 100;
      const speedActVal = activeRecs.length > 0 ? activeRecs.reduce((acc, r) => acc + (r.speed || 38), 0) / activeRecs.length : 39.40;
      const perfPct = speedSetVal > 0 ? (speedActVal / speedSetVal) * 100 : 100;
      const oeePct = (mePct * perfPct * qualPct) / 10000;

      totalPlanTime += planTimeVal;
      totalRunTime += runTimeVal;
      totalBd += bdVal;
      totalTarget += targetVal;
      totalAction += actionVal;
      totalGood += goodVal;
      totalReject += rejectVal;
      sumOee += oeePct;
      sumPerf += perfPct;
      sumMe += mePct;
      sumQual += qualPct;
      rowCount += 1;

      // Operator summary row
      exportRows.push({
        'Operator / Machine': opName,
        'OEE %': `${oeePct.toFixed(2)}%`,
        'Perf %': `${perfPct.toFixed(2)}%`,
        'Speed Std.': speedStdVal.toFixed(2),
        'Speed Set': speedSetVal.toFixed(2),
        'Speed Act.': speedActVal.toFixed(2),
        'Target (kg)': Math.round(targetVal),
        'Actual (kg)': Math.round(actionVal),
        'Good (kg)': Math.round(goodVal),
        'Reject (kg)': Math.round(rejectVal),
        'ME %': `${mePct.toFixed(2)}%`,
        'Quality %': `${qualPct.toFixed(2)}%`,
        'Plan Time': planTimeVal,
        'Run Time': runTimeVal,
        'BD (Min)': bdVal
      });

      // Machine sub-rows
      machineNames.forEach(mName => {
        const subRecs = activeRecs.filter(r => r.machine === mName);
        const subCount = subRecs.length || 1;
        const subPlan = subRecs.reduce((acc, r) => acc + (r.shiftType === '12h' ? 720 : 480), 0) || (subCount * 409);
        const subBd = subRecs.reduce((acc, r) => acc + (r.breakdownMin ?? 0), 0);
        const subRun = Math.max(0, subPlan - subBd);
        const subMe = subPlan > 0 ? (subRun / subPlan) * 100 : 100;
        const subGood = subRecs.reduce((acc, r) => acc + (r.goodKg ?? 0), 0) || (subCount * 1100);
        const subReject = subRecs.reduce((acc, r) => acc + (r.rejectKg ?? 0), 0) || Math.round(subGood * 0.002);
        const subAction = subRecs.reduce((acc, r) => acc + (r.actualKg ?? (r.goodKg || 0) + (r.rejectKg || 0)), 0) || (subGood + subReject);
        const subTarget = subRecs.reduce((acc, r) => acc + (r.targetKg ?? 4000), 0) || (35.00 * subRun);
        const subQual = subAction > 0 ? (subGood / subAction) * 100 : 100;
        const subSpeedAct = subRecs.length > 0 ? subRecs.reduce((acc, r) => acc + (r.speed || 40), 0) / subRecs.length : 42.00;
        const subPerf = 50 > 0 ? (subSpeedAct / 50.00) * 100 : 100;
        const subOee = (subMe * subPerf * subQual) / 10000;

        exportRows.push({
          'Operator / Machine': `  - ${mName}`,
          'OEE %': `${subOee.toFixed(2)}%`,
          'Perf %': `${subPerf.toFixed(2)}%`,
          'Speed Std.': '35.00',
          'Speed Set': '50.00',
          'Speed Act.': subSpeedAct.toFixed(2),
          'Target (kg)': Math.round(subTarget),
          'Actual (kg)': Math.round(subAction),
          'Good (kg)': Math.round(subGood),
          'Reject (kg)': Math.round(subReject),
          'ME %': `${subMe.toFixed(2)}%`,
          'Quality %': `${subQual.toFixed(2)}%`,
          'Plan Time': subPlan,
          'Run Time': subRun,
          'BD (Min)': subBd
        });
      });
    });

    const avgOee = rowCount > 0 ? sumOee / rowCount : 92.45;
    const avgPerf = rowCount > 0 ? sumPerf / rowCount : 93.80;
    const avgMe = rowCount > 0 ? sumMe / rowCount : 100.00;
    const avgQual = rowCount > 0 ? sumQual / rowCount : 99.05;

    // Total / Average row
    exportRows.push({
      'Operator / Machine': 'Total / Average',
      'OEE %': `${avgOee.toFixed(2)}%`,
      'Perf %': `${avgPerf.toFixed(2)}%`,
      'Speed Std.': '34.67',
      'Speed Set': '45.00',
      'Speed Act.': '39.40',
      'Target (kg)': Math.round(totalTarget),
      'Actual (kg)': Math.round(totalAction),
      'Good (kg)': Math.round(totalGood),
      'Reject (kg)': Math.round(totalReject),
      'ME %': `${avgMe.toFixed(2)}%`,
      'Quality %': `${avgQual.toFixed(2)}%`,
      'Plan Time': totalPlanTime,
      'Run Time': totalRunTime,
      'BD (Min)': totalBd
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DashboardPerformance");
    XLSX.writeFile(wb, `OEE_Dashboard_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('ส่งออก Excel แดชบอร์ดสำเร็จ ✔');
  };

  // Dashboard chart effect
  useEffect(() => {
    if (currentView !== 'dashboard') return;
    const m = MACHINES.find(item => item.id === selectedMachine);
    if (!m) return;

    const recs = records
      .filter(r => r.machine === m.name)
      .slice()
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
      .slice(-30);

    if (recs.length === 0) return;

    const labels = recs.map(r => {
      const d = new Date(r.datetime);
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    });
    const speeds = recs.map(r => r.speed);
    const gridColor = '#e2e8f0';
    const textColor = '#334155';

    if (speedChartInstance.current) speedChartInstance.current.destroy();
    if (tempChartInstance.current) tempChartInstance.current.destroy();

    if (speedChartRef.current) {
      speedChartInstance.current = new Chart(speedChartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Speed (bag/min)',
            data: speeds,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            tension: 0.35,
            fill: true,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: textColor, font: { weight: 'bold' } }, grid: { display: false } },
            y: { ticks: { color: textColor, font: { weight: 'bold' } }, grid: { color: gridColor } }
          }
        }
      });
    }

    if (tempChartRef.current) {
      tempChartInstance.current = new Chart(tempChartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'ซีลหน้า/บน', data: recs.map(r => r.tempFront), borderColor: '#ef4444', tension: 0.25 },
            { label: 'ซีลหลัง/ล่าง', data: recs.map(r => r.tempBack), borderColor: '#3b82f6', tension: 0.25 },
            { label: 'ซีลกลาง', data: recs.map(r => r.tempMid), borderColor: '#10b981', tension: 0.25 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: textColor, font: { weight: 'bold' } }, grid: { display: false } },
            y: { ticks: { color: textColor, font: { weight: 'bold' } }, grid: { color: gridColor } }
          }
        }
      });
    }

    return () => {
      if (speedChartInstance.current) speedChartInstance.current.destroy();
      if (tempChartInstance.current) tempChartInstance.current.destroy();
    };
  }, [currentView, selectedMachine, records]);

  const todayRecords = records.filter(r => isToday(r.datetime));
  const passToday = todayRecords.filter(recordOk).length;
  const failToday = todayRecords.length - passToday;
  const passRateToday = todayRecords.length ? Math.round((passToday / todayRecords.length) * 100) : 100;

  const filteredHistory = records.filter(r => {
    if (filterDate && (!r.datetime || !r.datetime.startsWith(filterDate))) return false;
    if (filterMachine !== 'all') {
      const m = MACHINES.find(item => item.id === Number(filterMachine));
      if (m && r.machine !== m.name) return false;
    }
    const ok = recordOk(r);
    if (filterResult === 'pass' && !ok) return false;
    if (filterResult === 'fail' && ok) return false;
    return true;
  });

  const activeMachineObj = MACHINES.find(m => m.id === selectedMachine) || MACHINES[0];
  const dashMachineRecords = records.filter(r => r.machine === activeMachineObj.name);
  const dashLatestRecord = dashMachineRecords.length > 0 ? dashMachineRecords[0] : null;
  const dashMachineHealth = !dashLatestRecord ? 'unknown' : recordOk(dashLatestRecord) ? 'good' : 'bad';
  const totalMachineRecs = dashMachineRecords.length;
  const passedMachineRecs = dashMachineRecords.filter(recordOk).length;
  const qualityRate = totalMachineRecs > 0 ? Math.round((passedMachineRecs / totalMachineRecs) * 100) : 95;
  const avgSpeed = totalMachineRecs > 0 ? Math.round(dashMachineRecords.reduce((acc, r) => acc + r.speed, 0) / totalMachineRecs) : 48;
  const performanceRate = Math.min(100, Math.round((avgSpeed / 50) * 100));
  const availabilityRate = 92;
  const oeeScore = Math.round((availabilityRate * performanceRate * qualityRate) / 10000);

  // Clean Light Mode Palette
  const appBg = 'bg-slate-50 text-slate-900';
  const navbarBg = 'bg-white/95 border-slate-200 shadow-md';
  const cardBg = 'bg-white border-slate-200 shadow-xl';
  const subCardBg = 'bg-slate-100/90 border-slate-200 text-slate-900';
  const inputBg = 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600';
  const textMuted = 'text-slate-500';
  const navDockBg = 'bg-slate-200 border-slate-300';

  return (
    <div className={`min-h-screen ${appBg} font-sans relative overflow-x-hidden transition-colors duration-300`}>
      {/* Ambient Vibrant Glow Effects */}
      <div className="fixed -top-45 -right-30 w-125 h-125 rounded-full blur-[140px] pointer-events-none z-0 opacity-25 bg-blue-400"></div>
      <div className="fixed -bottom-45 -left-30 w-125 h-125 rounded-full blur-[140px] pointer-events-none z-0 opacity-25 bg-indigo-400"></div>

      <div className="max-w-7xl mx-auto min-h-screen flex flex-col pb-24 md:pb-10 relative z-10">
        {/* Main Header Navbar - Adjusted Font */}
        <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${navbarBg}`}>
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 md:w-14 md:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/35 ring-4 ring-blue-400/30">
                <Factory className="w-7 h-7 md:w-8 md:h-8 animate-pulse text-white" />
              </div>
              <div>
                <h1 className="text-base md:text-xl font-black tracking-tight font-display text-slate-900 flex items-center gap-1.5">
                  SMART PACKING <span className="text-blue-600 font-black">PRO</span>
                </h1>
                <p className="text-[11px] font-bold text-slate-500">Sugar Packaging Machine OEE & Inspection Controller</p>
              </div>
            </div>

            {/* Desktop Navigation Dock */}
            <nav className={`hidden md:flex p-1 rounded-xl border gap-1 shadow-inner ${navDockBg}`}>
              <button
                onClick={() => setCurrentView('form')}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-black transition-all ${currentView === 'form' ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm scale-105' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
              >
                <ClipboardEdit className="w-3.5 h-3.5 text-blue-600" /> บันทึก Seal Temp
              </button>
              <button
                onClick={() => setCurrentView('oee')}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-black transition-all ${currentView === 'oee' ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm scale-105' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> บันทึก OEE
              </button>
              <button
                onClick={() => setCurrentView('film')}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-black transition-all ${currentView === 'film' ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm scale-105' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
              >
                <svg className="w-3.5 h-3.5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><line x1="12" y1="3" x2="12" y2="8.5"/></svg> บันทึกม้วนฟิล์ม
              </button>
              <button
                onClick={() => setCurrentView('historyHub')}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-black transition-all ${['historyHub', 'historySeal', 'historyOee', 'historyFilm'].includes(currentView) ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm scale-105' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
              >
                <Clock className="w-3.5 h-3.5 text-blue-500" /> ประวัติ
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-black transition-all ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm scale-105' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
              >
                <Award className="w-3.5 h-3.5 text-indigo-500" /> แดชบอร์ด
              </button>
            </nav>

          </div>
        </header>

        {/* =========================================================
            VIEW 1: SMART DATA ENTRY FORM
           ========================================================= */}
        {currentView === 'form' && (
          <motion.main
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 p-4 md:p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-black flex items-center gap-2 font-display text-slate-900">
                  <span className="flex items-center gap-1.5 text-blue-600 text-base md:text-lg"><Wrench className="w-5 h-5" /> บันทึกพารามิเตอร์ —</span>
                  <span className="px-3 py-1 rounded-xl text-white shadow-md text-sm md:text-base flex items-center gap-1.5" style={{ backgroundColor: activeMachineObj.color }}>
                    {activeMachineObj.name}
                  </span>
                </h2>
              </div>
              <div className="font-mono text-xs px-3 py-1.5 rounded-xl border flex items-center gap-2 bg-white border-slate-300 font-bold text-slate-700 shadow-sm">
                <span>🕒 {clockString}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Shift & Operator & Machine Selector */}
              <div className={`backdrop-blur-xl border rounded-2xl p-3 flex flex-col gap-2.5 ${cardBg}`}>
                <div className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5 font-display">
                  <UserCheck className="w-4 h-4 text-blue-600" /> Shift & Operator Selection
                </div>

                {/* Smaller Machine Selection Cards */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-black flex items-center gap-1.5 ${textMuted}`}>
                    <Factory className="w-3.5 h-3.5 text-blue-600" /> เลือกเครื่องจักร (Machine) <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {MACHINES.map(m => {
                      const isSelected = selectedMachine === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMachine(m.id)}
                          style={{
                            borderColor: isSelected ? m.color : undefined,
                            backgroundColor: isSelected ? `${m.color}15` : undefined,
                            color: isSelected ? m.color : undefined
                          }}
                          className={`group relative flex items-center justify-center p-2.5 rounded-xl border text-center transition-all overflow-hidden ${isSelected ? 'shadow-md ring-2 ring-offset-1 scale-[1.02] font-black' : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-white text-slate-800'}`}
                        >
                          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: m.color }}></div>
                          <div className="text-xs font-black font-display tracking-tight">No.{m.id}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Shift Selector: Larger, Color-Coded A, B, C */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-black flex items-center gap-1.5 ${textMuted}`}>
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> กะการทำงาน (Shift)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 border rounded-xl bg-slate-100 border-slate-300">
                    {[
                      { key: 'A', label: 'กะ A', color: 'from-blue-600 to-indigo-600' },
                      { key: 'B', label: 'กะ B', color: 'from-amber-500 to-orange-600' },
                      { key: 'C', label: 'กะ C', color: 'from-emerald-600 to-teal-600' }
                    ].map(sh => (
                      <button
                        key={sh.key}
                        type="button"
                        onClick={() => setShift(sh.key)}
                        className={`py-2 rounded-lg text-xs md:text-sm font-black font-display transition-all shadow-sm ${shift === sh.key ? `bg-gradient-to-r ${sh.color} text-white ring-2 ring-offset-1 ring-blue-400 scale-105` : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'}`}
                      >
                        {sh.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shift Hours Type Selector (Side-by-side separate colors) */}
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShiftType('8h')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold font-display transition-all shadow-xs ${shiftType === '8h' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white ring-1 ring-blue-400 scale-[1.01]' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'}`}
                  >
                    🛡️ กะ 8 ชม. (จ-พฤ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShiftType('12h')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold font-display transition-all shadow-xs ${shiftType === '12h' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white ring-1 ring-purple-400 scale-[1.01]' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'}`}
                  >
                    ⭐ กะ 12 ชม. (ศ-อา)
                  </button>
                </div>

                {/* Inspector Selector (Compact Dropdown) */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-black flex items-center gap-1.5 ${textMuted}`}>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> ผู้ตรวจสอบ (Operator) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <UserCheck className="absolute left-3.5 top-3 w-4 h-4 text-blue-600 pointer-events-none" />
                    <select
                      value={operator}
                      onChange={e => setOperator(e.target.value)}
                      required
                      className={`w-full border rounded-xl py-2.5 pl-10 pr-3 text-xs md:text-sm font-black ${inputBg}`}
                    >
                      <option value="">-- กรุณาเลือกรายชื่อผู้ตรวจสอบ --</option>
                      {INSPECTORS.map(ins => (
                        <option key={ins.name} value={ins.name}>
                          {ins.emoji} {ins.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Speed input */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-black flex items-center gap-1.5 ${textMuted}`}>
                    <Gauge className="w-3.5 h-3.5 text-blue-600" /> ความเร็วบรรจุ Speed (bag/min) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Gauge className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="number"
                      step="0.1"
                      value={speed}
                      onChange={e => setSpeed(e.target.value)}
                      placeholder="ระบุตัวเลขความเร็ว"
                      required
                      className={`w-full border rounded-xl py-2.5 pl-10 pr-3 text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono ${inputBg}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-500 font-mono font-bold">
                    <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                      <span className="text-slate-500 font-black">Std.:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={customSpeedSpecs[selectedMachine]?.std ?? 34.67}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setCustomSpeedSpecs(prev => ({
                            ...prev,
                            [selectedMachine]: { ...(prev[selectedMachine] || { std: 34.67, set: 45.00 }), std: val }
                          }));
                        }}
                        className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                      <span className="text-slate-500 font-black">Set:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={customSpeedSpecs[selectedMachine]?.set ?? 45.00}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setCustomSpeedSpecs(prev => ({
                            ...prev,
                            [selectedMachine]: { ...(prev[selectedMachine] || { std: 34.67, set: 45.00 }), set: val }
                          }));
                        }}
                        className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Thermal & Time Parameters */}
              <div className={`lg:col-span-2 backdrop-blur-xl border rounded-2xl p-3 flex flex-col gap-2.5 ${cardBg}`}>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5 font-display">
                    <Thermometer className="w-4 h-4 text-amber-500" /> TEMP. & Time Parameters
                  </div>
                </div>

                {selectedMachine === 1 && (
                  <div className={`border p-3 rounded-xl ${subCardBg}`}>
                    <label className="text-xs font-black text-blue-700 block mb-1.5 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-600" /> เลือกลักษณะสเปคอุณหภูมิ No.1
                    </label>
                    <select
                      value={no1Group}
                      onChange={e => setNo1Group(e.target.value as any)}
                      className={`w-full border rounded-lg py-2 px-3 text-xs font-black ${inputBg}`}
                    >
                      <option value="group1">กลุ่ม 1 (มาตรฐาน: 175-210 / 175-210)</option>
                      <option value="group2">กลุ่ม 2 (ความร้อนสูง: 170-190 / 170-185)</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Front/Top Temp */}
                  <div className={`border p-3.5 rounded-2xl flex flex-col gap-2 ${subCardBg}`}>
                    <div className="flex items-center justify-between text-xs font-black text-slate-900">
                      <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-rose-500" /> {selectedMachine === 1 || selectedMachine === 2 ? 'ซีลบน (°C)' : 'ซีลหน้า (°C)'} <span className="text-rose-600">*</span></span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${tfStatus === 'pass' ? 'bg-emerald-500/20 text-emerald-800 font-black' : tfStatus === 'fail' ? 'bg-rose-500/20 text-rose-800 font-black' : 'bg-slate-200 text-slate-700'}`}>
                        {tfStatus === 'pass' ? `✔ ปกติ` : tfStatus === 'fail' ? `✘ หลุด` : '—'}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={tempFront}
                      onChange={e => setTempFront(e.target.value)}
                      placeholder="ป้อนค่าอุณหภูมิ"
                      required
                      className={`w-full border rounded-xl py-2 px-3 text-sm font-black font-mono focus:outline-none ${inputBg}`}
                    />
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-500 font-mono font-bold">
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                        <span className="text-slate-500 font-black">Min:</span>
                        <input
                          type="number"
                          value={limits.tempFront[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempFront: [val, prev.tempFront[1]] }));
                          }}
                          className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                        <span className="text-slate-500 font-black">Max:</span>
                        <input
                          type="number"
                          value={limits.tempFront[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempFront: [prev.tempFront[0], val] }));
                          }}
                          className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Back/Bot Temp */}
                  <div className={`border p-3.5 rounded-2xl flex flex-col gap-2 ${subCardBg}`}>
                    <div className="flex items-center justify-between text-xs font-black text-slate-900">
                      <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-blue-500" /> {selectedMachine === 1 || selectedMachine === 2 ? 'ซีลล่าง (°C)' : 'ซีลหลัง (°C)'} <span className="text-rose-600">*</span></span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${tbStatus === 'pass' ? 'bg-emerald-500/20 text-emerald-800 font-black' : tbStatus === 'fail' ? 'bg-rose-500/20 text-rose-800 font-black' : 'bg-slate-200 text-slate-700'}`}>
                        {tbStatus === 'pass' ? `✔ ปกติ` : tbStatus === 'fail' ? `✘ หลุด` : '—'}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={tempBack}
                      onChange={e => setTempBack(e.target.value)}
                      placeholder="ป้อนค่าอุณหภูมิ"
                      required
                      className={`w-full border rounded-xl py-2 px-3 text-sm font-black font-mono focus:outline-none ${inputBg}`}
                    />
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-500 font-mono font-bold">
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                        <span className="text-slate-500 font-black">Min:</span>
                        <input
                          type="number"
                          value={limits.tempBack[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempBack: [val, prev.tempBack[1]] }));
                          }}
                          className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                        <span className="text-slate-500 font-black">Max:</span>
                        <input
                          type="number"
                          value={limits.tempBack[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempBack: [prev.tempBack[0], val] }));
                          }}
                          className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mid Temp */}
                  <div className={`border p-3.5 rounded-2xl flex flex-col gap-2 ${subCardBg}`}>
                    <div className="flex items-center justify-between text-xs font-black text-slate-900">
                      <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-emerald-500" /> ซีลกลาง (°C) <span className="text-rose-600">*</span></span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${tmStatus === 'pass' ? 'bg-emerald-500/20 text-emerald-800 font-black' : tmStatus === 'fail' ? 'bg-rose-500/20 text-rose-800 font-black' : 'bg-slate-200 text-slate-700'}`}>
                        {tmStatus === 'pass' ? `✔ ปกติ` : tmStatus === 'fail' ? `✘ หลุด` : '—'}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={tempMid}
                      onChange={e => setTempMid(e.target.value)}
                      placeholder="ป้อนค่าอุณหภูมิ"
                      required
                      className={`w-full border rounded-xl py-2 px-3 text-sm font-black font-mono focus:outline-none ${inputBg}`}
                    />
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-500 font-mono font-bold">
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                        <span className="text-slate-500 font-black">Min:</span>
                        <input
                          type="number"
                          value={limits.tempMid[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempMid: [val, prev.tempMid[1]] }));
                          }}
                          className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                        <span className="text-slate-500 font-black">Max:</span>
                        <input
                          type="number"
                          value={limits.tempMid[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempMid: [prev.tempMid[0], val] }));
                          }}
                          className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dwell Time Front/Back (Machines 3-7) */}
                  {selectedMachine > 2 && (
                    <div className={`border p-3.5 rounded-2xl flex flex-col gap-2 ${subCardBg}`}>
                      <div className="flex items-center justify-between text-xs font-black text-slate-900">
                        <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-blue-600" /> แช่จอหน้า-หลัง (ms) <span className="text-rose-600">*</span></span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${timeFbStatus === 'pass' ? 'bg-emerald-500/20 text-emerald-800 font-black' : timeFbStatus === 'fail' ? 'bg-rose-500/20 text-rose-800 font-black' : 'bg-slate-200 text-slate-700'}`}>
                          {timeFbStatus === 'pass' ? '✔ ปกติ' : timeFbStatus === 'fail' ? '✘ หลุด' : '—'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={timeFrontBack}
                        onChange={e => setTimeFrontBack(e.target.value)}
                        placeholder="เช่น 120-360"
                        required
                        className={`w-full border rounded-xl py-2 px-3 text-sm font-black font-mono focus:outline-none ${inputBg}`}
                      />
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-500 font-mono font-bold">
                        <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                          <span className="text-slate-500 font-black">Min:</span>
                          <input
                            type="number"
                            value={limits.timeFrontBack?.[0] || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setLimits(prev => ({ ...prev, timeFrontBack: [val, prev.timeFrontBack?.[1] || 0] }));
                            }}
                            className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                          <span className="text-slate-500 font-black">Max:</span>
                          <input
                            type="number"
                            value={limits.timeFrontBack?.[1] || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setLimits(prev => ({ ...prev, timeFrontBack: [prev.timeFrontBack?.[0] || 0, val] }));
                            }}
                            className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dwell Time Mid (Machines 3-7) */}
                  {selectedMachine > 2 && (
                    <div className={`border p-3.5 rounded-2xl flex flex-col gap-2 ${subCardBg}`}>
                      <div className="flex items-center justify-between text-xs font-black text-slate-900">
                        <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-blue-600" /> แช่จอกลาง (ms) <span className="text-rose-600">*</span></span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${timeMStatus === 'pass' ? 'bg-emerald-500/20 text-emerald-800 font-black' : timeMStatus === 'fail' ? 'bg-rose-500/20 text-rose-800 font-black' : 'bg-slate-200 text-slate-700'}`}>
                          {timeMStatus === 'pass' ? '✔ ปกติ' : timeMStatus === 'fail' ? '✘ หลุด' : '—'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={timeMid}
                        onChange={e => setTimeMid(e.target.value)}
                        placeholder="เช่น 120-360"
                        required
                        className={`w-full border rounded-xl py-2 px-3 text-sm font-black font-mono focus:outline-none ${inputBg}`}
                      />
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-500 font-mono font-bold">
                        <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                          <span className="text-slate-500 font-black">Min:</span>
                          <input
                            type="number"
                            value={limits.timeMid?.[0] || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setLimits(prev => ({ ...prev, timeMid: [val, prev.timeMid?.[1] || 0] }));
                            }}
                            className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                          <span className="text-slate-500 font-black">Max:</span>
                          <input
                            type="number"
                            value={limits.timeMid?.[1] || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setLimits(prev => ({ ...prev, timeMid: [prev.timeMid?.[0] || 0, val] }));
                            }}
                            className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* QC Checklist */}
                <div className="mt-1">
                  <div className="text-xs font-black text-blue-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-display">
                    <ListCheck className="w-4 h-4 text-blue-600" /> Quality & Package Verification <span className="text-rose-600">*</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {[
                      { key: 'lot', label: '🏷️ Lot No.' },
                      { key: 'teflon', label: '🛠️ เทปล่อน' },
                      { key: 'packSealTop', label: '📦 Seal (บน)' },
                      { key: 'packSealMid', label: '📦 Seal (กลาง)' },
                      { key: 'packSealBot', label: '📦 Seal (ล่าง)' },
                      { key: 'hole', label: '🎯 ตำแหน่งรูเข็ม' }
                    ].map(item => {
                      const val = (qc as any)[item.key];
                      return (
                        <div key={item.key} className={`border p-3 rounded-2xl flex flex-col gap-2 ${subCardBg}`}>
                          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-blue-600" /> {item.label} <span className="text-rose-600">*</span></span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setQc({ ...qc, [item.key]: val === 'pass' ? null : 'pass' })}
                              className={`py-2 px-3 rounded-xl text-xs md:text-sm font-black transition-all shadow-sm ${val === 'pass' ? 'bg-emerald-600 text-white ring-2 ring-offset-1 ring-emerald-400 scale-[1.02]' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`}
                            >
                              ✔ ผ่าน
                            </button>
                            <button
                              type="button"
                              onClick={() => setQc({ ...qc, [item.key]: val === 'fail' ? null : 'fail' })}
                              className={`py-2 px-3 rounded-xl text-xs md:text-sm font-black transition-all shadow-sm ${val === 'fail' ? 'bg-rose-600 text-white ring-2 ring-offset-1 ring-rose-400 scale-[1.02]' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`}
                            >
                              ✘ ไม่ผ่าน
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>



                {/* Notes */}
                <div>
                  <label className={`text-xs font-black block mb-1.5 ${textMuted}`}>📝 ข้อสังเกต / อาการผิดปกติ (Notes)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="ใส่รายละเอียดเพิ่มเติมหากพบความผิดปกติ..."
                    className={`w-full border rounded-xl p-2.5 text-xs font-semibold focus:outline-none ${inputBg}`}
                  ></textarea>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSpeed('');
                      setTempFront('');
                      setTempBack('');
                      setTempMid('');
                      setTimeFrontBack('');
                      setTimeMid('');
                      setQc({ lot: null, teflon: null, packSealTop: null, packSealMid: null, packSealBot: null, hole: null });
                      setTargetKg('');
                      setActualKg('');
                      setGoodKg('');
                      setRejectKg('');
                      setNotes('');
                      showToast('ล้างค่าฟอร์มแล้ว');
                    }}
                    className="px-5 py-2.5 rounded-xl border font-black text-xs flex items-center gap-1.5 transition-all border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-600" /> ล้างค่า
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all ring-2 ring-blue-400/50"
                  >
                    <Save className="w-3.5 h-3.5" /> บันทึกข้อมูล
                  </button>
                </div>
              </div>
            </form>
          </motion.main>
        )}

        {/* =========================================================
            VIEW 2: OEE RECORDING VIEW (บันทึก OEE)
           ========================================================= */}
        {currentView === 'oee' && (
          <motion.main
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 p-4 md:p-6"
          >
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg md:text-xl font-black flex items-center gap-2 font-display text-slate-900">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600" /> บันทึกข้อมูล OEE และการผลิต (OEE Production Records)
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold">บันทึกค่า Target, Actual, Good, Reject และ Breakdown Time แยกตามกะและเครื่องจักร</p>
                </div>
              </div>

              {/* Unified OEE Card Group */}
              <form onSubmit={handleOeeSubmit} className={`backdrop-blur-xl border rounded-3xl p-6 shadow-2xl space-y-6 ${cardBg}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5 flex items-center gap-1.5">
                      <Factory className="w-4 h-4 text-blue-600" /> เลือกเครื่องจักร (Machine)
                    </label>
                    <select
                      value={selectedMachine}
                      onChange={e => setSelectedMachine(Number(e.target.value))}
                      className={`w-full border rounded-xl py-3 px-3 text-sm font-black ${inputBg}`}
                    >
                      {MACHINES.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" /> กะการทำงาน (Shift)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 border rounded-xl bg-slate-100 border-slate-300">
                      {[
                        { key: 'A', label: 'กะ A', color: 'from-blue-600 to-indigo-600' },
                        { key: 'B', label: 'กะ B', color: 'from-amber-500 to-orange-600' },
                        { key: 'C', label: 'กะ C', color: 'from-emerald-600 to-teal-600' }
                      ].map(sh => (
                        <button
                          key={sh.key}
                          type="button"
                          onClick={() => setShift(sh.key)}
                          className={`py-2 rounded-lg text-xs md:text-sm font-black font-display transition-all shadow-sm ${shift === sh.key ? `bg-gradient-to-r ${sh.color} text-white ring-2 ring-offset-1 ring-blue-400 scale-105` : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'}`}
                        >
                          {sh.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Shift Hours Type Selector (กะปกติ 8 ชม. / กะยาว 12 ชม.) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-600" /> ประเภทกะการทำงาน (Shift Duration Type)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShiftType('8h')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black font-display transition-all shadow-sm ${shiftType === '8h' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white ring-2 ring-offset-1 ring-blue-400 scale-[1.02]' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'}`}
                    >
                      🛡️ กะปกติ 8 ชม. (จ-พฤ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShiftType('12h')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black font-display transition-all shadow-sm ${shiftType === '12h' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white ring-2 ring-offset-1 ring-purple-400 scale-[1.02]' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'}`}
                    >
                      ⭐ กะยาว 12 ชม. (ศ-อา)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" /> ผู้บันทึก (Operator) <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={operator}
                    onChange={e => setOperator(e.target.value)}
                    required
                    className={`w-full border rounded-xl py-3 px-3 text-sm font-black ${inputBg}`}
                  >
                    <option value="">-- เลือกผู้บันทึก --</option>
                    {INSPECTORS.map(ins => (
                      <option key={ins.name} value={ins.name}>{ins.emoji} {ins.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-blue-600" /> รายงานประจำ วันที่ (Report Date) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={e => setReportDate(e.target.value)}
                    required
                    className={`w-full border rounded-xl py-3 px-3 text-sm font-black font-mono ${inputBg}`}
                  />
                </div>

              {/* 3 Distinct Cards Layout for Availability, Performance, Quality */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Availability Card */}
                <div className={`backdrop-blur-xl border rounded-3xl p-5 shadow-xl space-y-4 ${cardBg} border-t-4 border-t-blue-600`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-blue-900 font-display flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" /> Availability
                    </h3>
                    <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                      {shiftType === '12h' ? 'กะ 12 ชม.' : 'กะ 8 ชม.'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-50 border border-slate-300 rounded-2xl p-3 shadow-xs">
                      <label className="text-[11px] font-black text-slate-600 block mb-1 flex items-center gap-1.5">
                        <span>📅 Plan Time <span className="text-rose-600">*</span></span>
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={planTime}
                        onChange={e => setPlanTime(e.target.value)}
                        placeholder="480"
                        required
                        className="w-full text-sm font-mono font-black text-slate-900 bg-white border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="bg-slate-50 border border-slate-300 rounded-2xl p-3 shadow-xs">
                      <label className="text-[11px] font-black text-slate-600 block mb-1 flex items-center gap-1.5">
                        <span>⏳ Run Time <span className="text-rose-600">*</span></span>
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={runTime}
                        onChange={e => setRunTime(e.target.value)}
                        placeholder="480"
                        required
                        className="w-full text-sm font-mono font-black text-emerald-700 bg-white border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3 shadow-xs">
                      <label className="text-[11px] font-black text-amber-900 block mb-1 flex items-center gap-1.5">
                        <span>🔧 BD (Min) <span className="text-rose-600">*</span></span>
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={breakdownMin}
                        onChange={e => setBreakdownMin(e.target.value)}
                        placeholder="0"
                        required
                        className="w-full text-sm font-mono font-black text-amber-800 bg-white border border-amber-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Performance Card */}
                <div className={`backdrop-blur-xl border rounded-3xl p-5 shadow-xl space-y-4 ${cardBg} border-t-4 border-t-purple-600`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-purple-900 font-display flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-purple-600" /> Performance
                    </h3>
                    <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-bold">
                      Speed
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-50 border border-slate-300 rounded-2xl p-3 shadow-xs">
                      <label className="text-[11px] font-black text-slate-600 block mb-1 flex items-center gap-1.5">
                        <span>⚙️ Speed Std. <span className="text-rose-600">*</span></span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={speedStd}
                        onChange={e => setSpeedStd(e.target.value)}
                        placeholder="34.67"
                        required
                        className="w-full text-sm font-mono font-black text-slate-900 bg-white border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="bg-slate-50 border border-slate-300 rounded-2xl p-3 shadow-xs">
                      <label className="text-[11px] font-black text-slate-600 block mb-1 flex items-center gap-1.5">
                        <span>🚀 Speed Set <span className="text-rose-600">*</span></span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={speedSet}
                        onChange={e => setSpeedSet(e.target.value)}
                        placeholder="45.00"
                        required
                        className="w-full text-sm font-mono font-black text-indigo-700 bg-white border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-3 shadow-xs">
                      <label className="text-[11px] font-black text-blue-900 block mb-1 flex items-center gap-1.5">
                        <span>⚡ Speed Act. <span className="text-rose-600">*</span></span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={speed}
                        onChange={e => setSpeed(e.target.value)}
                        placeholder="0.0"
                        required
                        className="w-full text-sm font-mono font-black text-blue-800 bg-white border border-blue-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Quality Card */}
                <div className={`backdrop-blur-xl border rounded-3xl p-5 shadow-xl space-y-4 ${cardBg} border-t-4 border-t-emerald-600`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-emerald-900 font-display flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Quality
                    </h3>
                    <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">
                      Output (kg)
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 shadow-xs">
                      <label className="text-[10px] font-black text-slate-700 block mb-1">🎯 Target (kg) <span className="text-rose-600">*</span></label>
                      <input
                        type="number"
                        step="0.1"
                        value={targetKg}
                        onChange={e => setTargetKg(e.target.value)}
                        placeholder="0"
                        required
                        className="w-full text-xs font-mono font-black text-slate-900 bg-white border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 shadow-xs">
                      <label className="text-[10px] font-black text-slate-700 block mb-1">📦 Actual (kg) <span className="text-rose-600">*</span></label>
                      <input
                        type="number"
                        step="0.1"
                        value={actualKg}
                        onChange={e => setActualKg(e.target.value)}
                        placeholder="0"
                        required
                        className="w-full text-xs font-mono font-black text-slate-900 bg-white border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 shadow-xs">
                      <label className="text-[10px] font-black text-emerald-900 block mb-1">✨ Good (kg) <span className="text-rose-600">*</span></label>
                      <input
                        type="number"
                        step="0.1"
                        value={goodKg}
                        onChange={e => setGoodKg(e.target.value)}
                        placeholder="0"
                        required
                        className="w-full text-xs font-mono font-black text-emerald-700 bg-white border border-emerald-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="bg-rose-50 border border-rose-300 rounded-xl p-2.5 shadow-xs">
                      <label className="text-[10px] font-black text-rose-900 block mb-1">⚠️ Reject (kg) <span className="text-rose-600">*</span></label>
                      <input
                        type="number"
                        step="0.1"
                        value={rejectKg}
                        onChange={e => setRejectKg(e.target.value)}
                        placeholder="0"
                        required
                        className="w-full text-xs font-mono font-black text-rose-700 bg-white border border-rose-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5">📝 หมายเหตุการผลิต / ปัญหาที่พบ</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="ระบุสาเหตุการหยุดทำงานหรือหมายเหตุ OEE..."
                    className={`w-full border rounded-xl p-3 text-xs font-semibold ${inputBg}`}
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all ring-2 ring-emerald-400/50"
                  >
                    <Save className="w-4 h-4" /> บันทึกข้อมูล
                  </button>
                </div>
              </form>
            </div>
          </motion.main>
        )}

        {/* =========================================================
            VIEW 3: FILM ROLL INSPECTION VIEW (บันทึกม้วนฟิล์ม)
           ========================================================= */}
        {currentView === 'film' && (
          <motion.main
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 p-4 md:p-6"
          >
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg md:text-xl font-black flex items-center gap-2 font-display text-slate-900">
                    <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><line x1="12" y1="3" x2="12" y2="8.5"/></svg> บันทึกการตรวจสอบม้วนฟิล์ม (Film Roll Inspection)
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold">ตรวจสอบคุณภาพ Lot ฟิล์ม ผู้ผลิต Supplier (TG / S&S) เวลาเปลี่ยน และรูปถ่ายป้าย Tag</p>
                </div>
              </div>

              <div className={`backdrop-blur-xl border rounded-3xl p-6 shadow-2xl space-y-6 ${cardBg}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5 flex items-center gap-1.5">
                      <Factory className="w-4 h-4 text-blue-600" /> เลือกเครื่อง (Machine)
                    </label>
                    <select
                      value={filmMachine}
                      onChange={e => setFilmMachine(Number(e.target.value))}
                      className={`w-full border rounded-xl py-3 px-3 text-sm font-black ${inputBg}`}
                    >
                      {MACHINES.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" /> ผู้บันทึก (Operator) <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={filmOperator}
                      onChange={e => setFilmOperator(e.target.value)}
                      required
                      className={`w-full border rounded-xl py-3 px-3 text-sm font-black ${inputBg}`}
                    >
                      <option value="">-- เลือกผู้บันทึก --</option>
                      {INSPECTORS.map(ins => (
                        <option key={ins.name} value={ins.name}>{ins.emoji} {ins.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" /> กะการทำงาน (Shift & Duration)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {['A', 'B', 'C'].map(sh => (
                        <button
                          key={sh}
                          type="button"
                          onClick={() => setFilmShift(sh)}
                          className={`py-2 rounded-xl text-xs font-black transition-all shadow-sm ${filmShift === sh ? 'bg-blue-600 text-white ring-2 ring-blue-400 scale-105' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                        >
                          กะ {sh}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFilmShiftType('8h')}
                        className={`py-2 rounded-xl text-[11px] font-black transition-all ${filmShiftType === '8h' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
                      >
                        กะปกติ 8 ชม.
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilmShiftType('12h')}
                        className={`py-2 rounded-xl text-[11px] font-black transition-all ${filmShiftType === '12h' ? 'bg-purple-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
                      >
                        กะยาว 12 ชม.
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-slate-700 block mb-1.5">🏭 เลือก Supplier (ผู้ผลิตฟิล์ม)</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['TG', 'S&S'].map(sup => (
                          <button
                            key={sup}
                            type="button"
                            onClick={() => setFilmSupplier(sup)}
                            className={`py-3 rounded-2xl text-sm font-black font-display transition-all shadow-sm ${filmSupplier === sup ? 'bg-purple-600 text-white ring-2 ring-purple-400 scale-[1.02]' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                          >
                            📦 {sup}
                          </button>
                        ))}
                      </div>
                    </div>



                    <div>
                      <label className="text-xs font-black text-slate-700 block mb-1.5">⏰ เวลาเปลี่ยนม้วนฟิล์ม (Change Time) <span className="text-rose-600">*</span></label>
                      <input
                        type="time"
                        value={filmChangeTime}
                        onChange={e => setFilmChangeTime(e.target.value)}
                        required
                        className={`w-full border rounded-xl py-2.5 px-3 text-sm font-black font-mono ${inputBg}`}
                      />
                    </div>
                  </div>
                </div>



                {/* Tag Photo Upload Section (Camera + Gallery / Native File Picker) */}
                <div className="border border-dashed border-purple-300 rounded-2xl p-4 bg-purple-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-purple-900 flex items-center gap-1.5 font-display">
                      <Camera className="w-4 h-4 text-purple-600" /> รูปป้าย tag ม้วนฟิล์ม (Film Roll Tag Photo) <span className="text-rose-600">*</span>
                    </label>
                    {filmTagPhoto && (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                        ✔ แนบรูปแล้ว
                      </span>
                    )}
                  </div>

                  {/* Hidden Inputs: Camera Capture & Native File/Gallery Picker */}
                  <input
                    ref={filmCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFilmPhotoSelect}
                    className="hidden"
                  />
                  <input
                    ref={filmGalleryInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFilmPhotoSelect}
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="grid grid-cols-2 gap-2.5 flex-1">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
                      >
                        <Camera className="w-4 h-4 shrink-0" />
                        <span>ถ่ายรูปจากกล้อง</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => filmGalleryInputRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-purple-100/70 text-purple-800 border border-purple-300 text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
                      >
                        <ImagePlus className="w-4 h-4 shrink-0 text-purple-600" />
                        <span>เลือกรูป / แนบไฟล์</span>
                      </button>
                    </div>

                    {filmTagPhoto && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-400 shadow-md shrink-0 self-center sm:self-auto bg-white">
                        <img src={filmTagPhoto} alt="Tag preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFilmTagPhoto(null)}
                          title="ลบรูปภาพ"
                          className="absolute top-0 right-0 bg-rose-600 hover:bg-rose-700 text-white text-[10px] w-5 h-5 flex items-center justify-center font-bold rounded-bl-lg"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Camera Modal */}
                {showCameraModal && (
                  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
                    <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl flex flex-col border border-slate-200">
                      <div className="bg-purple-900 text-white p-4 flex items-center justify-between">
                        <h3 className="text-sm font-black flex items-center gap-2">
                          <Camera className="w-5 h-5 text-purple-300" /> ถ่ายภาพป้าย Tag ม้วนฟิล์ม
                        </h3>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="text-white hover:text-rose-300 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center bg-white/10"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 bg-slate-50 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={captureSnapshot}
                          className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-xl flex items-center gap-2"
                        >
                          <Camera className="w-5 h-5" /> 📸 กดถ่ายภาพ
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-4 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  </div>
                )}



                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!filmOperator) {
                        showToast('กรุณาเลือกผู้บันทึก (Operator)');
                        return;
                      }
                      if (!filmChangeTime) {
                        showToast('กรุณาระบุเวลาเปลี่ยนม้วนฟิล์ม');
                        return;
                      }
                      if (!filmTagPhoto) {
                        showToast('กรุณาถ่ายหรือแนบรูปป้าย tag ม้วนฟิล์ม');
                        return;
                      }
                      const now = new Date();
                      const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

                      const mObj = MACHINES.find(m => m.id === filmMachine) || MACHINES[0];
                      const newFilmRec = {
                        id: Date.now(),
                        machine: mObj.name,
                        operator: filmOperator,
                        shift: filmShift,
                        shiftType: filmShiftType,
                        supplier: filmSupplier,
                        filmDate: formattedDate,
                        changeTime: filmChangeTime,
                        tagPhoto: filmTagPhoto,
                        datetime: new Date().toISOString()
                      };
                      setFilmRecords([newFilmRec, ...filmRecords]);
                      setFilmTagPhoto(null);
                      showToast('บันทึกตรวจสอบม้วนฟิล์มและซิงค์สำเร็จ ✔');

                      try {
                        await DatabaseService.submitFilmRollRecord(newFilmRec);
                      } catch (err) {
                        console.warn("Failed to sync film roll record to Google Sheet:", err);
                      }
                    }}
                    className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 transition-all ring-2 ring-purple-400/50"
                  >
                    <Save className="w-4 h-4" /> บันทึกตรวจสอบม้วนฟิล์ม
                  </button>
                </div>
              </div>
            </div>
          </motion.main>
        )}

        {/* =========================================================
            HISTORY HUB VIEW (ประวัติ - 3 Cards Selection)
           ========================================================= */}
        {currentView === 'historyHub' && (
          <motion.main
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 p-4 md:p-6"
          >
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-lg md:text-xl font-black flex items-center gap-2 font-display text-slate-900">
                  <Clock className="w-5 h-5 text-blue-600" /> ศูนย์รวมประวัติการบันทึกข้อมูล (History Hub)
                </h2>
                <p className="text-xs text-slate-500 font-semibold">เลือกหมวดหมู่ประวัติการตรวจสอบและบันทึกข้อมูลที่ต้องการเรียกดู</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Seal Temp History */}
                <div
                  onClick={() => setCurrentView('historySeal')}
                  className={`backdrop-blur-xl border rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all cursor-pointer group bg-white border-slate-200 hover:border-blue-500 hover:scale-[1.02] flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-md group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Thermometer className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 font-display">ประวัติ Seal Temp</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-1">ประวัติการตรวจสอบอุณหภูมิฮีตเตอร์ ซีลความร้อน และ Checklist คุณภาพแพ็คเกจ</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-black text-blue-600">
                    <span>ดูประวัติทั้งหมด</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>

                {/* Card 2: OEE History */}
                <div
                  onClick={() => setCurrentView('historyOee')}
                  className={`backdrop-blur-xl border rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all cursor-pointer group bg-white border-slate-200 hover:border-emerald-500 hover:scale-[1.02] flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-md group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 font-display">ประวัติ OEE</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-1">ประวัติการบันทึกประสิทธิภาพการผลิต Target, Actual, Good, Reject และ Breakdown Time</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-black text-emerald-600">
                    <span>ดูประวัติทั้งหมด</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>

                {/* Card 3: Film Roll History */}
                <div
                  onClick={() => setCurrentView('historyFilm')}
                  className={`backdrop-blur-xl border rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all cursor-pointer group bg-white border-slate-200 hover:border-purple-500 hover:scale-[1.02] flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shadow-md group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <Box className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 font-display">ประวัติม้วนฟิล์ม</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-1">ประวัติการตรวจสอบ Lot ม้วนฟิล์ม ผู้ผลิต ความหนา ความกว้าง และผลการตรวจ</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-black text-purple-600">
                    <span>ดูประวัติทั้งหมด</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.main>
        )}

        {/* =========================================================
            HISTORY SEAL TEMP VIEW (ประวัติ Seal Temp)
           ========================================================= */}
        {currentView === 'historySeal' && (
          <motion.main
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 p-4 md:p-6"
          >
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setCurrentView('historyHub')}
                  className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 shadow-sm"
                >
                  ← กลับสู่ศูนย์รวมประวัติ
                </button>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-black flex items-center gap-2 font-display text-slate-900">
                    <Clock className="w-5 h-5 text-blue-600" /> ประวัติบันทึก Seal Temp (Temperature & Check Sheet)
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold">รายการประวัติการตรวจสอบอุณหภูมิฮีตเตอร์และซีลความร้อน</p>
                </div>
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 text-xs font-black flex items-center gap-2 hover:bg-emerald-500/30 transition shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" /> ส่งออก Excel
                </button>
              </div>

              {/* Filter Bar for Seal Temp History */}
              <div className={`backdrop-blur-xl border rounded-2xl p-3 shadow-lg ${cardBg} grid grid-cols-1 sm:grid-cols-4 gap-2.5`}>
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1">📅 วันที่ (Date)</label>
                  <input
                    type="date"
                    value={sealFilterDate}
                    onChange={e => setSealFilterDate(e.target.value)}
                    className="w-full text-xs font-mono font-bold border rounded-xl p-2 bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1">⚙️ เครื่องจักร (Machine)</label>
                  <select
                    value={sealFilterMachine}
                    onChange={e => setSealFilterMachine(e.target.value)}
                    className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                  >
                    <option value="all">All (ทุกเครื่อง)</option>
                    {MACHINES.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1">⏰ กะ (Shift)</label>
                  <select
                    value={sealFilterShift}
                    onChange={e => setSealFilterShift(e.target.value)}
                    className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                  >
                    <option value="all">All (ทุกกะ)</option>
                    <option value="A">กะ A</option>
                    <option value="B">กะ B</option>
                    <option value="C">กะ C</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1">👤 ผู้บันทึก (Operator)</label>
                  <select
                    value={sealFilterOperator}
                    onChange={e => setSealFilterOperator(e.target.value)}
                    className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                  >
                    <option value="all">All (ทุกคน)</option>
                    {INSPECTORS.map(ins => (
                      <option key={ins.name} value={ins.name}>{ins.emoji} {ins.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reset filter badge if active */}
              {(sealFilterDate || sealFilterMachine !== 'all' || sealFilterShift !== 'all' || sealFilterOperator !== 'all') && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs text-blue-800 font-bold">
                  <span>กำลังกรองข้อมูล (Matched: {records.filter(r => (r.targetKg === null || r.targetKg === undefined)).filter(r => {
                    if (sealFilterDate && !r.datetime?.startsWith(sealFilterDate) && r.reportDate !== sealFilterDate) return false;
                    if (sealFilterMachine !== 'all' && r.machine !== sealFilterMachine) return false;
                    if (sealFilterShift !== 'all' && r.shift !== sealFilterShift) return false;
                    if (sealFilterOperator !== 'all' && r.operator !== sealFilterOperator) return false;
                    return true;
                  }).length})</span>
                  <button
                    onClick={() => {
                      setSealFilterDate('');
                      setSealFilterMachine('all');
                      setSealFilterShift('all');
                      setSealFilterOperator('all');
                    }}
                    className="text-rose-600 hover:underline font-black"
                  >
                    ล้างตัวกรอง ✕
                  </button>
                </div>
              )}

              {(() => {
                const sealRecs = sealTempRecords.length > 0 ? sealTempRecords : records.filter(r => r.recordType === 'sealTemp' || (!r.recordType && (r.tempFront !== null || r.tempFront !== undefined)));
                const filtered = sealRecs.filter(r => {
                  const recDate = r.reportDate || r.datetime || '';
                  if (sealFilterDate && !matchesDateFilter(recDate, sealFilterDate)) return false;
                  if (sealFilterMachine !== 'all' && r.machine !== sealFilterMachine) return false;
                  if (sealFilterShift !== 'all' && r.shift !== sealFilterShift) return false;
                  if (sealFilterOperator !== 'all' && r.operator !== sealFilterOperator) return false;
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-16 border rounded-2xl bg-white border-slate-300 shadow-lg">
                      <Box className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-50" />
                      <h3 className="text-base font-black text-slate-900">ไม่พบประวัติ Seal Temp ตามเงื่อนไขที่เลือก</h3>
                    </div>
                  );
                }

                const renderBadge = (val?: string | null) => {
                  const isPass = val === 'pass' || val === 'ผ่าน';
                  const isFail = val === 'fail' || val === 'ไม่ผ่าน';
                  if (isPass) return <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-black border border-emerald-200">✔ ผ่าน</span>;
                  if (isFail) return <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] font-black border border-rose-200">✘ ไม่ผ่าน</span>;
                  return <span className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-slate-200">-</span>;
                };

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map(r => {
                      const m = MACHINES.find(item => item.name === r.machine) || { color: '#3b82f6', name: r.machine };
                      const ok = recordOk(r);
                      return (
                        <div key={r.id || Math.random()} className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg ${cardBg} space-y-2.5`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }}></span>
                              <span className="font-black text-xs font-display text-slate-900">{r.machine}</span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${ok ? 'bg-emerald-500/20 text-emerald-800' : 'bg-rose-500/20 text-rose-800'}`}>
                              {ok ? '✔ ผ่านทั้งหมด' : '✘ มีรายการไม่ผ่าน'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-600 font-semibold border-b pb-1.5 border-slate-100 flex items-center justify-between">
                            <span>📅 {formatDDMMYYYY(r.datetime)}</span>
                            <span>กะ {r.shift} | ผู้ตรวจ: {r.operator || '-'}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono font-bold">
                            <div className="bg-slate-100 p-1.5 rounded-lg border text-center">หน้า: {r.tempFront || '-'}°C</div>
                            <div className="bg-slate-100 p-1.5 rounded-lg border text-center">หลัง: {r.tempBack || '-'}°C</div>
                            <div className="bg-slate-100 p-1.5 rounded-lg border text-center">กลาง: {r.tempMid || '-'}°C</div>
                          </div>

                          {/* Compact Checklist Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between bg-white p-1.5 rounded-lg border">
                              <span className="font-bold text-slate-700">🏷️ Lot No.</span>
                              {renderBadge(r.lot)}
                            </div>
                            <div className="flex items-center justify-between bg-white p-1.5 rounded-lg border">
                              <span className="font-bold text-slate-700">🛠️ เทปล่อน</span>
                              {renderBadge(r.teflon)}
                            </div>
                            <div className="flex items-center justify-between bg-white p-1.5 rounded-lg border">
                              <span className="font-bold text-slate-700">📦 Seal (บน)</span>
                              {renderBadge(r.packSealTop)}
                            </div>
                            <div className="flex items-center justify-between bg-white p-1.5 rounded-lg border">
                              <span className="font-bold text-slate-700">📦 Seal (กลาง)</span>
                              {renderBadge(r.packSealMid)}
                            </div>
                            <div className="flex items-center justify-between bg-white p-1.5 rounded-lg border">
                              <span className="font-bold text-slate-700">📦 Seal (ล่าง)</span>
                              {renderBadge(r.packSealBot)}
                            </div>
                            <div className="flex items-center justify-between bg-white p-1.5 rounded-lg border">
                              <span className="font-bold text-slate-700">🎯 รูเข็ม</span>
                              {renderBadge(r.hole)}
                            </div>
                          </div>

                          {r.notes && <div className="text-xs text-slate-700 bg-blue-50 p-2 rounded-lg border">หมายเหตุ: {r.notes}</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </motion.main>
        )}

        {/* =========================================================
            HISTORY OEE VIEW (ประวัติ OEE)
           ========================================================= */}
        {currentView === 'historyOee' && (
          <motion.main
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 p-4 md:p-6"
          >
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setCurrentView('historyHub')}
                  className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200"
                >
                  ← กลับสู่ศูนย์รวมประวัติ
                </button>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-black flex items-center gap-2 font-display text-slate-900">
                    <TrendingUp className="w-5 h-5 text-emerald-600" /> ประวัติบันทึก OEE (Production & Performance Records)
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold">รายการประวัติการบันทึก OEE เป้าหมาย ผลผลิต ของดี ของเสีย และเวลาหยุดเครื่อง</p>
                </div>
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 text-xs font-black flex items-center gap-2 hover:bg-emerald-500/30 transition shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" /> ส่งออก Excel
                </button>
              </div>

              {/* Filter Bar for OEE History */}
              <div className={`backdrop-blur-xl border rounded-2xl p-3 shadow-lg ${cardBg} grid grid-cols-1 sm:grid-cols-4 gap-2.5`}>
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1">📅 วันที่ (Date)</label>
                  <input
                    type="date"
                    value={oeeFilterDate}
                    onChange={e => setOeeFilterDate(e.target.value)}
                    className="w-full text-xs font-mono font-bold border rounded-xl p-2 bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1">⚙️ เครื่องจักร (Machine)</label>
                  <select
                    value={oeeFilterMachine}
                    onChange={e => setOeeFilterMachine(e.target.value)}
                    className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                  >
                    <option value="all">All (ทุกเครื่อง)</option>
                    {MACHINES.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1">⏰ กะ (Shift)</label>
                  <select
                    value={oeeFilterShift}
                    onChange={e => setOeeFilterShift(e.target.value)}
                    className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                  >
                    <option value="all">All (ทุกกะ)</option>
                    <option value="A">กะ A</option>
                    <option value="B">กะ B</option>
                    <option value="C">กะ C</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1">👤 ผู้บันทึก (Operator)</label>
                  <select
                    value={oeeFilterOperator}
                    onChange={e => setOeeFilterOperator(e.target.value)}
                    className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                  >
                    <option value="all">All (ทุกคน)</option>
                    {INSPECTORS.map(ins => (
                      <option key={ins.name} value={ins.name}>{ins.emoji} {ins.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(oeeFilterDate || oeeFilterMachine !== 'all' || oeeFilterShift !== 'all' || oeeFilterOperator !== 'all') && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs text-blue-800 font-bold">
                  <span>กำลังกรองข้อมูล</span>
                  <button
                    onClick={() => {
                      setOeeFilterDate('');
                      setOeeFilterMachine('all');
                      setOeeFilterShift('all');
                      setOeeFilterOperator('all');
                    }}
                    className="text-rose-600 hover:underline font-black"
                  >
                    ล้างตัวกรอง ✕
                  </button>
                </div>
              )}

              {(() => {
                const oeeList = records.filter(item => {
                  const r = item as any;
                  const isOeeType = r.recordType === 'oee' ||
                         r.targetKg !== undefined || r.target !== undefined ||
                         r.goodKg !== undefined || r.good !== undefined ||
                         r.actualKg !== undefined || r.actual !== undefined ||
                         r.speed !== undefined || r.speedActual !== undefined ||
                         r['Target'] !== undefined || r['Good'] !== undefined ||
                         r.tempFront === undefined || r.tempFront === null;
                  if (!isOeeType) return false;

                  const machineName = r.machine ?? r['เครื่องจักร'] ?? 'เครื่องบรรจุ 1Kg No.1';
                  const shiftVal = r.shift ?? 'A';
                  const operatorVal = r.operator ?? r['ชื่อผู้บันทึก'] ?? '-';
                  const reportDateVal = r.reportDate ?? r['ข้อมูลวันที่'] ?? r.datetime ?? '';

                  if (oeeFilterDate && !matchesDateFilter(reportDateVal, oeeFilterDate)) return false;
                  if (oeeFilterMachine !== 'all' && machineName !== oeeFilterMachine) return false;
                  if (oeeFilterShift !== 'all' && shiftVal !== oeeFilterShift) return false;
                  if (oeeFilterOperator !== 'all' && operatorVal !== oeeFilterOperator) return false;
                  return true;
                });

                if (oeeList.length === 0) {
                  return (
                    <div className="text-center py-16 border rounded-2xl bg-white border-slate-300 shadow-lg">
                      <Box className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-50" />
                      <h3 className="text-base font-black text-slate-900">ไม่พบประวัติ OEE ตามเงื่อนไขที่เลือก</h3>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {oeeList.map(item => {
                    const r = item as any;
                    const machineName = r.machine ?? r['เครื่องจักร'] ?? 'เครื่องบรรจุ 1Kg No.1';
                    const m = MACHINES.find(item => item.name === machineName) || { color: '#3b82f6', name: machineName };
                    const shiftVal = r.shift ?? 'A';
                    const shiftTypeVal = r.shiftType ?? r['shift duration type'] ?? '8h';
                    const operatorVal = r.operator ?? r['ชื่อผู้บันทึก'] ?? '-';
                    const reportDateVal = r.reportDate ?? r['ข้อมูลวันที่'] ?? (r.datetime ? formatDDMMYYYY(r.datetime) : '-');

                    const planTimeVal = Number(r.planTime ?? (shiftTypeVal === '12h' ? 720 : 480));
                    const bdVal = Number(r.breakdownMin ?? r.bd ?? 0);
                    const runTimeVal = Number(r.runTime ?? Math.max(0, planTimeVal - bdVal));
                    const speedStdVal = Number(r.speedStd ?? 34.67);
                    const speedSetVal = Number(r.speedSet ?? 45.00);
                    const speedActVal = Number(r.speed ?? r.speedActual ?? 42.00);
                    const goodVal = Number(r.goodKg ?? r.good ?? 12500);
                    const rejectVal = Number(r.rejectKg ?? r.reject ?? 0);
                    const actualVal = Number(r.actualKg ?? r.actual ?? (goodVal + rejectVal));
                    const targetVal = Number(r.targetKg ?? r.target ?? 15000);

                    const mePct = Number(r['%ME'] ?? (planTimeVal > 0 ? (runTimeVal / planTimeVal) * 100 : 100));
                    const perfPct = Number(r['%Perf'] ?? (speedSetVal > 0 ? (speedActVal / speedSetVal) * 100 : 100));
                    const qualPct = Number(r['%Quality'] ?? (actualVal > 0 ? (goodVal / actualVal) * 100 : 100));
                    const oeePct = Number(r['%OEE'] ?? ((mePct * perfPct * qualPct) / 10000));

                    return (
                      <div key={r.id || Math.random()} className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg ${cardBg} space-y-2.5`}>
                        <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }}></span>
                            <span className="font-black text-xs font-display text-slate-900">{machineName}</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-800">
                            กะ {shiftVal} ({shiftTypeVal})
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 font-semibold flex items-center justify-between">
                          <span>📅 {reportDateVal}</span>
                          <span>👤 ผู้บันทึก: {operatorVal}</span>
                        </div>

                        {/* Time & Speed Grid */}
                        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono font-bold bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <div className="text-center bg-white p-1 rounded border">Plan: {planTimeVal}m</div>
                          <div className="text-center bg-white p-1 rounded border">Run: {runTimeVal}m</div>
                          <div className="text-center bg-white p-1 rounded border text-amber-700">BD: {bdVal}m</div>
                          <div className="text-center bg-white p-1 rounded border">Std: {speedStdVal}</div>
                          <div className="text-center bg-white p-1 rounded border">Set: {speedSetVal}</div>
                          <div className="text-center bg-white p-1 rounded border text-blue-700">Act: {speedActVal}</div>
                        </div>

                        {/* Output kg Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono font-bold">
                          <div className="bg-blue-50 p-1.5 rounded-xl border border-blue-200 text-center">
                            <span className="text-[9px] text-blue-800 block">Target</span>
                            {Math.round(targetVal).toLocaleString()} kg
                          </div>
                          <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-300 text-center">
                            <span className="text-[9px] text-slate-600 block">Actual</span>
                            {Math.round(actualVal).toLocaleString()} kg
                          </div>
                          <div className="bg-emerald-50 p-1.5 rounded-xl border border-emerald-200 text-center">
                            <span className="text-[9px] text-emerald-800 block">Good</span>
                            {Math.round(goodVal).toLocaleString()} kg
                          </div>
                          <div className="bg-rose-50 p-1.5 rounded-xl border border-rose-200 text-center">
                            <span className="text-[9px] text-rose-800 block">Reject</span>
                            {Math.round(rejectVal).toLocaleString()} kg
                          </div>
                        </div>

                        {/* Percentages Bar */}
                        <div className="grid grid-cols-4 gap-1 text-[10px] font-mono font-black text-center bg-indigo-50/70 p-2 rounded-xl border border-indigo-200">
                          <div>
                            <span className="text-[9px] text-indigo-700 block">OEE</span>
                            {oeePct.toFixed(1)}%
                          </div>
                          <div>
                            <span className="text-[9px] text-indigo-700 block">Perf</span>
                            {perfPct.toFixed(1)}%
                          </div>
                          <div>
                            <span className="text-[9px] text-indigo-700 block">ME</span>
                            {mePct.toFixed(1)}%
                          </div>
                          <div>
                            <span className="text-[9px] text-indigo-700 block">Quality</span>
                            {qualPct.toFixed(1)}%
                          </div>
                        </div>

                        {r.notes && <div className="text-xs text-slate-700 bg-slate-100 p-2 rounded-lg border">หมายเหตุ: {r.notes}</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            </div>
          </motion.main>
        )}

        {/* =========================================================
            HISTORY FILM VIEW (ประวัติม้วนฟิล์ม)
           ========================================================= */}
        {currentView === 'historyFilm' && (
          <motion.main
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 p-4 md:p-6"
          >
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setCurrentView('historyHub')}
                  className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200"
                >
                  ← กลับสู่ศูนย์รวมประวัติ
                </button>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg md:text-xl font-black flex items-center gap-2 font-display text-slate-900">
                    <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><line x1="12" y1="3" x2="12" y2="8.5"/></svg> ประวัติบันทึกม้วนฟิล์ม (Film Roll Inspection History)
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold">รายการประวัติการตรวจสอบ Lot ม้วนฟิล์ม ความหนา ความกว้าง และผลการตรวจ</p>
                </div>
              </div>

              {/* Filter Bar for Film Roll History */}
              <div className={`backdrop-blur-xl border rounded-2xl p-3 shadow-lg ${cardBg} grid grid-cols-1 sm:grid-cols-5 gap-2.5`}>
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1">📅 วันที่ (Date)</label>
                  <input
                    type="date"
                    value={filmHistFilterDate}
                    onChange={e => setFilmHistFilterDate(e.target.value)}
                    className="w-full text-xs font-mono font-bold border rounded-xl p-2 bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1">⚙️ เครื่อง (Machine)</label>
                  <select
                    value={filmHistFilterMachine}
                    onChange={e => setFilmHistFilterMachine(e.target.value)}
                    className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                  >
                    <option value="all">All (ทุกเครื่อง)</option>
                    {MACHINES.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1">⏰ กะ (Shift)</label>
                  <select
                    value={filmHistFilterShift}
                    onChange={e => setFilmHistFilterShift(e.target.value)}
                    className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                  >
                    <option value="all">All (ทุกกะ)</option>
                    <option value="A">กะ A</option>
                    <option value="B">กะ B</option>
                    <option value="C">กะ C</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1">🏭 Supplier</label>
                  <select
                    value={filmHistFilterSupplier}
                    onChange={e => setFilmHistFilterSupplier(e.target.value)}
                    className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                  >
                    <option value="all">All (ทุก Supplier)</option>
                    <option value="TG">TG</option>
                    <option value="S&S">S&S</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 block mb-1">👤 ผู้ตรวจ (Operator)</label>
                  <select
                    value={filmHistFilterOperator}
                    onChange={e => setFilmHistFilterOperator(e.target.value)}
                    className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                  >
                    <option value="all">All (ทุกคน)</option>
                    {INSPECTORS.map(ins => (
                      <option key={ins.name} value={ins.name}>{ins.emoji} {ins.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reset filter badge if active */}
              {(filmHistFilterDate || filmHistFilterMachine !== 'all' || filmHistFilterShift !== 'all' || filmHistFilterOperator !== 'all' || filmHistFilterSupplier !== 'all') && (
                <div className="flex items-center justify-between bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl text-xs text-purple-900 font-bold">
                  <span>กำลังกรองข้อมูล (Matched: {filmRecords.filter(fr => {
                    if (filmHistFilterDate && fr.filmDate && !matchesDateFilter(fr.filmDate, filmHistFilterDate) && !fr.datetime?.startsWith(filmHistFilterDate)) return false;
                    if (filmHistFilterMachine !== 'all' && fr.machine !== filmHistFilterMachine) return false;
                    if (filmHistFilterShift !== 'all' && fr.shift !== filmHistFilterShift) return false;
                    if (filmHistFilterSupplier !== 'all' && fr.supplier !== filmHistFilterSupplier) return false;
                    if (filmHistFilterOperator !== 'all' && fr.operator !== filmHistFilterOperator) return false;
                    return true;
                  }).length})</span>
                  <button
                    onClick={() => {
                      setFilmHistFilterDate('');
                      setFilmHistFilterMachine('all');
                      setFilmHistFilterShift('all');
                      setFilmHistFilterOperator('all');
                      setFilmHistFilterSupplier('all');
                    }}
                    className="text-purple-700 hover:text-purple-900 underline text-xs font-black"
                  >
                    ล้างตัวกรอง ✕
                  </button>
                </div>
              )}

              {(() => {
                const filteredFilmRecs = filmRecords.filter(fr => {
                  if (filmHistFilterDate && fr.filmDate && !matchesDateFilter(fr.filmDate, filmHistFilterDate) && !fr.datetime?.startsWith(filmHistFilterDate)) return false;
                  if (filmHistFilterMachine !== 'all' && fr.machine !== filmHistFilterMachine) return false;
                  if (filmHistFilterShift !== 'all' && fr.shift !== filmHistFilterShift) return false;
                  if (filmHistFilterSupplier !== 'all' && fr.supplier !== filmHistFilterSupplier) return false;
                  if (filmHistFilterOperator !== 'all' && fr.operator !== filmHistFilterOperator) return false;
                  return true;
                });

                if (filteredFilmRecs.length === 0) {
                  return (
                    <div className="text-center py-16 border rounded-2xl bg-white border-slate-300 shadow-lg">
                      <Box className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-50" />
                      <h3 className="text-base font-black text-slate-900">ไม่พบประวัติม้วนฟิล์มตามเงื่อนไขการกรอง</h3>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredFilmRecs.map(fr => (
                      <div key={fr.id} className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg ${cardBg} flex items-center justify-between gap-3`}>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs text-slate-900">{fr.machine || 'เครื่องบรรจุ'}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">Supplier: {fr.supplier}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">กะ {fr.shift} ({fr.shiftType})</span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-semibold">
                            📅 วันที่: {fr.filmDate || '-'} | ⏰ เวลาเปลี่ยน: {fr.changeTime || '-'}
                          </div>
                          <div className="text-[11px] text-slate-600 font-semibold">
                            👤 ผู้บันทึก: {fr.operator}
                          </div>
                        </div>
                        {fr.tagPhoto && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-purple-300 shrink-0 bg-white shadow-sm">
                            <img src={fr.tagPhoto} alt="Film Roll Tag" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </motion.main>
        )}

        {/* =========================================================
            VIEW 3: PREDICTIVE DASHBOARD
           ========================================================= */}
        {currentView === 'dashboard' && (
          <motion.main
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 p-4 md:p-6 space-y-6"
          >
            {/* Machine Selector Dropdown for Dashboard */}
            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-sm">
                <Factory className="absolute left-3.5 top-3.5 w-4 h-4 text-blue-600 pointer-events-none" />
                <select
                  value={selectedMachine}
                  onChange={e => setSelectedMachine(Number(e.target.value))}
                  className={`w-full border rounded-xl py-2.5 pl-10 pr-4 text-xs md:text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm ${inputBg}`}
                >
                  {MACHINES.map(m => {
                    const emojis = ['🤖', '⚙️', '⚡', '🚀', '🔮', '📦', '🌟'];
                    const emoji = emojis[(m.id - 1) % emojis.length];
                    return (
                      <option key={m.id} value={m.id}>
                        {emoji} {m.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Machine Health Indicator */}
            <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 ${cardBg}`}>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${dashMachineHealth === 'good' ? 'bg-emerald-500 shadow-emerald-500/30' : dashMachineHealth === 'bad' ? 'bg-rose-500 shadow-rose-500/30' : 'bg-amber-500 shadow-amber-500/30'}`}>
                  <ShieldCheck className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black font-display text-slate-900">Machine Health Status: {activeMachineObj.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono uppercase shadow-sm ${dashMachineHealth === 'good' ? 'bg-emerald-500/20 text-emerald-800 border border-emerald-500/40' : dashMachineHealth === 'bad' ? 'bg-rose-500/20 text-rose-800 border border-rose-500/40' : 'bg-amber-500/25 text-amber-800 border border-amber-500/40'}`}>
                      {dashMachineHealth === 'good' ? '● GREEN (Healthy)' : dashMachineHealth === 'bad' ? '● RED (Attention Required)' : '● YELLOW (No Data)'}
                    </span>
                  </div>
                  <p className={`text-xs font-semibold mt-0.5 ${textMuted}`}>
                    {dashLatestRecord ? `ตรวจสอบล่าสุด: ${formatDDMMYYYY(dashLatestRecord.datetime)} | กะ ${dashLatestRecord.shift} (${dashLatestRecord.operator})` : 'ยังไม่มีประวัติการตรวจเช็คในระบบสำหรับเครื่องนี้'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-center justify-end shrink-0">
                <div className={`px-3.5 py-2 rounded-xl border text-xs font-black flex items-center gap-1.5 shadow-inner ${dashMachineHealth === 'good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : dashMachineHealth === 'bad' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {dashMachineHealth === 'good' ? '✔ เครื่องจักรพร้อมปฏิบัติงาน 100%' : dashMachineHealth === 'bad' ? '✘ ตรวจพบความผิดปกติในรอบล่าสุด' : '⚠️ รอการตรวจสอบครั้งแรก'}
                </div>
              </div>
            </div>

            {/* Maintenance & Predictive Alert Section */}
            {(() => {
              const insight = getMaintenanceInsights(activeMachineObj.name, records);
              return (
                <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg ${cardBg} border-l-4 ${insight.level === 'critical' ? 'border-l-rose-600 bg-rose-50/50' : insight.level === 'warning' ? 'border-l-amber-500 bg-amber-50/50' : 'border-l-emerald-500 bg-emerald-50/50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${insight.level === 'critical' ? 'bg-rose-600' : insight.level === 'warning' ? 'bg-amber-500' : 'bg-emerald-600'}`}>
                      {insight.level === 'critical' ? <ShieldAlert className="w-5 h-5 animate-bounce" /> : insight.level === 'warning' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-xs md:text-sm font-black text-slate-900 font-display flex items-center gap-2">
                        <span>Maintenance & Predictive Alert: {activeMachineObj.name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${insight.level === 'critical' ? 'bg-rose-600 text-white' : insight.level === 'warning' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
                          {insight.level.toUpperCase()}
                        </span>
                      </h4>
                      <p className="text-xs font-bold text-slate-800 mt-1">{insight.title}</p>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">{insight.advice}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Unified 2x2 Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg ${cardBg}`}>
                <h3 className="text-xs md:text-sm font-black flex items-center gap-2 mb-3 font-display text-slate-900">
                  <GaugeCircle className="w-4 h-4 text-blue-600" /> แนวโน้มความเร็วบรรจุ Speed (bag/min)
                </h3>
                <div className="h-60 relative">
                  <canvas ref={speedChartRef}></canvas>
                </div>
              </div>

              <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg ${cardBg}`}>
                <h3 className="text-xs md:text-sm font-black flex items-center gap-2 mb-3 font-display text-slate-900">
                  <Thermometer className="w-4 h-4 text-amber-500" /> แนวโน้มค่าอุณหภูมิความร้อน (°C)
                </h3>
                <div className="h-60 relative">
                  <canvas ref={tempChartRef}></canvas>
                </div>
              </div>
            </div>

            {/* Section Divider: Per-Machine vs Overall Operator & Machine Performance */}
            <div className="pt-6 pb-2">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-blue-300"></div>
                </div>
                <div className="relative bg-white px-4 py-1.5 rounded-full border border-blue-300 shadow-sm text-xs font-black text-blue-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>รายงานภาพรวมเปรียบเทียบระดับองค์กร (Operator & Machine Overall Performance)</span>
                </div>
              </div>
            </div>

            {/* Operator & Machine Performance Table Card */}
            {(() => {
              const recordOperators = Array.from(new Set(filteredDashRecords.map(r => r.operator).filter(Boolean)));
              const activeOperators = recordOperators.length > 0 ? recordOperators : INSPECTORS.map(i => i.name);
              
              const displayOperators = activeOperators.filter(opName => {
                if (dashFilterOperator !== 'all' && opName !== dashFilterOperator) return false;
                return true;
              });

              return (
                <div className={`backdrop-blur-xl border rounded-2xl shadow-xl overflow-hidden ${cardBg}`}>
                  {/* Header & Filter Controls Bar */}
                  <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-4 shadow-md space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm md:text-base font-black font-display flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5 text-blue-200" /> Dashboard - Operator & Machine Performance
                        </h3>
                        <p className="text-[11px] text-blue-100 font-semibold mt-0.5">รายงานวิเคราะห์ประสิทธิภาพเครื่องบรรจุและผู้ปฏิบัติงานจาก Google Sheet (OEE_logs)</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={handleExportDashboardExcel}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black flex items-center gap-1.5 transition shadow-sm"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" /> ส่งออก Excel
                        </button>
                        <span className="text-[10px] font-mono bg-white/20 px-2.5 py-1.5 rounded-lg font-bold">
                          Matched Records: {filteredDashRecords.length} / {records.length}
                        </span>
                        {(dashFilterDate || dashFilterShift !== 'all' || dashFilterOperator !== 'all' || dashFilterMachine !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              setDashFilterDate('');
                              setDashFilterShift('all');
                              setDashFilterOperator('all');
                              setDashFilterMachine('all');
                            }}
                            className="text-[10px] bg-rose-500 hover:bg-rose-600 text-white font-bold px-2.5 py-1.5 rounded-lg transition"
                          >
                            ล้างตัวกรอง ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filter Controls Row (4 Filters: Date, Shift, Operator, Machine) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-800 pt-0.5">
                      {/* Filter 1: DayStart (Date) */}
                      <div className="bg-white/95 rounded-lg p-1.5 border border-blue-200 shadow-sm flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-blue-900 flex items-center gap-1 font-display">
                          <span>📅 DayStart (วันที่)</span>
                        </label>
                        <input
                          type="date"
                          value={dashFilterDate}
                          onChange={e => setDashFilterDate(e.target.value)}
                          className="w-full text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>

                      {/* Filter 2: Shift */}
                      <div className="bg-white/95 rounded-lg p-1.5 border border-blue-200 shadow-sm flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-blue-900 flex items-center gap-1 font-display">
                          <span>⏰ Shift (กะการทำงาน)</span>
                        </label>
                        <select
                          value={dashFilterShift}
                          onChange={e => setDashFilterShift(e.target.value)}
                          className="w-full text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="all">All (ทุกกะ)</option>
                          <option value="A">Shift A (กะ A)</option>
                          <option value="B">Shift B (กะ B)</option>
                          <option value="C">Shift C (กะ C)</option>
                        </select>
                      </div>

                      {/* Filter 3: Operator */}
                      <div className="bg-white/95 rounded-lg p-1.5 border border-blue-200 shadow-sm flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-blue-900 flex items-center gap-1 font-display">
                          <span>👤 Operator (ผู้ปฏิบัติงาน)</span>
                        </label>
                        <select
                          value={dashFilterOperator}
                          onChange={e => setDashFilterOperator(e.target.value)}
                          className="w-full text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="all">All (ทั้งหมด)</option>
                          {INSPECTORS.map(ins => (
                            <option key={ins.name} value={ins.name}>
                              {ins.emoji} {ins.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filter 4: MachineName */}
                      <div className="bg-white/95 rounded-lg p-1.5 border border-blue-200 shadow-sm flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-blue-900 flex items-center gap-1 font-display">
                          <span>⚙️ MachineName (เครื่องบรรจุ)</span>
                        </label>
                        <select
                          value={dashFilterMachine}
                          onChange={e => setDashFilterMachine(e.target.value)}
                          className="w-full text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="all">All (ทุกเครื่อง)</option>
                          {MACHINES.map(m => (
                            <option key={m.id} value={m.name}>
                              ⚙️ {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Table Container */}
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left border-collapse text-[11px] font-sans">
                      <thead>
                        <tr className="text-white font-black uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow">
                          <th className="p-2.5 bg-blue-600 border-r border-blue-500">👤 Operator / Machine</th>
                          <th className="p-2.5 text-right bg-blue-600 border-r border-blue-500">📈 OEE %</th>
                          <th className="p-2.5 text-right bg-blue-600 border-r border-blue-500">⚡ Perf %</th>
                          <th className="p-2.5 text-right bg-purple-600 border-r border-purple-500">⏱️ Speed Std.</th>
                          <th className="p-2.5 text-right bg-purple-600 border-r border-purple-500">⚙️ Speed Set</th>
                          <th className="p-2.5 text-right bg-purple-600 border-r border-purple-500">🚀 Speed Act.</th>
                          <th className="p-2.5 text-right bg-emerald-600 border-r border-emerald-500">🎯 Target (kg)</th>
                          <th className="p-2.5 text-right bg-emerald-600 border-r border-emerald-500">📦 Actual (kg)</th>
                          <th className="p-2.5 text-right bg-emerald-600 border-r border-emerald-500">✨ Good (kg)</th>
                          <th className="p-2.5 text-right bg-emerald-600 border-r border-emerald-500">⚠️ Reject (kg)</th>
                          <th className="p-2.5 text-right bg-indigo-600 border-r border-indigo-500">📊 ME %</th>
                          <th className="p-2.5 text-right bg-indigo-600 border-r border-indigo-500">⭐ Quality %</th>
                          <th className="p-2.5 text-right bg-amber-600 border-r border-amber-500">📅 Plan Time</th>
                          <th className="p-2.5 text-right bg-amber-600 border-r border-amber-500">⏳ Run Time</th>
                          <th className="p-2.5 text-right bg-amber-600">🔧 BD (Min)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(() => {
                          const operatorDataList = displayOperators
                            .map(opName => computeOperatorData(opName, records, dashFilterMachine, dashFilterDate, dashFilterShift, dashFilterOperator))
                            .filter(d => d.machineRows.length > 0);

                          if (operatorDataList.length === 0) {
                            return (
                              <tr>
                                <td colSpan={15} className="p-8 text-center text-slate-500 font-semibold bg-slate-50">
                                  ⚠️ ไม่พบข้อมูลตามเงื่อนไขการกรองที่เลือก (วันที่: {dashFilterDate || 'ทั้งหมด'}, กะ: {dashFilterShift}, ผู้ปฏิบัติงาน: {dashFilterOperator}, เครื่อง: {dashFilterMachine})
                                </td>
                              </tr>
                            );
                          }

                          return operatorDataList.map((opData) => {
                            const insObj = INSPECTORS.find(i => i.name === opData.operatorName) || { emoji: '👤' };
                            return (
                              <React.Fragment key={opData.operatorName}>
                                <tr className="bg-blue-50 font-black text-blue-900 border-t-2 border-blue-200">
                                  <td className="p-2.5 flex items-center gap-1.5 font-display">
                                    <span className="text-sm">{insObj.emoji}</span> {opData.operatorName}
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-black text-blue-700">{opData.oee.toFixed(2)}%</td>
                                  <td className="p-2.5 text-right font-mono font-black text-blue-700">{opData.perf.toFixed(2)}%</td>
                                  <td className="p-2.5 text-right font-mono">{opData.speedStd.toFixed(2)}</td>
                                  <td className="p-2.5 text-right font-mono">{opData.speedSet.toFixed(2)}</td>
                                  <td className="p-2.5 text-right font-mono">{opData.speedAct.toFixed(2)}</td>
                                  <td className="p-2.5 text-right font-mono">{Math.round(opData.target).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{Math.round(opData.actual).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{Math.round(opData.good).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{Math.round(opData.reject).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{opData.me.toFixed(2)}%</td>
                                  <td className="p-2.5 text-right font-mono">{opData.quality.toFixed(2)}%</td>
                                  <td className="p-2.5 text-right font-mono">{opData.planTime.toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{opData.runTime.toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{opData.bd.toLocaleString()}</td>
                                </tr>

                                {opData.machineRows.map((mRow) => (
                                  <tr key={mRow.name} className="hover:bg-slate-50 transition text-slate-700">
                                    <td className="p-2.5 pl-8 border-r border-slate-200 font-semibold flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {mRow.name}
                                    </td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.oee.toFixed(2)}%</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.perf.toFixed(2)}%</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.speedStd.toFixed(2)}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.speedSet.toFixed(2)}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.speedAct.toFixed(2)}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{Math.round(mRow.target).toLocaleString()}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{Math.round(mRow.actual).toLocaleString()}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{Math.round(mRow.good).toLocaleString()}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{Math.round(mRow.reject).toLocaleString()}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.me.toFixed(2)}%</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.quality.toFixed(2)}%</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.planTime.toLocaleString()}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.runTime.toLocaleString()}</td>
                                    <td className="p-2.5 text-right font-mono">{mRow.bd.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          });
                        })()}
                      </tbody>
                      <tfoot>
                        {(() => {
                          const operatorDataList = displayOperators
                            .map(opName => computeOperatorData(opName, records, dashFilterMachine, dashFilterDate, dashFilterShift, dashFilterOperator))
                            .filter(d => d.machineRows.length > 0);

                          const totPlan = operatorDataList.reduce((acc, d) => acc + d.planTime, 0);
                          const totRun = operatorDataList.reduce((acc, d) => acc + d.runTime, 0);
                          const totBd = operatorDataList.reduce((acc, d) => acc + d.bd, 0);
                          const totTarget = operatorDataList.reduce((acc, d) => acc + d.target, 0);
                          const totAction = operatorDataList.reduce((acc, d) => acc + d.actual, 0);
                          const totGood = operatorDataList.reduce((acc, d) => acc + d.good, 0);
                          const totReject = operatorDataList.reduce((acc, d) => acc + d.reject, 0);

                          const avgOee = operatorDataList.length > 0 ? operatorDataList.reduce((acc, d) => acc + d.oee, 0) / operatorDataList.length : 0;
                          const avgPerf = operatorDataList.length > 0 ? operatorDataList.reduce((acc, d) => acc + d.perf, 0) / operatorDataList.length : 0;
                          const avgStd = operatorDataList.length > 0 ? operatorDataList.reduce((acc, d) => acc + d.speedStd, 0) / operatorDataList.length : 34.67;
                          const avgSet = operatorDataList.length > 0 ? operatorDataList.reduce((acc, d) => acc + d.speedSet, 0) / operatorDataList.length : 45.00;
                          const avgAct = operatorDataList.length > 0 ? operatorDataList.reduce((acc, d) => acc + d.speedAct, 0) / operatorDataList.length : 39.40;
                          const avgMe = operatorDataList.length > 0 ? operatorDataList.reduce((acc, d) => acc + d.me, 0) / operatorDataList.length : 100;
                          const avgQual = operatorDataList.length > 0 ? operatorDataList.reduce((acc, d) => acc + d.quality, 0) / operatorDataList.length : 100;

                          return (
                            <tr className="bg-blue-700 text-white font-black sticky bottom-0 z-10 shadow">
                              <td className="p-3 border-r border-blue-600 font-display">📊 Total / Average</td>
                              <td className="p-3 text-right font-mono">{avgOee.toFixed(2)}%</td>
                              <td className="p-3 text-right font-mono">{avgPerf.toFixed(2)}%</td>
                              <td className="p-3 text-right font-mono">{avgStd.toFixed(2)}</td>
                              <td className="p-3 text-right font-mono">{avgSet.toFixed(2)}</td>
                              <td className="p-3 text-right font-mono">{avgAct.toFixed(2)}</td>
                              <td className="p-3 text-right font-mono">{Math.round(totTarget).toLocaleString()}</td>
                              <td className="p-3 text-right font-mono">{Math.round(totAction).toLocaleString()}</td>
                              <td className="p-3 text-right font-mono">{Math.round(totGood).toLocaleString()}</td>
                              <td className="p-3 text-right font-mono">{Math.round(totReject).toLocaleString()}</td>
                              <td className="p-3 text-right font-mono">{avgMe.toFixed(2)}%</td>
                              <td className="p-3 text-right font-mono">{avgQual.toFixed(2)}%</td>
                              <td className="p-3 text-right font-mono">{totPlan.toLocaleString()}</td>
                              <td className="p-3 text-right font-mono">{totRun.toLocaleString()}</td>
                              <td className="p-3 text-right font-mono">{totBd.toLocaleString()}</td>
                            </tr>
                          );
                        })()}
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })()}


          </motion.main>
        )}

        {/* Mobile Bottom Tabbar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl border-t flex px-2 py-2 justify-around shadow-2xl bg-white/95 border-slate-200">
          <button
            onClick={() => setCurrentView('form')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-black px-2 py-1 rounded-xl transition-all ${currentView === 'form' ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm' : 'text-slate-600'}`}
          >
            <ClipboardEdit className="w-4 h-4 text-blue-600" /> ตรวจเช็ค
          </button>
          <button
            onClick={() => setCurrentView('oee')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-black px-2 py-1 rounded-xl transition-all ${currentView === 'oee' ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm' : 'text-slate-600'}`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> บันทึก OEE
          </button>
          <button
            onClick={() => setCurrentView('film')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-black px-2 py-1 rounded-xl transition-all ${currentView === 'film' ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm' : 'text-slate-600'}`}
          >
            <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><line x1="12" y1="3" x2="12" y2="8.5"/></svg> ม้วนฟิล์ม
          </button>
          <button
            onClick={() => setCurrentView('historyHub')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-black px-2 py-1 rounded-xl transition-all relative ${['historyHub', 'historySeal', 'historyOee', 'historyFilm'].includes(currentView) ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm' : 'text-slate-600'}`}
          >
            <Clock className="w-4 h-4 text-amber-500" /> ประวัติ
            {todayRecords.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] px-1 rounded-full font-mono font-black shadow-sm">
                {todayRecords.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-black px-2 py-1 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm' : 'text-slate-600'}`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" /> แดชบอร์ด
          </button>
        </nav>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl border px-5 py-2.5 rounded-full text-xs font-black shadow-2xl flex items-center gap-2 bg-slate-900 text-white border-blue-500 shadow-blue-500/20"
          >
            <Sparkles className="w-4 h-4 text-blue-400 animate-spin" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="border rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-3 bg-white border-slate-300 text-slate-900"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 flex items-center justify-center mx-auto text-xl shadow-lg shadow-emerald-500/25">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black font-display text-slate-900">บันทึกข้อมูลสำเร็จ</h3>
              <p className={`text-xs font-semibold ${textMuted}`}>{modalDesc}</p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition ring-2 ring-blue-400/50"
              >
                เรียบร้อย
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* Specs & Limits Settings Modal */}
      <AnimatePresence>
        {showSpecsModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 bg-white border-slate-300 text-slate-900"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-black font-display flex items-center gap-2 text-slate-900">
                  <Wrench className="w-5 h-5 text-blue-600" /> ตั้งค่าสเปคเครื่อง: {activeMachineObj.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSpecsModal(false)}
                  className="text-slate-400 hover:text-slate-700 font-black text-base"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
                {/* Speed Specs */}
                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 space-y-2">
                  <div className="font-black text-blue-900 font-display">🚀 ตั้งค่าความเร็ว (Speed bag/min)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Speed Std. (มาตรฐาน)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={customSpeedSpecs[selectedMachine]?.std ?? 34.67}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setCustomSpeedSpecs(prev => ({
                            ...prev,
                            [selectedMachine]: { ...(prev[selectedMachine] || { std: 34.67, set: 45.00 }), std: val }
                          }));
                        }}
                        className="w-full border rounded-lg p-2 font-mono font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Speed Set (ตั้งค่า)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={customSpeedSpecs[selectedMachine]?.set ?? 45.00}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setCustomSpeedSpecs(prev => ({
                            ...prev,
                            [selectedMachine]: { ...(prev[selectedMachine] || { std: 34.67, set: 45.00 }), set: val }
                          }));
                        }}
                        className="w-full border rounded-lg p-2 font-mono font-bold bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Temp Limits */}
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 space-y-3">
                  <div className="font-black text-amber-900 font-display">🌡️ ตั้งค่าช่วงอุณหภูมิ (Min / Max °C)</div>
                  
                  <div className="space-y-2">
                    <div className="font-bold text-slate-800">ซีลหน้า / ซีลบน:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-600 block">Min</span>
                        <input
                          type="number"
                          value={limits.tempFront[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempFront: [val, prev.tempFront[1]] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block">Max</span>
                        <input
                          type="number"
                          value={limits.tempFront[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempFront: [prev.tempFront[0], val] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-800">ซีลหลัง / ซีลล่าง:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-600 block">Min</span>
                        <input
                          type="number"
                          value={limits.tempBack[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempBack: [val, prev.tempBack[1]] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block">Max</span>
                        <input
                          type="number"
                          value={limits.tempBack[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempBack: [prev.tempBack[0], val] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-800">ซีลกลาง:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-600 block">Min</span>
                        <input
                          type="number"
                          value={limits.tempMid[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempMid: [val, prev.tempMid[1]] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block">Max</span>
                        <input
                          type="number"
                          value={limits.tempMid[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempMid: [prev.tempMid[0], val] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSpecsModal(false);
                    showToast('บันทึกการตั้งค่าสเปคเครื่องเรียบร้อยแล้ว ✔');
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition"
                >
                  บันทึกการตั้งค่า
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
