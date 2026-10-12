'use client'
import React, { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, LabelList,
} from 'recharts'
import { CampRow, OutRow, Filters, Data, BLUE, RED, BLUE_LIGHT, RED_LIGHT, SHADES, OUTSIDE_COLORS, OTHER_GREY, INK } from '@/lib/data'
import {
  headline, outsideMonthly, groupTable, toneSplit, outsideTypes, dailySeries, leadStats, MILESTONES_COMBINED, CANDS,
} from '@/lib/metrics'
import { compact, m2, money, pct, num, dateLabel, monthLabel, shortName } from '@/lib/format'
import { Card, Kpi, CandLegend, Seg, SimpleTable, Legend, PageHead, KeyDateList, DatesToggle, fade, candColor } from '../ui'
import { AXIS, GRID, moneyTick, moneyTip, Donut, LeadChart, WrapTick, useNarrow } from '../charts'

const SIDE = (c: string) => `${c}'s side`

const EXTRA = ['#5AA3C7', '#C97B3F', '#8BA86B', '#D98E8E']
const outColor = (cat: string, i: number) => OUTSIDE_COLORS[cat] ?? EXTRA[i % EXTRA.length]

export default function Q3({ f, data, camp, out }: { f: Filters; data: Data; camp: CampRow[]; out: OutRow[] }) {
  const [groupSide, setGroupSide] = useState<'Brown' | 'Moreno'>('Moreno')
  const [showDates, setShowDates] = useState(true)
  const narrow = useNarrow()
  const h = headline(camp, out)
  const daily = useMemo(() => dailySeries(data), [data])
  const view = daily
  const stats = leadStats(view)
  const monthly = useMemo(() => outsideMonthly(out), [out])
  const gB = useMemo(() => groupTable(out, 'Brown'), [out])
  const gM = useMemo(() => groupTable(out, 'Moreno'), [out])
  const topGroups = (groupSide === 'Brown' ? gB : gM).slice(0, 10).map((g) => ({ ...g, label: shortName(g.group) }))
  const tone = { Brown: toneSplit(out, 'Brown'), Moreno: toneSplit(out, 'Moreno') }
  const types = useMemo(() => outsideTypes(out), [out])
  const typeRows = CANDS.map((c) => {
    const o: Record<string, string | number> = { side: SIDE(c) }
    for (const t of types) o[t.cat] = t[c]
    return o
  })
  const groupsAll = [...gB, ...gM]
  const top6 = new Set([...groupsAll].sort((a, b) => b.total - a.total).slice(0, 6).map((g) => `${g.side}|${g.group}`))
  const dots = (side: 'Brown' | 'Moreno') =>
    (side === 'Brown' ? gB : gM).map((g) => ({ ...g, x: g.payments, y: g.total / 1e6, label: top6.has(`${g.side}|${g.group}`) ? shortName(g.group) : '' }))

  const stacked = CANDS.map((c) => ({
    name: `${SIDE(c)} · ${m2(c === 'Brown' ? h.brownSide : h.morenoSide)}`,
    cand: c,
    Campaign: c === 'Brown' ? h.bc : h.mc,
    Outside: c === 'Brown' ? h.ob : h.om,
  }))

  const conc = (g: typeof gB, c: 'Brown' | 'Moreno') => {
    const top = g.slice(0, 3)
    const topSum = top.reduce((s, x) => s + x.total, 0)
    const all = g.reduce((s, x) => s + x.total, 0)
    return [
      ...top.map((x, i) => ({ name: shortName(x.group), value: x.total, color: SHADES[c][i] })),
      { name: `All other groups (${Math.max(0, g.length - 3)})`, value: all - topSum, color: OTHER_GREY },
    ]
  }

  return (
    <>
      <PageHead tag="Question 3 · Extension" title="Did Outside Groups Offset Brown's Campaign Spending Advantage?" question="Outside groups (super PACs and similar) also pay for political ads. Did their spending offset Brown's campaign spending advantage?" />

      <div className="kpis six">
        <Kpi label="Brown's campaign lead" value={m2(h.lead)} color={BLUE} tip="Brown campaign spending minus Moreno campaign spending." />
        <Kpi label="Net outside help for Moreno" value={m2(h.net)} color={RED} tip="Outside spending that helped Moreno minus outside spending that helped Brown." />
        <Kpi label="Combined result" value={`${h.combined >= 0 ? '+' : '-'}${compact(Math.abs(h.combined))}`} color={h.combined >= 0 ? BLUE : RED} sub={h.combined >= 0 ? "Brown's side ahead" : "Moreno's side ahead"} tip="Campaign plus outside spending for Brown's side minus the same for Moreno's side." />
        <Kpi label="Total outside spending" value={m2(h.outsideTotal)} tip="All FEC-reported outside spending (independent expenditures) in view." />
        <Kpi label="Outside share of each side's money" value={`${pct(h.brownOutsideShare, 0)} / ${pct(h.morenoOutsideShare, 0)}`} sub="Brown's side / Moreno's side" tip="Outside spending divided by (campaign + outside spending) for each side." />
        <Kpi label="Offset" value={h.lead > 0 ? pct(h.net / h.lead, 1) : 'n/a'} sub="net outside help ÷ campaign lead" tip="How much of Brown's campaign lead was matched by extra outside spending for Moreno." />
      </div>

      <div className="grid2">
        <Card title="Who the Outside Money Helped" what="Outside spending split by the candidate it helped." tip="Independent expenditures reported to the FEC, grouped by the candidate it helps (by supporting that candidate or attacking the opponent)." filters="Category, Outside group" rows={[{ helped: 'Moreno', amount: h.om }, { helped: 'Brown', amount: h.ob }]} file="outside_money_split">
          <Donut data={[{ name: 'Helped Moreno', value: h.om, color: RED }, { name: 'Helped Brown', value: h.ob, color: BLUE }]} center={compact(h.outsideTotal)} centerSub="outside total" />
        </Card>

        <Card title="Campaign Plus Outside Spending, by Side" what="Everything spent for each side, split into the campaign's own money and outside groups' money." tip="Brown's side = Brown campaign + outside spending helping Brown. Same for Moreno." filters="Category, Committee, Outside group, Affiliated" rows={stacked.map((s) => ({ side: s.cand, campaign: s.Campaign, outside: s.Outside, total: s.Campaign + s.Outside }))} file="side_totals">
          <Legend items={[{ label: 'Campaign spending (dark)', color: '#555555' }, { label: 'Outside groups (light)', color: '#BBBBBB' }]} />
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stacked} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={AXIS} tickFormatter={moneyTick} />
                <YAxis type="category" dataKey="name" tick={<WrapTick orient="y" max={narrow ? 16 : 26} />} width={narrow ? 120 : 190} interval={0} />
                <Tooltip formatter={(v, n) => [moneyTip(v), n === 'Campaign' ? 'Campaign spending' : 'Outside groups']} />
                <Bar dataKey="Campaign" stackId="s" isAnimationActive={false}>
                  {stacked.map((s) => <Cell key={s.cand} fill={candColor(s.cand)} fillOpacity={fade(f, s.cand)} />)}
                </Bar>
                <Bar dataKey="Outside" stackId="s" isAnimationActive={false}>
                  {stacked.map((s) => <Cell key={s.cand} fill={s.cand === 'Brown' ? BLUE_LIGHT : RED_LIGHT} fillOpacity={fade(f, s.cand)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card wide title="Brown's Side Minus Moreno's Side, Over Time" what="Campaign plus outside spending added up day by day. Blue = Brown's side ahead; red = Moreno's side ahead." tip="Running total of (Brown campaign + outside for Brown) minus (Moreno campaign + outside for Moreno), from 1 Jan 2023." filters="None" rows={MILESTONES_COMBINED.map((m) => ({ milestone: m.label, date: m.date, combined_lead: daily.find((d) => d.date === m.date)?.lead }))} file="combined_lead_milestones" action={<DatesToggle checked={showDates} onChange={setShowDates} />}>
        <div className="statrow">
          {stats && (
            <>
              <div><b style={{ color: BLUE }}>{compact(stats.peak.lead)}</b><span>Highest lead ({dateLabel(stats.peak.date)})</span></div>
              <div><b style={{ color: stats.low.lead < 0 ? RED : INK }}>{compact(stats.low.lead)}</b><span>Lowest point ({dateLabel(stats.low.date)})</span></div>
              <div><b style={{ color: stats.last.lead >= 0 ? BLUE : RED }}>{compact(stats.last.lead)}</b><span>Last day in view ({dateLabel(stats.last.date)})</span></div>
              <div><b>{num(stats.daysMorenoAhead)}</b><span>Days Moreno&apos;s side was ahead ({dateLabel(stats.firstBehind)} to {dateLabel(stats.lastBehind)})</span></div>
            </>
          )}
        </div>
        <LeadChart data={view} height={360} markers keyDates={showDates ? data.keyDates : []} gid="q3lead" />
        {showDates && <KeyDateList dates={data.keyDates} />}
        <SimpleTable head={['Milestone', 'Date', "Brown's side minus Moreno's side"]} rows={MILESTONES_COMBINED.map((m) => { const v = daily.find((d) => d.date === m.date)?.lead ?? 0; return [m.label, dateLabel(m.date), `${v >= 0 ? '+' : '-'}${compact(Math.abs(v))} (${v >= 0 ? 'Brown ahead' : 'Moreno ahead'})`] })} />
      </Card>

      <Card wide title="Outside Spending by Month" what="How much outside groups spent each month, by the candidate it helped." tip="Outside spending only (campaign spending is not included here)." filters="Category, Outside group" rows={monthly} file="outside_spending_by_month">
        <CandLegend />
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="key" tick={AXIS} tickFormatter={monthLabel} minTickGap={16} />
              <YAxis tick={AXIS} tickFormatter={moneyTick} width={60} />
              <Tooltip labelFormatter={(l) => monthLabel(String(l))} formatter={(v, n) => [moneyTip(v), `Outside money helping ${n}`]} />
              <Bar dataKey="Brown" fill={BLUE} fillOpacity={fade(f, 'Brown')} isAnimationActive={false} />
              <Bar dataKey="Moreno" fill={RED} fillOpacity={fade(f, 'Moreno')} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid2">
        <Card title="Top 10 Outside Groups" what="The outside groups that spent the most for the chosen side." tip="Group totals of independent expenditures for the chosen candidate's side." filters="Category, Outside group" rows={topGroups} file={`top_groups_${groupSide.toLowerCase()}`}
          action={<Seg label="Side" value={groupSide} onChange={setGroupSide} options={[{ v: 'Brown', l: "Brown's side" }, { v: 'Moreno', l: "Moreno's side" }]} />}>
          <div style={{ height: 420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topGroups} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={AXIS} tickFormatter={moneyTick} />
                <YAxis type="category" dataKey="label" tick={<WrapTick orient="y" max={narrow ? 16 : 26} fontSize={11} />} width={narrow ? 120 : 200} interval={0} />
                <Tooltip formatter={(v, _n, item) => [`${moneyTip(v)} · ${num((item.payload as { payments: number }).payments)} payments · ${pct((item.payload as { attackShare: number }).attackShare, 0)} attack`, (item.payload as { group: string }).group]} />
                <Bar dataKey="total" fill={candColor(groupSide)} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="stack">
          {CANDS.map((c) => {
            const d = conc(c === 'Brown' ? gB : gM, c)
            const share = d.length > 1 ? d.slice(0, 3).reduce((s, x) => s + x.value, 0) / (d.reduce((s, x) => s + x.value, 0) || 1) : 0
            return (
              <Card key={c} title={`${SIDE(c)}: How Concentrated Is the Money?`} what="The 3 biggest groups versus all the others." tip="Top 3 groups' combined outside spending as a share of the side's total outside spending." filters="Category, Outside group" rows={d.map((x) => ({ group: x.name, amount: x.value }))} file={`concentration_${c.toLowerCase()}`}>
                <Donut data={d} height={170} center={pct(share, 0)} centerSub="top 3" />
              </Card>
            )
          })}
        </div>
      </div>

      <div className="grid2">
        {CANDS.map((c) => {
          const t = tone[c]
          return (
            <Card key={c} title={`${SIDE(c)}: Support vs Attack`} what="How much outside money praised the candidate versus attacked the opponent." tip="Tone is taken from the FEC support/oppose indicator. Attack = spending against the other candidate." filters="Category, Outside group" rows={[{ tone: 'Support', amount: t.support }, { tone: 'Attack', amount: t.attack }]} file={`support_vs_attack_${c.toLowerCase()}`}>
              <Donut data={[{ name: 'Attack the opponent', value: t.attack, color: candColor(c) }, { name: 'Support the candidate', value: t.support, color: c === 'Brown' ? BLUE_LIGHT : RED_LIGHT }]} center={isFinite(t.attackShare) ? pct(t.attackShare, 0) : 'n/a'} centerSub="attack" />
            </Card>
          )
        })}
      </div>

      <Card wide title="What Outside Groups Spent On" what="The mix of spending types for each side's outside money." tip="Categories are our grouping of payment descriptions. Categories under 2% of both sides are combined as 'Other'." filters="Category, Outside group" rows={typeRows} file="outside_spending_types">
        <Legend items={types.map((t, i) => ({ label: t.cat, color: outColor(t.cat, i) }))} />
        <div style={{ height: 230 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeRows} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={AXIS} tickFormatter={(v) => `${Math.round(v * 100)}%`} domain={[0, 1]} />
              <YAxis type="category" dataKey="side" tick={<WrapTick orient="y" max={narrow ? 12 : 20} />} width={narrow ? 80 : 110} />
              <Tooltip formatter={(v, n) => [pct(Number(v)), n]} />
              {types.map((t, i) => <Bar key={t.cat} dataKey={t.cat} stackId="a" fill={outColor(t.cat, i)} isAnimationActive={false} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card wide title="Every Outside Group: Payments vs Total Spent" what="Each dot is one outside group." tip="Horizontal = number of payments the group reported. Vertical = total spent in millions of dollars." filters="Category, Outside group" rows={groupsAll} file="outside_groups">
        <CandLegend />
        <div style={{ height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 16, right: 40, left: 4, bottom: 24 }}>
              <CartesianGrid stroke={GRID} />
              <XAxis type="number" dataKey="x" name="Payments" tick={AXIS} label={{ value: 'Number of payments', position: 'insideBottom', offset: -12, fontSize: 12, fill: '#5B6577' }} />
              <YAxis type="number" dataKey="y" name="Total" tick={AXIS} tickFormatter={(v) => `$${v}M`} width={56} />
              <ZAxis range={[80, 80]} />
              <Tooltip content={({ payload }) => {
                const p = payload?.[0]?.payload as { group: string; payments: number; total: number; attackShare: number; side: string } | undefined
                return p ? <div className="tt"><b>{p.group}</b><br />Helped {p.side} · {num(p.payments)} payments<br />{money(p.total)} · {pct(p.attackShare, 0)} attack</div> : null
              }} />
              <Scatter name="Brown" data={dots('Brown')} fill={BLUE} fillOpacity={0.8 * fade(f, 'Brown') + 0.05} isAnimationActive={false}>
                <LabelList dataKey="label" position="right" style={{ fontSize: 11, fill: INK }} />
              </Scatter>
              <Scatter name="Moreno" data={dots('Moreno')} fill={RED} fillOpacity={0.8 * fade(f, 'Moreno') + 0.05} isAnimationActive={false}>
                <LabelList dataKey="label" position="right" style={{ fontSize: 11, fill: INK }} />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  )
}
