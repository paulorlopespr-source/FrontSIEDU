import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './services/api';

const empty = { summary: { schools: 0, students: 0, professors: 0, classes: 0, idebTarget: 0 }, academic: { ideb: [] } };
const number = (value) => Number(value || 0).toLocaleString('pt-BR');

export default function SuperintendenciaDashboard({ user, token, onLogout }) {
  const [dashboard, setDashboard] = useState(empty);
  const [schools, setSchools] = useState([]);
  const [academic, setAcademic] = useState(null);
  const [records, setRecords] = useState([]);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    Promise.all([api.getManagerDashboard(token), api.listSchools(token), api.getAcademicSummary({}, token).catch(() => null)])
      .then(([data, units, academics]) => { setDashboard(data || empty); setSchools(units || []); setAcademic(academics); });
  }, [token]);

  const indicators = useMemo(() => [
    ['Escolas acompanhadas', number(dashboard.summary.schools), 'Unidades sob responsabilidade técnica'],
    ['Alunos matriculados', number(dashboard.summary.students), 'Visão consolidada da rede'],
    ['Turmas ativas', number(dashboard.summary.classes), 'Acompanhamento por etapa e período'],
    ['Meta IDEB', Number(dashboard.summary.idebTarget || 0).toFixed(1), 'Resultado e metas da rede'],
  ], [dashboard]);

  function register(type, target) {
    setRecords((items) => [{ id: Date.now(), type, target, date: new Date().toLocaleDateString('pt-BR') }, ...items]);
    setNotice(type + ' registrado para acompanhamento pedagógico.');
  }

  return <div style={{ minHeight: '100vh', background: '#f4f7fb', color: '#17335e' }}>
    <header style={{ background: '#fff', borderBottom: '1px solid #dbe4f2', padding: '16px 5%', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ marginRight: 'auto' }}><small style={{ color: '#1872d3', fontWeight: 800 }}>SUPERVISÃO PEDAGÓGICA MUNICIPAL</small><h1 style={{ margin: 0, fontSize: 22 }}>Portal da Superintendência</h1></div>
      <Link to="/superintendencia">Painel</Link><Link to="/gestor/escolas">Escolas</Link><Link to="/gestor">Visão municipal</Link>
      <div><b>{user?.nome || 'Superintendente'}</b><small style={{ display: 'block', color: '#627492' }}>Superintendente / Diretor de Ensino</small></div>
      <button type="button" onClick={onLogout}>Sair</button>
    </header>
    <main style={{ maxWidth: 1380, margin: 'auto', padding: '34px 5%' }}>
      <section style={{ padding: 30, borderRadius: 18, background: 'linear-gradient(120deg,#0e4f9b,#1872d3)', color: '#fff', display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div><small>REDE MUNICIPAL DE ENSINO</small><h2 style={{ fontSize: 28, margin: '8px 0' }}>Acompanhamento pedagógico e institucional</h2><p>Consulte resultados, acompanhe demandas das unidades e encaminhe orientações à rede.</p></div>
        <button type="button" onClick={() => window.print()}>⇩ Emitir relatório consolidado</button>
      </section>
      {notice && <p style={{ background: '#e4f6eb', color: '#176d3d', padding: 12 }}>{notice}</p>}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 15, margin: '22px 0' }}>
        {indicators.map(([label, value, detail]) => <article key={label} style={{ background: '#fff', padding: 20, borderRadius: 14, border: '1px solid #e2e9f3' }}><small>{label}</small><strong style={{ display: 'block', fontSize: 28, color: '#1263bd', margin: '10px 0' }}>{value}</strong><small>{detail}</small></article>)}
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 18 }}>
        <article style={{ gridColumn: '1/-1', background: '#fff', padding: 22, borderRadius: 14, border: '1px solid #e2e9f3' }}>
          <small style={{ color: '#1872d3', fontWeight: 800 }}>DEMANDAS ESCOLARES</small><h2>Unidades sob acompanhamento</h2>
          <div style={{ overflow: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={{ textAlign: 'left' }}>Unidade</th><th style={{ textAlign: 'left' }}>Localidade</th><th style={{ textAlign: 'left' }}>Direção</th><th>Encaminhamento</th></tr></thead><tbody>{schools.map((school) => <tr key={school.id}><td style={{ padding: 10, borderTop: '1px solid #edf1f7' }}><b>{school.nome}</b></td><td style={{ borderTop: '1px solid #edf1f7' }}>{school.localidade || 'Não informada'}</td><td style={{ borderTop: '1px solid #edf1f7' }}>{school.diretor || 'Sem diretor vinculado'}</td><td style={{ borderTop: '1px solid #edf1f7' }}><button onClick={() => register('Visita técnica', school.nome)}>Registrar visita</button> <button onClick={() => register('Solicitação de correção', school.nome)}>Solicitar correção</button></td></tr>)}</tbody></table></div>
          {!schools.length && <p>Nenhuma escola cadastrada para acompanhamento.</p>}
        </article>
        <article style={{ background: '#fff', padding: 22, borderRadius: 14, border: '1px solid #e2e9f3' }}><small style={{ color: '#1872d3', fontWeight: 800 }}>INDICADORES PEDAGÓGICOS</small><h2>Frequência, rendimento e evasão</h2><p>{academic?.summary ? 'Indicadores acadêmicos consolidados disponíveis.' : 'Os indicadores serão apresentados por escola, turma, etapa e período quando houver lançamentos acadêmicos.'}</p><Link to="/gestor/escolas">Consultar por escola e turma ›</Link></article>
        <article style={{ background: '#fff', padding: 22, borderRadius: 14, border: '1px solid #e2e9f3' }}><small style={{ color: '#1872d3', fontWeight: 800 }}>PLANEJAMENTO E ORIENTAÇÕES</small><h2>Registros pedagógicos</h2><p><button onClick={() => register('Orientação pedagógica', 'Rede Municipal')}>Registrar orientação</button> <button onClick={() => register('Parecer técnico', 'Rede Municipal')}>Emitir parecer</button></p><p>Planejamentos, relatórios pedagógicos e calendários podem ser consultados por escola.</p></article>
        <article style={{ background: '#fff', padding: 22, borderRadius: 14, border: '1px solid #e2e9f3' }}><small style={{ color: '#1872d3', fontWeight: 800 }}>IDEB E RESULTADOS</small><h2>Desempenho da rede</h2>{dashboard.academic?.ideb?.length ? dashboard.academic.ideb.map((item) => <p key={item.ano}><b>{item.ano}</b>: {item.valor}</p>) : <p>Ainda não existem avaliações IDEB registradas no banco.</p>}</article>
        <article style={{ background: '#fff', padding: 22, borderRadius: 14, border: '1px solid #e2e9f3' }}><small style={{ color: '#1872d3', fontWeight: 800 }}>REGISTROS DA SESSÃO</small><h2>Visitas, orientações e pareceres</h2>{records.length ? <ul>{records.map((record) => <li key={record.id}><b>{record.type}</b> — {record.target} <small>({record.date})</small></li>)}</ul> : <p>Registre visitas técnicas, orientações, pareceres e pedidos de correção para acompanhar as demandas da rede.</p>}</article>
      </section>
      <p style={{ borderLeft: '4px solid #1263bd', background: '#eaf3ff', padding: 16, marginTop: 22 }}><b>Acesso do Superintendente:</b> consulta integral da rede, acompanhamento pedagógico, relatórios consolidados e encaminhamentos às unidades. <strong>Não possui permissão para criar ou excluir usuários.</strong></p>
    </main>
  </div>;
}
