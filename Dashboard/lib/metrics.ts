import { CampRow, OutRow, Filters, Cand, Data, PHASES, COMM_CATEGORIES, FIRST_DAY, LAST_DAY, KeyDate } from './data'

export const CANDS: Cand[] = ['Brown', 'Moreno']

/* ---------- basic helpers ---------- */
export const sum = (a: { amount: number }[]) => a.reduce((s, r) => s + r.amount, 0)

export function groupSum<T extends { amount: number }>(rows: T[], key: (r: T) => string) {
  const m = new Map<string, number>()
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + r.amount)
  return m
}

export const median = (v: number[]) => {
  if (!v.length) return 0
  const s = [...v].sort((a, b) => a - b)
  const h = Math.floor(s.length / 2)
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2
}

export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5)

export const addDays = (d: string, n: number) =>
  new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10)

/* ---------- filtering ---------- */
type CampOpts = { forceAffiliated?: boolean; ignoreCategory?: boolean; ignoreCommittee?: boolean }

export function selCamp(all: CampRow[], f: Filters, o: CampOpts = {}) {
  return all.filter(
    (r) =>
      (o.forceAffiliated || f.affiliated || r.committee_type === 'Campaign') &&
      (o.ignoreCategory || f.category === 'All' || r.category === f.category) &&
      (o.ignoreCommittee || f.committee === 'All' || r.committee === f.committee),
  )
}

export function selOut(all: OutRow[], f: Filters, o: { ignoreGroup?: boolean; ignoreCategory?: boolean } = {}) {
  return all.filter(
    (r) =>
      (o.ignoreCategory || f.category === 'All' || r.category === f.category) &&
      (o.ignoreGroup || f.group === 'All' || r.committee === f.group),
  )
}

export const byCand = (rows: CampRow[], c: Cand) => rows.filter((r) => r.candidate === c)
export const bySide = (rows: OutRow[], c: Cand) => rows.filter((r) => r.side === c)

/* ---------- headline numbers ---------- */
export function headline(camp: CampRow[], out: OutRow[]) {
  const bc = sum(byCand(camp, 'Brown'))
  const mc = sum(byCand(camp, 'Moreno'))
  const ob = sum(bySide(out, 'Brown'))
  const om = sum(bySide(out, 'Moreno'))
  const lead = bc - mc
  const net = om - ob
  return {
    bc, mc, ob, om, lead, net,
    ratio: mc ? bc / mc : NaN,
    offset: lead ? net / lead : NaN,
    brownSide: bc + ob,
    morenoSide: mc + om,
    combined: bc + ob - (mc + om),
    outsideTotal: ob + om,
    brownOutsideShare: bc + ob ? ob / (bc + ob) : NaN,
    morenoOutsideShare: mc + om ? om / (mc + om) : NaN,
  }
}

/* ---------- time series ---------- */
export function monthsBetween(start: string, end: string) {
  const out: string[] = []
  let y = Number(start.slice(0, 4)), m = Number(start.slice(5, 7))
  const ey = Number(end.slice(0, 4)), em = Number(end.slice(5, 7))
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return out
}

export function monthlySpend(camp: CampRow[]) {
  return monthsBetween(FIRST_DAY, LAST_DAY).map((month) => {
    const rows = camp.filter((r) => r.month === month)
    return { key: month, Brown: sum(byCand(rows, 'Brown')), Moreno: sum(byCand(rows, 'Moreno')) }
  })
}

export function quarterlySpend(camp: CampRow[]) {
  const qs = [...new Set(camp.map((r) => r.quarter))].sort()
  return qs.map((q) => {
    const rows = camp.filter((r) => r.quarter === q)
    return { key: q, Brown: sum(byCand(rows, 'Brown')), Moreno: sum(byCand(rows, 'Moreno')) }
  })
}

export function cumulative<T extends { Brown: number; Moreno: number }>(rows: T[]) {
  let b = 0, m = 0
  return rows.map((r) => ({ ...r, Brown: (b += r.Brown), Moreno: (m += r.Moreno) }))
}

/** Daily running totals from 2023-01-01 (campaign committees only, all categories). */
export function dailySeries(data: Data) {
  const camp = data.camp.filter((r) => r.committee_type === 'Campaign')
  const out = data.out
  const delta = new Map<string, { bc: number; mc: number; ob: number; om: number }>()
  const get = (d: string) => {
    let v = delta.get(d)
    if (!v) { v = { bc: 0, mc: 0, ob: 0, om: 0 }; delta.set(d, v) }
    return v
  }
  for (const r of camp) r.candidate === 'Brown' ? (get(r.date).bc += r.amount) : (get(r.date).mc += r.amount)
  for (const r of out) r.side === 'Brown' ? (get(r.date).ob += r.amount) : (get(r.date).om += r.amount)
  const rows: { date: string; campLead: number; lead: number; brownSide: number; morenoSide: number }[] = []
  let bc = 0, mc = 0, ob = 0, om = 0
  const n = daysBetween(FIRST_DAY, LAST_DAY)
  for (let i = 0; i <= n; i++) {
    const d = addDays(FIRST_DAY, i)
    const v = delta.get(d)
    if (v) { bc += v.bc; mc += v.mc; ob += v.ob; om += v.om }
    rows.push({ date: d, campLead: bc - mc, lead: bc + ob - (mc + om), brownSide: bc + ob, morenoSide: mc + om })
  }
  return rows
}

export const MILESTONES_CAMPAIGN = [
  { label: 'End of 2023', date: '2023-12-31' },
  { label: 'Ohio primary (Mar 19)', date: '2024-03-19' },
  { label: 'Lead first passed $25M (Jun 10)', date: '2024-06-10' },
  { label: 'Lead first passed $50M (Sep 23)', date: '2024-09-23' },
  { label: 'Election Day (Nov 5)', date: '2024-11-05' },
  { label: 'End of 2024', date: '2024-12-31' },
]

export const MILESTONES_COMBINED = [
  { label: 'End of 2023', date: '2023-12-31' },
  { label: 'Ohio primary (Mar 19)', date: '2024-03-19' },
  { label: 'End of June', date: '2024-06-30' },
  { label: 'End of August', date: '2024-08-31' },
  { label: "First day Moreno's side was ahead (Sep 24)", date: '2024-09-24' },
  { label: 'End of September', date: '2024-09-30' },
  { label: 'Lowest point (Oct 15)', date: '2024-10-15' },
  { label: 'Election Day (Nov 5)', date: '2024-11-05' },
  { label: 'End of 2024', date: '2024-12-31' },
]

export function leadStats(daily: ReturnType<typeof dailySeries>) {
  if (!daily.length) return null
  let peak = daily[0], low = daily[0], behind = 0
  let firstBehind = '', lastBehind = ''
  for (const d of daily) {
    if (d.lead > peak.lead) peak = d
    if (d.lead < low.lead) low = d
    if (d.lead < 0) {
      behind++
      if (!firstBehind) firstBehind = d.date
      lastBehind = d.date
    }
  }
  return { peak, low, last: daily[daily.length - 1], daysMorenoAhead: behind, firstBehind, lastBehind }
}

/* ---------- phases & key dates (these ignore the timeframe on purpose) ---------- */
export function phaseTable(camp: CampRow[]) {
  const totals: Record<Cand, number> = { Brown: sum(byCand(camp, 'Brown')), Moreno: sum(byCand(camp, 'Moreno')) }
  return PHASES.map((p) => {
    const days = daysBetween(p.s, p.e) + 1
    const rows = camp.filter((r) => r.date >= p.s && r.date <= p.e)
    const row: Record<string, string | number> = { phase: p.name, days }
    for (const c of CANDS) {
      const t = sum(byCand(rows, c))
      row[`${c}_total`] = t
      row[`${c}_share`] = totals[c] ? t / totals[c] : 0
      row[`${c}_weekly`] = t / (days / 7)
    }
    return row
  })
}

/** Average weekly spending in the 4 weeks before vs the 4 weeks from a key date.
 *  For Election Day the "after" window is the final 4 weeks (Oct 9 to Nov 5) and "before" the 4 weeks ahead of them. */
export function keyDateEffects(camp: CampRow[], keyDates: KeyDate[]) {
  return keyDates.map((k) => {
    const isEnd = k.event === 'Election Day'
    const afterStart = isEnd ? addDays(k.date, -27) : k.date
    const afterEnd = isEnd ? k.date : addDays(k.date, 27)
    const beforeStart = addDays(afterStart, -28)
    const beforeEnd = addDays(afterStart, -1)
    const row: Record<string, string | number> = { event: k.event, date: k.date, before_window: `${beforeStart} to ${beforeEnd}`, after_window: `${afterStart} to ${afterEnd}` }
    for (const c of CANDS) {
      const rows = byCand(camp, c)
      const before = sum(rows.filter((r) => r.date >= beforeStart && r.date <= beforeEnd)) / 4
      const after = sum(rows.filter((r) => r.date >= afterStart && r.date <= afterEnd)) / 4
      row[`${c}_before`] = before
      row[`${c}_after`] = after
      row[`${c}_change`] = before ? after / before - 1 : NaN
    }
    return row
  })
}

export function mixByPhase(camp: CampRow[], c: Cand) {
  const types = [...new Set(camp.map((r) => r.spending_type))].sort()
  const rows = byCand(camp, c)
  return {
    types,
    data: PHASES.map((p) => {
      const pr = rows.filter((r) => r.date >= p.s && r.date <= p.e)
      const tot = sum(pr)
      const o: Record<string, string | number> = { phase: p.name }
      for (const t of types) o[t] = tot ? sum(pr.filter((r) => r.spending_type === t)) / tot : 0
      return o
    }),
  }
}

/* ---------- Q2 helpers ---------- */
export const BANDS = ['Under $1K', '$1K to under $10K', '$10K to $100K', 'Over $100K to $1M', 'Over $1M']
export function bandOf(a: number) {
  if (a < 1000) return BANDS[0]
  if (a < 10000) return BANDS[1]
  if (a <= 100000) return BANDS[2]
  if (a <= 1000000) return BANDS[3]
  return BANDS[4]
}

export function scorecard(camp: CampRow[]) {
  return CANDS.map((c) => {
    const rows = byCand(camp, c)
    const total = sum(rows)
    const comm = sum(rows.filter((r) => r.spending_type === 'Voter communication'))
    const payees = [...groupSum(rows, (r) => r.payee).entries()].sort((a, b) => b[1] - a[1])
    const biggest = rows.reduce((m, r) => (r.amount > m ? r.amount : m), 0)
    return {
      cand: c, total,
      commShare: total ? comm / total : NaN,
      count: rows.length,
      median: median(rows.map((r) => r.amount)),
      biggest,
      topVendor: payees[0]?.[0] ?? '-',
      topVendorTotal: payees[0]?.[1] ?? 0,
      topVendorShare: total && payees[0] ? payees[0][1] / total : NaN,
    }
  })
}

export function categoryTable(camp: CampRow[]) {
  const cats = [...new Set(camp.map((r) => r.category))]
  const bt = sum(byCand(camp, 'Brown')), mt = sum(byCand(camp, 'Moreno'))
  return cats
    .map((cat) => {
      const rows = camp.filter((r) => r.category === cat)
      const b = sum(byCand(rows, 'Brown')), m = sum(byCand(rows, 'Moreno'))
      return { category: cat, Brown: b, Moreno: m, BrownShare: bt ? b / bt : 0, MorenoShare: mt ? m / mt : 0, advantage: b - m }
    })
    .sort((a, b) => b.Brown + b.Moreno - (a.Brown + a.Moreno))
}

export function topVendors(camp: CampRow[], c: Cand, n = 10) {
  const rows = byCand(camp, c)
  const total = sum(rows)
  const g = new Map<string, { total: number; n: number }>()
  for (const r of rows) {
    const v = g.get(r.payee) ?? { total: 0, n: 0 }
    v.total += r.amount; v.n++
    g.set(r.payee, v)
  }
  return [...g.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, n)
    .map(([payee, v]) => ({ payee, total: v.total, payments: v.n, share: total ? v.total / total : 0 }))
}

export function commByQuarter(camp: CampRow[], c: Cand) {
  const rows = byCand(camp, c).filter((r) => COMM_CATEGORIES.includes(r.category))
  const qs = [...new Set(camp.map((r) => r.quarter))].sort()
  return qs.map((q) => {
    const o: Record<string, string | number> = { quarter: q }
    for (const cat of COMM_CATEGORIES) o[cat] = sum(rows.filter((r) => r.quarter === q && r.category === cat))
    return o
  })
}

export function sizeScatter(camp: CampRow[], max = 2000) {
  const big = camp.filter((r) => r.amount > 100000)
  const rest = camp.filter((r) => r.amount <= 100000)
  const room = Math.max(0, max - big.length)
  const step = rest.length > room && room > 0 ? rest.length / room : 1
  const picked: CampRow[] = []
  for (let i = 0; i < rest.length && picked.length < room; i += step) picked.push(rest[Math.floor(i)])
  return { rows: [...big, ...picked], shown: big.length + picked.length, total: camp.length, big: big.length }
}

export function sizeBands(camp: CampRow[]) {
  return BANDS.map((b) => {
    const o: Record<string, string | number> = { band: b }
    for (const c of CANDS) {
      const rows = byCand(camp, c).filter((r) => bandOf(r.amount) === b)
      o[`${c}_count`] = rows.length
      o[`${c}_dollars`] = sum(rows)
    }
    return o
  })
}

export function committeeStack(camp: CampRow[]) {
  const types = [...new Set(camp.map((r) => r.spending_type))].sort()
  const ids = [...new Set(camp.map((r) => r.committee_id))]
  return {
    types,
    data: ids
      .map((id) => {
        const rows = camp.filter((r) => r.committee_id === id)
        const r0 = rows[0]
        const o: Record<string, string | number> = {
          name: `${r0.committee} (${r0.candidate}, ${r0.committee_type})`,
          total: sum(rows),
        }
        for (const t of types) o[t] = sum(rows.filter((r) => r.spending_type === t))
        return o
      })
      .sort((a, b) => (b.total as number) - (a.total as number)),
  }
}

export const COST_CATS = [
  { label: 'Payroll and benefits', cat: 'Payroll & benefits' },
  { label: 'Fundraising costs', cat: 'Fundraising costs' },
  { label: 'Processing and bank fees', cat: 'Processing & bank fees' },
  { label: 'Operations and overhead', cat: 'Operations & overhead' },
]

/* ---------- Q3 helpers ---------- */
export function outsideMonthly(out: OutRow[]) {
  return monthsBetween(FIRST_DAY, LAST_DAY).map((month) => {
    const rows = out.filter((r) => r.month === month)
    return { key: month, Brown: sum(bySide(rows, 'Brown')), Moreno: sum(bySide(rows, 'Moreno')) }
  })
}

export function groupTable(out: OutRow[], side: Cand) {
  const rows = bySide(out, side)
  const g = new Map<string, { total: number; n: number; attack: number }>()
  for (const r of rows) {
    const v = g.get(r.committee) ?? { total: 0, n: 0, attack: 0 }
    v.total += r.amount; v.n++
    if (r.tone === 'Attack') v.attack += r.amount
    g.set(r.committee, v)
  }
  const total = sum(rows)
  return [...g.entries()]
    .map(([group, v]) => ({ group, side, total: v.total, payments: v.n, attackShare: v.total ? v.attack / v.total : 0, share: total ? v.total / total : 0 }))
    .sort((a, b) => b.total - a.total)
}

export function toneSplit(out: OutRow[], side: Cand) {
  const rows = bySide(out, side)
  const attack = sum(rows.filter((r) => r.tone === 'Attack'))
  const support = sum(rows.filter((r) => r.tone === 'Support'))
  return { attack, support, attackShare: attack + support ? attack / (attack + support) : NaN }
}

export function outsideTypes(out: OutRow[]) {
  const cats = [...new Set(out.map((r) => r.category))]
  const tot: Record<Cand, number> = { Brown: sum(bySide(out, 'Brown')), Moreno: sum(bySide(out, 'Moreno')) }
  const shares = cats.map((cat) => {
    const rows = out.filter((r) => r.category === cat)
    return { cat, Brown: tot.Brown ? sum(bySide(rows, 'Brown')) / tot.Brown : 0, Moreno: tot.Moreno ? sum(bySide(rows, 'Moreno')) / tot.Moreno : 0 }
  })
  const keep = shares.filter((s) => s.Brown >= 0.02 || s.Moreno >= 0.02).sort((a, b) => b.Brown + b.Moreno - (a.Brown + a.Moreno))
  const other = shares.filter((s) => !(s.Brown >= 0.02 || s.Moreno >= 0.02))
  if (other.length) keep.push({ cat: 'Other (small categories)', Brown: other.reduce((s, x) => s + x.Brown, 0), Moreno: other.reduce((s, x) => s + x.Moreno, 0) })
  return keep
}
