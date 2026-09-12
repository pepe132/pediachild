import type { GrowthIndicator, GrowthResponse } from './growth.api';

const labels: Record<GrowthIndicator,string> = { weight: 'Peso para la edad', height: 'Talla para la edad', head: 'Perímetro cefálico para la edad' };
const colors = ['#d97706','#7c3aed','#0f766e','#2563eb','#dc2626'];

export function GrowthCharts({ data }: { data: GrowthResponse }) {
  if (!data.available) return <section className="panel"><h2>Crecimiento OMS</h2><p>Para generar las curvas registra {data.missing.includes('dateOfBirth') ? 'la fecha de nacimiento' : ''}{data.missing.length === 2 ? ' y ' : ''}{data.missing.includes('sex') ? 'el sexo del paciente' : ''}.</p></section>;
  return <section className="panel growth-section"><div className="panel__heading"><div><h2>Crecimiento OMS</h2><p>Evolución histórica y percentiles 3, 15, 50, 85 y 97.</p></div></div>
    <div className="growth-grid">{data.charts.map(chart => <GrowthChart key={chart.indicator} chart={chart} observations={data.observations} />)}</div>
    <small className="growth-source">Fuente: {data.source}. La edad corregida se aplica a prematuros hasta los 2 años.</small>
  </section>;
}

function GrowthChart({ chart, observations }: { chart: GrowthResponse['charts'][number]; observations: GrowthResponse['observations'] }) {
  const points = observations.filter(o => o.values[chart.indicator] != null && o.correctedAgeDays <= 1856);
  const values = [...chart.curves.flatMap(c=>c.points.map(p=>p.value)), ...points.map(p=>p.values[chart.indicator] as number)];
  const min=Math.min(...values)*0.92,max=Math.max(...values)*1.04,w=640,h=300,pad=38;
  const x=(days:number)=>pad+(days/1856)*(w-pad*2), y=(value:number)=>h-pad-((value-min)/(max-min))*(h-pad*2);
  const path=(ps:{ageDays:number,value:number}[])=>ps.map((p,i)=>`${i?'L':'M'}${x(p.ageDays).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  return <article className="growth-card"><h3>{labels[chart.indicator]}</h3><svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={labels[chart.indicator]}>
    {[0,12,24,36,48,60].map(m=><g key={m}><line x1={x(m*30.4375)} y1={pad} x2={x(m*30.4375)} y2={h-pad} className="growth-gridline"/><text x={x(m*30.4375)} y={h-12} textAnchor="middle">{m}</text></g>)}
    {chart.curves.map((curve,i)=><path key={curve.percentile} d={path(curve.points)} fill="none" stroke={colors[i]} className="growth-curve"><title>Percentil {curve.percentile}</title></path>)}
    {points.map(p=><circle key={p.consultationId} cx={x(p.correctedAgeDays)} cy={y(p.values[chart.indicator] as number)} r="5" className="growth-observation"><title>{new Date(p.measuredAt).toLocaleDateString('es-MX')}: {p.values[chart.indicator]} {chart.unit}, percentil {p.percentiles[chart.indicator]?.percentile ?? 'fuera de rango'}</title></circle>)}
    <text x={w/2} y={h-1} textAnchor="middle" className="growth-axis-label">Edad (meses)</text>
  </svg><div className="growth-legend">{chart.curves.map((c,i)=><span key={c.percentile} style={{color:colors[i]}}>P{c.percentile}</span>)}<strong>● Paciente</strong></div></article>;
}
