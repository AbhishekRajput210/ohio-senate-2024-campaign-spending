'use client'
import React, { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, ReferenceLine,
} from 'recharts'
import { CampRow, Filters, BLUE, RED, COMM_CATEGORIES, COMM_COLORS, TYPE_COLORS, OTHER_GREY, INK } from '@/lib/data'
import {
  scorecard, categoryTable, topVendors, commByQuarter, sizeScatter, sizeBands, committeeStack, COST_CATS, byCand, sum, CANDS,
} from '@/lib/metrics'
import { compact, money, pct, num, dateLabel, monthLabel } from '@/lib/format'
import { Card, CandLegend, Seg, SimpleTable, Legend, PageHead, fade, candColor } from '../ui'
import { AXIS, GRID, moneyTick, moneyTip, Donut, WrapTick, useNarrow } from '../charts'

export default function Q2({ f, camp, campAff }: { f: Filters; camp: CampRow[]; campAff: CampRow[] }) {
  const narrow = useNarrow()
  const [catMode, setCatMode] = useState<'usd' | 'pct'>('usd')
  const [qCand, setQCand] = useState<'Brown' | 'Moreno'>('Brown')
  const [vCand, setVCand] = useState<'Brown' | 'Moreno'>('Brown')
  const [sizeMode, setSizeMode] = useState<'count' | 'dollars'>('count')

  const sc = useMemo(() => scorecard(camp), [camp])
  const cats = useMemo(() => categoryTable(camp), [camp])
  const advantage = useMemo(() => [...cats].sort((a, b) => b.advantage - a.advantage), [cats])
  const vendors = useMemo(() => topVendors(camp, vCand), [camp, vCand])
  const quarters = useMemo(() => commByQuarter(camp, qCand), [camp, qCand])
  const dots = useMemo(() => sizeScatter(camp), [camp])
  const bands = useMemo(() => sizeBands(camp), [camp])
  const stack = useMemo(() => committeeStack(campAff), [campAff])
  const [b, m] = sc
  const ratio = (x: number, y: number, d = 2) => (y ? `${(x / y).toFixed(d)} times` : 'n/a')
  const shareGap = [...cats].map((c) => ({ category: c.category, b: c.BrownShare * 100, m: c.MorenoShare * 100, diff: (c.BrownShare - c.MorenoShare) * 100 })).sort((x, y) => y.diff - x.diff)

  const donut = (c: 'Brown' | 'Moreno') => {
    const rows = byCand(camp, c)
    return COMM_CATEGORIES.map((cat) => ({ name: cat, value: sum(rows.filter((r) => r.category === cat)), color: COMM_COLORS[cat] }))
  }

  const scatter = (c: 'Brown' | 'Moreno') => dots.rows.filter((r) => r.candidate === c).map((r) => ({ t: Date.parse(r.date), amount: r.amount, payee: r.payee, purpose: r.purpose }))

  return (
    <>
      <PageHead tag="Question 2" title="How Do the Two Campaigns Compare?" question="How do Brown's and Moreno's campaigns compare in spending level, categories, communication, timing and vendors?" />

      <Card wide title="Side-by-Side Scorecard" what="Key facts about how each campaign spent its money." tip="Voter communication = TV, radio, digital, mail, texting and canvassing. Biggest vendor = the payee that received the most money." filters="Category, Committee, Affiliated" rows={sc.map((s) => ({ ...s }))} file="scorecard">
        <SimpleTable
          head={['Measure', 'Brown', 'Moreno', 'Brown ÷ Moreno']}
          rows={[
            ['Total spent', money(b.total), money(m.total), ratio(b.total, m.total, 1)],
            ['Share spent on voter communication', pct(b.commShare), pct(m.commShare), '—'],
            ['Number of payments', num(b.count), num(m.count), ratio(b.count, m.count)],
            ['Typical (median) payment', money(b.median), money(m.median), ratio(b.median, m.median)],
            ['Biggest single payment', money(b.biggest), money(m.biggest), ratio(b.biggest, m.biggest)],
            ['Biggest vendor', `${b.topVendor} (${money(b.topVendorTotal)})`, `${m.topVendor} (${money(m.topVendorTotal)})`, '—'],
            ['Biggest vendor, share of own spending', pct(b.topVendorShare), pct(m.topVendorShare), '—'],
          ]}
        />
      </Card>

      <Card wide title="Spending by Category" what="What each campaign spent its money on." tip="Categories are our grouping of payment descriptions. Share = category spending divided by that candidate's total." filters="Category, Committee, Affiliated" rows={cats} file="spending_by_category"
        action={<Seg label="Show" value={catMode} onChange={setCatMode} options={[{ v: 'usd', l: 'Dollars' }, { v: 'pct', l: '% of own spending' }]} />}>
        <CandLegend />
        <div style={{ height: Math.max(360, cats.length * 44) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cats} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={AXIS} tickFormatter={catMode === 'usd' ? moneyTick : (v) => `${Math.round(v * 100)}%`} />
              <YAxis type="category" dataKey="category" tick={<WrapTick orient="y" max={narrow ? 16 : 26} />} width={narrow ? 120 : 190} interval={0} />
              <Tooltip formatter={(v, n) => [catMode === 'usd' ? moneyTip(v) : pct(Number(v)), n]} />
              <Bar dataKey={catMode === 'usd' ? 'Brown' : 'BrownShare'} name="Brown" fill={BLUE} fillOpacity={fade(f, 'Brown')} isAnimationActive={false} />
              <Bar dataKey={catMode === 'usd' ? 'Moreno' : 'MorenoShare'} name="Moreno" fill={RED} fillOpacity={fade(f, 'Moreno')} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid2">
        <Card title="Category Priorities: Share of Own Spending" what="How much bigger or smaller each category is for Brown than for Moreno, as a share of each campaign's own spending (percentage points)." tip="Brown's share of own spending minus Moreno's share, in percentage points. For example +25 means Brown put 25 points more of its money there." filters="Committee, Affiliated" rows={shareGap.map((c) => ({ category: c.category, Brown_share: c.b, Moreno_share: c.m, difference_points: c.diff }))} file="priority_differences">
          <div style={{ height: Math.max(420, shareGap.length * 34) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shareGap} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={AXIS} tickFormatter={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}`} />
                <YAxis type="category" dataKey="category" tick={<WrapTick orient="y" max={narrow ? 16 : 26} />} width={narrow ? 120 : 190} interval={0} />
                <Tooltip content={({ payload }) => {
                  const p = payload?.[0]?.payload as { category: string; b: number; m: number; diff: number } | undefined
                  return p ? <div className="tt"><b>{p.category}</b><br />Brown: {p.b.toFixed(1)}% of own spending<br />Moreno: {p.m.toFixed(1)}% of own spending</div> : null
                }} />
                <ReferenceLine x={0} stroke={INK} />
                <Bar dataKey="diff" isAnimationActive={false}>
                  {shareGap.map((c) => <Cell key={c.category} fill={c.diff >= 0 ? BLUE : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Where Brown Outspent Moreno" what="Brown's spending minus Moreno's in each category." tip="Positive (blue) = Brown spent more. Negative (red) = Moreno spent more." filters="Category, Committee, Affiliated" rows={advantage.map((c) => ({ category: c.category, brown_minus_moreno: c.advantage }))} file="brown_advantage_by_category">
          <div style={{ height: Math.max(420, advantage.length * 34) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={advantage} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={AXIS} tickFormatter={moneyTick} />
                <YAxis type="category" dataKey="category" tick={<WrapTick orient="y" max={narrow ? 16 : 26} />} width={narrow ? 120 : 190} interval={0} />
                <Tooltip formatter={(v) => [moneyTip(v), 'Brown minus Moreno']} />
                <ReferenceLine x={0} stroke={INK} />
                <Bar dataKey="advantage" isAnimationActive={false}>
                  {advantage.map((c) => <Cell key={c.category} fill={c.advantage >= 0 ? BLUE : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid2">
        {CANDS.map((c) => {
          const d = donut(c)
          return (
            <Card key={c} title={`${c}: Types of Voter Communication`} what="How the money for reaching voters was split." tip="Voter communication = TV, radio & other media; digital advertising; direct mail; texting & phone; canvassing & field." filters="Committee, Affiliated (category filter not applied)" rows={d.map((x) => ({ type: x.name, amount: x.value }))} file={`communication_types_${c.toLowerCase()}`}>
              <Donut data={d} center={compact(d.reduce((s, x) => s + x.value, 0))} centerSub="voter communication" />
            </Card>
          )
        })}
      </div>

      <div className="grid2">
        <Card title="Voter Communication by Quarter" what="How each type of communication spending changed over time." tip="Stacked bars of the five voter-communication categories for the chosen candidate." filters="Committee, Affiliated" rows={quarters} file={`communication_by_quarter_${qCand.toLowerCase()}`}
          action={<Seg label="Candidate" value={qCand} onChange={setQCand} options={[{ v: 'Brown', l: 'Brown' }, { v: 'Moreno', l: 'Moreno' }]} />}>
          <Legend items={COMM_CATEGORIES.map((c) => ({ label: c, color: COMM_COLORS[c] }))} />
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarters} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="quarter" tick={AXIS} />
                <YAxis tick={AXIS} tickFormatter={moneyTick} width={60} />
                <Tooltip formatter={(v, n) => [moneyTip(v), n]} />
                {COMM_CATEGORIES.map((c) => <Bar key={c} dataKey={c} stackId="a" fill={COMM_COLORS[c]} isAnimationActive={false} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Top 10 Vendors" what="The companies and people that received the most money." tip="Payee totals for the chosen candidate. Share = payee total divided by that candidate's total spending." filters="Category, Committee, Affiliated" rows={vendors} file={`top_vendors_${vCand.toLowerCase()}`}
          action={<Seg label="Candidate" value={vCand} onChange={setVCand} options={[{ v: 'Brown', l: 'Brown' }, { v: 'Moreno', l: 'Moreno' }]} />}>
          <div style={{ height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendors} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={AXIS} tickFormatter={moneyTick} />
                <YAxis type="category" dataKey="payee" tick={<WrapTick orient="y" max={narrow ? 16 : 26} fontSize={11} />} width={narrow ? 120 : 190} interval={0} />
                <Tooltip formatter={(v, _n, item) => [`${moneyTip(v)} · ${pct((item.payload as { share: number }).share)} of own spending · ${(item.payload as { payments: number }).payments} payments`, 'Total']} />
                <Bar dataKey="total" fill={candColor(vCand)} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid2">
        <Card title="Every Payment by Date and Size" what="Each dot is one payment: when it was made and how big it was." tip="Shows every payment over $100,000, plus a spread of the smaller ones." filters="Category, Committee, Affiliated" rows={dots.rows.map((r) => ({ date: r.date, candidate: r.candidate, payee: r.payee, purpose: r.purpose, amount: r.amount }))} file="payments_by_date_and_size">
          <CandLegend />
          <div style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
                <CartesianGrid stroke={GRID} />
                <XAxis type="number" dataKey="t" domain={['dataMin', 'dataMax']} tick={AXIS} tickFormatter={(t) => monthLabel(new Date(t).toISOString().slice(0, 7))} />
                <YAxis type="number" dataKey="amount" tick={AXIS} tickFormatter={moneyTick} width={60} />
                <ZAxis range={[28, 28]} />
                <Tooltip content={({ payload }) => {
                  const p = payload?.[0]?.payload as { t: number; amount: number; payee: string; purpose: string } | undefined
                  return p ? <div className="tt"><b>{p.payee}</b><br />{money(p.amount)} · {dateLabel(new Date(p.t).toISOString().slice(0, 10))}<br /><span className="muted">{p.purpose}</span></div> : null
                }} />
                <Scatter name="Brown" data={scatter('Brown')} fill={BLUE} fillOpacity={0.55 * fade(f, 'Brown') + 0.05} isAnimationActive={false} />
                <Scatter name="Moreno" data={scatter('Moreno')} fill={RED} fillOpacity={0.55 * fade(f, 'Moreno') + 0.05} isAnimationActive={false} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Payments by Size Band" what="How many payments (or how many dollars) fall into each size band." tip="Bands: under $1K; $1K to under $10K; $10K to $100K (includes exactly $100,000); over $100K to $1M; over $1M." filters="Category, Committee, Affiliated" rows={bands} file="payments_by_size_band"
          action={<Seg label="Show" value={sizeMode} onChange={setSizeMode} options={[{ v: 'count', l: 'Number of payments' }, { v: 'dollars', l: 'Dollars' }]} />}>
          <CandLegend />
          <div style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bands} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="band" tick={<WrapTick max={14} fontSize={11} />} interval={0} height={44} />
                <YAxis tick={AXIS} tickFormatter={sizeMode === 'count' ? (v) => num(v) : moneyTick} width={60} />
                <Tooltip formatter={(v, n) => [sizeMode === 'count' ? `${num(Number(v))} payments` : moneyTip(v), n]} />
                <Bar dataKey={`Brown_${sizeMode}`} name="Brown" fill={BLUE} fillOpacity={fade(f, 'Brown')} isAnimationActive={false} />
                <Bar dataKey={`Moreno_${sizeMode}`} name="Moreno" fill={RED} fillOpacity={fade(f, 'Moreno')} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card wide title="Spending by Committee and Type" what="Which committees spent the money, split into three types of spending." tip="Campaign committees are the candidates' own. Affiliated committees are related fundraising committees." filters="Category" rows={stack.data} file="spending_by_committee">
        <Legend items={stack.types.map((t) => ({ label: t, color: TYPE_COLORS[t] ?? OTHER_GREY }))} />
        <div style={{ height: Math.max(340, stack.data.length * 56) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stack.data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={AXIS} tickFormatter={moneyTick} />
              <YAxis type="category" dataKey="name" tick={<WrapTick orient="y" max={narrow ? 20 : 44} maxLines={narrow ? 3 : 2} fontSize={11} />} width={narrow ? 130 : 290} interval={0} />
              <Tooltip formatter={(v, n) => [moneyTip(v), n]} />
              {stack.types.map((t) => <Bar key={t} dataKey={t} stackId="a" fill={TYPE_COLORS[t] ?? OTHER_GREY} isAnimationActive={false} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card wide title="Payroll, Fundraising and Overhead Costs" what="How much each campaign spent on running costs, in dollars and as a share of its own spending." tip="Payroll and benefits; fundraising costs; processing and bank fees; operations and overhead. Moreno's payroll is much lower than Brown's, probably because the two campaigns report and categorise staff costs differently." filters="Committee, Affiliated (category filter not applied)" rows={COST_CATS.map((c) => ({ cost: c.label, Brown: sum(byCand(camp, 'Brown').filter((r) => r.category === c.cat)), Moreno: sum(byCand(camp, 'Moreno').filter((r) => r.category === c.cat)) }))} file="running_costs">
        <SimpleTable
          head={['Cost', 'Brown ($)', 'Brown (% of own)', 'Moreno ($)', 'Moreno (% of own)']}
          rows={COST_CATS.map((c) => {
            const bb = sum(byCand(camp, 'Brown').filter((r) => r.category === c.cat))
            const mm = sum(byCand(camp, 'Moreno').filter((r) => r.category === c.cat))
            return [c.label, money(bb), pct(b.total ? bb / b.total : 0), money(mm), pct(m.total ? mm / m.total : 0)]
          })}
        />
      </Card>
    </>
  )
}
