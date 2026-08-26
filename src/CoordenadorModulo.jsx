import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './services/api';

const modules = {
  turmas: ['Turmas acompanhadas', 'Acompanhe rendimento e frequência consolidados por unidade.'],
  diario: ['Diário de classe', 'Consulte a consolidação dos registros acadêmicos lançados.'],
  frequencia: ['Frequência', 'Monitore presença e unidades que exigem acompanhamento.'],
  avaliacoes: ['Avaliações e IDEB', 'Analise médias oficiais e resultados consolidados.'],
  relatorios: ['Relatórios', 'Emita arquivos oficiais com rastreabilidade.'],
  comunicacao: ['Comunicação', 'Consulte comunicações recebidas e enviadas.'],
  agenda: ['Agenda', 'Organize reuniões, visitas técnicas e formações.'],
  ocorrencias: ['Ocorrências pedagógicas', 'Acompanhe alertas acadêmicos e situações que exigem intervenção pedagógica.'],
};
const reportTypes = [['escolas', 'Escolas'], ['funcionarios', 'Funcionários'], ['demandas', 'Demandas'], ['ideb', 'IDEB']];
const formatDate = (value) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';

export default function CoordenadorModulo({ type = 'turmas', user, token, onLogout }) {
  const [dashboard, setDashboard] = useState({ summary: {}, academic: { performance: [] } });
  const [meetings, setMeetings] = useState([]);
  const [messages, setMessages] = useState({ recebidas: [], enviadas: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [meeting, setMeeting] = useState({ titulo: '', tipo: 'Reunião pedagógica', inicio: '', local: '', pauta: '' });
  const [saving, setSaving] = useState(false);
  const [title, description] = modules[type] || modules.turmas;

  async function load() {
    setLoading(true); setError('');
    try {
      const base = await api.getManagerDashboard(token);
      setDashboard(base || { summary: {}, academic: { performance: [] } });
      if (type === 'agenda') setMeetings(await api.listMunicipalMeetings(token) || []);
      if (type === 'comunicacao') setMessages(await api.listProfessorMessages(token) || { recebidas: [], enviadas: [] });
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [token, type]);

  const performance = useMemo(() => (dashboard.academic?.performance || []).filter((item) => `${item.nome} ${item.frequencia} ${item.media}`.toLowerCase().includes(query.toLowerCase())), [dashboard, query]);
  const summary = dashboard.summary || {};
  const cards = [['Turmas', summary.classes || 0], ['Alunos', summary.students || 0], ['Frequência média', `${Number(summary.attendance || 0).toFixed(1)}%`], ['Média geral', Number(summary.average || 0).toFixed(1)]];

  async function createMeeting(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      await api.createMunicipalMeeting({ ...meeting, inicio: new Date(meeting.inicio).toISOString(), fim: null, escolaId: null, linkVirtual: null, participantes: null }, token);
      setMeeting({ titulo: '', tipo: 'Reunião pedagógica', inicio: '', local: '', pauta: '' });
      setNotice('Reunião incluída na agenda municipal.'); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  return <div style={{ minHeight: '100vh', background: '#f4f7fc', color: '#09245a' }}>
    <header style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 4%', background: '#fff', borderBottom: '1px solid #dce5f0' }}><Link to="/coordenacao">← Portal do Coordenador</Link><b style={{ fontSize: 22 }}>{title}</b><span style={{ marginLeft: 'auto' }}>{user?.nome}</span><button type="button" onClick={onLogout}>Sair</button></header>
    <main style={{ maxWidth: 1250, margin: 'auto', padding: '30px 4%' }}><small style={{ color: '#1476ef', fontWeight: 900, letterSpacing: '.12em' }}>COORDENAÇÃO PEDAGÓGICA</small><h1>{title}</h1><p style={{ color: '#607399' }}>{description}</p>
      {error && <div role="alert" style={{ padding: 14, background: '#fff0f0', border: '1px solid #efb8b8', borderRadius: 10 }}><b>Não foi possível carregar os dados.</b><p>{error}</p><button type="button" onClick={load}>Tentar novamente</button></div>}
      {notice && <p role="status" style={{ padding: 12, background: '#e8f7ef', color: '#17633f', borderRadius: 8 }}>{notice}</p>}
      {loading ? <p style={{ padding: 28, background: '#fff', borderRadius: 12 }}>Carregando dados oficiais…</p> : <>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, margin: '22px 0' }}>{cards.map(([label, value]) => <article key={label} style={{ background: '#fff', border: '1px solid #dce7f5', borderRadius: 12, padding: 16 }}><small style={{ color: '#607399' }}>{label}</small><strong style={{ display: 'block', fontSize: 26, marginTop: 5 }}>{value}</strong></article>)}</section>
        {['turmas', 'diario', 'frequencia', 'avaliacoes'].includes(type) && <section style={{ background: '#fff', border: '1px solid #dce7f5', borderRadius: 13, padding: 20 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><h2>Indicadores por unidade</h2><input aria-label="Pesquisar unidade" placeholder="Pesquisar unidade" value={query} onChange={(event) => setQuery(event.target.value)} /></div>{performance.length ? <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['Unidade', 'Frequência', 'Média', 'Situação'].map((head) => <th key={head} style={{ textAlign: 'left', padding: 10, borderBottom: '2px solid #e7eef7' }}>{head}</th>)}</tr></thead><tbody>{performance.map((item) => <tr key={item.id}><td style={{ padding: 10 }}>{item.nome}</td><td>{Number(item.frequencia || 0).toFixed(1)}%</td><td>{Number(item.media || 0).toFixed(1)}</td><td>{Number(item.frequencia || 0) < 75 || Number(item.media || 0) < 6 ? 'Requer acompanhamento' : 'Regular'}</td></tr>)}</tbody></table></div> : <p>Nenhum indicador acadêmico disponível para o período.</p>}</section>}
        {type === 'relatorios' && <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>{reportTypes.map(([key, label]) => <article key={key} style={{ background: '#fff', border: '1px solid #dce7f5', borderRadius: 12, padding: 18 }}><h2>{label}</h2><p>Arquivo CSV emitido e registrado no histórico oficial.</p><button type="button" onClick={() => api.downloadMunicipalReport(key, token).catch((requestError) => setError(requestError.message))}>Baixar relatório</button></article>)}</section>}
        {type === 'agenda' && <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}><article style={{ background: '#fff', padding: 20, borderRadius: 12 }}><h2>Nova reunião</h2><form onSubmit={createMeeting}><input required placeholder="Título" value={meeting.titulo} onChange={(e) => setMeeting({ ...meeting, titulo: e.target.value })}/><input required type="datetime-local" value={meeting.inicio} onChange={(e) => setMeeting({ ...meeting, inicio: e.target.value })}/><input placeholder="Local" value={meeting.local} onChange={(e) => setMeeting({ ...meeting, local: e.target.value })}/><textarea required minLength={5} placeholder="Pauta" value={meeting.pauta} onChange={(e) => setMeeting({ ...meeting, pauta: e.target.value })}/><button disabled={saving}>{saving ? 'Salvando…' : 'Agendar'}</button></form></article><article style={{ background: '#fff', padding: 20, borderRadius: 12 }}><h2>Agenda municipal</h2>{meetings.length ? meetings.map((item) => <p key={item.id}><b>{item.titulo}</b><br/><small>{formatDate(item.inicio)} · {item.local || 'Local a definir'} · {item.status}</small></p>) : <p>Nenhuma reunião cadastrada.</p>}</article></section>}
        {type === 'comunicacao' && <section style={{ background: '#fff', padding: 20, borderRadius: 12 }}><h2>Comunicações</h2>{[...(messages.recebidas || []), ...(messages.enviadas || [])].length ? [...(messages.recebidas || []), ...(messages.enviadas || [])].map((item) => <article key={`${item.id}-${item.remetente || item.destinatario}`} style={{ borderTop: '1px solid #edf1f7', padding: '12px 0' }}><b>{item.assunto}</b><p>{item.corpo}</p><small>{item.remetente ? `De: ${item.remetente}` : `Para: ${item.destinatario}`} · {formatDate(item.criadoEm)}</small></article>) : <p>Nenhuma comunicação encontrada.</p>}</section>}
        {type === 'ocorrencias' && <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
          {(dashboard.alerts || []).length ? (dashboard.alerts || []).map((item) => <article key={item.id || `${item.title}-${item.detail}`} style={{ background: '#fff', padding: 20, border: '1px solid #dce7f5', borderLeft: '5px solid #f28b16', borderRadius: 12 }}><small style={{ color: '#a85d05', fontWeight: 900 }}>ACOMPANHAMENTO PEDAGÓGICO</small><h2 style={{ fontSize: 18 }}>{item.title || 'Situação identificada'}</h2><p>{item.detail || 'Verifique os indicadores acadêmicos relacionados.'}</p><Link to="/coordenacao/gestao-pedagogica">Abrir gestão pedagógica →</Link></article>) : <article style={{ background: '#fff', padding: 24, border: '1px solid #dce7f5', borderRadius: 12 }}><h2>Nenhuma ocorrência ativa</h2><p>Não há alertas acadêmicos consolidados que exijam intervenção neste momento.</p><Link to="/coordenacao/frequencia">Conferir frequência</Link></article>}
          <article style={{ background: '#eef6ff', padding: 20, border: '1px solid #b9d6f5', borderRadius: 12 }}><h2>Registrar acompanhamento</h2><p>Use a Gestão Pedagógica para registrar AC, intervenção, conselho de classe e PEI com histórico oficial.</p><Link to="/coordenacao/gestao-pedagogica">Abrir fluxo oficial →</Link></article>
        </section>}
      </>}
    </main>
  </div>;
}
