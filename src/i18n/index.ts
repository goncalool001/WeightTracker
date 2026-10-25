import { format, parseISO } from 'date-fns';
import { enUS, pt as ptLocale } from 'date-fns/locale';
import type { DeltaDirection, InsightStrings, Locale } from '@/types';
import type { RowIssue as RowIssueKey } from '@/domain/importRows';
import type { CategoryGroupId, CategoryId } from '@/domain/categories';
import { useStore } from '@/store/useStore';

export type { Locale, InsightStrings };

/** Full translation interface. Functions take already-formatted numbers. */
export interface T {
  appName: string;
  skipToContent: string;
  nav: { today: string; log: string; goal: string; data: string };
  navLabel: string;
  openMenu: string;
  closeMenu: string;
  close: string;
  language: string;
  theme: string;
  themeLight: string;
  themeDark: string;

  // account
  signIn: string;
  signOut: string;
  signedInAs: (name: string) => string;
  syncLocalFailed: string;
  syncedMsg: string;
  offlineMsg: string;
  localOnly: string;

  // today — h1 parts
  emptyHead: string;
  emptySub: string;
  lastWeighIn: (date: string) => string;
  kAvg7: string;
  kAvg7Cap: (n: number) => string;
  kVsPrev: string;
  kVsPrevCap: Record<DeltaDirection, string>;
  kBelow: (kg: string) => string;
  kDays: (n: number) => string;
  kSince: (date: string) => string;
  kNotBelow: (kg: string) => string;
  kAbove: (kg: string) => string;
  kNotAbove: (kg: string) => string;
  kSinceStart: string;
  kSinceStartCap: (kg: string, date: string) => string;
  kToGo: string;
  kToGoCap: (target: string) => string;
  kPace: string;
  kPaceUnit: string;
  kPaceCap: string;
  kPaceNoGoal: string;
  kEta: string;
  kEtaFrom: (date: string) => string;
  kEtaCap: string;
  kEtaUnsteady: string;
  kNoData: string;

  // today — ruler
  rulerMaintain: string;
  rulerReach: string;
  rulerNone: string;
  rStart: string;
  rToday: string;
  rAvg: string;
  rGoal: string;
  rBand: string;
  rCapInside: (aboveLow: string, belowHigh: string) => string;
  rCapAbove: (over: string) => string;
  rCapBelow: (under: string) => string;
  rCapReach: (pct: string) => string;
  rCapReached: (target: string, date: string) => string;
  rCapNone: string;
  setMaintain: string;
  setGoal: string;
  rulerAria: (parts: string) => string;
  stripTitle: string;
  stripInBand: (n: number, total: number) => string;
  stripLogged: (n: number) => string;
  stripToward: (n: number, total: number) => string;
  stripTip: (date: string, kg: string, delta: string, prev: string) => string;
  stripVs: (prev: string) => string;
  sInBandOrBack: string;
  sAway: string;
  sToward: string;
  sAgainst: string;
  sDown: string;
  sUp: string;
  sFlat: string;
  sNone: string;

  // log
  logTitle: string;
  dateLbl: string;
  weightLbl: string;
  todayWord: string;
  yesterdayWord: string;
  save: string;
  replaceBtn: (kg: string) => string;
  errEmpty: string;
  errRange: string;
  errFuture: string;
  changeDate: string;

  // toasts
  tSaved: (kg: string, date: string) => string;
  tSavedNote: (date: string) => string;
  noteLbl: string;
  noteExample: string;
  addNote: string;
  catGroup: Record<CategoryGroupId, string>;
  cat: Record<CategoryId, string>;
  noteSheetTitle: (date: string) => string;
  freeText: string;
  done: string;
  clear: string;
  saveNote: string;
  editNote: string;
  categoriesLbl: string;
  noteAbout: (prevDay: string) => string;
  effTitle: string;
  effFinding: (label: string, kg: string, n: number, heavier: boolean) => string;
  effNoFinding: string;
  effEmpty: string;
  effOnDay: string;
  effNext: string;
  effNext2: string;
  effCount: (n: number) => string;
  effFew: (n: number) => string;
  effIndicative: string;
  effUnclear: string;
  effExplained: (withTag: number, total: number) => string;
  effMethod: string;
  effAria: (label: string, kg: string, low: string, high: string, n: number) => string;
  driftUp: (limit: string, date: string, rate: string) => string;
  driftDown: (limit: string, date: string, rate: string) => string;
  driftNear: (gap: string, limit: string) => string;
  streak: (n: number) => string;
  compareBtn: string;
  compareThis: string;
  comparePrev: string;
  compareNone: string;
  compareRange: (low: string, high: string) => string;
  compareNoneShort: string;
  compareAvg: (now: string, before: string) => string;
  chartPrev: string;
  tReplaced: (prev: string, kg: string, date: string) => string;
  tDeleted: (kg: string, date: string) => string;
  tUndo: string;
  tUndone: string;
  tImported: (n: number) => string;
  tGoalSaved: string;
  tGoalRemoved: string;
  tExported: (name: string) => string;
  tDeletedAll: (n: number) => string;

  // charts
  dailyWeight: string;
  overlayMa: string;
  overlayTrend: string;
  lWeighIn: string;
  lGap: string;
  lBand: string;
  lGoal: string;
  rangeLabel: string;
  ranges: { '7d': string; '30d': string; '90d': string; ytd: string; all: string; custom: string };
  rangeFrom: string;
  rangeTo: string;
  rangeDates: (n: number) => string;
  chartWeight: string;
  chartAvg: string;
  chartChange: string;
  chartAria: (n: number, from: string, to: string, lo: string, hi: string, last: string) => string;
  noDataRange: string;
  chartError: string;
  retry: string;
  resetZoom: string;
  periodWeekly: string;
  avgWeekly: string;
  avgMonthly: string;
  periodMonthly: string;
  granLabel: string;
  granWeekly: string;
  granMonthly: string;
  axisLost: string;
  axisGained: string;
  periodAria: (n: number) => string;
  weekNum: (n: number) => string;
  monthNum: (n: number) => string;
  avgLbl: string;
  weighInsLbl: string;

  // insights
  insightsTitle: string;
  insightsEmpty: string;
  insights: InsightStrings;

  // entries screen
  logScreenTitle: string;
  pesagens: string;
  colDate: string;
  colWeight: string;
  colChange: string;
  colActions: string;
  colPeriod: (g: 'weekly' | 'monthly') => string;
  colAvg: string;
  colWeighIns: string;
  edit: string;
  del: string;
  editTitle: (date: string) => string;
  cancel: string;
  showMore: (n: number) => string;
  showLess: string;
  viewAll: (n: number) => string;
  noEntriesRange: string;

  // goal screen
  goalTitle: string;
  currentGoal: string;
  modeLabel: string;
  modeLose: string;
  modeGain: string;
  modeMaintain: string;
  targetLbl: string;
  lowLbl: string;
  highLbl: string;
  bandHint: string;
  saveGoal: string;
  removeGoal: string;
  noGoal: string;
  errBand: string;
  previewMaintain: (inBand: number, total: number) => string;
  previewReach: (kg: string, dir: 'above' | 'below') => string;
  historyTitle: string;
  historyEmpty: string;
  hLose: (kg: string) => string;
  hGain: (kg: string) => string;
  errLoseAbove: (kg: string) => string;
  errGainBelow: (kg: string) => string;
  hMaintain: (low: string, high: string) => string;
  hRange: (from: string, to: string) => string;
  hSince: (from: string) => string;
  hCurrent: string;
  hReached: (date: string, kg: string) => string;
  hNotReached: string;
  hNotYet: string;

  // data screen
  dataTitle: string;
  importTitle: string;
  importDesc: string;
  chooseFile: string;
  readFailed: string;
  noColumns: string;
  nothingValid: string;
  previewOf: (file: string) => string;
  pTotal: (n: number) => string;
  pNew: (n: number) => string;
  pChanged: (n: number) => string;
  pSame: (n: number) => string;
  pRejected: (n: number) => string;
  issue: Record<RowIssueKey, string>;
  changeNew: string;
  changeSame: string;
  changeFrom: (prev: string) => string;
  modeMerge: string;
  modeMergeDesc: string;
  modeReplace: string;
  modeReplaceDesc: (n: number) => string;
  saveImport: (n: number) => string;
  colRow: string;
  colStatus: string;
  rejectedTitle: string;
  validTitle: string;
  exportTitle: string;
  exportDesc: (n: number) => string;
  exportXlsx: string;
  exportCsv: string;
  nothingToExport: string;
  accountTitle: string;
  accountDescOut: string;
  accountDescIn: (who: string) => string;
  accountOff: string;
  dangerTitle: string;
  dangerDesc: (n: number) => string;
  deleteAll: string;
  deleteAllTitle: string;
  deleteAllDesc: (n: number) => string;

  // states
  loading: string;
  loadErrorTitle: string;
  loadErrorDesc: string;

  // formatters
  fmtDate: (iso: string) => string;
  fmtShort: (iso: string) => string;
  fmtDay: (iso: string) => string;
  fmtWeekday: (iso: string) => string;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

// ── English ─────────────────────────────────────────────────────────────────

const en: T = {
  appName: 'Weight Tracker',
  skipToContent: 'Skip to content',
  nav: { today: 'Today', log: 'Entries', goal: 'Goal', data: 'Data' },
  navLabel: 'Main',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  close: 'Close',
  language: 'Language',
  theme: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',

  signIn: 'Sign in with Google',
  signOut: 'Sign out',
  signedInAs: (name) => `Signed in as ${name}`,
  syncLocalFailed: 'Your local weigh-ins could not be copied to your account.',
  syncedMsg: 'Synced',
  offlineMsg: 'Offline. Changes sync when you are back online.',
  localOnly: 'Saved on this device only',

  emptyHead: 'Log your first weight',
  emptySub: 'Your averages, trend and goal appear from the first few weigh-ins.',
  lastWeighIn: (date) => `Last weigh-in ${date}`,
  kAvg7: 'Weekly average',
  kAvg7Cap: (n) => `from ${n} ${plural(n, 'weigh-in', 'weigh-ins')}`,
  kVsPrev: 'Change this week',
  kVsPrevCap: { down: 'vs last week', up: 'vs last week', flat: 'vs last week, steady' },
  kBelow: (kg) => `Below ${kg} kg`,
  kDays: (n) => `${n} ${plural(n, 'day', 'days')}`,
  kSince: (date) => `since ${date}`,
  kNotBelow: (kg) => `at or above ${kg} kg today`,
  kAbove: (kg) => `Above ${kg} kg`,
  kNotAbove: (kg) => `at or below ${kg} kg today`,
  kSinceStart: 'Total change',
  kSinceStartCap: (kg, date) => `since ${kg} kg on ${date}`,
  kToGo: 'Left to goal',
  kToGoCap: (target) => `goal ${target} kg`,
  kPace: 'Weekly pace',
  kPaceUnit: 'kg/wk',
  kPaceCap: 'average of the last 4 weeks',
  kPaceNoGoal: 'last 4 weeks, away from the goal',
  kEta: 'Expected arrival',
  kEtaFrom: (date) => `after ${date}`,
  kEtaCap: 'over the last 4 weeks',
  kEtaUnsteady: 'pace too uneven for an end date',
  kNoData: 'not enough weigh-ins',

  rulerMaintain: 'Maintaining weight',
  rulerReach: 'Way to the goal',
  rulerNone: 'Where you are',
  rStart: 'start',
  rToday: 'today',
  rAvg: '7-day avg',
  rGoal: 'goal',
  rBand: 'range',
  rCapInside: (aboveLow, belowHigh) => `${aboveLow} kg above the bottom, ${belowHigh} kg under the top.`,
  rCapAbove: (over) => `${over} kg over the range.`,
  rCapBelow: (under) => `${under} kg under the range.`,
  rCapReach: (pct) => `${pct}% of the way.`,
  rCapReached: (target, date) => `Passed ${target} kg on ${date}.`,
  rCapNone: 'Set a goal to see your target or the weight to maintain here.',
  setMaintain: 'Set a weight to maintain',
  setGoal: 'Set a goal',
  rulerAria: (parts) => `Scale in kilograms: ${parts}`,
  stripTitle: 'Last 30 days',
  stripInBand: (n, total) => `Inside the range on ${n} of ${total} days with a weigh-in.`,
  stripLogged: (n) => `${n} of the last 30 days have a weigh-in.`,
  stripToward: (n, total) => `${n} of ${total} weigh-ins moved towards your goal.`,
  stripTip: (date, kg, delta, prev) => `${date}: ${kg} kg, ${delta} kg vs ${prev}`,
  stripVs: (prev) => `vs ${prev}`,
  sInBandOrBack: 'inside or heading back',
  sAway: 'moving away',
  sToward: 'towards goal',
  sAgainst: 'against goal',
  sDown: 'down',
  sUp: 'up',
  sFlat: 'no change',
  sNone: 'no weigh-in',

  logTitle: 'Log weight',
  dateLbl: 'Date',
  weightLbl: 'Weight in kg',
  todayWord: 'Today',
  yesterdayWord: 'Yesterday',
  save: 'Save',
  replaceBtn: (kg) => `Replace ${kg}`,
  errEmpty: 'Enter your weight.',
  errRange: 'Use a weight between 30 and 250 kg.',
  errFuture: 'Pick today or an earlier day.',
  changeDate: 'Change date',

  tSaved: (kg, date) => `Saved ${kg} kg for ${date}`,
  tSavedNote: (date) => `Note saved for ${date}`,
  noteLbl: 'Note',
  noteExample: 'dinner out',
  addNote: 'Add a note',
  catGroup: {
    food: 'Food',
    hydration: 'Hydration',
    activity: 'Activity',
    wellbeing: 'Sleep and wellbeing',
    health: 'Health',
    context: 'Context',
    measurement: 'Measurement',
  },
  cat: {
    clean_day: 'Clean day, on plan',
    late_meal: 'Late meal',
    big_meal: 'Big meal',
    salty: 'Very salty',
    carbs: 'Lots of carbs',
    alcohol: 'Alcohol',
    fasting: 'Fasted or skipped a meal',
    restaurant: 'Restaurant food',
    low_water: 'Drank little water',
    heat: 'Heat or heavy sweating',
    hard_workout: 'Hard workout',
    strength: 'Strength training',
    cardio: 'Cardio',
    rest_day: 'Rest day',
    low_movement: 'Little movement',
    poor_sleep: 'Slept badly',
    stress: 'Stress',
    sick: 'Unwell',
    constipation: 'Constipated',
    medication: 'Medication',
    travel: 'Travel',
    social: 'Social event',
    holidays: 'Holidays',
    other_time: 'Weighed at another time',
    other_scale: 'Another scale',
    after_eating: 'Weighed after eating or drinking',
  },
  noteSheetTitle: (date) => `Note for ${date}`,
  freeText: 'Free text (optional)',
  done: 'Done',
  clear: 'Clear',
  saveNote: 'Save note',
  editNote: 'Edit note',
  categoriesLbl: 'Categories',
  noteAbout: (prevDay) => `About the day before (${prevDay}).`,
  effTitle: 'What explains the swings',
  effFinding: (label, kg, n, heavier) =>
    `After a day with "${label}" you weigh ${kg} kg ${heavier ? 'more' : 'less'} on average (${n} weigh-ins).`,
  effNoFinding: 'No category has a clear effect yet. Keep tagging the days that stand out.',
  effEmpty: 'No categories yet. Add them to a weigh-in to see what is linked to your ups and downs.',
  effOnDay: 'Weigh-in',
  effNext: '+1 day',
  effNext2: '+2 days',
  effCount: (n) => `${n} ${plural(n, 'weigh-in', 'weigh-ins')}`,
  effFew: (n) => `${n} ${plural(n, 'weigh-in', 'weigh-ins')}, not enough yet`,
  effIndicative: 'indicative',
  effUnclear: 'no clear effect',
  effExplained: (withTag, total) =>
    `${withTag} of your ${total} rises above 0.5 kg have a category.`,
  effMethod: 'Difference from your previous 7-day average, against weigh-ins with no category, with an 80% range. 5 to 9 weigh-ins: indicative. Patterns, not causes.',
  effAria: (label, kg, low, high, n) =>
    `${label}: ${kg} kg on average, range ${low} to ${high} kg, ${n} weigh-ins`,
  driftUp: (limit, date, rate) => `At ${rate} kg/wk, your 7-day average passes ${limit} kg around ${date}.`,
  driftDown: (limit, date, rate) => `At ${rate} kg/wk, your 7-day average drops below ${limit} kg around ${date}.`,
  driftNear: (gap, limit) => `Your 7-day average is ${gap} kg from the ${limit} kg limit.`,
  streak: (n) => `${n} ${plural(n, 'day', 'days')} in a row with a weigh-in.`,
  compareBtn: 'Compare with previous',
  compareThis: 'This period',
  comparePrev: 'Previous period',
  compareNone: 'No weigh-ins in the previous period.',
  compareRange: (low, high) => `${low}–${high} kg`,
  compareNoneShort: 'no weigh-ins',
  compareAvg: (now, before) => `Average ${now} vs ${before} kg.`,
  chartPrev: 'Previous period',
  tReplaced: (prev, kg, date) => `${date}: ${prev} kg replaced by ${kg} kg`,
  tDeleted: (kg, date) => `Deleted ${kg} kg on ${date}`,
  tUndo: 'Undo',
  tUndone: 'Undone',
  tImported: (n) => `Saved ${n} ${plural(n, 'weigh-in', 'weigh-ins')} from the file`,
  tGoalSaved: 'Goal saved',
  tGoalRemoved: 'Goal removed',
  tExported: (name) => `Downloaded ${name}`,
  tDeletedAll: (n) => `Deleted ${n} ${plural(n, 'weigh-in', 'weigh-ins')}`,

  dailyWeight: 'Daily weight',
  overlayMa: '7-day average',
  overlayTrend: 'Trend line',
  lWeighIn: 'Weigh-in',
  lGap: 'Too few weigh-ins',
  lBand: 'Range',
  lGoal: 'Goal',
  rangeLabel: 'Period',
  ranges: { '7d': '7D', '30d': '30D', '90d': '90D', ytd: 'YTD', all: 'All', custom: 'Dates' },
  rangeFrom: 'From',
  rangeTo: 'To',
  rangeDates: (n) => `${n} ${plural(n, 'weigh-in', 'weigh-ins')}`,
  chartWeight: 'Weigh-in',
  chartAvg: '7-day avg',
  chartChange: 'Change',
  chartAria: (n, from, to, lo, hi, last) =>
    `Daily weight chart: ${n} weigh-ins from ${from} to ${to}, between ${lo} and ${hi} kg, latest ${last} kg. The tables on the Entries screen hold every value.`,
  noDataRange: 'No weigh-ins in this range.',
  chartError: 'The chart could not be drawn.',
  retry: 'Try again',
  resetZoom: 'Reset zoom',
  periodWeekly: 'Weekly change',
  avgWeekly: 'Weekly averages',
  avgMonthly: 'Monthly averages',
  periodMonthly: 'Monthly change',
  granLabel: 'Group by',
  granWeekly: 'Weeks',
  granMonthly: 'Months',
  axisLost: 'Loss',
  axisGained: 'Gain',
  periodAria: (n) =>
    `Change of the average from one period to the next, ${n} periods. Bars below zero are losses.`,
  weekNum: (n) => `Week ${n}`,
  monthNum: (n) => `Month ${n}`,
  avgLbl: 'Average',
  weighInsLbl: 'Weigh-ins',

  insightsTitle: 'Insights',
  insightsEmpty: 'Insights appear once there are a few weeks of weigh-ins.',
  insights: {
    windowLost: (kg, days) => `You've lost ${kg} over the last ${days} days.`,
    windowGained: (kg, days) => `You've gained ${kg} over the last ${days} days.`,
    accelAccel: (recent, prior) =>
      `Your loss is speeding up: ${recent} in the last 30 days against ${prior} in the 30 before.`,
    accelSlow: (recent, prior) =>
      `Your loss is slowing: ${recent} in the last 30 days against ${prior} in the 30 before.`,
    consistency: (drops, m) => `Your weight went down in ${drops} of your last ${m} weigh-ins.`,
    bestWeek: (start, end, kg) => `Your fastest week was ${start} – ${end}, down ${kg}.`,
    contribution: (pct) => `The last 14 days account for ${pct}% of your total loss.`,
    compareStronger: (thisRate, lastRate) =>
      `This month's pace (${thisRate} kg/wk) is faster than last month's (${lastRate} kg/wk).`,
    compareWeaker: (thisRate, lastRate) =>
      `This month's pace (${thisRate} kg/wk) is slower than last month's (${lastRate} kg/wk).`,
    categoryEffect: (label, kg, n, heavier) =>
      `After a day with "${label}" you weigh ${kg} kg ${heavier ? 'more' : 'less'} on average (${n} weigh-ins).`,
    weekday: (day, kg, heavier) =>
      `On ${['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][day]} you weigh ${kg} kg ${heavier ? 'more' : 'less'} than the rest of that week, on average.`,
    avgSpread: (lo, hi, days) =>
      `Your 7-day average stayed between ${lo} and ${hi} kg over the last ${days} days.`,
  },

  logScreenTitle: 'Entries',
  pesagens: 'Weigh-ins',
  colDate: 'Date',
  colWeight: 'Weight',
  colChange: 'vs previous',
  colActions: 'Actions',
  colPeriod: (g) => (g === 'weekly' ? 'Week' : 'Month'),
  colAvg: 'Average',
  colWeighIns: 'Weigh-ins',
  edit: 'Edit',
  del: 'Delete',
  editTitle: (date) => `Edit ${date}`,
  cancel: 'Cancel',
  showMore: (n) => `Show ${n} more`,
  showLess: 'Show fewer',
  viewAll: (n) => `All ${n} weigh-ins`,
  noEntriesRange: 'No weigh-ins in this range.',

  goalTitle: 'Goal',
  currentGoal: 'Current goal',
  modeLabel: 'Kind of goal',
  modeLose: 'Lose',
  modeGain: 'Gain',
  modeMaintain: 'Maintain',
  targetLbl: 'Target weight, kg',
  lowLbl: 'From, kg',
  highLbl: 'To, kg',
  bandHint: 'A range of 1 to 3 kg absorbs normal day-to-day swings.',
  saveGoal: 'Save goal',
  removeGoal: 'Remove goal',
  noGoal: 'No goal set.',
  errBand: 'Use two different weights between 30 and 250 kg.',
  previewMaintain: (inBand, total) =>
    `In the last 30 days, ${inBand} of ${total} weigh-ins were inside this range.`,
  previewReach: (kg, dir) =>
    dir === 'above' ? `Today you are ${kg} kg above this target.` : `Today you are ${kg} kg below this target.`,
  historyTitle: 'Goal history',
  historyEmpty: 'Goals you set are kept here.',
  hLose: (kg) => `Lose weight to ${kg} kg`,
  hGain: (kg) => `Gain weight to ${kg} kg`,
  errLoseAbove: (kg) => `To lose weight, pick a target below today's ${kg} kg.`,
  errGainBelow: (kg) => `To gain weight, pick a target above today's ${kg} kg.`,
  hMaintain: (low, high) => `Maintain ${low}–${high} kg`,
  hRange: (from, to) => `${from} – ${to}`,
  hSince: (from) => `since ${from}`,
  hCurrent: 'Current',
  hReached: (date, kg) => `reached on ${date} (${kg} kg)`,
  hNotReached: 'not reached',
  hNotYet: 'not reached yet',

  dataTitle: 'Data',
  importTitle: 'Import',
  importDesc: 'CSV or Excel with Date and Weight (kg) columns. You check every row before saving.',
  chooseFile: 'Choose a file',
  readFailed: 'That file could not be read. Use a .csv or .xlsx file.',
  noColumns: 'No Date and Weight columns in that file.',
  nothingValid: 'None of the rows in that file can be saved.',
  previewOf: (file) => `Check ${file}`,
  pTotal: (n) => `${n} ${plural(n, 'row', 'rows')}`,
  pNew: (n) => `${n} new`,
  pChanged: (n) => `${n} changed`,
  pSame: (n) => `${n} unchanged`,
  pRejected: (n) => `${n} left out`,
  issue: {
    badDate: 'Invalid date',
    badWeight: 'Weight is not a number',
    outOfRange: 'Outside 30–250 kg',
    duplicate: 'Date repeated in the file',
    future: 'Date in the future',
  },
  changeNew: 'New',
  changeSame: 'Unchanged',
  changeFrom: (prev) => `was ${prev} kg`,
  modeMerge: 'Add and update',
  modeMergeDesc: 'New dates are added and changed ones overwritten. Nothing else is touched.',
  modeReplace: 'Replace everything',
  modeReplaceDesc: (n) =>
    `Your ${n} saved ${plural(n, 'weigh-in is', 'weigh-ins are')} replaced by the file.`,
  saveImport: (n) => `Save ${n} ${plural(n, 'weigh-in', 'weigh-ins')}`,
  colRow: 'Row',
  colStatus: 'Status',
  rejectedTitle: 'Rows left out',
  validTitle: 'Rows to save',
  exportTitle: 'Export',
  exportDesc: (n) => `${n} ${plural(n, 'weigh-in', 'weigh-ins')}, with categories and notes.`,
  exportXlsx: 'Download .xlsx',
  exportCsv: 'Download .csv',
  nothingToExport: 'There is nothing to export yet.',
  accountTitle: 'Account and sync',
  accountDescOut: 'Sign in to keep your weigh-ins and goals on every device.',
  accountDescIn: (who) => `Signed in as ${who}. Weigh-ins and goals sync to your account.`,
  accountOff: 'Sync is not set up in this build. Everything stays on this device.',
  dangerTitle: 'Delete all weigh-ins',
  dangerDesc: (n) =>
    `Removes all ${n} weigh-ins here and from your synced account. Export first if you want a copy.`,
  deleteAll: 'Delete all',
  deleteAllTitle: 'Delete all weigh-ins?',
  deleteAllDesc: (n) =>
    `All ${n} weigh-ins are removed from this device and your account. You can undo this for a few seconds.`,

  loading: 'Loading your weigh-ins',
  loadErrorTitle: 'The weigh-ins saved on this device could not be read.',
  loadErrorDesc: 'Nothing has been deleted. Try again, or sign in to load them from your account.',

  fmtDate: (iso) => format(parseISO(iso), 'd MMM yyyy', { locale: enUS }),
  fmtShort: (iso) => format(parseISO(iso), 'd MMM', { locale: enUS }),
  fmtDay: (iso) => format(parseISO(iso), 'EEEE, d MMM yyyy', { locale: enUS }),
  fmtWeekday: (iso) => format(parseISO(iso), 'EEEE', { locale: enUS }),
};

// ── Portuguese ───────────────────────────────────────────────────────────────

const pt: T = {
  appName: 'Weight Tracker',
  skipToContent: 'Saltar para o conteúdo',
  nav: { today: 'Hoje', log: 'Registos', goal: 'Meta', data: 'Dados' },
  navLabel: 'Principal',
  openMenu: 'Abrir menu',
  closeMenu: 'Fechar menu',
  close: 'Fechar',
  language: 'Idioma',
  theme: 'Tema',
  themeLight: 'Claro',
  themeDark: 'Escuro',

  signIn: 'Entrar com Google',
  signOut: 'Terminar sessão',
  signedInAs: (name) => `Sessão iniciada como ${name}`,
  syncLocalFailed: 'Não foi possível copiar os registos locais para a tua conta.',
  syncedMsg: 'Sincronizado',
  offlineMsg: 'Sem ligação. As alterações sincronizam quando voltares a estar online.',
  localOnly: 'Guardado só neste dispositivo',

  emptyHead: 'Regista o teu primeiro peso',
  emptySub: 'As médias, a tendência e a meta aparecem a partir das primeiras pesagens.',
  lastWeighIn: (date) => `Última pesagem a ${date}`,
  kAvg7: 'Média semanal',
  kAvg7Cap: (n) => `de ${n} ${plural(n, 'pesagem', 'pesagens')}`,
  kVsPrev: 'Variação esta semana',
  kVsPrevCap: { down: 'face à semana passada', up: 'face à semana passada', flat: 'face à semana passada, estável' },
  kBelow: (kg) => `Abaixo de ${kg} kg`,
  kDays: (n) => `${n} ${plural(n, 'dia', 'dias')}`,
  kSince: (date) => `desde ${date}`,
  kNotBelow: (kg) => `hoje em ${kg} kg ou mais`,
  kAbove: (kg) => `Acima de ${kg} kg`,
  kNotAbove: (kg) => `hoje em ${kg} kg ou menos`,
  kSinceStart: 'Variação total',
  kSinceStartCap: (kg, date) => `desde ${kg} kg a ${date}`,
  kToGo: 'Falta para a meta',
  kToGoCap: (target) => `meta ${target} kg`,
  kPace: 'Ritmo semanal',
  kPaceUnit: 'kg/sem',
  kPaceCap: 'média das últimas 4 semanas',
  kPaceNoGoal: 'últimas 4 semanas, longe da meta',
  kEta: 'Chegada prevista',
  kEtaFrom: (date) => `depois de ${date}`,
  kEtaCap: 'nas últimas 4 semanas',
  kEtaUnsteady: 'ritmo irregular, sem data final',
  kNoData: 'poucas pesagens',

  rulerMaintain: 'Manter peso',
  rulerReach: 'Caminho até à meta',
  rulerNone: 'Onde estás',
  rStart: 'início',
  rToday: 'hoje',
  rAvg: 'média 7 dias',
  rGoal: 'meta',
  rBand: 'intervalo',
  rCapInside: (aboveLow, belowHigh) => `${aboveLow} kg acima do limite inferior, ${belowHigh} kg abaixo do superior.`,
  rCapAbove: (over) => `${over} kg acima do intervalo.`,
  rCapBelow: (under) => `${under} kg abaixo do intervalo.`,
  rCapReach: (pct) => `${pct}% do caminho.`,
  rCapReached: (target, date) => `Passaste os ${target} kg a ${date}.`,
  rCapNone: 'Define uma meta para ver aqui o alvo ou o peso a manter.',
  setMaintain: 'Definir peso a manter',
  setGoal: 'Definir meta',
  rulerAria: (parts) => `Escala em quilos: ${parts}`,
  stripTitle: 'Últimos 30 dias',
  stripInBand: (n, total) => `Dentro do intervalo em ${n} dos ${total} dias com pesagem.`,
  stripLogged: (n) => `${n} dos últimos 30 dias têm pesagem.`,
  stripToward: (n, total) => `${n} de ${total} pesagens foram na direção da meta.`,
  stripTip: (date, kg, delta, prev) => `${date}: ${kg} kg, ${delta} kg vs ${prev}`,
  stripVs: (prev) => `vs ${prev}`,
  sInBandOrBack: 'dentro ou a voltar',
  sAway: 'a afastar-se',
  sToward: 'na direção da meta',
  sAgainst: 'contra a meta',
  sDown: 'desceu',
  sUp: 'subiu',
  sFlat: 'sem variação',
  sNone: 'sem pesagem',

  logTitle: 'Registar peso',
  dateLbl: 'Data',
  weightLbl: 'Peso em kg',
  todayWord: 'Hoje',
  yesterdayWord: 'Ontem',
  save: 'Gravar',
  replaceBtn: (kg) => `Substituir ${kg}`,
  errEmpty: 'Escreve o teu peso.',
  errRange: 'Usa um peso entre 30 e 250 kg.',
  errFuture: 'Escolhe hoje ou um dia anterior.',
  changeDate: 'Mudar data',

  tSaved: (kg, date) => `Gravado ${kg} kg a ${date}`,
  tSavedNote: (date) => `Nota gravada a ${date}`,
  noteLbl: 'Nota',
  noteExample: 'jantar fora',
  addNote: 'Adicionar nota',
  catGroup: {
    food: 'Alimentação',
    hydration: 'Hidratação',
    activity: 'Atividade',
    wellbeing: 'Sono e bem-estar',
    health: 'Saúde',
    context: 'Contexto',
    measurement: 'Medição',
  },
  cat: {
    clean_day: 'Dia limpo, dentro do plano',
    late_meal: 'Refeição tardia',
    big_meal: 'Refeição grande',
    salty: 'Muito sal',
    carbs: 'Muitos hidratos',
    alcohol: 'Álcool',
    fasting: 'Jejum ou refeição saltada',
    restaurant: 'Comida de restaurante',
    low_water: 'Bebi pouca água',
    heat: 'Calor ou muita transpiração',
    hard_workout: 'Treino intenso',
    strength: 'Treino de força',
    cardio: 'Cardio',
    rest_day: 'Dia de descanso',
    low_movement: 'Pouco movimento',
    poor_sleep: 'Dormi mal',
    stress: 'Stress',
    sick: 'Doente',
    constipation: 'Intestino preso',
    medication: 'Medicação',
    travel: 'Viagem',
    social: 'Evento social',
    holidays: 'Férias',
    other_time: 'Pesagem a outra hora',
    other_scale: 'Outra balança',
    after_eating: 'Pesagem depois de comer ou beber',
  },
  noteSheetTitle: (date) => `Nota de ${date}`,
  freeText: 'Texto livre (opcional)',
  done: 'Feito',
  clear: 'Limpar',
  saveNote: 'Gravar nota',
  editNote: 'Editar nota',
  categoriesLbl: 'Categorias',
  noteAbout: (prevDay) => `Sobre o dia anterior (${prevDay}).`,
  effTitle: 'O que explica as variações',
  effFinding: (label, kg, n, heavier) =>
    `Depois de um dia com "${label}" pesas, em média, ${kg} kg ${heavier ? 'a mais' : 'a menos'} (${n} pesagens).`,
  effNoFinding: 'Nenhuma categoria tem ainda um efeito claro. Continua a marcar os dias que se destacam.',
  effEmpty: 'Ainda sem categorias. Junta-as às pesagens para veres o que está associado às subidas e descidas.',
  effOnDay: 'Pesagem',
  effNext: '+1 dia',
  effNext2: '+2 dias',
  effCount: (n) => `${n} ${plural(n, 'pesagem', 'pesagens')}`,
  effFew: (n) => `${n} ${plural(n, 'pesagem', 'pesagens')}, ainda poucas`,
  effIndicative: 'indicativo',
  effUnclear: 'sem efeito claro',
  effExplained: (withTag, total) =>
    `${withTag} das tuas ${total} subidas acima de 0.5 kg têm categoria.`,
  effMethod: 'Diferença face à média dos 7 dias anteriores, comparada com pesagens sem categoria, com intervalo de 80%. 5 a 9 pesagens: indicativo. Padrões, não causas.',
  effAria: (label, kg, low, high, n) =>
    `${label}: ${kg} kg em média, intervalo de ${low} a ${high} kg, ${n} pesagens`,
  driftUp: (limit, date, rate) => `A ${rate} kg/sem, a média de 7 dias passa os ${limit} kg por volta de ${date}.`,
  driftDown: (limit, date, rate) => `A ${rate} kg/sem, a média de 7 dias desce abaixo dos ${limit} kg por volta de ${date}.`,
  driftNear: (gap, limit) => `A média de 7 dias está a ${gap} kg do limite de ${limit} kg.`,
  streak: (n) => `${n} ${plural(n, 'dia seguido', 'dias seguidos')} com pesagem.`,
  compareBtn: 'Comparar com o anterior',
  compareThis: 'Este período',
  comparePrev: 'Período anterior',
  compareNone: 'Sem pesagens no período anterior.',
  compareRange: (low, high) => `${low}–${high} kg`,
  compareNoneShort: 'sem pesagens',
  compareAvg: (now, before) => `Média ${now} vs ${before} kg.`,
  chartPrev: 'Período anterior',
  tReplaced: (prev, kg, date) => `${date}: ${prev} kg substituído por ${kg} kg`,
  tDeleted: (kg, date) => `Apagado ${kg} kg de ${date}`,
  tUndo: 'Desfazer',
  tUndone: 'Desfeito',
  tImported: (n) => `${n} ${plural(n, 'registo gravado', 'registos gravados')} a partir do ficheiro`,
  tGoalSaved: 'Meta gravada',
  tGoalRemoved: 'Meta removida',
  tExported: (name) => `Descarregado ${name}`,
  tDeletedAll: (n) => `${n} ${plural(n, 'registo apagado', 'registos apagados')}`,

  dailyWeight: 'Peso diário',
  overlayMa: 'Média 7 dias',
  overlayTrend: 'Linha de tendência',
  lWeighIn: 'Pesagem',
  lGap: 'Poucas pesagens',
  lBand: 'Intervalo',
  lGoal: 'Meta',
  rangeLabel: 'Período',
  ranges: { '7d': '7D', '30d': '30D', '90d': '90D', ytd: 'Ano', all: 'Tudo', custom: 'Datas' },
  rangeFrom: 'De',
  rangeTo: 'Até',
  rangeDates: (n) => `${n} ${plural(n, 'pesagem', 'pesagens')}`,
  chartWeight: 'Pesagem',
  chartAvg: 'Média 7 dias',
  chartChange: 'Variação',
  chartAria: (n, from, to, lo, hi, last) =>
    `Gráfico do peso diário: ${n} pesagens de ${from} a ${to}, entre ${lo} e ${hi} kg, última ${last} kg. As tabelas no ecrã Registos têm todos os valores.`,
  noDataRange: 'Sem pesagens neste intervalo.',
  chartError: 'Não foi possível desenhar o gráfico.',
  retry: 'Tentar de novo',
  resetZoom: 'Repor zoom',
  periodWeekly: 'Variação semanal',
  avgWeekly: 'Médias semanais',
  avgMonthly: 'Médias mensais',
  periodMonthly: 'Variação mensal',
  granLabel: 'Agrupar por',
  granWeekly: 'Semanas',
  granMonthly: 'Meses',
  axisLost: 'Descida',
  axisGained: 'Subida',
  periodAria: (n) =>
    `Variação da média de um período para o seguinte, ${n} períodos. Barras abaixo de zero são perdas.`,
  weekNum: (n) => `Semana ${n}`,
  monthNum: (n) => `Mês ${n}`,
  avgLbl: 'Média',
  weighInsLbl: 'Pesagens',

  insightsTitle: 'Análise',
  insightsEmpty: 'A análise aparece quando houver algumas semanas de pesagens.',
  insights: {
    windowLost: (kg, days) => `Perdeste ${kg} nos últimos ${days} dias.`,
    windowGained: (kg, days) => `Ganhaste ${kg} nos últimos ${days} dias.`,
    accelAccel: (recent, prior) =>
      `A perda está a acelerar: ${recent} nos últimos 30 dias contra ${prior} nos 30 anteriores.`,
    accelSlow: (recent, prior) =>
      `A perda está a abrandar: ${recent} nos últimos 30 dias contra ${prior} nos 30 anteriores.`,
    consistency: (drops, m) => `O peso desceu em ${drops} das tuas últimas ${m} pesagens.`,
    bestWeek: (start, end, kg) => `A tua semana mais rápida foi ${start} – ${end}, menos ${kg}.`,
    contribution: (pct) => `Os últimos 14 dias representam ${pct}% da tua perda total.`,
    compareStronger: (thisRate, lastRate) =>
      `O ritmo deste mês (${thisRate} kg/sem) é mais rápido do que o do mês passado (${lastRate} kg/sem).`,
    compareWeaker: (thisRate, lastRate) =>
      `O ritmo deste mês (${thisRate} kg/sem) é mais lento do que o do mês passado (${lastRate} kg/sem).`,
    categoryEffect: (label, kg, n, heavier) =>
      `Depois de um dia com "${label}" pesas, em média, ${kg} kg ${heavier ? 'a mais' : 'a menos'} (${n} pesagens).`,
    weekday: (day, kg, heavier) =>
      `${['Ao domingo', 'À segunda-feira', 'À terça-feira', 'À quarta-feira', 'À quinta-feira', 'À sexta-feira', 'Ao sábado'][day]} pesas, em média, ${kg} kg ${heavier ? 'a mais' : 'a menos'} do que no resto dessa semana.`,
    avgSpread: (lo, hi, days) =>
      `A tua média de 7 dias ficou entre ${lo} e ${hi} kg nos últimos ${days} dias.`,
  },

  logScreenTitle: 'Registos',
  pesagens: 'Pesagens',
  colDate: 'Data',
  colWeight: 'Peso',
  colChange: 'vs anterior',
  colActions: 'Ações',
  colPeriod: (g) => (g === 'weekly' ? 'Semana' : 'Mês'),
  colAvg: 'Média',
  colWeighIns: 'Pesagens',
  edit: 'Editar',
  del: 'Apagar',
  editTitle: (date) => `Editar ${date}`,
  cancel: 'Cancelar',
  showMore: (n) => `Mostrar mais ${n}`,
  showLess: 'Mostrar menos',
  viewAll: (n) => `Todas as ${n} pesagens`,
  noEntriesRange: 'Sem pesagens neste intervalo.',

  goalTitle: 'Meta',
  currentGoal: 'Meta atual',
  modeLabel: 'Tipo de meta',
  modeLose: 'Perder',
  modeGain: 'Ganhar',
  modeMaintain: 'Manter',
  targetLbl: 'Peso alvo, kg',
  lowLbl: 'De, kg',
  highLbl: 'Até, kg',
  bandHint: 'Um intervalo de 1 a 3 kg absorve as oscilações normais de dia para dia.',
  saveGoal: 'Gravar meta',
  removeGoal: 'Remover meta',
  noGoal: 'Sem meta definida.',
  errBand: 'Usa dois pesos diferentes entre 30 e 250 kg.',
  previewMaintain: (inBand, total) =>
    `Nos últimos 30 dias, ${inBand} de ${total} pesagens ficaram dentro deste intervalo.`,
  previewReach: (kg, dir) =>
    dir === 'above' ? `Hoje estás ${kg} kg acima deste alvo.` : `Hoje estás ${kg} kg abaixo deste alvo.`,
  historyTitle: 'Histórico de metas',
  historyEmpty: 'As metas que definires ficam guardadas aqui.',
  hLose: (kg) => `Perder peso até ${kg} kg`,
  hGain: (kg) => `Ganhar peso até ${kg} kg`,
  errLoseAbove: (kg) => `Para perder peso, escolhe um alvo abaixo dos ${kg} kg de hoje.`,
  errGainBelow: (kg) => `Para ganhar peso, escolhe um alvo acima dos ${kg} kg de hoje.`,
  hMaintain: (low, high) => `Manter ${low}–${high} kg`,
  hRange: (from, to) => `${from} – ${to}`,
  hSince: (from) => `desde ${from}`,
  hCurrent: 'Atual',
  hReached: (date, kg) => `atingida a ${date} (${kg} kg)`,
  hNotReached: 'não atingida',
  hNotYet: 'ainda não atingida',

  dataTitle: 'Dados',
  importTitle: 'Importar',
  importDesc: 'CSV ou Excel com colunas Data e Peso (kg). Vês todas as linhas antes de gravar.',
  chooseFile: 'Escolher ficheiro',
  readFailed: 'Não foi possível ler o ficheiro. Usa um .csv ou .xlsx.',
  noColumns: 'O ficheiro não tem colunas Data e Peso.',
  nothingValid: 'Nenhuma linha do ficheiro pode ser gravada.',
  previewOf: (file) => `Verificar ${file}`,
  pTotal: (n) => `${n} ${plural(n, 'linha', 'linhas')}`,
  pNew: (n) => `${n} ${plural(n, 'nova', 'novas')}`,
  pChanged: (n) => `${n} ${plural(n, 'alterada', 'alteradas')}`,
  pSame: (n) => `${n} ${plural(n, 'igual', 'iguais')}`,
  pRejected: (n) => `${n} ${plural(n, 'rejeitada', 'rejeitadas')}`,
  issue: {
    badDate: 'Data inválida',
    badWeight: 'Peso não é um número',
    outOfRange: 'Fora de 30–250 kg',
    duplicate: 'Data repetida no ficheiro',
    future: 'Data no futuro',
  },
  changeNew: 'Nova',
  changeSame: 'Igual',
  changeFrom: (prev) => `era ${prev} kg`,
  modeMerge: 'Juntar e atualizar',
  modeMergeDesc: 'Datas novas são acrescentadas e as alteradas substituídas. O resto fica igual.',
  modeReplace: 'Substituir tudo',
  modeReplaceDesc: (n) =>
    `${plural(n, 'A tua pesagem guardada é substituída', `As tuas ${n} pesagens guardadas são substituídas`)} pelo ficheiro.`,
  saveImport: (n) => `Gravar ${n} ${plural(n, 'registo', 'registos')}`,
  colRow: 'Linha',
  colStatus: 'Estado',
  rejectedTitle: 'Linhas rejeitadas',
  validTitle: 'Linhas a gravar',
  exportTitle: 'Exportar',
  exportDesc: (n) => `${n} ${plural(n, 'pesagem', 'pesagens')}, com categorias e notas.`,
  exportXlsx: 'Descarregar .xlsx',
  exportCsv: 'Descarregar .csv',
  nothingToExport: 'Ainda não há nada para exportar.',
  accountTitle: 'Conta e sincronização',
  accountDescOut: 'Entra para teres as pesagens e as metas em todos os dispositivos.',
  accountDescIn: (who) => `Sessão iniciada como ${who}. Pesagens e metas sincronizam com a tua conta.`,
  accountOff: 'A sincronização não está configurada nesta versão. Tudo fica neste dispositivo.',
  dangerTitle: 'Apagar todos os registos',
  dangerDesc: (n) =>
    `Remove as ${n} pesagens daqui e da conta sincronizada. Exporta primeiro se quiseres uma cópia.`,
  deleteAll: 'Apagar tudo',
  deleteAllTitle: 'Apagar todos os registos?',
  deleteAllDesc: (n) =>
    `As ${n} pesagens são removidas deste dispositivo e da tua conta. Podes desfazer durante alguns segundos.`,

  loading: 'A carregar os teus registos',
  loadErrorTitle: 'Não foi possível ler os registos guardados neste dispositivo.',
  loadErrorDesc: 'Nada foi apagado. Tenta de novo, ou entra na conta para os carregar de lá.',

  fmtDate: (iso) => format(parseISO(iso), 'd MMM yyyy', { locale: ptLocale }),
  fmtShort: (iso) => format(parseISO(iso), 'd MMM', { locale: ptLocale }),
  fmtDay: (iso) => format(parseISO(iso), "EEEE, d MMM yyyy", { locale: ptLocale }),
  fmtWeekday: (iso) => format(parseISO(iso), 'EEEE', { locale: ptLocale }),
};

// ── Dictionary ───────────────────────────────────────────────────────────────

const dict: Record<Locale, T> = { en, pt };

/** Returns the full translation object for the active locale. */
export function useT(): T {
  const locale = useStore((s) => s.locale);
  return dict[locale] ?? en;
}

/** Returns the translations for a given locale (no React required). */
export function getT(locale: Locale): T {
  return dict[locale] ?? en;
}
