'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { loadAll, Data, Filters, DEFAULT_FILTERS } from '@/lib/data'
import { selCamp, selOut, sum } from '@/lib/metrics'
import { m2, num } from '@/lib/format'
import FilterBar, { TabKey } from '@/components/Filters'
import Overview from '@/components/tabs/Overview'
import Q1 from '@/components/tabs/Q1'
import Q2 from '@/components/tabs/Q2'
import Q3 from '@/components/tabs/Q3'
import { Empty } from '@/components/ui'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Summary' },
  { key: 'q1', label: 'Spending Trends' },
  { key: 'q2', label: 'Campaign Comparison' },
  { key: 'q3', label: 'Outside Spending' },
]

export default function Page() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')
  const [f, setF] = useState<Filters>(DEFAULT_FILTERS)
  const [tab, setTab] = useState<TabKey>('overview')

  useEffect(() => {
    loadAll().then(setData).catch((e) => setError(String(e.message ?? e)))
  }, [])

  const isQ3 = tab === 'q3'
  const camp = useMemo(() => (data ? selCamp(data.camp, f, { ignoreCommittee: isQ3 }) : []), [data, f, isQ3])
  const campAff = useMemo(() => (data ? selCamp(data.camp, f, { forceAffiliated: true, ignoreCommittee: true }) : []), [data, f])
  const out = useMemo(() => (data ? selOut(data.out, f, { ignoreGroup: !isQ3 }) : []), [data, f, isQ3])

  if (error) return <main className="state"><h1>Could not load the data</h1><p>{error}</p><p>Check that the CSV files are in <code>public/data</code>.</p></main>
  if (!data) return <main className="state"><div className="spinner" aria-hidden /><p>Loading data…</p></main>

  return (
    <div className="app">
      <header className="hero">
        <div className="top">
          <p className="eyebrow">OHIO · U.S. SENATE · 2024 · FEC DATA, 2023–24 CYCLE</p>
          <h1>Ohio 2024 Senate Race: Campaign Spending Analysis</h1>
          <p className="sub">Sherrod Brown (D) vs Bernie Moreno (R). How the two campaigns spent their money, and whether outside groups offset Brown&apos;s campaign spending advantage.</p>
        </div>
      </header>
      <nav className="tabs" aria-label="Dashboard sections">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={t.key === tab ? 'active' : ''} aria-current={t.key === tab ? 'page' : undefined} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>
      <FilterBar f={f} set={setF} data={data} tab={tab} />
      <div className="strip" aria-live="polite">
        <span>Campaign spending: <b>{num(camp.length)}</b> payments · <b>{m2(sum(camp))}</b></span>
        <span>Outside spending: <b>{num(out.length)}</b> payments · <b>{m2(sum(out))}</b></span>
        <span>Jan 1, 2023 – Dec 31, 2024</span>
      </div>
      <main className="content">
        {camp.length === 0 && out.length === 0 && <Empty />}
        {tab === 'overview' && <Overview f={f} data={data} camp={camp} out={out} />}
        {tab === 'q1' && <Q1 f={f} data={data} camp={camp} campAff={campAff} />}
        {tab === 'q2' && <Q2 f={f} camp={camp} campAff={campAff} />}
        {tab === 'q3' && <Q3 f={f} data={data} camp={camp} out={out} />}
      </main>
    </div>
  )
}
