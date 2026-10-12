'use client'
import React, { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceDot,
} from 'recharts'
import { BLUE, RED, INK, KeyDate } from '@/lib/data'
import { compact, money, pct, dateLabel, monthLabel } from '@/lib/format'

/** True on phone-sized screens, so charts can use narrower axis labels. */
export function useNarrow(breakpoint = 640) {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])
  return narrow
}

export const AXIS = { fontSize: 12, fill: '#5B6577' }
export const GRID = '#E3DFD6'
export const moneyTick = (v: number) => compact(v)
export const moneyTip = (v: unknown) => money(Number(v))

/** Break a label into at most `maxLines` short lines; cut with "..." if it is still too long. */
export function wrapText(text: string, max: number, maxLines = 2) {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w } else cur = cur ? cur + ' ' + w : w
  }
  if (cur) lines.push(cur)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S*$/, '') + '…'
    return kept
  }
  return lines
}

/** Axis label that wraps onto 2 lines instead of overlapping its neighbours. A "\n" in the text forces a line break. */
export function WrapTick({ x = 0, y = 0, payload, orient = 'x', max = 16, maxLines = 2, fmt, fontSize = 12 }: {
  x?: number; y?: number; payload?: { value: unknown }; orient?: 'x' | 'y'; max?: number; maxLines?: number; fmt?: (v: string) => string; fontSize?: number
}) {
  const raw = String(payload?.value ?? '')
  const text = fmt ? fmt(raw) : raw
  const lines = text.includes('\n') ? text.split('\n') : wrapText(text, max, maxLines)
  const lh = fontSize + 2
  const first = orient === 'x' ? fontSize + 2 : -((lines.length - 1) * lh) / 2 + fontSize / 3
  const tx = orient === 'y' ? -6 : 0
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor={orient === 'x' ? 'middle' : 'end'} fill="#5B6577" fontSize={fontSize}>
        {lines.map((l, i) => <tspan key={i} x={tx} dy={i === 0 ? first : lh}>{l}</tspan>)}
        <title>{raw}</title>
      </text>
    </g>
  )
}

/** Small numbered circle drawn above a key-date line. The number matches the key-date list under the chart. */
function KeyBadge({ viewBox, n, row = 0 }: { viewBox?: { x?: number; y?: number }; n: number; row?: number }) {
  const cx = viewBox?.x ?? 0
  const cy = (viewBox?.y ?? 0) - 13 - row * 21
  return (
    <g>
      <circle cx={cx} cy={cy} r={9} fill={INK} stroke="#fff" strokeWidth={1.5} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">{n}</text>
    </g>
  )
}

/** Dotted vertical lines for the key dates, each with a numbered badge. xOf maps a date to the chart's x value (or undefined to skip). */
export function keyLines(dates: KeyDate[], xOf: (d: string) => string | undefined, stagger = false) {
  const used = new Map<string, number>()
  return dates.map((k, i) => {
    const x = xOf(k.date)
    if (!x) return null
    const same = used.get(x) ?? 0
    used.set(x, same + 1)
    const row = stagger ? i % 2 : same
    return <ReferenceLine key={k.event} x={x} stroke="#8A93A5" strokeDasharray="4 4" label={<KeyBadge n={i + 1} row={row} />} />
  })
}

export function Donut({
  data, center, centerSub, height = 240, valueFmt = money,
}: {
  data: { name: string; value: number; color: string }[]
  center?: string; centerSub?: string; height?: number; valueFmt?: (v: number) => string
}) {
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0)
  const shown = data.filter((d) => d.value > 0)
  return (
    <div className="donut">
      <div className="donut-chart" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={shown} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="90%" paddingAngle={shown.length > 1 ? 1 : 0} stroke="#fff" strokeWidth={2} isAnimationActive={false}>
              {shown.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip formatter={(v, n) => [`${valueFmt(Number(v))} (${pct(total ? Number(v) / total : 0)})`, n]} />
          </PieChart>
        </ResponsiveContainer>
        {center && (
          <div className="donut-center">
            <b>{center}</b>
            {centerSub && <span>{centerSub}</span>}
          </div>
        )}
      </div>
      <ul className="donut-legend">
        {data.map((d) => (
          <li key={d.name}>
            <i style={{ background: d.color }} />
            <span>{d.name}</span>
            <b>{valueFmt(d.value)}</b>
            <em>{pct(total ? d.value / total : 0, 0)}</em>
          </li>
        ))}
      </ul>
    </div>
  )
}

type Pt = { date: string; lead?: number; campLead?: number }

/** Running lead line: blue when Brown is ahead, red when Moreno is ahead. */
export function LeadChart({
  data, field = 'lead', height = 300, markers = false, keyDates = [], gid = 'lead', what = "Brown's side",
}: {
  data: Pt[]; field?: 'lead' | 'campLead'; height?: number; markers?: boolean; keyDates?: KeyDate[]; gid?: string; what?: string
}) {
  const vals = data.map((d) => (d[field] as number) ?? 0)
  const max = Math.max(0, ...vals), min = Math.min(0, ...vals)
  const off = max === min ? 1 : max / (max - min)
  const step = max - min > 40e6 ? 20e6 : 10e6
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step
  const ticks = data.filter((d) => d.date.slice(8) === '01' && ['01', '04', '07', '10'].includes(d.date.slice(5, 7))).map((d) => d.date)
  const first = data[0]?.date
  const peak = data.reduce((m, d) => ((d[field] ?? 0) > (m[field] ?? 0) ? d : m), data[0])
  const low = data.reduce((m, d) => ((d[field] ?? 0) < (m[field] ?? 0) ? d : m), data[0])
  const last = data[data.length - 1]
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: keyDates.length ? 50 : 18, right: 24, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor={BLUE} />
              <stop offset={off} stopColor={RED} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" ticks={ticks.length ? ticks : undefined} tick={AXIS} tickFormatter={(d) => monthLabel(String(d).slice(0, 7))} minTickGap={24} />
          <YAxis tick={AXIS} width={64} domain={[lo, hi]} tickFormatter={(v) => (v > 0 ? '+' : '') + compact(v)} />
          <Tooltip
            labelFormatter={(d) => dateLabel(String(d))}
            formatter={(v) => {
              const n = Number(v)
              return [`${n >= 0 ? '+' : '-'}${money(Math.abs(n))} ${n >= 0 ? `(Brown ahead)` : `(Moreno ahead)`}`, what]
            }}
          />
          <ReferenceLine y={0} stroke={INK} strokeWidth={2} />
          {keyLines(keyDates, (d) => (first && d >= first && d <= (last?.date ?? '') ? d : undefined), true)}
          <Area type="monotone" dataKey={field} stroke={`url(#${gid})`} strokeWidth={2.5} fill={`url(#${gid})`} fillOpacity={0.22} dot={false} isAnimationActive={false} />
          {markers && peak && <ReferenceDot x={peak.date} y={peak[field] ?? 0} r={6} fill={BLUE} stroke="#fff" strokeWidth={2} label={{ value: `High ${compact(peak[field] ?? 0)}`, position: 'top', fontSize: 12, fill: INK }} />}
          {markers && low && (low[field] ?? 0) < 0 && <ReferenceDot x={low.date} y={low[field] ?? 0} r={6} fill={RED} stroke="#fff" strokeWidth={2} label={{ value: `Low ${compact(low[field] ?? 0)}`, position: 'bottom', fontSize: 12, fill: INK }} />}
          {markers && last && <ReferenceDot x={last.date} y={last[field] ?? 0} r={6} fill={(last[field] ?? 0) >= 0 ? BLUE : RED} stroke="#fff" strokeWidth={2} label={{ value: `End ${compact(last[field] ?? 0)}`, position: 'top', fontSize: 12, fill: INK }} />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
