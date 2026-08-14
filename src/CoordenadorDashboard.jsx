import React, { useEffect, useMemo, useState } from 'react';
import { api } from './services/api';

const formatHours = (minutes) => {
  const total = Math.max(0, Math.floor(minutes || 0));
  return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
};

export default function CoordenadorDashboard({ user, token, onLogout }) {
  const [schools, setSchools] = useState([]);
  const [dashboard, setDashboard] = useState({ summary: {} });
  const [clockedIn, setClockedIn] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    Promise.all([api.listSchools(token).catch(() => []), api.getManagerDashboard(token).catch(() => ({ summary: {} }))])
      .then(([units, data]) => { setSchools(units || []); setDashboard(data || { summary: {} }); });
    const saved = JSON.parse(localStorage.getItem('siedu_coordenacao_jornada') || '{}');
    if (saved.userId === user?.id) {
      setClockedIn(Boolean(saved.startedAt));
      setStartedAt(saved.startedAt || null);
      setMinutes(Number(saved.minutes || 0));
    }
  }, [token, user?.id]);

  useEffect(() => {
    if (!clockedIn || !startedAt) return undefined;
    const update = () => setMinutes((Date.now() - new Date(startedAt).getTime()) / 60000);
    update();
    const interval = window.setInterval(update, 30000);
    return () => window.clearInterval(interval);
  }, [clockedIn, startedAt]);

  const hoursToday = useMemo(() => clockedIn && startedAt ? (Date.now() - new Date(startedAt).getTime()) / 60000 : minutes, [clockedIn, startedAt, minutes]);

  function toggleWorkday() {
    if (clockedIn) {
      const total = (Date.now() - new Date(startedAt).getTime()) / 60000;
      localStorage.setItem('siedu_coordenacao_jornada', JSON.stringify({ userId: user?.id, minutes: total, startedAt: null }));
      setMinutes(total); setClockedIn(false); setStartedAt(null); setNotice('Jornada encerrada. As horas de hoje foram contabilizadas.');
      return;
    }
    const now = new Date().toISOString();
    localStorage.setItem('siedu_coordenacao_jornada', JSON.stringify({ userId: user?.id, minutes: 0, startedAt: now }));
    setMinutes(0); setStartedAt(now); setClockedIn(true); setNotice('Jornada iniciada. O tempo de trabalho está sendo contabilizado.');
  }

  const pendingPlans = 3;
  const cards = [
    ['🏫', 'Turmas acompanhadas', dashboard.summary?.classes || 0, '#1674e8'],
    ['👩‍🏫', 'Professores acompanhados', dashboard.summary?.professors || 0, '#14a96d'],
    ['🎒', 'Alunos matriculados', dashboard.summary?.students || 0, '#7350df'],
    ['📊', 'Média geral da escola', '7,4', '#f28b16'],
    ['✓', 'Frequência média', '92,6%', '#14b7c8'],
    ['📋', 'Planos de aula pendentes', pendingPlans, pendingPlans ? '#dc3545' : '#16a34a'],
  ];
  const actions = ['Acompanhar turmas', 'Planos de aula', 'Gerar relatórios', 'Enviar comunicado', 'Agendar reunião', 'Ocorrências pedagógicas'];

  return <div style={{ minHeight: '100vh', background: '#f4f7fc', color: '#09245a', fontFamily: 'Arial, sans-serif' }}>
    <header style={{ height: 78, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 4%', gap: 24, boxShadow: '0 2px 12px #dbe4f255', position: 'sticky', top: 0, zIndex: 2 }}>
      <div style={{ fontSize: 24, color: '#0a3270' }}>☰</div>
      <div><b style={{ fontSize: 21 }}>Portal do Coordenador</b><small style={{ display: 'block', color: '#607399' }}>Coordenação Pedagógica Municipal</small></div>
      <div style={{ margin: '0 auto', width: 'min(42vw, 510px)', border: '1px solid #d5e0ef', borderRadius: 11, padding: '13px 18px', color: '#7183a3' }}>⌕ &nbsp; Pesquisar turmas, professores, alunos e conteúdos...</div>
      <div style={{ textAlign: 'right' }}><b>{user?.nome || 'Coordenador(a)'}</b><small style={{ display: 'block', color: '#607399' }}>Coordenador(a) Pedagógico(a)</small></div>
      <button type="button" onClick={onLogout} aria-label="Sair e voltar para o login">Sair</button>
    </header>
    <main style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 'calc(100vh - 78px)' }}>
      <aside style={{ background: 'linear-gradient(#063675,#04285b)', color: '#fff', padding: '28px 18px' }}>
        <h1 style={{ margin: 0, fontSize: 30 }}>SIEDU</h1><p style={{ fontSize: 13, opacity: .86 }}>Sistema Integrado de Educação</p>
        {['Dashboard', 'Turmas', 'Professores', 'Alunos', 'Diário de classe', 'Planejamento', 'Frequência', 'Avaliações e IDEB', 'Relatórios', 'Comunicação', 'Agenda', 'Calendário escolar', 'Ocorrências'].map((item, index) => <button type="button" key={item} onClick={() => setNotice(index === 0 ? 'Você já está no painel principal.' : `${item}: módulo em preparação para a próxima etapa da versão beta.`)} style={{ width: '100%', padding: '12px 10px', marginTop: index === 0 ? 18 : 2, borderRadius: 8, background: index === 0 ? '#1476ef' : 'transparent', fontWeight: 600, textAlign: 'left' }}>{item}</button>)}
        <p style={{ marginTop: 38, borderTop: '1px solid #ffffff33', paddingTop: 18, fontSize: 12 }}>Secretaria Municipal de Educação<br />Prefeitura de Pindobaçu - Bahia</p>
      </aside>
      <section style={{ padding: '32px 3.5%', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div><h2 style={{ margin: 0, fontSize: 27 }}>Olá, {user?.nome?.split(' ')[0] || 'Coordenador(a)'}! 👋</h2><p style={{ color: '#5e7193' }}>Acompanhe os indicadores e as atividades pedagógicas da rede.</p></div>
        </div>
        {notice && <p style={{ padding: 12, background: '#e2f6ea', color: '#12603d', borderRadius: 8 }}>{notice}</p>}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, margin: '22px 0' }}>{cards.map(([icon, label, value, color]) => <article key={label} style={{ background: '#fff', borderRadius: 13, padding: 18, boxShadow: '0 2px 12px #dbe4f2' }}><span style={{ display: 'inline-block', padding: 10, minWidth: 20, textAlign: 'center', background: color, color: '#fff', borderRadius: '50%' }}>{icon}</span><small style={{ display: 'block', marginTop: 12 }}>{label}</small><b style={{ fontSize: 27, color: label.includes('pendentes') && value ? '#c62828' : '#09245a' }}>{value}</b><small style={{ display: 'block', color: label.includes('pendentes') ? (value ? '#c62828' : '#178d4c') : '#607399' }}>{label.includes('pendentes') ? (value ? 'Aguardam aprovação' : 'Tudo regular') : 'Indicador atualizado'}</small></article>) }</section>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18, marginBottom: 18 }}>
          <article style={{ background: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #dbe4f2' }}><h3 style={{ marginTop: 0 }}>📅 Calendário escolar</h3><p><b>15 ago</b> — Conselho pedagógico municipal</p><p><b>20 ago</b> — Fechamento do bimestre</p><p><b>25 ago</b> — Reunião com famílias</p><button type="button" onClick={() => setNotice('Calendário escolar aberto para consulta.')}>Ver calendário completo</button></article>
          <article style={{ background: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #dbe4f2' }}><h3 style={{ marginTop: 0 }}>📚 Desempenho por disciplina</h3>{[['Português','7,8'],['Matemática','6,9'],['Ciências','7,6'],['História','7,2']].map(([name,value]) => <p key={name} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #edf1f7', paddingBottom:7 }}><span>{name}</span><b>{value}</b></p>)}</article>
          <article style={{ background: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #dbe4f2' }}><h3 style={{ marginTop: 0 }}>📝 Planos de aula para aprovar</h3>{['Plano de Matemática — 7º Ano','Plano de Ciências — 8º Ano','Plano de Leitura — 6º Ano'].map((plan) => <p key={plan} style={{ borderBottom:'1px solid #edf1f7', paddingBottom:8 }}><b>{plan}</b><br /><button type="button" onClick={() => setNotice(plan + ' aprovado.')}>Aprovar</button> <button type="button" onClick={() => setNotice('Solicitada correção: ' + plan)}>Solicitar correção</button></p>)}</article>
        </section>
        <section style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18 }}>
          <article style={{ background: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #dbe4f2' }}><h3 style={{ marginTop: 0 }}>Desempenho das turmas</h3><div style={{ height: 220, display: 'flex', alignItems: 'end', gap: 18, borderBottom: '1px solid #dce6f5', padding: '0 20px' }}>{[81, 76, 68, 72, 65, 59, 71, 67].map((score, i) => <div key={i} style={{ flex: 1, textAlign: 'center' }}><small>{(score / 10).toFixed(1)}</small><div style={{ height: score * 1.8, background: '#176fe3', borderRadius: '5px 5px 0 0', marginTop: 5 }} /><small>{i + 6}º Ano</small></div>)}</div><p style={{ color: '#176fe3', textAlign: 'right' }}>Ver relatório completo →</p></article>
          <article style={{ background: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #dbe4f2' }}><h3 style={{ marginTop: 0 }}>Pendências e alertas</h3>{['Planos de aula aguardando aprovação', 'Turmas abaixo da média definida', 'Alunos com frequência abaixo de 75%', 'Diários de classe incompletos'].map((item, i) => <p key={item} style={{ color: '#435a80' }}><b style={{ color: '#f09b19' }}>• {i + 1}</b> &nbsp; {item}</p>)}<p style={{ borderTop: '1px solid #e3ebf6', paddingTop: 14, color: '#176fe3', textAlign: 'right' }}>Ver todas as pendências →</p></article>
          <article style={{ background: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #dbe4f2' }}><h3 style={{ marginTop: 0 }}>Unidades e acompanhamentos</h3><p><b>{schools.length}</b> escolas disponíveis para acompanhamento pedagógico.</p>{schools.slice(0, 4).map((school) => <p key={school.id} style={{ borderTop: '1px solid #edf1f7', paddingTop: 9 }}><b>{school.nome}</b><br /><small>{school.localidade || 'Rede municipal'} · Solicitar orientação</small></p>)}</article>
          <article style={{ background: '#fff', padding: 22, borderRadius: 13, boxShadow: '0 2px 12px #dbe4f2' }}><h3 style={{ marginTop: 0 }}>Ações rápidas</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>{actions.map((action, i) => <button key={action} type="button" onClick={() => setNotice(action + ' selecionado para acompanhamento pedagógico.')} style={{ minHeight: 75, border: 0, borderRadius: 9, background: ['#edf4ff', '#eaf9f3', '#f5f0ff', '#fff5e8'][i % 4], color: '#09245a', fontWeight: 700 }}>{action}</button>)}</div></article>
        </section>
      </section>
    </main>
  </div>;
}
