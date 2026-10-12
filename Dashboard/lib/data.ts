import Papa from 'papaparse'

export const BLUE = '#1F5FA8'
export const RED = '#C0392B'
export const INK = '#14213D'
export const GOLD = '#E8B84A'
export const GREY = '#B8BDC7'
// neutral colours for stacked charts (candidate colours are reserved for Brown / Moreno)
export const NEUTRAL = ['#6a51a3', '#e6a817', '#2a9d8f', '#8d6e63', '#9e9e9e', '#5AA3C7', '#C97B3F', '#8BA86B', '#D98E8E', '#6B7A99']
// same colours as the analysis notebooks
export const BLUE_LIGHT = '#9fbbe0'
export const RED_LIGHT = '#e8aaa3'
export const OTHER_GREY = '#9e9e9e'
export const SHADES: Record<'Brown' | 'Moreno', string[]> = {
  Brown: ['#1f5fa8', '#5b8cc6', '#9fbbe0', '#c9daf0'],
  Moreno: ['#c0392b', '#d4766c', '#e8aaa3', '#f3d3cf'],
}
export const COMM_COLORS: Record<string, string> = {
  'TV, radio & other media': '#6a51a3', 'Digital advertising': '#e6a817', 'Direct mail & printing': '#2a9d8f',
  'Texting & phone': '#8d6e63', 'Canvassing & field': '#9e9e9e',
}
export const TYPE_COLORS: Record<string, string> = {
  'Voter communication': '#6a51a3', 'Fundraising costs': '#e6a817', 'Staff, overhead and other': '#9e9e9e',
}
export const OUTSIDE_COLORS: Record<string, string> = {
  'TV, radio & other media': '#6a51a3', 'Digital advertising': '#e6a817', 'Direct mail & printing': '#2a9d8f',
  'Canvassing & field': '#8d6e63', 'Other (small categories)': '#9e9e9e',
}

export type Cand = 'Brown' | 'Moreno'

export type CampRow = {
  date: string; month: string; quarter: string; candidate: Cand
  committee_id: string; committee: string; committee_type: 'Campaign' | 'Affiliated'
  category: string; spending_type: string; payee: string; purpose: string
  amount: number; possible_repeat: boolean
}
export type OutRow = {
  date: string; month: string; quarter: string; side: Cand; tone: 'Support' | 'Attack'
  committee_id: string; committee: string; category: string; payee: string; purpose: string
  amount: number; possible_repeat: boolean
}
export type KeyDate = { event: string; date: string; description: string }
export type Data = { camp: CampRow[]; out: OutRow[]; keyDates: KeyDate[] }

async function csv(file: string): Promise<Record<string, string>[]> {
  const res = await fetch(`/data/${file}`)
  if (!res.ok) throw new Error(`Could not load ${file}`)
  const text = await res.text()
  return Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }).data
}

const truthy = (v: string) => ['true', '1', 'yes'].includes(String(v).trim().toLowerCase())

export async function loadAll(): Promise<Data> {
  const [c, o, k] = await Promise.all([csv('campaign_spending.csv'), csv('outside_spending.csv'), csv('key_dates.csv')])
  return {
    camp: c.map((x) => ({ ...x, amount: Number(x.amount), possible_repeat: truthy(x.possible_repeat) })) as unknown as CampRow[],
    out: o.map((x) => ({ ...x, amount: Number(x.amount), possible_repeat: truthy(x.possible_repeat) })) as unknown as OutRow[],
    keyDates: k as unknown as KeyDate[],
  }
}

export type Filters = {
  focus: 'All' | Cand        // highlight one candidate (the other is faded, never removed)
  category: string; committee: string; group: string
  affiliated: boolean
}

export const FIRST_DAY = '2023-01-01'
export const LAST_DAY = '2024-12-31'

export const DEFAULT_FILTERS: Filters = {
  focus: 'All', category: 'All', committee: 'All', group: 'All', affiliated: false,
}

// name = label in tables and downloads; short = two-line axis label
export const PHASES = [
  { name: '2023', short: '2023', s: '2023-01-01', e: '2023-12-31' },
  { name: 'Jan 1 to Mar 19, 2024', short: 'Jan 1 –\nMar 19', s: '2024-01-01', e: '2024-03-19' },
  { name: 'Mar 20 to Aug 31, 2024', short: 'Mar 20 –\nAug 31', s: '2024-03-20', e: '2024-08-31' },
  { name: 'Sep 1 to Nov 5, 2024', short: 'Sep 1 –\nNov 5', s: '2024-09-01', e: '2024-11-05' },
  { name: 'Nov 6 to Dec 31, 2024', short: 'After\nElection Day', s: '2024-11-06', e: '2024-12-31' },
]
export const phaseShort = (name: string) => PHASES.find((p) => p.name === name)?.short ?? name

export const COMM_CATEGORIES = [
  'TV, radio & other media', 'Digital advertising', 'Direct mail & printing', 'Texting & phone', 'Canvassing & field',
]
