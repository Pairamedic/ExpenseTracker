// 2025/2026 Arkansas paycheck tax estimates (annualized percentage method)
// Based on IRS Pub 15-T (federal) and AR DFA withholding tables

const FICA_WAGE_BASE = 176100; // 2025 SS wage base

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Arkansas SIT withholding (annualized method)
function calcARSIT(taxablePerPeriod, periodsPerYear, filingStatus) {
  const annual = taxablePerPeriod * periodsPerYear;
  const stdDeduction = filingStatus === 'mfj' ? 4400 : 2200;
  const net = Math.max(0, annual - stdDeduction);

  let tax = 0;
  // AR 2025 brackets
  if (net > 89500) tax += (net - 89500) * 0.049;
  if (net > 23800) tax += (Math.min(net, 89500) - 23800) * 0.044;
  if (net > 14100) tax += (Math.min(net, 23800) - 14100) * 0.034;
  if (net > 10000) tax += (Math.min(net, 14100) - 10000) * 0.03;
  if (net > 5000) tax += (Math.min(net, 10000) - 5000) * 0.02;

  // Personal exemption credit ($29 each)
  const credits = filingStatus === 'mfj' ? 2 : 1;
  tax = Math.max(0, tax - credits * 29);

  return Math.max(0, round2(tax / periodsPerYear));
}

// Federal income tax withholding (2025 Pub 15-T percentage method)
function calcFIT(taxablePerPeriod, periodsPerYear, filingStatus) {
  const annual = taxablePerPeriod * periodsPerYear;
  const stdDeduction = filingStatus === 'mfj' ? 30000 : 15000;
  const net = Math.max(0, annual - stdDeduction);

  let tax = 0;
  const brackets = filingStatus === 'mfj'
    ? [
        [0, 23850, 0.10], [23850, 96950, 0.12], [96950, 206700, 0.22],
        [206700, 394600, 0.24], [394600, 501050, 0.32], [501050, 731200, 0.35],
        [731200, Infinity, 0.37],
      ]
    : [
        [0, 11925, 0.10], [11925, 48475, 0.12], [48475, 103350, 0.22],
        [103350, 197300, 0.24], [197300, 250525, 0.32], [250525, 626350, 0.35],
        [626350, Infinity, 0.37],
      ];

  for (const [lo, hi, rate] of brackets) {
    if (net > lo) tax += (Math.min(net, hi) - lo) * rate;
  }

  return Math.max(0, round2(tax / periodsPerYear));
}

// Calculate a full paycheck from hours and job config
export function calcPaycheck({ job, regularHours, overtimeHours }) {
  const periodsPerYear = job.payFrequency === 'weekly' ? 52 : 26;
  const filingStatus = job.filingStatus || 'single';
  const otRate = job.otRate || round2(job.hourlyRate * 1.5);

  const regularPay = round2(regularHours * job.hourlyRate);
  const otPay = round2(overtimeHours * otRate);
  const grossPay = round2(regularPay + otPay);

  // IRA/401k is pre-tax for FIT and SIT, but not FICA/Medicare
  const iraDeduction = round2(job.iraPerPeriod || 0);
  const ficaTaxable = grossPay;
  const fitTaxable = round2(grossPay - iraDeduction);

  // FICA capped at wage base
  const ficaCap = round2((FICA_WAGE_BASE / periodsPerYear) * 0.062);
  const fica = Math.min(round2(ficaTaxable * 0.062), ficaCap);
  const medi = round2(ficaTaxable * 0.0145);
  const fit = calcFIT(fitTaxable, periodsPerYear, filingStatus);
  const sitAR = calcARSIT(fitTaxable, periodsPerYear, filingStatus);

  const totalDeductions = round2(iraDeduction + fit + fica + medi + sitAR);
  const netPay = round2(grossPay - totalDeductions);

  return {
    regularHours, overtimeHours, regularPay, otPay, grossPay,
    iraDeduction, fitTaxable, ficaTaxable,
    fit, fica, medi, sitAR,
    totalDeductions, netPay,
    periodsPerYear,
  };
}

// Calculate OT breakdown from an array of shifts for a job
// Uses weekly OT (FLSA standard: >40 hrs/week = OT)
export function calcHoursFromShifts(shifts, job) {
  // Group shifts by ISO week
  const byWeek = {};
  for (const sh of shifts) {
    const d = new Date(sh.date + 'T12:00:00');
    const day = d.getDay(); // 0=Sun
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const wk = monday.toISOString().slice(0, 10);
    byWeek[wk] = (byWeek[wk] || 0) + sh.hoursWorked;
  }

  let regularHours = 0;
  let overtimeHours = 0;
  const weeklyLimit = 40;

  for (const total of Object.values(byWeek)) {
    regularHours += Math.min(total, weeklyLimit);
    overtimeHours += Math.max(0, total - weeklyLimit);
  }

  return { regularHours: round2(regularHours), overtimeHours: round2(overtimeHours) };
}
