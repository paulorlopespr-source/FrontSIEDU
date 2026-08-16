import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const modules = {
  turmas: { icon: '👥', title: 'Turmas acompanhadas', description: 'Acompanhe rendimento, frequência e encaminhamentos por turma.' },
  diario: { icon: '📖', title: 'Diário de classe', description: 'Consulte registros de aulas, conteúdos e frequência lançados pelos professores.' },
  frequencia: { icon: '✅', title: 'Frequência', description: 'Monitore presença, faltas recorrentes e alunos em risco.' },
  avaliacoes: { icon: '📊', title: 'Avaliações e IDEB', description: 'Analise resultados por etapa, disciplina e período.' },
  relatorios: { icon: '📑', title: 'Relatórios', description: 'Gere relatórios consolidados para orientar decisões pedagógicas.' },
  comunicacao: { icon: '📣', title: 'Comunicação', description: 'Registre comunicados e encaminhamentos com escolas e professores.' },
  agenda: { icon: '📅', title: 'Agenda', description: 'Organize reuniões, visitas técnicas e formações continuadas.' },
  ocorrencias: { icon: '⚠️', title: 'Ocorrências pedagógicas', description: 'Analise ocorrências e acompanhe planos de intervenção.' },
};

const baseRows = [
  ['6º Ano A', 'Escola Municipal Pindobaçu', '92%', '7,8', 'Acompanhamento regular'],
  ['7º Ano B', 'Colégio Caminhos do Saber', '88%', '6,9', 'Plano de intervenção'],
  ['9º Ano A', 'Escola Municipal Pindobaçu', '95%', '8,1', 'Meta atingida'],
];

export default function CoordenadorModulo({ type = 'turmas', user, onLogout }) {
  const module = modules[type] || modules.turmas;
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ titulo: '', data: '', responsavel: '', descricao: '' });
  const rows = useMemo(() => baseRows.filter((row) => row.join(' ').toLowerCase().includes(query.toLowerCase())), [query]);
  const save = (event) => {
    event.preventDefault();
    if (!form.titulo || !form.descricao) return;
    setItems((current) => [{ ...form, id: Date.now() }, ...current]);
    setForm({ titulo: '', data: '', responsavel: '', descricao: '' });
    setNotice(`${module.title}: registro salvo com sucesso.`);
  };
  const metricCards = type === 'turmas' ? [['Turmas monitoradas', '12', '👥'], ['Frequência média', '92,6%', '✅'], ['Média geral', '7,4', '📈'], ['Alertas ativos', '18', '⚠️']] : [['Registros no período', '48', '📋'], ['Pendências', type === 'ocorrencias' ? '6' : '4', '⏳'], ['Concluídos', '82%', '✅'], ['Última atualização', 'Hoje', '🕒']];
  return <div style={{ minHeight: '100vh', background: '#f4f7fc', color: '#09245a', fontFamily: 'Arial, sans-serif' }}>
    <header style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 4%', background: '#fff', borderBottom: '1px solid #dce5f0' }}><Link to="/coordenacao">← Portal do Coordenador</Link><b style={{ fontSize: 22 }}>{module.icon} {module.title}</b><span style={{ marginLeft: 'auto' }}>{user?.nome}</span><button type="button" onClick={onLogout}>Sair</button></header>
    <main style={{ maxWidth: 1250, margin: 'auto', padding: '30px 4%' }}><small style={{ color: '#1476ef', fontWeight: 900, letterSpacing: '.12em' }}>COORDENAÇÃO PEDAGÓGICA</small><h1 style={{ margin: '8px 0' }}>{module.title}</h1><p style={{ color: '#607399' }}>{module.description}</p>{notice && <p style={{ padding: 12, borderRadius: 8, background: '#e8f7ef', color: '#17633f' }}>{notice}</p>}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, margin: '22px 0' }}>{metricCards.map(([label, value, icon]) => <article key={label} style={{ background: '#fff', border: '1px solid #dce7f5', borderRadius: 12, padding: 16 }}><span style={{ fontSize: 22 }}>{icon}</span><small style={{ display: 'block', color: '#607399', marginTop: 8 }}>{label}</small><strong style={{ display: 'block', fontSize: 26, marginTop: 4 }}>{value}</strong></article>)}</section>
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,1.5fr) minmax(280px,1fr)', gap: 16 }}><article style={{ background: '#fff', border: '1px solid #dce7f5', borderRadius: 13, padding: 20 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}><h2 style={{ marginTop: 0 }}>Visão consolidada</h2><input aria-label="Pesquisar" placeholder="Pesquisar..." value={query} onChange={(event) => setQuery(event.target.value)} style={{ padding: 9, border: '1px solid #cbd8e9', borderRadius: 7, maxWidth: 170 }} /></div>{type === 'turmas' || type === 'frequencia' || type === 'avaliacoes' ? <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['Turma', 'Escola', 'Frequência', 'Média', 'Situação'].map((head) => <th key={head} style={{ textAlign: 'left', padding: 9, borderBottom: '2px solid #e7eef7', fontSize: 12 }}>{head}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell} style={{ padding: 10, borderBottom: '1px solid #edf1f7', fontSize: 13 }}>{cell}</td>)}</tr>)}</tbody></table></div> : <div style={{ padding: '25px 5px', color: '#607399' }}>Use o formulário ao lado para registrar e acompanhar ações deste módulo.</div>}</article>
        <article style={{ background: '#fff', border: '1px solid #dce7f5', borderRadius: 13, padding: 20 }}><h2 style={{ marginTop: 0 }}>Novo registro</h2><form onSubmit={save}><input required placeholder="Título ou referência" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: 10, marginBottom: 9 }} /><input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: 10, marginBottom: 9 }} /><input placeholder="Responsável / unidade" value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: 10, marginBottom: 9 }} /><textarea required placeholder="Descrição, análise ou encaminhamento" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', minHeight: 105, padding: 10 }} /><button style={{ marginTop: 10, padding: '10px 15px', border: 0, borderRadius: 8, background: '#176fe3', color: '#fff', fontWeight: 800 }}>Salvar registro</button></form></article></section>
      {items.length > 0 && <section style={{ marginTop: 16, background: '#fff', border: '1px solid #dce7f5', borderRadius: 13, padding: 20 }}><h2>Registros recentes</h2>{items.map((item) => <article key={item.id} style={{ padding: '11px 0', borderTop: '1px solid #edf1f7' }}><b>{item.titulo}</b> · {item.responsavel || 'Coordenação'}<p style={{ margin: '5px 0', color: '#607399' }}>{item.descricao}</p></article>)}</section>}
    </main></div>;
}
