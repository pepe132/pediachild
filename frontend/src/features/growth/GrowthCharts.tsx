import { useEffect, useState } from 'react';
import type { GrowthIndicator, GrowthResponse } from './growth.api';

const labels: Record<GrowthIndicator, string> = { weight: 'Peso para la edad', height: 'Talla para la edad', head: 'Perimetro cefalico para la edad' };
const colors = ['#d97706', '#7c3aed', '#0f766e', '#2563eb', '#dc2626'];

export function GrowthCharts({ data }: { data: GrowthResponse }) {
  if (!data.available) return <section className="panel"><h2>Crecimiento OMS</h2><p>Para generar las curvas registra la fecha de nacimiento y el sexo del paciente.</p></section>;
  const hasMeasurements = data.observations.length > 0 || hasBaseline(data.baseline);
  return <section className="panel growth-section"><div className="panel__heading"><div><h2>Crecimiento OMS</h2><p>Evolucion historica y percentiles 3, 15, 50, 85 y 97.</p></div></div>
    {data.observations.length === 0 && <div className="growth-empty">Aun no hay mediciones mensuales. Registra peso, talla y perimetro cefalico en una consulta.</div>}
    <div className="growth-grid">{data.charts.map(chart => <GrowthChart key={chart.indicator} chart={chart} observations={data.observations} />)}</div>
    {hasMeasurements && <GrowthTable observations={data.observations} baseline={hasBaseline(data.baseline) ? data.baseline : undefined} />}
    <small className="growth-source">Fuente: {data.source}. La edad corregida se aplica a prematuros hasta los 2 anos.</small>
  </section>;
}

function hasBaseline(baseline: GrowthResponse['baseline']) { return Boolean(baseline && Object.values(baseline.values).some(value => value != null)); }

function GrowthTable({ observations, baseline }: { observations: GrowthResponse['observations']; baseline?: GrowthResponse['baseline'] }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const rows = [...observations].sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
  const filteredRows = rows.filter(row => { const date = row.measuredAt.slice(0, 10); return (!from || date >= from) && (!to || date <= to); });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / 20));
  const visibleRows = filteredRows.slice((page - 1) * 20, page * 20);
  useEffect(() => { setPage(1); }, [from, to]);
  return <div className="growth-history"><div className="growth-history__heading"><div><h3>Seguimiento mes a mes</h3><p>La variacion se calcula contra la medicion anterior registrada.</p></div></div>
    <div className="growth-filters"><label className="field"><span>Desde</span><input type="date" value={from} onChange={event => setFrom(event.target.value)} /></label><label className="field"><span>Hasta</span><input type="date" value={to} onChange={event => setTo(event.target.value)} /></label>{(from || to) && <button type="button" className="button button--ghost" onClick={() => { setFrom(''); setTo(''); }}>Limpiar filtro</button>}</div>
    <div className="growth-table-wrap"><table className="growth-table"><thead><tr><th>Fecha</th><th>Edad</th><th>Peso</th><th>Cambio peso</th><th>Talla</th><th>Cambio talla</th><th>Perimetro cefalico</th><th>Cambio PC</th></tr></thead><tbody>
      {baseline && <tr className="growth-table__baseline"><td>{formatDate(baseline.measuredAt)}</td><td>Al nacer</td><td>{formatValue(baseline.values.weight, 'kg')}</td><td>-</td><td>{formatValue(baseline.values.height, 'cm')}</td><td>-</td><td>{formatValue(baseline.values.head, 'cm')}</td><td>-</td></tr>}
      {visibleRows.map(row => { const index = rows.findIndex(item => item.consultationId === row.consultationId); const previous = rows[index - 1]; return <tr key={row.consultationId}><td>{formatDate(row.measuredAt)}</td><td>{formatAge(row.correctedAgeDays)}</td><td>{formatValue(row.values.weight, 'kg')}</td><td>{formatDelta(row.values.weight, previous?.values.weight, 'kg')}</td><td>{formatValue(row.values.height, 'cm')}</td><td>{formatDelta(row.values.height, previous?.values.height, 'cm')}</td><td>{formatValue(row.values.head, 'cm')}</td><td>{formatDelta(row.values.head, previous?.values.head, 'cm')}</td></tr>; })}
    </tbody></table></div>
    {filteredRows.length === 0 && <p className="form-note">No hay mediciones para ese rango de fechas.</p>}
    {filteredRows.length > 0 && <div className="growth-pagination"><span>Mostrando {(page - 1) * 20 + 1}-{Math.min(page * 20, filteredRows.length)} de {filteredRows.length}</span><button type="button" className="button button--ghost" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Anterior</button><strong>Pagina {page} de {totalPages}</strong><button type="button" className="button button--ghost" disabled={page >= totalPages} onClick={() => setPage(value => value + 1)}>Siguiente</button></div>}
  </div>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)); }
function formatValue(value: number | null, unit: string) { return value == null ? '-' : `${value} ${unit}`; }
function formatDelta(value: number | null, previous: number | null | undefined, unit: string) { if (value == null || previous == null || previous === undefined) return '-'; const delta = Math.round((value - previous) * 100) / 100; return `${delta > 0 ? '+' : ''}${delta} ${unit}`; }
function formatAge(days: number) { const months = Math.floor(days / 30.4375); const remainingDays = Math.round(days - months * 30.4375); return `${months} m ${Math.max(0, remainingDays)} d`; }

function GrowthChart({ chart, observations }: { chart: GrowthResponse['charts'][number]; observations: GrowthResponse['observations'] }) {
  const points = observations.filter(o => o.values[chart.indicator] != null && o.correctedAgeDays <= 1856);
  const values = [...chart.curves.flatMap(c => c.points.map(p => p.value)), ...points.map(p => p.values[chart.indicator] as number)];
  const min = Math.min(...values) * 0.92, max = Math.max(...values) * 1.04, w = 640, h = 300, pad = 38;
  const x = (days: number) => pad + (days / 1856) * (w - pad * 2), y = (value: number) => h - pad - ((value - min) / (max - min)) * (h - pad * 2);
  const path = (ps: { ageDays: number; value: number }[]) => ps.map((p, i) => `${i ? 'L' : 'M'}${x(p.ageDays).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  return <article className="growth-card"><h3>{labels[chart.indicator]}</h3><svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={labels[chart.indicator]}>{[0, 12, 24, 36, 48, 60].map(m => <g key={m}><line x1={x(m * 30.4375)} y1={pad} x2={x(m * 30.4375)} y2={h - pad} className="growth-gridline" /><text x={x(m * 30.4375)} y={h - 12} textAnchor="middle">{m}</text></g>)}{chart.curves.map((curve, i) => <path key={curve.percentile} d={path(curve.points)} fill="none" stroke={colors[i]} className="growth-curve"><title>Percentil {curve.percentile}</title></path>)}{points.map(p => <circle key={p.consultationId} cx={x(p.correctedAgeDays)} cy={y(p.values[chart.indicator] as number)} r="5" className="growth-observation"><title>{formatDate(p.measuredAt)}: {p.values[chart.indicator]} {chart.unit}</title></circle>)}<text x={w / 2} y={h - 1} textAnchor="middle" className="growth-axis-label">Edad (meses)</text></svg><div className="growth-legend">{chart.curves.map((c, i) => <span key={c.percentile} style={{ color: colors[i] }}>P{c.percentile}</span>)}<strong>Paciente</strong></div></article>;
}
