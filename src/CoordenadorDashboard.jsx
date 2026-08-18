import React, { useEffect, useState } from 'react';
import { api } from './services/api';

export default function CoordenadorDashboard({ user, token, onLogout }) {
  const [schools, setSchools] = useState([]);
  const [dashboard, setDashboard] = useState({ summary: {} });
  const [notice, setNotice] = useState('');
  const [pendingPlans, setPendingPlans] = useState(0);
  const [idebAnalysis, setIdebAnalysis] = useState(null);

  useEffect(() => {
    Promise.all([api.listSchools(token).catch(() => []), api.getManagerDashboard(token).catch(() => ({ summary: {} })), api.listLessonPlansForReview('Enviado para aprovação', token).catch(() => []), api.getIdebAnalysis(token).catch(() => null)])
      .then(([units, data, plans, analysis]) => { setSchools(units || []); setDashboard(data || { summary: {} }); setPendingPlans(plans.length); setIdebAnalysis(analysis); });
  }, [token, user?.id]);

  const cards = [
    ['🏫', 'Turmas acompanhadas', dashboard.summary?.classes || 0, '#1674e8'],
    ['👩‍🏫', 'Professores acompanhados', dashboard.summary?.professors || 0, '#14a96d'],
    ['🎒', 'Alunos matriculados', dashboard.summary?.students || 0, '#7350df'],
    ['📊', 'Média geral da rede', Number(dashboard.summary?.average || 0).toFixed(1), '#f28b16'],
    ['✓', 'Frequência média', `${Number(dashboard.summary?.attendance || 0).toFixed(1)}%`, '#14b7c8'],
    ['📋', 'Planos de aula pendentes', pendingPlans, pendingPlans ? '#dc3545' : '#16a34a'],
  ];
  const actions = [
    ['📈', 'Ciclos, Trilhas e SAEB', '/aprendizagem'],
    ['👥', 'Acompanhar turmas', '#acompanhamentos'],
    ['📝', 'Planos de aula', '/coordenacao/planos'],
    ['📊', 'Gerar relatórios', '/coordenacao/relatorios'],
    ['📣', 'Enviar comunicado', '#comunicacao'],
    ['📅', 'Agendar reunião', '/gestao-municipal?tab=agenda'],
    ['⚠️', 'Ocorrências pedagógicas', '#ocorrencias'],
  ];

  return <div style={{ minHeight: '100vh', background: '#f4f7fc', color: '#09245a', fontFamily: 'Arial, sans-serif' }}>
    <header style={{ height: 78, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 4%', gap: 24, boxShadow: '0 2px 12px #dbe4f255', position: 'sticky', top: 0, zIndex: 2 }}>
      <div style={{ fontSize: 24, color: '#0a3270' }}>☰</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><img className="portal-header-logo" src="/images/prefeitura-transparent.svg" alt="Prefeitura Municipal de Pindobaçu" /><div><b style={{ fontSize: 21 }}>Portal do Coordenador</b><small style={{ display: 'block', color: '#607399' }}>Coordenação Pedagógica Municipal</small></div></div>
      <div style={{ margin: '0 auto', width: 'min(42vw, 510px)', border: '1px solid #d5e0ef', borderRadius: 11, padding: '13px 18px', color: '#7183a3' }}>⌕ &nbsp; Pesquisar turmas, professores, alunos e conteúdos...</div>
      <div style={{ textAlign: 'right' }}><b>{user?.nome || 'Coordenador(a)'}</b><small style={{ display: 'block', color: '#607399' }}>Coordenador(a) Pedagógico(a)</small></div>
      <button type="button" onClick={onLogout} aria-label="Sair e voltar para o login">Sair</button>
    </header>
    <main style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 'calc(100vh - 78px)' }}>
      <aside style={{ background: 'linear-gradient(#063675,#04285b)', color: '#fff', padding: '28px 18px' }}>
        <h1 style={{ margin: 0, fontSize: 30 }}>SIEDU</h1><p style={{ fontSize: 13, opacity: .86 }}>Sistema Integrado de Educação</p>
        {['Dashboard', 'Turmas', 'Professores', 'Alunos', 'Diário de classe', 'Planejamento', 'Frequência', 'Avaliações e IDEB', 'Relatórios', 'Comunicação', 'Agenda', 'Calendário escolar', 'Ocorrências'].map((item, index) => <button type="button" key={item} onClick={() => { const destinations = { Turmas: '/coordenacao/turmas', Professores: '/coordenacao/professores', Alunos: '/coordenacao/alunos', 'Diário de classe': '/coordenacao/diario', Planejamento: '/coordenacao/planos', Frequência: '/coordenacao/frequencia', 'Avaliações e IDEB': '/coordenacao/avaliacoes', Relatórios: '/coordenacao/relatorios', Comunicação: '/coordenacao/comunicacao', Agenda: '/coordenacao/agenda', 'Calendário escolar': '/calendario-escolar', Ocorrências: '/coordenacao/ocorrencias' }; destinations[item] ? window.location.assign(destinations[item]) : setNotice('Você já está no painel principal.'); }} style={{ width: '100%', padding: '12px 10px', marginTop: index === 0 ? 18 : 2, borderRadius: 8, background: index === 0 ? '#1476ef' : 'transparent', fontWeight: 600, textAlign: 'left' }}>{item}</button>)}
        <p style={{ marginTop: 38, borderTop: '1px solid #ffffff33', paddingTop: 18, fontSize: 12 }}>Secretaria Municipal de Educação<br />Prefeitura de Pindobaçu - Bahia</p>
      </aside>
      <section style={{ padding: '32px 3.5%', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div><h2 style={{ margin: 0, fontSize: 27 }}>Olá, {user?.nome?.split(' ')[0] || 'Coordenador(a)'}! 👋</h2><p style={{ color: '#5e7193' }}>Acompanhe os indicadores e as atividades pedagógicas da rede.</p></div>
        </div>
        {notice && <p style={{ padding: 12, background: '#e2f6ea', color: '#12603d', borderRadius: 8 }}>{notice}</p>}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, margin: '22px 0' }}>{cards.map(([icon, label, value, color]) => <article key={label} style={{ background: '#fff', borderRadius: 13, padding: 18, boxShadow: '0 2px 12px #dbe4f2' }}><span style={{ display: 'inline-block', padding: 10, minWidth: 20, textAlign: 'center', background: color, color: '#fff', borderRadius: '50%' }}>{icon}</span><small style={{ display: 'block', marginTop: 12 }}>{label}</small><b style={{ fontSize: 27, color: label.includes('pendentes') && value ? '#c62828' : '#09245a' }}>{value}</b><small style={{ display: 'block', color: label.includes('pendentes') ? (value ? '#c62828' : '#178d4c') : '#607399' }}>{label.includes('pendentes') ? (value ? 'Aguardam aprovação' : 'Tudo regular') : 'Indicador atualizado'}</small></article>) }</section>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18, marginBottom: 18 }}>
          <article style={{ background: 'linear-gradient(135deg,#113f80,#1774d1)', color: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #a9c5e8' }}><small style={{fontWeight:800}}>ANO LETIVO VIGENTE {idebAnalysis?.currentSchoolYear || new Date().getFullYear()}</small><h3 style={{ margin: '8px 0' }}>📈 Resultados do IDEB</h3>{idebAnalysis?.summaries?.map(item=><p key={item.stage} style={{display:'flex',justifyContent:'space-between'}}><span>{item.stage} ({item.latestYear})</span><b style={{fontSize:22}}>{Number(item.latestValue).toFixed(1)}</b></p>)}<button type="button" onClick={() => window.location.assign('/gestao-municipal?tab=ideb-analise')} style={{background:'#fff',color:'#145da8'}}>Analisar os últimos 10 anos</button></article>
          <article style={{ background: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #dbe4f2' }}><h3 style={{ marginTop: 0 }}>📅 Calendário escolar</h3><p>Cadastre períodos letivos, avaliações, simulados, reuniões, feriados e eventos oficiais.</p><button type="button" onClick={() => window.location.assign('/calendario-escolar')}>Gerenciar calendário completo</button></article>
          <article style={{ background: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #dbe4f2' }}><h3 style={{ marginTop: 0 }}>🏛️ Gestão municipal</h3><p>Indicadores IDEB, reuniões, demandas das escolas e relatórios oficiais.</p><button type="button" onClick={() => window.location.assign('/gestao-municipal')}>Abrir gestão municipal</button></article>
          <article style={{ background: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #dbe4f2' }}><h3 style={{ marginTop: 0 }}>📚 Desempenho por unidade</h3>{dashboard.academic?.performance?.length ? dashboard.academic.performance.slice(0, 4).map((item) => <p key={item.id} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #edf1f7', paddingBottom:7 }}><span>{item.nome}</span><b>{Number(item.media || 0).toFixed(1)}</b></p>) : <p>Nenhum resultado acadêmico consolidado.</p>}</article>
          <article style={{ background: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #dbe4f2' }}><h3 style={{ marginTop: 0 }}>📝 Planos de aula para aprovar</h3><p><b>{pendingPlans}</b> plano(s) aguardam análise pedagógica.</p><button type="button" onClick={() => window.location.assign('/coordenacao/planos')}>Abrir fila de revisão</button></article>
        </section>
        <section style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18 }}>
          <article style={{ background: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #dbe4f2' }}><h3 style={{ marginTop: 0 }}>Desempenho das unidades</h3>{dashboard.academic?.performance?.length ? <div style={{ height: 220, display: 'flex', alignItems: 'end', gap: 18, borderBottom: '1px solid #dce6f5', padding: '0 20px' }}>{dashboard.academic.performance.slice(0, 8).map((item) => { const score = Math.max(0, Math.min(10, Number(item.media || 0))); return <div key={item.id} style={{ flex: 1, textAlign: 'center' }}><small>{score.toFixed(1)}</small><div style={{ height: score * 18, background: '#176fe3', borderRadius: '5px 5px 0 0', marginTop: 5 }} /><small title={item.nome}>{item.nome?.slice(0, 10)}</small></div>; })}</div> : <p>Nenhum desempenho consolidado disponível.</p>}<p style={{ color: '#176fe3', textAlign: 'right' }}>Dados oficiais do diário e das avaliações</p></article>
          <article style={{ background: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #dbe4f2' }}><h3 style={{ marginTop: 0 }}>Pendências e alertas</h3>{pendingPlans > 0 && <p style={{ color: '#435a80' }}><b style={{ color: '#f09b19' }}>•</b> &nbsp; {pendingPlans} plano(s) de aula aguardando aprovação</p>}{dashboard.alerts?.length ? dashboard.alerts.slice(0, 5).map((item) => <p key={item.id} style={{ color: '#435a80' }}><b style={{ color: '#f09b19' }}>•</b> &nbsp; {item.title}: {item.detail}</p>) : pendingPlans === 0 && <p>Nenhuma pendência consolidada.</p>}</article>
          <article style={{ background: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #dbe4f2' }}><h3 style={{ marginTop: 0 }}>Unidades e acompanhamentos</h3><p><b>{schools.length}</b> escolas disponíveis para acompanhamento pedagógico.</p>{schools.slice(0, 4).map((school) => <p key={school.id} style={{ borderTop: '1px solid #edf1f7', paddingTop: 9 }}><b>{school.nome}</b><br /><small>{school.localidade || 'Rede municipal'} · Solicitar orientação</small></p>)}</article>
          <article style={{ background: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #dbe4f2' }}><h3 style={{ marginTop: 0 }}>Ações rápidas</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>{actions.map(([icon, action, target], i) => <button key={action} type="button" onClick={() => target.startsWith('/') ? window.location.assign(target) : setNotice(`${action} selecionado para acompanhamento pedagógico.`)} style={{ minHeight: 75, border: 0, borderRadius: 9, background: ['#edf4ff', '#eaf9f3', '#f5f0ff', '#fff5e8'][i % 4], color: '#09245a', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' }}><span style={{ fontSize: 25 }} aria-hidden="true">{icon}</span><span>{action}</span></button>)}</div></article>
        </section>
      </section>
    </main>
  </div>;
}
