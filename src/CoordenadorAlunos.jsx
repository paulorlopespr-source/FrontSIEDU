import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './services/api';

export default function CoordenadorAlunos({ user, token, onLogout }) {
  const [dashboard, setDashboard] = useState({ summary: {}, academic: { performance: [] } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function load() { setLoading(true); setError(''); try { setDashboard(await api.getManagerDashboard(token) || { summary: {}, academic: { performance: [] } }); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [token]);
  const performance = dashboard.academic?.performance || [];
  const risk = performance.filter((item) => Number(item.frequencia || 0) < 75 || Number(item.media || 0) < 6);
  return <main style={{ minHeight: '100vh', background: '#f4f7fc', color: '#09245a', padding: '28px 4%' }}><header style={{ display: 'flex', gap: 18, alignItems: 'center' }}><Link to="/coordenacao">← Portal do Coordenador</Link><h1>Alunos e acompanhamento</h1><span style={{ marginLeft: 'auto' }}>{user?.nome}</span><button onClick={onLogout}>Sair</button></header><p>Indicadores consolidados dos diários, matrículas e avaliações da rede.</p>{error && <div role="alert"><b>Não foi possível carregar os dados.</b><p>{error}</p><button onClick={load}>Tentar novamente</button></div>}{loading ? <p>Carregando dados oficiais…</p> : <><section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>{[['Alunos matriculados', dashboard.summary?.students || 0], ['Frequência média', `${Number(dashboard.summary?.attendance || 0).toFixed(1)}%`], ['Média geral', Number(dashboard.summary?.average || 0).toFixed(1)], ['Unidades em atenção', risk.length]].map(([label, value]) => <article key={label} style={{ background: '#fff', padding: 18, borderRadius: 12 }}><small>{label}</small><strong style={{ display: 'block', fontSize: 28 }}>{value}</strong></article>)}</section><section style={{ marginTop: 18, background: '#fff', padding: 20, borderRadius: 12 }}><h2>Acompanhamento por unidade</h2>{performance.length ? <div style={{ overflowX: 'auto' }}><table style={{ width: '100%' }}><thead><tr><th>Unidade</th><th>Frequência</th><th>Média</th><th>Situação</th></tr></thead><tbody>{performance.map((item) => <tr key={item.id}><td>{item.nome}</td><td>{Number(item.frequencia || 0).toFixed(1)}%</td><td>{Number(item.media || 0).toFixed(1)}</td><td>{Number(item.frequencia || 0) < 75 || Number(item.media || 0) < 6 ? 'Requer acompanhamento' : 'Regular'}</td></tr>)}</tbody></table></div> : <p>Nenhum lançamento acadêmico disponível para consolidação.</p>}</section></>}</main>;
}
