'use client'
import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CampRow, OutRow, Filters, Data, BLUE, RED } from '@/lib/data'
import { headline, monthlySpend, dailySeries } from '@/lib/metrics'
import { compact, m2, pct, monthLabel } from '@/lib/format'
import { Card, Kpi, CandLegend, PageHead, KeyDateList, DatesToggle, fade } from '../ui'
import { AXIS, GRID, moneyTick, moneyTip, Donut, LeadChart, keyLines } from '../charts'

export default function Overview({ f, data, camp, out }: { f: Filters; data: Data; camp: CampRow[]; out: OutRow[] }) {
  const [monthDates, setMonthDates] = useState(true)
  const [leadDates, setLeadDates] = useState(true)
  const h = headline(camp, out)
  const monthly = monthlySpend(camp)
  const daily = dailySeries(data)
  const offsetOk = h.lead > 0

  return (
    <>
      <PageHead tag="Summary" title="Did Outside Groups Offset Brown's Campaign Spending Advantage?" question="Brown's campaign spent far more than Moreno's. This page shows the size of that gap and how much outside groups spending changed the picture." />

      <section className="answer">
        <h2>Key finding</h2>
        <p>
          Brown&apos;s campaign spent <b>{m2(h.bc)}</b> and Moreno&apos;s spent <b>{m2(h.mc)}</b>, a gap of <b>{m2(h.lead)}</b>
          {isFinite(h.ratio) && <> ({h.ratio.toFixed(1)} times as much)</>}. Outside groups spent <b>{m2(Math.abs(h.net))}</b> {h.net >= 0 ? 'more for Moreno than for Brown' : 'more for Brown than for Moreno'}
          {offsetOk && <>, which matched about <b>{pct(h.net / h.lead, 0)}</b> of that gap</>}. Counting both, Brown&apos;s side
          ended <b>{compact(Math.abs(h.combined))}</b> {h.combined >= 0 ? 'ahead' : 'behind'}.
        </p>
      </section>

      <div className="kpis">
        <Kpi label="Brown campaign spending" value={m2(h.bc)} color={BLUE} tip="Money spent by Brown's own campaign committees (FEC operating expenditures)." />
        <Kpi label="Moreno campaign spending" value={m2(h.mc)} color={RED} tip="Money spent by Moreno's own campaign committees (FEC operating expenditures)." />
        <Kpi label="Campaign lead (Brown minus Moreno)" value={m2(h.lead)} sub={isFinite(h.ratio) ? `${h.ratio.toFixed(1)} times Moreno's spending` : undefined} tip="Brown's campaign spending minus Moreno's campaign spending." />
        <Kpi label="Net outside help for Moreno" value={m2(h.net)} sub={offsetOk ? `${pct(h.net / h.lead, 1)} of the campaign lead` : undefined} tip="Outside spending that helped Moreno minus outside spending that helped Brown." />
        <Kpi label="Combined result" value={`${h.combined >= 0 ? '+' : '-'}${compact(Math.abs(h.combined))}`} sub={h.combined >= 0 ? "Brown's side ahead" : "Moreno's side ahead"} color={h.combined >= 0 ? BLUE : RED} tip="Campaign plus outside spending for Brown's side, minus the same for Moreno's side." />
      </div>

      <div className="grid2">
        <Card title="Campaign Spending by Month" what="How much each campaign spent in each month of 2023-24." tip="Total payments reported by each candidate's campaign committees in each month." filters="Category, Committee, Affiliated" rows={monthly} file="monthly_campaign_spending" action={<DatesToggle checked={monthDates} onChange={setMonthDates} />}>
          <CandLegend />
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly} margin={{ top: monthDates ? 40 : 10, right: 16, left: 4, bottom: 4 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="key" tick={AXIS} tickFormatter={monthLabel} minTickGap={20} />
                <YAxis tick={AXIS} tickFormatter={moneyTick} width={60} />
                <Tooltip labelFormatter={(l) => monthLabel(String(l))} formatter={(v, n) => [moneyTip(v), n]} />
                {monthDates && keyLines(data.keyDates, (d) => (monthly.some((m) => m.key === d.slice(0, 7)) ? d.slice(0, 7) : undefined))}
                <Line type="monotone" dataKey="Brown" stroke={BLUE} strokeWidth={3} strokeOpacity={fade(f, 'Brown')} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="Moreno" stroke={RED} strokeWidth={3} strokeOpacity={fade(f, 'Moreno')} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {monthDates && <KeyDateList dates={data.keyDates} />}
        </Card>

        <Card title="Who the Outside Money Helped" what="Outside group spending (super PACs and similar), split by the candidate it helped." tip="Outside spending = FEC-reported independent expenditures. Payments filed under both candidates are counted once." filters="Category" rows={[{ helped: 'Moreno', amount: h.om }, { helped: 'Brown', amount: h.ob }]} file="outside_money_split">
          <Donut
            data={[{ name: 'Helped Moreno', value: h.om, color: RED }, { name: 'Helped Brown', value: h.ob, color: BLUE }]}
            center={m2(h.outsideTotal)} centerSub="outside total"
          />
        </Card>
      </div>

      <Card wide title="Brown's Side Minus Moreno's Side, Over Time" what="Campaign plus outside spending added up day by day. Blue = Brown's side ahead; red = Moreno's side ahead." tip="Running total of (Brown campaign + outside for Brown) minus (Moreno campaign + outside for Moreno), starting 1 Jan 2023." filters="None" rows={daily.map((d) => ({ date: d.date, combined_lead: d.lead }))} file="combined_lead_by_day" action={<DatesToggle checked={leadDates} onChange={setLeadDates} />}>
        <LeadChart data={daily} height={320} gid="ov" keyDates={leadDates ? data.keyDates : []} />
        {leadDates && <KeyDateList dates={data.keyDates} />}
      </Card>
    </>
  )
}
