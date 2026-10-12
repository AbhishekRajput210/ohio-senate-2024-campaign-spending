'use client'
import React from 'react'
import { downloadCsv, dateLabel } from '@/lib/format'
import { BLUE, RED, Cand, Filters, KeyDate } from '@/lib/data'

export const candColor = (c: Cand) => (c === 'Brown' ? BLUE : RED)
export const fade = (f: Filters, c: Cand) => (f.focus === 'All' || f.focus === c ? 1 : 0.2)

export function Tip({ text }: { text: string }) {
  return (
    <span className="tip">
      <button type="button" className="tip-btn" aria-label={`More info: ${text}`}>i</button>
      <span className="tip-box" role="tooltip">{text}</span>
    </span>
  )
}

export function Card({
  title, what, tip, filters, rows, file, children, wide, action,
}: {
  title: string; what: string; tip?: string
  filters?: string; rows?: Record<string, unknown>[]; file?: string
  children: React.ReactNode; wide?: boolean; action?: React.ReactNode
}) {
  return (
    <section className={`card${wide ? ' wide' : ''}`}>
      <header className="card-head">
        <div>
          <h3>
            {title} {tip && <Tip text={tip} />}
          </h3>
          <p className="what">{what}</p>
        </div>
        <div className="card-actions">
          {action}
          {rows && rows.length > 0 && (
            <button type="button" className="ghost" onClick={() => downloadCsv(file ?? title.replace(/\W+/g, '_').toLowerCase(), rows)}>
              Download CSV
            </button>
          )}
        </div>
      </header>
      {children}
      {filters && <p className="applied">Filters used here: {filters}</p>}
    </section>
  )
}

/** "Show key dates" switch. Each chart has its own, so turning it off in one chart does not change another. */
export function DatesToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="check small">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> Show key dates
    </label>
  )
}

/** Heading block at the top of each page: which question it answers. */
export function PageHead({ tag, title, question }: { tag: string; title: string; question: string }) {
  return (
    <section className="pagehead">
      <span className="pagetag">{tag}</span>
      <h2>{title}</h2>
      <p>{question}</p>
    </section>
  )
}

/** Numbered key dates; the numbers match the badges drawn on the charts. */
export function KeyDateList({ dates }: { dates: KeyDate[] }) {
  return (
    <ol className="keydates" aria-label="Key dates">
      {dates.map((k, i) => (
        <li key={k.event}><span className="kd-num">{i + 1}</span>{k.event}<em>{dateLabel(k.date)}</em></li>
      ))}
    </ol>
  )
}

export function Kpi({ label, value, sub, color, tip }: { label: string; value: string; sub?: string; color?: string; tip?: string }) {
  return (
    <div className="kpi" style={color ? { borderTopColor: color } : undefined}>
      <div className="kpi-label">{label} {tip && <Tip text={tip} />}</div>
      <div className="kpi-value" style={{ color: color ?? 'inherit' }}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" className={o.v === value ? 'on' : ''} aria-pressed={o.v === value} onClick={() => onChange(o.v)}>
          {o.l}
        </button>
      ))}
    </div>
  )
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.label}><i style={{ background: i.color }} />{i.label}</span>
      ))}
    </div>
  )
}

export const CandLegend = () => <Legend items={[{ label: 'Brown', color: BLUE }, { label: 'Moreno', color: RED }]} />

export function SimpleTable({ head, rows, align }: { head: string[]; rows: React.ReactNode[][]; align?: ('l' | 'r')[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{head.map((h, i) => <th key={h} className={align?.[i] === 'l' ? 'l' : i === 0 ? 'l' : 'r'}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className={align?.[j] === 'l' ? 'l' : j === 0 ? 'l' : 'r'}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Empty() {
  return <div className="empty">No data for these filters. Try “Reset filters”.</div>
}

