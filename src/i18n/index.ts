import { format, parseISO } from 'date-fns';
import { enUS, pt as ptLocale } from 'date-fns/locale';
import type { InsightStrings, Locale } from '@/types';
import { useStore } from '@/store/useStore';

export type { Locale, InsightStrings };

// ── Full translation interface ─────────────────────────────────────────────

export interface T {
  // Header / auth
  signIn: string;
  signOut: string;
  signedInAs: (name: string) => string;
  syncLocalFailed: string;
  syncedMsg: string;
  offlineMsg: string;
  importBtn: string;
  exportBtn: string;
  showLabelsBtn: string;
  hideLabelsBtn: string;
  language: string;

  // Dashboard sections
  trends: string;
  showingOf: (shown: number, total: number) => string;
  dailyWeight: string;
  weeklyAvg: string;
  monthlyAvg: string;
  dailyLog: string;
  weeklyAvgs: string;
  monthlyAvgs: string;

  // Overlay / granularity / range
  overlayTrend: string;
  overlayMa: string;
  granWeekly: string;
  granMonthly: string;
  range7d: string;
  range30d: string;
  range90d: string;
  rangeYtd: string;
  rangeAll: string;

  // KPI cards
  totalEntries: string;
  latest: string;
  thisWeek: string;
  vsLastWeek: string;
  sinceWeek1: string;
  rate: string;
  measuredN: (n: number) => string;
  need2Weeks: string;
  trendRate: string;
  goalAround: (date: string) => string;

  // Log form
  logWeight: string;
  dateLbl: string;
  weightKgLbl: string;
  save: string;

  // Goal
  goalLbl: string;
  targetKg: string;
  noneSet: string;
  clearGoal: string;
  goalOnTrack: (weight: string, date: string) => string;
  goalShownOnCharts: string;
  goalPrompt: string;

  // Chart tooltip
  weightLbl: string;
  deltaLbl: string;
  averageLbl: string;
  entriesLbl: string;
  weekNum: (n: number) => string;
  monthNum: (n: number) => string;
  resetZoom: string;

  // Table headers
  dateCol: string;
  weightCol: string;
  changeCol: string;
  avgCol: string;
  weekCol: string;
  monthCol: string;

  // Empty / info states
  noEntriesInRange: string;
  noChartData: string;
  noWeeklyData: string;
  noMonthlyData: string;
  periodsShown: (n: number, unit: 'week' | 'month') => string;
  noEntriesYet: string;
  noEntriesYetDesc: string;

  // Insights panel
  insightsTitle: string;
  insightsSub: string;
  insightsEmpty: string;

  // File controls
  replaceTitle: string;
  replaceDesc: (current: number, imported: number) => string;
  replaceBtn: string;
  cancelBtn: string;

  // Delete dialog
  deleteTitle: string;
  deleteDesc: (date: string) => string;
  deleteBtn: string;

  // Toast messages
  toastAdded: (date: string, weight: string) => string;
  toastUpdated: (date: string, weight: string) => string;
  toastDeleted: (date: string) => string;

  // Insight text strings (passed into the domain)
  insights: InsightStrings;

  // Locale-aware date formatters
  fmtDate: (iso: string) => string;
  fmtDateLong: (iso: string) => string;
}

// ── English ─────────────────────────────────────────────────────────────────

const en: T = {
  signIn: 'Sign in',
  signOut: 'Sign out',
  signedInAs: (name) => `Signed in as ${name}`,
  syncLocalFailed: 'Could not sync local data to the cloud.',
  syncedMsg: 'Synced',
  offlineMsg: 'Offline — changes will sync when back online',
  importBtn: 'Import',
  exportBtn: 'Export',
  showLabelsBtn: 'Show labels',
  hideLabelsBtn: 'Hide labels',
  language: 'Language',

  trends: 'Trends',
  showingOf: (shown, total) => `Showing ${shown} of ${total} entries`,
  dailyWeight: 'Daily weight',
  weeklyAvg: 'Weekly average',
  monthlyAvg: 'Monthly average',
  dailyLog: 'Daily log',
  weeklyAvgs: 'Weekly averages',
  monthlyAvgs: 'Monthly averages',

  overlayTrend: 'Trend',
  overlayMa: '7-day avg',
  granWeekly: 'Weekly',
  granMonthly: 'Monthly',
  range7d: '7D',
  range30d: '30D',
  range90d: '90D',
  rangeYtd: 'YTD',
  rangeAll: 'All',

  totalEntries: 'Total entries',
  latest: 'Latest',
  thisWeek: 'This week',
  vsLastWeek: 'vs last week',
  sinceWeek1: 'Since week 1',
  rate: 'Rate',
  measuredN: (n) => `${n}× measured`,
  need2Weeks: 'need 2+ weeks',
  trendRate: 'trend rate of change',
  goalAround: (date) => `goal ~${date}`,

  logWeight: 'Log weight',
  dateLbl: 'Date',
  weightKgLbl: 'Weight (kg)',
  save: 'Save',

  goalLbl: 'Goal',
  targetKg: 'Target (kg)',
  noneSet: 'None set',
  clearGoal: 'Clear goal',
  goalOnTrack: (weight, date) =>
    `On track to reach ${weight} kg around ${date}.`,
  goalShownOnCharts: 'Shown as a line on the charts.',
  goalPrompt: 'Set a target to see a goal line and projection.',

  weightLbl: 'Weight',
  deltaLbl: 'Delta',
  averageLbl: 'Average',
  entriesLbl: 'Entries',
  weekNum: (n) => `Week #${n}`,
  monthNum: (n) => `Month #${n}`,
  resetZoom: 'Reset zoom',

  dateCol: 'Date',
  weightCol: 'Weight',
  changeCol: 'Change',
  avgCol: 'Avg',
  weekCol: 'Week',
  monthCol: 'Month',

  noEntriesInRange: 'No entries in this range.',
  noChartData: 'No data in this range — add an entry to begin.',
  noWeeklyData: 'No weekly data in this range.',
  noMonthlyData: 'No monthly data in this range.',
  periodsShown: (n, unit) =>
    `${n} ${unit}${n === 1 ? '' : 's'} shown`,
  noEntriesYet: 'No entries yet',
  noEntriesYetDesc:
    'Log your first weight using the form above, or import an existing .xlsx file from the header.',

  insightsTitle: 'Insights',
  insightsSub: 'patterns found in your data',
  insightsEmpty:
    'Keep logging — insights appear once there\'s enough history to spot trends.',

  replaceTitle: 'Replace current data?',
  replaceDesc: (current, imported) =>
    `This will replace your current ${current} entries with ${imported} imported entries. Export first if you want a backup.`,
  replaceBtn: 'Replace',
  cancelBtn: 'Cancel',

  deleteTitle: 'Delete entry?',
  deleteDesc: (date) =>
    `Delete the entry for ${date}? This cannot be undone.`,
  deleteBtn: 'Delete',

  insights: {
    reachedGoal: (g) => `You've reached your goal of ${g} kg — nice work.`,
    goalPace: (g, date, weeks) =>
      `At your current pace, you'll reach ${g} kg around ${date} — about ${weeks} week${weeks === 1 ? '' : 's'} away.`,
    progress: (pct, start, goal) =>
      `You're ${pct}% of the way from your start (${start} kg) to your goal (${goal} kg).`,
    windowLost: (kg, days) => `You've lost ${kg} over the last ${days} days.`,
    windowGained: (kg, days) =>
      `You've gained ${kg} over the last ${days} days.`,
    accelAccel: (recent, prior) =>
      `Your weight loss is accelerating — ${recent} in the last 30 days vs ${prior} the 30 days before.`,
    accelSlow: (recent, prior) =>
      `Your weight loss is slowing — ${recent} in the last 30 days vs ${prior} the 30 days before.`,
    consistency: (drops, m) =>
      `Weight decreased in ${drops} of your last ${m} measurements.`,
    bestWeek: (start, end, kg) =>
      `Your fastest week was ${start} – ${end}, down ${kg}.`,
    contribution: (pct) =>
      `The last 14 days account for ${pct}% of your total weight loss.`,
    compareStronger: (thisRate, lastRate) =>
      `This month's pace (${thisRate} kg/wk) is stronger than last month's (${lastRate} kg/wk).`,
    compareWeaker: (thisRate, lastRate) =>
      `This month's pace (${thisRate} kg/wk) is weaker than last month's (${lastRate} kg/wk).`,
  },

  toastAdded: (date, weight) => `Added ${date} — ${weight}`,
  toastUpdated: (date, weight) => `Updated ${date} — ${weight}`,
  toastDeleted: (date) => `Deleted entry for ${date}`,

  fmtDate: (iso) => format(parseISO(iso), 'dd MMM yyyy', { locale: enUS }),
  fmtDateLong: (iso) =>
    format(parseISO(iso), 'dd MMM yyyy (EEEE)', { locale: enUS }),
};

// ── Portuguese ───────────────────────────────────────────────────────────────

const pt: T = {
  signIn: 'Iniciar sessão',
  signOut: 'Terminar sessão',
  signedInAs: (name) => `Sessão iniciada como ${name}`,
  syncLocalFailed: 'Não foi possível sincronizar os dados locais para a cloud.',
  syncedMsg: 'Sincronizado',
  offlineMsg: 'Sem ligação — as alterações sincronizam quando voltares online',
  importBtn: 'Importar',
  exportBtn: 'Exportar',
  showLabelsBtn: 'Mostrar rótulos',
  hideLabelsBtn: 'Ocultar rótulos',
  language: 'Idioma',

  trends: 'Tendências',
  showingOf: (shown, total) => `A mostrar ${shown} de ${total} entradas`,
  dailyWeight: 'Peso diário',
  weeklyAvg: 'Média semanal',
  monthlyAvg: 'Média mensal',
  dailyLog: 'Registo diário',
  weeklyAvgs: 'Médias semanais',
  monthlyAvgs: 'Médias mensais',

  overlayTrend: 'Tendência',
  overlayMa: 'Méd. 7 dias',
  granWeekly: 'Semanal',
  granMonthly: 'Mensal',
  range7d: '7D',
  range30d: '30D',
  range90d: '90D',
  rangeYtd: 'YTD',
  rangeAll: 'Tudo',

  totalEntries: 'Total de entradas',
  latest: 'Último',
  thisWeek: 'Esta semana',
  vsLastWeek: 'vs sem. anterior',
  sinceWeek1: 'Desde a semana 1',
  rate: 'Ritmo',
  measuredN: (n) => `${n}× medido`,
  need2Weeks: 'precisas de 2+ semanas',
  trendRate: 'taxa de variação',
  goalAround: (date) => `objetivo ~${date}`,

  logWeight: 'Registar peso',
  dateLbl: 'Data',
  weightKgLbl: 'Peso (kg)',
  save: 'Guardar',

  goalLbl: 'Objetivo',
  targetKg: 'Alvo (kg)',
  noneSet: 'Não definido',
  clearGoal: 'Limpar objetivo',
  goalOnTrack: (weight, date) =>
    `No caminho certo para chegar aos ${weight} kg por volta de ${date}.`,
  goalShownOnCharts: 'Apresentado como linha nos gráficos.',
  goalPrompt: 'Define um alvo para ver a linha objetivo e projeção.',

  weightLbl: 'Peso',
  deltaLbl: 'Variação',
  averageLbl: 'Média',
  entriesLbl: 'Entradas',
  weekNum: (n) => `Semana #${n}`,
  monthNum: (n) => `Mês #${n}`,
  resetZoom: 'Repor zoom',

  dateCol: 'Data',
  weightCol: 'Peso',
  changeCol: 'Variação',
  avgCol: 'Média',
  weekCol: 'Semana',
  monthCol: 'Mês',

  noEntriesInRange: 'Nenhuma entrada neste intervalo.',
  noChartData: 'Sem dados neste intervalo — adiciona uma entrada para começar.',
  noWeeklyData: 'Sem dados semanais neste intervalo.',
  noMonthlyData: 'Sem dados mensais neste intervalo.',
  periodsShown: (n, unit) =>
    unit === 'week'
      ? `${n} semana${n === 1 ? '' : 's'} mostrada${n === 1 ? '' : 's'}`
      : `${n} ${n === 1 ? 'mês mostrado' : 'meses mostrados'}`,
  noEntriesYet: 'Sem entradas ainda',
  noEntriesYetDesc:
    'Regista o teu primeiro peso usando o formulário acima, ou importa um ficheiro .xlsx existente do cabeçalho.',

  insightsTitle: 'Análise',
  insightsSub: 'padrões encontrados nos teus dados',
  insightsEmpty:
    'Continua a registar — as análises aparecem quando houver histórico suficiente.',

  replaceTitle: 'Substituir dados atuais?',
  replaceDesc: (current, imported) =>
    `Isto vai substituir as tuas ${current} entradas atuais por ${imported} entradas importadas. Exporta primeiro se quiseres uma cópia.`,
  replaceBtn: 'Substituir',
  cancelBtn: 'Cancelar',

  deleteTitle: 'Eliminar entrada?',
  deleteDesc: (date) =>
    `Eliminar a entrada de ${date}? Esta ação não pode ser desfeita.`,
  deleteBtn: 'Eliminar',

  insights: {
    reachedGoal: (g) => `Atingiste o teu objetivo de ${g} kg — parabéns.`,
    goalPace: (g, date, weeks) =>
      `Ao teu ritmo atual, vais chegar aos ${g} kg por volta de ${date} — cerca de ${weeks} semana${weeks === 1 ? '' : 's'}.`,
    progress: (pct, start, goal) =>
      `Estás a ${pct}% do caminho entre o início (${start} kg) e o objetivo (${goal} kg).`,
    windowLost: (kg, days) => `Perdeste ${kg} nos últimos ${days} dias.`,
    windowGained: (kg, days) => `Ganhaste ${kg} nos últimos ${days} dias.`,
    accelAccel: (recent, prior) =>
      `A tua perda de peso está a acelerar — ${recent} nos últimos 30 dias vs ${prior} nos 30 dias anteriores.`,
    accelSlow: (recent, prior) =>
      `A tua perda de peso está a abrandar — ${recent} nos últimos 30 dias vs ${prior} nos 30 dias anteriores.`,
    consistency: (drops, m) =>
      `O peso diminuiu em ${drops} das tuas últimas ${m} medições.`,
    bestWeek: (start, end, kg) =>
      `A tua melhor semana foi ${start} – ${end}, menos ${kg}.`,
    contribution: (pct) =>
      `Os últimos 14 dias representam ${pct}% da tua perda total de peso.`,
    compareStronger: (thisRate, lastRate) =>
      `O ritmo deste mês (${thisRate} kg/sem) é mais forte do que o do mês passado (${lastRate} kg/sem).`,
    compareWeaker: (thisRate, lastRate) =>
      `O ritmo deste mês (${thisRate} kg/sem) é mais fraco do que o do mês passado (${lastRate} kg/sem).`,
  },

  toastAdded: (date, weight) => `Adicionado ${date} — ${weight}`,
  toastUpdated: (date, weight) => `Atualizado ${date} — ${weight}`,
  toastDeleted: (date) => `Entrada de ${date} eliminada`,

  fmtDate: (iso) => format(parseISO(iso), 'dd MMM yyyy', { locale: ptLocale }),
  fmtDateLong: (iso) =>
    format(parseISO(iso), "dd MMM yyyy (EEEE)", { locale: ptLocale }),
};

// ── Dictionary ───────────────────────────────────────────────────────────────

const dict: Record<Locale, T> = { en, pt };

// ── Hook ─────────────────────────────────────────────────────────────────────

/** Returns the full translation object for the active locale. */
export function useT(): T {
  const locale = useStore((s) => s.locale);
  return dict[locale] ?? en;
}

/** Returns the translations for a given locale (no React required). */
export function getT(locale: Locale): T {
  return dict[locale] ?? en;
}
