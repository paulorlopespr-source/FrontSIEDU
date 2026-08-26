import React from 'react';

const formatScore = (value) => value == null ? '—' : Number(value).toFixed(1).replace('.', ',');

export default function IdebAnalysisPanel({ analysis }) {
  if (!analysis) {
    return <section className="municipal-card ideb-analysis"><p>Carregando a análise do IDEB…</p></section>;
  }

  const cycles = [];
  for (let year = analysis.periodStart || 2015; year <= analysis.currentSchoolYear; year += 1) {
    if (year % 2 === 1) cycles.push(year);
  }

  const stages = analysis.series || [];
  return (
    <section className="municipal-card ideb-analysis">
      <header className="ideb-analysis-header">
        <div>
          <small>REDE MUNICIPAL DE ENSINO</small>
          <h2>Análise do IDEB — últimos 10 anos</h2>
          <p>Resultados oficiais por ciclo de aplicação. O IDEB é divulgado a cada dois anos.</p>
        </div>
        <div className="current-school-year"><span>ANO LETIVO VIGENTE</span><strong>{analysis.currentSchoolYear}</strong><small>Não corresponde a uma nova nota IDEB</small></div>
      </header>

      <div className="ideb-latest-grid">
        {stages.map((stage) => {
          const summary = analysis.summaries?.find((item) => item.stage === stage.stage) || {};
          const variation = summary.decennialVariation;
          return <article key={stage.stage}><span>{stage.stage}</span><strong>{formatScore(summary.latestValue)}</strong><small>Último resultado oficial · {summary.latestYear || analysis.latestOfficialYear}</small><em className={variation >= 0 ? 'positive' : 'negative'}>{variation == null ? 'Variação indisponível' : `${variation >= 0 ? '+' : ''}${formatScore(variation)} ponto(s) em 10 anos`}</em></article>;
        })}
      </div>

      <div className="ideb-chart-grid">
        {stages.map((stage) => {
          const values = new Map(stage.values.map((item) => [Number(item.year), item.value]));
          return <article className="ideb-stage-chart" key={stage.stage}>
            <h3>{stage.stage}</h3>
            <div className="ideb-bars">
              {cycles.map((year) => {
                const value = values.has(year) ? values.get(year) : null;
                const height = value == null ? 6 : Math.max(12, (Number(value) / 7) * 100);
                return <div className="ideb-bar-column" key={year} title={value == null ? `${year}: sem resultado` : `${year}: ${formatScore(value)}`}>
                  <b>{value == null ? '—' : formatScore(value)}</b>
                  <div className={`ideb-bar ${value == null ? 'missing' : ''}`} style={{ height: `${height}%` }} />
                  <span>{year}</span>
                  {value == null && <small>sem resultado</small>}
                </div>;
              })}
            </div>
          </article>;
        })}
      </div>

      <footer className="ideb-analysis-note">
        <span>Período analisado: {analysis.periodStart}–{analysis.latestOfficialYear}</span>
        <a href="https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb/resultados/2005-2025" target="_blank" rel="noreferrer">Consultar fonte oficial do Inep</a>
      </footer>
    </section>
  );
}
