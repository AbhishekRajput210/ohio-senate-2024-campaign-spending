'use client'
import React, { useMemo, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { CampRow, Filters, Data, BLUE, RED, SHADES, TYPE_COLORS, OTHER_GREY, phaseShort } from '@/lib/data'
import {
  headline, monthlySpend, quarterlySpend, cumulative, phaseTable, keyDateEffects, mixByPhase, MILESTONES_CAMPAIGN, sum, byCand, groupSum, dailySeries,
} from '@/lib/metrics'
import { compact, m2, money, pct, monthLabel, dateLabel, num } from '@/lib/format'
import { Card, Kpi, CandLegend, Seg, SimpleTable, Legend, PageHead, KeyDateList, DatesToggle, fade, candColor } from '../ui'
import { AXIS, GRID, moneyTick, moneyTip, Donut, LeadChart, WrapTick, keyLines } from '../charts'

export default function Q1({ f, data, camp, campAff }: { f: Filters; data: Data; camp: CampRow[]; campAff: CampRow[] }) {
  const [mode, setMode] = useState<'monthly' | 'quarterly' | 'cumulative'>('monthly')
  const [showDates, setShowDates] = useState(true)
  const [showLeadDates, setShowLeadDates] = useState(true)
  const [q, setQ] = useState('')
  const [sortBy, setSortBy] = useState<'amount' | 'date'>('amount')

  const h = headline(camp, [])
  const monthly = useMemo(() => monthlySpend(camp), [camp])
  const series = mode === 'quarterly' ? quarterlySpend(camp) : mode === 'cumulative' ? cumulative(monthly) : monthly
  const daily = useMemo(() => dailySeries(data), [data])
  const phases = useMemo(() => phaseTable(camp), [camp])
  const effects = useMemo(() => keyDateEffects(camp, data.keyDates), [camp, data.keyDates])
  const mixB = useMemo(() => mixByPhase(camp, 'Brown'), [camp])
  const mixM = useMemo(() => mixByPhase(camp, 'Moreno'), [camp])
  const big = useMemo(() => camp.filter((r) => r.amount > 100000), [camp])
  const bigShown = useMemo(() => {
    const s = q.trim().toLowerCase()
    const rows = s ? big.filter((r) => `${r.payee} ${r.committee} ${r.category} ${r.purpose}`.toLowerCase().includes(s)) : big
    return [...rows].sort((a, b) => (sortBy === 'amount' ? b.amount - a.amount : a.date.localeCompare(b.date)))
  }, [big, q, sortBy])

  const keyKey = (d: string) => (mode === 'quarterly' ? `${d.slice(0, 4)}Q${Math.ceil(Number(d.slice(5, 7)) / 3)}` : d.slice(0, 7))
  const keyX = (d: string) => (series.some((s) => s.key === keyKey(d)) ? keyKey(d) : undefined)
  const label = (k: string) => (mode === 'quarterly' ? k : monthLabel(k))

  const committeeDonut = (c: 'Brown' | 'Moreno') => {
    const rowsC = byCand(campAff, c)
    const isCampaign = (name: string) => rowsC.find((r) => r.committee === name)?.committee_type === 'Campaign'
    const g = [...groupSum(rowsC, (r) => r.committee).entries()].sort((a, b) => b[1] - a[1])
    const total = g.reduce((s, x) => s + x[1], 0)
    const bigG = g.filter(([, v]) => v / total >= 0.01)
    const small = g.filter(([, v]) => v / total < 0.01)
    let ci = 0, ai = 0
    const rows = bigG.map(([name, value]) => ({
      name, value,
      color: isCampaign(name) ? SHADES[c][Math.min(ci++, 1)] : SHADES[c][Math.min(2 + ai++, 3)],
    }))
    if (small.length) rows.push({ name: `Other committees (${small.length})`, value: small.reduce((s, x) => s + x[1], 0), color: OTHER_GREY })
    return rows
  }

  return (
    <>
      <PageHead tag="Question 1" title="Campaign Spending Trends" question="How does campaign spending change over the 2023-24 cycle, and how do the two campaigns differ?" />

      <div className="kpis">
        <Kpi label="Brown campaign spending" value={m2(h.bc)} color={BLUE} />
        <Kpi label="Moreno campaign spending" value={m2(h.mc)} color={RED} />
        <Kpi label="Campaign lead (Brown minus Moreno)" value={m2(h.lead)} />
        <Kpi label="Spending ratio" value={isFinite(h.ratio) ? `${h.ratio.toFixed(1)} times` : 'n/a'} sub="Brown's spending as a multiple of Moreno's" />
      </div>

      <Card wide title="Campaign Spending Over Time" what="How much each campaign spent, month by month, by quarter, or added up." tip="Sum of payments reported by each candidate's campaign committees. 'Added up' is a running total starting at the first month in view." filters="Category, Committee, Affiliated" rows={series} file="spending_over_time"
        action={<Seg label="View" value={mode} onChange={setMode} options={[{ v: 'monthly', l: 'Monthly' }, { v: 'quarterly', l: 'Quarterly' }, { v: 'cumulative', l: 'Added up' }]} />}>
        <div className="row-between">
          <CandLegend />
          <DatesToggle checked={showDates} onChange={setShowDates} />
        </div>
        <div style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: !showDates ? 10 : mode === 'quarterly' ? 68 : 42, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="key" tick={AXIS} tickFormatter={label} minTickGap={18} />
              <YAxis tick={AXIS} tickFormatter={moneyTick} width={62} />
              <Tooltip labelFormatter={(l) => label(String(l))} formatter={(v, n) => [moneyTip(v), n]} />
              {showDates && keyLines(data.keyDates, keyX)}
              <Line type="monotone" dataKey="Brown" stroke={BLUE} strokeWidth={3} strokeOpacity={fade(f, 'Brown')} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="Moreno" stroke={RED} strokeWidth={3} strokeOpacity={fade(f, 'Moreno')} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {showDates && <KeyDateList dates={data.keyDates} />}
      </Card>

      <Card wide title="Brown's Campaign Spending Lead Over Time" what="Brown's campaign spending minus Moreno's, added up day by day." tip="Running total of Brown campaign spending minus Moreno campaign spending from 1 Jan 2023. Blue = Brown ahead." filters="None" rows={MILESTONES_CAMPAIGN.map((m) => ({ milestone: m.label, date: m.date, campaign_lead: daily.find((d) => d.date === m.date)?.campLead }))} file="campaign_lead_milestones" action={<DatesToggle checked={showLeadDates} onChange={setShowLeadDates} />}>
        <LeadChart data={daily} field="campLead" height={320} gid="q1lead" what="Brown's campaign lead" keyDates={showLeadDates ? data.keyDates : []} />
        {showLeadDates && <KeyDateList dates={data.keyDates} />}
        <SimpleTable head={['Milestone', 'Date', 'Brown\'s campaign lead']} rows={MILESTONES_CAMPAIGN.map((m) => [m.label, dateLabel(m.date), compact(daily.find((d) => d.date === m.date)?.campLead ?? 0)])} />
      </Card>

      <div className="grid2">
        <Card title="Share of Each Campaign's Spending, by Period" what="What part of its total each campaign spent in each period of the race." tip="Phase total divided by that candidate's total over all phases." filters="Category, Committee, Affiliated" rows={phases} file="share_by_phase">
          <CandLegend />
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phases} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="phase" tick={<WrapTick fmt={phaseShort} />} interval={0} height={44} />
                <YAxis tick={AXIS} tickFormatter={(v) => `${Math.round(v * 100)}%`} width={44} />
                <Tooltip
                  labelFormatter={(l) => { const p = phases.find((x) => x.phase === l); return `${l} (${p?.days} days)` }}
                  formatter={(v, n, item) => [`${pct(Number(v))} (${money(Number((item.payload as Record<string, number>)[`${n}_total`]))})`, n]}
                />
                <Bar dataKey="Brown_share" name="Brown" fill={BLUE} fillOpacity={fade(f, 'Brown')} isAnimationActive={false} />
                <Bar dataKey="Moreno_share" name="Moreno" fill={RED} fillOpacity={fade(f, 'Moreno')} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Average Weekly Spending, by Period" what="How fast each campaign spent in each period." tip="Phase total divided by the number of weeks in the phase (days / 7)." filters="Category, Committee, Affiliated" rows={phases.map((p) => ({ phase: p.phase, days: p.days, Brown_per_week: p.Brown_weekly, Moreno_per_week: p.Moreno_weekly }))} file="weekly_pace_by_phase">
          <CandLegend />
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phases} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="phase" tick={<WrapTick fmt={phaseShort} />} interval={0} height={44} />
                <YAxis tick={AXIS} tickFormatter={moneyTick} width={60} />
                <Tooltip formatter={(v, n) => [`${moneyTip(v)} per week`, n]} />
                <Bar dataKey="Brown_weekly" name="Brown" fill={BLUE} fillOpacity={fade(f, 'Brown')} isAnimationActive={false} />
                <Bar dataKey="Moreno_weekly" name="Moreno" fill={RED} fillOpacity={fade(f, 'Moreno')} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card wide title="Weekly Spending Before and After Key Dates" what="Average weekly spending in the 4 weeks before each key date compared with the 4 weeks after it." tip="Average weekly spending in the 4 weeks before a date versus the 4 weeks starting on that date. For Election Day: the last 4 weeks (Oct 9 to Nov 5) versus the 4 weeks before them. Change = after divided by before, minus 1." filters="Category, Committee, Affiliated" rows={effects} file="key_date_before_after">
        <SimpleTable
          head={['Key date', 'Brown: weekly before', 'Brown: weekly after', 'Brown change', 'Moreno: weekly before', 'Moreno: weekly after', 'Moreno change']}
          rows={effects.map((e) => [
            `${e.event} (${dateLabel(String(e.date))})`,
            money(Number(e.Brown_before)), money(Number(e.Brown_after)), isFinite(Number(e.Brown_change)) ? `${Number(e.Brown_change) >= 0 ? '+' : ''}${pct(Number(e.Brown_change), 0)}` : 'n/a',
            money(Number(e.Moreno_before)), money(Number(e.Moreno_after)), isFinite(Number(e.Moreno_change)) ? `${Number(e.Moreno_change) >= 0 ? '+' : ''}${pct(Number(e.Moreno_change), 0)}` : 'n/a',
          ])}
        />
      </Card>

      <div className="grid2">
        {([['Brown', mixB], ['Moreno', mixM]] as const).map(([c, mix]) => (
          <Card key={c} title={`What ${c} Spent On, by Period`} what={`${c}'s spending in each period, split into three types.`} tip="Voter communication = ads, mail, texting, canvassing. Fundraising costs = the cost of raising money. Staff, overhead and other = everything else." filters="Category, Committee, Affiliated" rows={mix.data} file={`mix_by_phase_${c.toLowerCase()}`}>
            <Legend items={mix.types.map((t) => ({ label: t, color: TYPE_COLORS[t] ?? OTHER_GREY }))} />
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mix.data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="phase" tick={<WrapTick fmt={phaseShort} />} interval={0} height={44} />
                  <YAxis tick={AXIS} tickFormatter={(v) => `${Math.round(v * 100)}%`} width={44} domain={[0, 1]} />
                  <Tooltip formatter={(v, n) => [pct(Number(v)), n]} />
                  {mix.types.map((t) => <Bar key={t} dataKey={t} stackId="a" fill={TYPE_COLORS[t] ?? OTHER_GREY} isAnimationActive={false} />)}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid2">
        {(['Brown', 'Moreno'] as const).map((c) => {
          const d = committeeDonut(c)
          return (
            <Card key={c} title={`${c}: Spending by Committee`} what={`Share of ${c}'s spending by committee, including affiliated committees.`} tip="Affiliated committees are joint fundraising and related committees tied to the candidate." filters="Category" rows={d.map((x) => ({ committee: x.name, amount: x.value }))} file={`committee_share_${c.toLowerCase()}`}>
              <Donut data={d} center={compact(d.reduce((s, x) => s + x.value, 0))} centerSub="total" />
            </Card>
          )
        })}
      </div>

      <Card wide title="Payments Over $100,000" what="The largest single payments, with who was paid and for what." tip="Every payment with an amount strictly above $100,000 in the current view." filters="Category, Committee, Affiliated" rows={bigShown.map((r) => ({ date: r.date, candidate: r.candidate, payee: r.payee, committee: r.committee, category: r.category, purpose: r.purpose, amount: r.amount }))} file="payments_over_100k">
        <div className="row-between">
          <p className="small"><b>{num(big.length)}</b> payments totalling <b>{compact(sum(big))}</b> — Brown: {num(big.filter((r) => r.candidate === 'Brown').length)} ({compact(sum(big.filter((r) => r.candidate === 'Brown')))}), Moreno: {num(big.filter((r) => r.candidate === 'Moreno').length)} ({compact(sum(big.filter((r) => r.candidate === 'Moreno')))})</p>
          <input className="search" type="search" placeholder="Search payee, purpose…" aria-label="Search big payments" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="table-wrap tall">
          <table>
            <thead>
              <tr>
                <th className="l"><button type="button" className="th-btn" onClick={() => setSortBy('date')}>Date{sortBy === 'date' ? ' ▲' : ''}</button></th>
                <th className="l">Candidate</th><th className="l">Paid to</th><th className="l">Category</th><th className="l">Purpose</th>
                <th className="r"><button type="button" className="th-btn" onClick={() => setSortBy('amount')}>Amount{sortBy === 'amount' ? ' ▼' : ''}</button></th>
              </tr>
            </thead>
            <tbody>
              {bigShown.slice(0, 100).map((r, i) => (
                <tr key={i}>
                  <td className="l">{dateLabel(r.date)}</td>
                  <td className="l"><span className="dot" style={{ background: candColor(r.candidate) }} />{r.candidate}</td>
                  <td className="l">{r.payee}</td><td className="l">{r.category}</td><td className="l ell">{r.purpose}</td>
                  <td className="r">{money(r.amount)}</td>
                </tr>
              ))}
              {bigShown.length === 0 && <tr><td colSpan={6} className="l">No payments over $100,000 match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        {bigShown.length > 100 && <p className="small muted">Showing the first 100 of {num(bigShown.length)}. Use the CSV button for all rows.</p>}
      </Card>
    </>
  )
}
