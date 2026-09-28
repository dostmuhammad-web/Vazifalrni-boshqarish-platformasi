import { useMemo, useState } from 'react'
import { cn } from '../lib/utils'

function niceMax(value) {
  if (value <= 5) return 5
  const step = Math.pow(10, Math.floor(Math.log10(value)))
  return Math.ceil(value / step) * step
}

export function DonutChart({ data, size = 200, thickness = 22, centerTitle = 'Total', centerValue }) {
  const [hover, setHover] = useState(null)
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const active = hover !== null ? data[hover] : null

  const segments = data.reduce((acc, d, i) => {
    const len = total ? (d.value / total) * c : 0
    const offset = acc.cursor
    acc.items.push({ ...d, len, offset, index: i })
    acc.cursor += len
    return acc
  }, { items: [], cursor: 0 }).items

  return (
    <div className="donut">
      <div className="donut__chart" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chart-track)" strokeWidth={thickness} />
            {segments.map((s) => (
              <circle
                key={s.id}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color || 'var(--accent)'}
                strokeWidth={hover === s.index ? thickness + 4 : thickness}
                strokeDasharray={`${s.len} ${c - s.len}`}
                strokeDashoffset={-s.offset}
                strokeLinecap="butt"
                className="donut__seg"
                onMouseEnter={() => setHover(s.index)}
                onMouseLeave={() => setHover(null)}
                style={{ transition: 'stroke-width .18s ease' }}
              />
            ))}
          </g>
        </svg>
        <div className="donut__center">
          <strong>{active ? active.value : (centerValue ?? total)}</strong>
          <span>{active ? active.label : centerTitle}</span>
        </div>
      </div>
      <ul className="donut__legend">
        {data.map((d, i) => (
          <li
            key={d.id}
            className={cn('donut__legend-item', hover === i && 'is-active')}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <i style={{ background: d.color || 'var(--accent)' }} />
            <span className="donut__legend-label">{d.label}</span>
            <span className="donut__legend-value">
              {d.value}
              <em>{total ? Math.round((d.value / total) * 100) : 0}%</em>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BarChart({ data, height = 220, color = 'var(--accent)', unit = '', showValues = true }) {
  const max = useMemo(() => niceMax(Math.max(1, ...data.map((d) => d.value))), [data])
  return (
    <div className="bar-chart" style={{ height }}>
      <div className="bar-chart__grid">
        {[1, 0.75, 0.5, 0.25, 0].map((f) => (
          <div key={f} className="bar-chart__gridline" style={{ bottom: `${f * 100}%` }}>
            <span>{Math.round(max * f)}</span>
          </div>
        ))}
      </div>
      <div className="bar-chart__bars">
        {data.map((d) => (
          <div className="bar-chart__col" key={d.id ?? d.label} title={`${d.label}: ${d.value}${unit}`}>
            {showValues && <span className="bar-chart__value">{d.value}</span>}
            <div
              className="bar-chart__bar"
              style={{
                height: `${Math.max(3, (d.value / max) * 100)}%`,
                background: d.color ? `linear-gradient(180deg, ${d.color}, ${d.color}aa)` : `linear-gradient(180deg, ${color}, ${color}99)`,
              }}
            />
            <span className="bar-chart__label">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AreaChart({ data, series, height = 260, unit = '' }) {
  const [hover, setHover] = useState(null)
  const width = 720
  const padX = 34
  const padTop = 18
  const padBottom = 30
  const innerH = height - padTop - padBottom
  const max = useMemo(() => {
    const values = data.flatMap((row) => series.map((s) => row[s.key] ?? 0))
    return niceMax(Math.max(1, ...values))
  }, [data, series])

  const x = (i) => padX + (i * (width - padX * 2)) / Math.max(1, data.length - 1)
  const y = (v) => padTop + innerH - (v / max) * innerH

  return (
    <div className="area-chart" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="area-chart__svg"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const ratio = (e.clientX - rect.left) / rect.width
          const index = Math.round((ratio * width - padX) / ((width - padX * 2) / Math.max(1, data.length - 1)))
          setHover(Math.min(data.length - 1, Math.max(0, index)))
        }}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.38" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={width - padX}
            y1={padTop + innerH * f}
            y2={padTop + innerH * f}
            stroke="var(--chart-grid)"
            strokeWidth="1"
            strokeDasharray="4 5"
          />
        ))}
        {series.map((s) => {
          const points = data.map((row, i) => `${x(i)},${y(row[s.key] ?? 0)}`).join(' ')
          const areaPoints = `${padX},${padTop + innerH} ${points} ${width - padX},${padTop + innerH}`
          return (
            <g key={s.key}>
              <polygon points={areaPoints} fill={`url(#grad-${s.key})`} />
              <polyline
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {data.map((row, i) => (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(row[s.key] ?? 0)}
                  r={hover === i ? 5 : 3}
                  fill="var(--surface)"
                  stroke={s.color}
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          )
        })}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={padTop} y2={padTop + innerH} stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 3" />
        )}
      </svg>
      <div className="area-chart__labels">
        {data.map((row, i) => (
          <span key={i} className={cn(hover === i && 'is-active')}>
            {row.short ?? row.label}
          </span>
        ))}
      </div>
      {hover !== null && (
        <div className="area-chart__tip" style={{ left: `${(x(hover) / width) * 100}%` }}>
          <strong>{data[hover].short ?? data[hover].label}</strong>
          {series.map((s) => (
            <span key={s.key}>
              <i style={{ background: s.color }} /> {s.label}: {data[hover][s.key] ?? 0}
              {unit}
            </span>
          ))}
        </div>
      )}
      <div className="area-chart__legend">
        {series.map((s) => (
          <span key={s.key}>
            <i style={{ background: s.color }} /> {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function HBarList({ data, unit = '', max: maxProp }) {
  const max = maxProp ?? Math.max(1, ...data.map((d) => d.value))
  return (
    <ul className="hbar-list">
      {data.map((d) => (
        <li key={d.id ?? d.label}>
          <div className="hbar-list__head">
            <span className="hbar-list__label">
              {d.color && <i style={{ background: d.color }} />}
              {d.label}
            </span>
            <span className="hbar-list__value">
              {d.value}
              {unit}
            </span>
          </div>
          <div className="hbar-list__track">
            <div
              className="hbar-list__fill"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: d.color ? `linear-gradient(90deg, ${d.color}, ${d.color}bb)` : 'var(--accent)',
              }}
            />
          </div>
          {d.sub && <span className="hbar-list__sub">{d.sub}</span>}
        </li>
      ))}
    </ul>
  )
}

export function Sparkline({ data, color = 'var(--accent)', width = 120, height = 34 }) {
  if (!data.length) return null
  const max = Math.max(1, ...data)
  const step = width / Math.max(1, data.length - 1)
  const points = data.map((v, i) => `${i * step},${height - (v / max) * (height - 4) - 2}`).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function RadialProgress({ value, size = 92, thickness = 9, label = 'Completion' }) {
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const dash = (Math.min(100, value) / 100) * c
  return (
    <div className="radial" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chart-track)" strokeWidth={thickness} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#radial-grad)"
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            className="radial__bar"
          />
          <defs>
            <linearGradient id="radial-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent-2)" />
            </linearGradient>
          </defs>
        </g>
      </svg>
      <div className="radial__center">
        <strong>{value}%</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}
