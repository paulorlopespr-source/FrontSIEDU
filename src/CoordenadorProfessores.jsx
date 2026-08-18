import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './services/api';

export default function CoordenadorProfessores({ user, token, onLogout }) {
  const [dashboard, setDashboard] = useState({ summary: {} });
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function load() { setLoading(true); setError(''); try { const [data, pending] = await Promise.all([api.getManagerDashboard(token), api.listLessonPlansForReview('Enviado para aprovação', token)]); setDashboard(data || { summary: {} }); setPlans(pending || []); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [token]);
  return <main style={{ minHeight: '100vh', background: '#f4f7fc', color: '#09245a', padding: '28px 4%' }}><header style={{ display: 'flex', gap: 18, alignItems: 'center' }}><Link to="/coordenacao">← Portal do Coordenador</Link><h1>Professores e planejamento</h1><span style={{ marginLeft: 'auto' }}>{user?.nome}</span><button onClick={onLogout}>Sair</button></header><p>Acompanhe professores e revise planejamentos registrados oficialmente.</p>{error && <div role="alert"><b>Não foi possível carregar os dados.</b><p>{error}</p><button onClick={load}>Tentar novamente</button></div>}{loading ? <p>Carregando dados oficiais…</p> : <><section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>{[['Professores ativos', dashboard.summary?.professors || 0], ['Planos pendentes', plans.length], ['Turmas da rede', dashboard.summary?.classes || 0], ['Média da rede', Number(dashboard.summary?.average || 0).toFixed(1)]].map(([label, value]) => <article key={label} style={{ background: '#fff', padding: 18, borderRadius: 12 }}><small>{label}</small><strong style={{ display: 'block', fontSize: 28 }}>{value}</strong></article>)}</section><section style={{ marginTop: 18, background: '#fff', padding: 20, borderRadius: 12 }}><h2>Planos aguardando análise</h2>{plans.length ? plans.slice(0, 12).map((plan) => <article key={plan.id} style={{ borderTop: '1px solid #e4eaf3', padding: '12px 0' }}><b>{plan.professor}</b> — {plan.turma}<p>{plan.tema}</p><small>{plan.escola} · {plan.status}</small></article>) : <p>Nenhum plano aguardando aprovação.</p>}<Link to="/coordenacao/planos">Abrir fila completa de revisão</Link></section></>}</main>;
}
