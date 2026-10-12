export const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export const money2 = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

// $97.5M, $412K, -$10.0M
export const compact = (n: number) => {
  const a = Math.abs(n)
  const s = n < 0 ? '-' : ''
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(2)}B`
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(1)}M`
  if (a >= 1e3) return `${s}$${(a / 1e3).toFixed(0)}K`
  return `${s}$${a.toFixed(0)}`
}

// $97.46M: two decimals, used for headline numbers so they match the report
export const m2 = (n: number) => `${n < 0 ? '-' : ''}$${(Math.abs(n) / 1e6).toFixed(2)}M`

// Shorten long outside-group names for chart labels: "AMERICANS FOR PROSPERITY ACTION, INC. (AFP ACTION) DBA ..." -> "AMERICANS FOR PROSPERITY ACTION"
export const shortName = (n: string) => n.split(' (')[0].split(' DBA ')[0].replace(/,? INC\.?$/i, '').trim()

export const pct = (n: number, d = 1) => (isFinite(n) ? `${(n * 100).toFixed(d)}%` : 'n/a')
export const num = (n: number) => n.toLocaleString('en-US')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const monthLabel = (m: string) => {
  const [y, mo] = m.split('-')
  return `${MONTHS[Number(mo) - 1]} ${y.slice(2)}`
}
export const dateLabel = (d: string) => {
  const [y, m, day] = d.split('-')
  return `${MONTHS[Number(m) - 1]} ${Number(day)}, ${y}`
}

export function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  const cols = Object.keys(rows[0])
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const text = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name.endsWith('.csv') ? name : `${name}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
