'use client'
import React from 'react'
import { Filters, DEFAULT_FILTERS, Data } from '@/lib/data'
import { groupSum } from '@/lib/metrics'
import { Seg } from './ui'

export type TabKey = 'overview' | 'q1' | 'q2' | 'q3'

export default function FilterBar({
  f, set, data, tab,
}: { f: Filters; set: (f: Filters) => void; data: Data; tab: TabKey }) {
  const upd = (p: Partial<Filters>) => set({ ...f, ...p })
  const cats = [...new Set([...data.camp.map((r) => r.category), ...data.out.map((r) => r.category)])].sort()
  const comms = [...new Set(data.camp.map((r) => r.committee))].sort()
  // outside groups, biggest spenders first
  const groups = [...groupSum(data.out, (r) => r.committee).entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g)
  const isQ3 = tab === 'q3'
  const changed = JSON.stringify(f) !== JSON.stringify(DEFAULT_FILTERS)

  return (
    <div className="filters">
      <div className="filters-inner">
        <div className="frow">
          <div className="fgroup">
            <span className="flabel">Highlight candidate</span>
            <Seg label="Highlight candidate" value={f.focus} onChange={(v) => upd({ focus: v })}
              options={[{ v: 'All', l: 'Both' }, { v: 'Brown', l: 'Brown' }, { v: 'Moreno', l: 'Moreno' }]} />
          </div>
          <label className="fgroup">
            <span className="flabel">Spending category</span>
            <select value={f.category} onChange={(e) => upd({ category: e.target.value })}>
              <option value="All">All categories</option>
              {cats.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          {isQ3 ? (
            <label className="fgroup">
              <span className="flabel">Outside group</span>
              <select value={f.group} onChange={(e) => upd({ group: e.target.value })}>
                <option value="All">All {groups.length} groups</option>
                {groups.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          ) : (
            <label className="fgroup">
              <span className="flabel">Campaign committee</span>
              <select value={f.committee} onChange={(e) => upd({ committee: e.target.value })}>
                <option value="All">All committees</option>
                {comms.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          )}
          {!isQ3 && (
            <label className="check">
              <input type="checkbox" checked={f.affiliated} onChange={(e) => upd({ affiliated: e.target.checked })} />
              Include affiliated committees
            </label>
          )}
          <button type="button" className="ghost" disabled={!changed} onClick={() => set(DEFAULT_FILTERS)}>Reset filters</button>
        </div>
        <p className="filter-note">
          “Highlight candidate” fades the other candidate instead of hiding them, so comparisons (lead, ratio, offset) stay correct.
          {isQ3 && ' The outside group filter only changes the outside-group charts.'}
        </p>
      </div>
    </div>
  )
}
