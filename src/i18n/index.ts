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
  headInBand: (low: string, high: string) => string;
  headAboveBand: (kg: string) => string;
  headBelowBand: (kg: string) => string;
  headToGo: (kg: string, target: string) => string;
  headReached: (target: string) => string;
  headPastTarget: (kg: string) => string;
  trendWord: Record<DeltaDirection, string>;
  emptyHead: string;
  emptySub: string;
  todayLine: (date: string) => string;
  lastWeighIn: (date: string) => string;
  avg7Line: (kg: string, n: number) => string;

  // today — KPIs
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
  kPaceEta: (date: string) => string;
  kPaceNoEta: string;
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
  rCapInside: (kg: string, low: string, aboveLow: string, belowHigh: string) => string;
  rCapAbove: (kg: string, over: string) => string;
  rCapBelow: (kg: string, under: string) => string;
  rCapReach: (pct: string, start: string, target: string) => string;
  rCapReached: (target: string, date: string, kg: string) => string;
  rCapNone: string;
  setMaintain: string;
  setGoal: string;
  rulerAria: (parts: string) => string;
  stripTitle: string;
  stripInBand: (n: number, total: number) => string;
  stripLogged: (n: number) => string;
  sInBand: string;
  sOut: string;
  sWeighed: string;
  sNone: string;

  // log
  logTitle: string;
  dateLbl: string;
  weightLbl: string;
  todayWord: string;
  yesterdayWord: string;
  save: string;
  replaceBtn: (kg: string) => string;
  existsNote: (kg: string, date: string) => string;
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
  effSub: string;
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
  kPaceRange: (early: string, late: string) => string;
  kPaceFrom: (early: string) => string;
  compareBtn: string;
  lPrevious: (from: string, to: string) => string;
  compareThis: string;
  comparePrev: string;
  compareNone: string;
  compareRange: (low: string, high: string) => string;
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
  rangeDates: (from: string, to: string, n: number) => string;
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
  logScreenSub: (n: number, from: string, to: string) => string;
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
  goalSub: string;
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
  dataSub: (n: number) => string;
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

  headInBand: (low, high) => `inside ${low}–${high} kg`,
  headAboveBand: (kg) => `${kg} kg above your range`,
  headBelowBand: (kg) => `${kg} kg below your range`,
  headToGo: (kg, target) => `${kg} kg to ${target}`,
  headReached: (target) => `${target} kg goal reached`,
  headPastTarget: (kg) => `${kg} kg past your goal`,
  trendWord: { down: 'trending down', up: 'trending up', flat: 'holding steady' },
  emptyHead: 'Log your first weight',
  emptySub: 'Your averages, trend and goal appear from the first few weigh-ins.',
  todayLine: (date) => date,
  lastWeighIn: (date) => `last weigh-in ${date}`,
  avg7Line: (kg, n) => `7-day average ${kg} kg from ${n} ${plural(n, 'weigh-in', 'weigh-ins')}`,

  kAvg7: '7-day average',
  kAvg7Cap: (n) => `${n} ${plural(n, 'weigh-in', 'weigh-ins')} in 7 days`,
  kVsPrev: 'vs the 7 days before',
  kVsPrevCap: { down: 'going down', up: 'going up', flat: 'steady' },
  kBelow: (kg) => `Below ${kg} kg`,
  kDays: (n) => `${n} ${plural(n, 'day', 'days')}`,
  kSince: (date) => `since ${date}`,
  kNotBelow: (kg) => `at or above ${kg} kg today`,
  kAbove: (kg) => `Above ${kg} kg`,
  kNotAbove: (kg) => `at or below ${kg} kg today`,
  kSinceStart: 'Since the start',
  kSinceStartCap: (kg, date) => `from ${kg} kg on ${date}`,
  kToGo: 'To go',
  kToGoCap: (target) => `to ${target} kg`,
  kPace: 'Pace, 28 days',
  kPaceUnit: 'kg/wk',
  kPaceEta: (date) => `goal around ${date}`,
  kPaceNoEta: 'not heading to the goal yet',
  kNoData: 'not enough weigh-ins',

  rulerMaintain: 'Maintaining weight',
  rulerReach: 'Way to the goal',
  rulerNone: 'Where you are',
  rStart: 'start',
  rToday: 'today',
  rAvg: '7-day avg',
  rGoal: 'goal',
  rBand: 'range',
  rCapInside: (kg, low, aboveLow, belowHigh) =>
    `Today's ${kg} kg is ${aboveLow} kg above the bottom of the range (${low} kg) and ${belowHigh} kg under the top.`,
  rCapAbove: (kg, over) => `Today's ${kg} kg is ${over} kg over the top of the range.`,
  rCapBelow: (kg, under) => `Today's ${kg} kg is ${under} kg under the bottom of the range.`,
  rCapReach: (pct, start, target) => `${pct}% of the way from ${start} kg to ${target} kg.`,
  rCapReached: (target, date, kg) => `Passed ${target} kg on ${date} (${kg} kg).`,
  rCapNone: 'Set a goal to see your target or the weight to maintain here.',
  setMaintain: 'Set a weight to maintain',
  setGoal: 'Set a goal',
  rulerAria: (parts) => `Scale in kilograms: ${parts}`,
  stripTitle: 'Last 30 days',
  stripInBand: (n, total) => `Inside the range on ${n} of ${total} days with a weigh-in.`,
  stripLogged: (n) => `${n} of the last 30 days have a weigh-in.`,
  sInBand: 'inside',
  sOut: 'outside',
  sWeighed: 'weigh-in',
  sNone: 'no weigh-in',

  logTitle: 'Log weight',
  dateLbl: 'Date',
  weightLbl: 'Weight in kg',
  todayWord: 'Today',
  yesterdayWord: 'Yesterday',
  save: 'Save',
  replaceBtn: (kg) => `Replace ${kg}`,
  existsNote: (kg, date) => `${date} already has ${kg} kg.`,
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
  noteAbout: (prevDay) => `What happened the day before (${prevDay}) that may explain this weight.`,
  effTitle: 'What explains the swings',
  effSub: 'How far a weigh-in sits from your previous 7-day average after a day with each category, against weigh-ins with no category.',
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
  effMethod:
    'Bars show the average difference with an 80% range. 5 to 9 weigh-ins: indicative. A day with two categories counts for both. These are patterns in your data, not causes.',
  effAria: (label, kg, low, high, n) =>
    `${label}: ${kg} kg on average, range ${low} to ${high} kg, ${n} weigh-ins`,
  driftUp: (limit, date, rate) =>
    `At the last two weeks' pace (${rate} kg/wk), your 7-day average passes ${limit} kg around ${date}.`,
  driftDown: (limit, date, rate) =>
    `At the last two weeks' pace (${rate} kg/wk), your 7-day average drops below ${limit} kg around ${date}.`,
  driftNear: (gap, limit) => `Your 7-day average is ${gap} kg from the ${limit} kg limit.`,
  streak: (n) => `${n} ${plural(n, 'day', 'days')} in a row with a weigh-in.`,
  kPaceRange: (early, late) => `goal between ${early} and ${late}`,
  kPaceFrom: (early) => `goal not before ${early}, pace unsteady`,
  compareBtn: 'Compare with previous',
  lPrevious: (from, to) => `Previous period, ${from} – ${to}`,
  compareThis: 'This period',
  comparePrev: 'Previous period',
  compareNone: 'No weigh-ins in the previous period.',
  compareRange: (low, high) => `${low}–${high} kg`,
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
  rangeDates: (from, to, n) => `${from} to ${to}, ${n} ${plural(n, 'weigh-in', 'weigh-ins')}`,
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
  logScreenSub: (n, from, to) =>
    `${n} ${plural(n, 'weigh-in', 'weigh-ins')} from ${from} to ${to}`,
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
  goalSub: 'Lose weight, gain weight, or maintain it.',
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
  dataSub: (n) => `${n} ${plural(n, 'weigh-in', 'weigh-ins')} saved`,
  importTitle: 'Import',
  importDesc:
    'CSV or Excel with a Date column (2026-10-25 or 25/10/2026) and a Weight column in kg. You see every row before anything is saved.',
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
  exportDesc: (n) => `All ${n} weigh-ins with their dates, in kg.`,
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

  headInBand: (low, high) => `dentro de ${low}–${high} kg`,
  headAboveBand: (kg) => `${kg} kg acima do intervalo`,
  headBelowBand: (kg) => `${kg} kg abaixo do intervalo`,
  headToGo: (kg, target) => `faltam ${kg} kg para ${target}`,
  headReached: (target) => `meta de ${target} kg atingida`,
  headPastTarget: (kg) => `${kg} kg além da meta`,
  trendWord: { down: 'a descer', up: 'a subir', flat: 'tendência estável' },
  emptyHead: 'Regista o teu primeiro peso',
  emptySub: 'As médias, a tendência e a meta aparecem a partir das primeiras pesagens.',
  todayLine: (date) => date,
  lastWeighIn: (date) => `última pesagem a ${date}`,
  avg7Line: (kg, n) => `média de 7 dias ${kg} kg em ${n} ${plural(n, 'pesagem', 'pesagens')}`,

  kAvg7: 'Média 7 dias',
  kAvg7Cap: (n) => `${n} ${plural(n, 'pesagem', 'pesagens')} em 7 dias`,
  kVsPrev: 'vs 7 dias antes',
  kVsPrevCap: { down: 'a descer', up: 'a subir', flat: 'estável' },
  kBelow: (kg) => `Abaixo de ${kg} kg`,
  kDays: (n) => `${n} ${plural(n, 'dia', 'dias')}`,
  kSince: (date) => `desde ${date}`,
  kNotBelow: (kg) => `hoje em ${kg} kg ou mais`,
  kAbove: (kg) => `Acima de ${kg} kg`,
  kNotAbove: (kg) => `hoje em ${kg} kg ou menos`,
  kSinceStart: 'Desde o início',
  kSinceStartCap: (kg, date) => `de ${kg} kg a ${date}`,
  kToGo: 'Falta',
  kToGoCap: (target) => `até ${target} kg`,
  kPace: 'Ritmo, 28 dias',
  kPaceUnit: 'kg/sem',
  kPaceEta: (date) => `meta por volta de ${date}`,
  kPaceNoEta: 'ainda sem direção à meta',
  kNoData: 'poucas pesagens',

  rulerMaintain: 'Manter peso',
  rulerReach: 'Caminho até à meta',
  rulerNone: 'Onde estás',
  rStart: 'início',
  rToday: 'hoje',
  rAvg: 'média 7 dias',
  rGoal: 'meta',
  rBand: 'intervalo',
  rCapInside: (kg, low, aboveLow, belowHigh) =>
    `Hoje, ${kg} kg está ${aboveLow} kg acima do limite inferior (${low} kg) e ${belowHigh} kg abaixo do superior.`,
  rCapAbove: (kg, over) => `Hoje, ${kg} kg está ${over} kg acima do limite superior.`,
  rCapBelow: (kg, under) => `Hoje, ${kg} kg está ${under} kg abaixo do limite inferior.`,
  rCapReach: (pct, start, target) => `${pct}% do caminho entre ${start} kg e ${target} kg.`,
  rCapReached: (target, date, kg) => `Passaste os ${target} kg a ${date} (${kg} kg).`,
  rCapNone: 'Define uma meta para ver aqui o alvo ou o peso a manter.',
  setMaintain: 'Definir peso a manter',
  setGoal: 'Definir meta',
  rulerAria: (parts) => `Escala em quilos: ${parts}`,
  stripTitle: 'Últimos 30 dias',
  stripInBand: (n, total) => `Dentro do intervalo em ${n} dos ${total} dias com pesagem.`,
  stripLogged: (n) => `${n} dos últimos 30 dias têm pesagem.`,
  sInBand: 'dentro',
  sOut: 'fora',
  sWeighed: 'pesagem',
  sNone: 'sem pesagem',

  logTitle: 'Registar peso',
  dateLbl: 'Data',
  weightLbl: 'Peso em kg',
  todayWord: 'Hoje',
  yesterdayWord: 'Ontem',
  save: 'Gravar',
  replaceBtn: (kg) => `Substituir ${kg}`,
  existsNote: (kg, date) => `${date} já tem ${kg} kg.`,
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
  noteAbout: (prevDay) => `O que aconteceu no dia anterior (${prevDay}) e pode explicar este peso.`,
  effTitle: 'O que explica as variações',
  effSub: 'Quanto uma pesagem se afasta da tua média dos 7 dias anteriores depois de um dia com cada categoria, comparado com as pesagens sem categoria.',
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
  effMethod:
    'As barras mostram a diferença média com um intervalo de 80%. 5 a 9 pesagens: indicativo. Um dia com duas categorias conta para as duas. São padrões nos teus dados, não causas.',
  effAria: (label, kg, low, high, n) =>
    `${label}: ${kg} kg em média, intervalo de ${low} a ${high} kg, ${n} pesagens`,
  driftUp: (limit, date, rate) =>
    `Ao ritmo das últimas 2 semanas (${rate} kg/sem), a média de 7 dias passa os ${limit} kg por volta de ${date}.`,
  driftDown: (limit, date, rate) =>
    `Ao ritmo das últimas 2 semanas (${rate} kg/sem), a média de 7 dias desce abaixo dos ${limit} kg por volta de ${date}.`,
  driftNear: (gap, limit) => `A média de 7 dias está a ${gap} kg do limite de ${limit} kg.`,
  streak: (n) => `${n} ${plural(n, 'dia seguido', 'dias seguidos')} com pesagem.`,
  kPaceRange: (early, late) => `meta entre ${early} e ${late}`,
  kPaceFrom: (early) => `meta não antes de ${early}, ritmo instável`,
  compareBtn: 'Comparar com o anterior',
  lPrevious: (from, to) => `Período anterior, ${from} – ${to}`,
  compareThis: 'Este período',
  comparePrev: 'Período anterior',
  compareNone: 'Sem pesagens no período anterior.',
  compareRange: (low, high) => `${low}–${high} kg`,
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
  rangeDates: (from, to, n) => `${from} a ${to}, ${n} ${plural(n, 'pesagem', 'pesagens')}`,
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
  logScreenSub: (n, from, to) =>
    `${n} ${plural(n, 'pesagem', 'pesagens')} de ${from} a ${to}`,
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
  goalSub: 'Perder peso, ganhar peso ou manter.',
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
  dataSub: (n) => `${n} ${plural(n, 'pesagem guardada', 'pesagens guardadas')}`,
  importTitle: 'Importar',
  importDesc:
    'CSV ou Excel com uma coluna Data (2026-10-25 ou 25/10/2026) e uma coluna Peso em kg. Vês todas as linhas antes de gravar.',
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
  exportDesc: (n) => `As ${n} pesagens com as datas, em kg.`,
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
