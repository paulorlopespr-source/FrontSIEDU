import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './services/api';

const emptyDashboard = { summary: { schools: 0, students: 0, professors: 0, classes: 0, idebTarget: 0 }, academic: { ideb: [] } };
const emptyFinance = { allocations: [], expenses: [], statements: [] };
const number = (value) => Number(value || 0).toLocaleString('pt-BR');
const money = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function SuperintendenciaDashboard({ user, token, onLogout }) {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [schools, setSchools] = useState([]);
  const [academic, setAcademic] = useState(null);
  const [finance, setFinance] = useState(emptyFinance);

  useEffect(() => {
    Promise.all([
      api.getManagerDashboard(token),
      api.listSchools(token),
      api.getAcademicSummary({}, token).catch(() => null),
      api.getSchoolFinance(token).catch(() => emptyFinance),
    ]).then(([data, units, academics, financial]) => {
      setDashboard(data || emptyDashboard);
      setSchools(units || []);
      setAcademic(academics);
      setFinance(financial || emptyFinance);
    });
  }, [token]);

  const indicators = useMemo(() => [
    ['Escolas acompanhadas', number(dashboard.summary.schools), 'Unidades sob responsabilidade técnica'],
    ['Alunos matriculados', number(dashboard.summary.students), 'Visão consolidada da rede'],
    ['Turmas ativas', number(dashboard.summary.classes), 'Acompanhamento por etapa e período'],
    ['Meta IDEB', Number(dashboard.summary.idebTarget || 0).toFixed(1), 'Resultado e metas da rede'],
  ], [dashboard]);

  const financeSummary = useMemo(() => {
    const allocations = finance.allocations || [];
    const expenses = finance.expenses || [];
    return {
      allocated: allocations.reduce((total, item) => total + Number(item.valor_alocado || 0), 0),
      used: expenses.reduce((total, item) => total + Number(item.valor || 0), 0),
      balance: allocations.reduce((total, item) => total + Number(item.saldo || 0), 0),
      pending: allocations.filter((item) => item.status === 'Com pendencia').length,
    };
  }, [finance]);

  const card = { background: '#fff', padding: 22, borderRadius: 14, border: '1px solid #e2e9f3' };
  const th = { textAlign: 'left', padding: 10, color: '#627492', fontSize: 13 };
  const td = { padding: 10, borderTop: '1px solid #edf1f7' };

  return <div className="siedu-profile-page superintendencia-portal" style={{ minHeight: '100vh', background: '#f4f7fb', color: '#17335e' }}>
    <header className="siedu-profile-header superintendencia-header" style={{ background: '#fff', borderBottom: '1px solid #dbe4f2', padding: '16px 5%', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ marginRight: 'auto' }}><small style={{ color: '#1872d3', fontWeight: 800 }}>SUPERVISÃO PEDAGÓGICA MUNICIPAL</small><h1 style={{ margin: 0, fontSize: 22 }}>Portal da Superintendência</h1></div>
      <Link to="/superintendencia">Painel</Link><Link to="/gestao-municipal">Gestão municipal</Link><Link to="/aprendizagem">SAEB e Aprendizagem</Link><a href="#demandas">Escolas</a><a href="#pedagogico">Pedagógico</a><a href="#financeiro">Financeiro</a>
      <div><b>{user?.nome || 'Superintendente'}</b><small style={{ display: 'block', color: '#627492' }}>Superintendente / Diretor de Ensino</small></div>
      <button type="button" onClick={onLogout}>Sair</button>
    </header>
    <main className="siedu-profile-content superintendencia-content" style={{ maxWidth: 1380, margin: 'auto', padding: '34px 5%' }}>
      <section className="siedu-profile-hero" style={{ padding: 30, borderRadius: 18, background: 'linear-gradient(120deg,#0e4f9b,#1872d3)', color: '#fff', display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div><small>REDE MUNICIPAL DE ENSINO</small><h2 style={{ fontSize: 28, margin: '8px 0' }}>Acompanhamento pedagógico, financeiro e institucional</h2><p>Consulte resultados, acompanhe demandas, recursos e prestações de contas das unidades.</p></div>
        <Link to="/gestao-municipal" style={{background:'#fff',color:'#1263bd',padding:12,borderRadius:8,fontWeight:800}}>Indicadores, agenda e demandas</Link>
      </section>
      <section className="siedu-profile-quick-actions" style={{ ...card, marginTop: 18 }}><small style={{ color: '#1872d3', fontWeight: 800 }}>ACESSO DIRETO</small><h2>Ações rápidas</h2><div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><Link to="/gestao-municipal?tab=agenda">Agenda e visitas</Link><Link to="/gestao-municipal?tab=demandas">Demandas escolares</Link><Link to="/aprendizagem">SAEB e aprendizagem</Link><Link to="/gestao-municipal?tab=relatorios">Emitir relatório</Link></div></section>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 15, margin: '22px 0' }}>
        {indicators.map(([label, value, detail]) => <article key={label} style={{ background: '#fff', padding: 20, borderRadius: 14, border: '1px solid #e2e9f3' }}><small>{label}</small><strong style={{ display: 'block', fontSize: 28, color: '#1263bd', margin: '10px 0' }}>{value}</strong><small>{detail}</small></article>)}
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 18 }}>
        <article id="demandas" style={{ ...card, gridColumn: '1/-1' }}>
          <small style={{ color: '#1872d3', fontWeight: 800 }}>DEMANDAS ESCOLARES</small><h2>Unidades sob acompanhamento</h2>
          <div style={{ overflow: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={th}>Unidade</th><th style={th}>Localidade</th><th style={th}>Direção</th><th style={th}>Encaminhamento</th></tr></thead><tbody>{schools.map((school) => <tr key={school.id}><td style={td}><b>{school.nome}</b></td><td style={td}>{school.localidade || 'Não informada'}</td><td style={td}>{school.diretor || 'Sem diretor vinculado'}</td><td style={td}><Link to="/gestao-municipal?tab=agenda">Agendar visita</Link> · <Link to="/gestao-municipal?tab=demandas">Acompanhar demandas</Link></td></tr>)}</tbody></table></div>
          {!schools.length && <p>Nenhuma escola cadastrada para acompanhamento.</p>}
        </article>
        <article id="pedagogico" style={card}><small style={{ color: '#1872d3', fontWeight: 800 }}>INDICADORES PEDAGÓGICOS</small><h2>Frequência, rendimento e evasão</h2><p>{academic?.summary ? 'Indicadores acadêmicos consolidados disponíveis.' : 'Os indicadores serão apresentados por escola, turma, etapa e período quando houver lançamentos acadêmicos.'}</p><a href="#demandas">Consultar escolas acompanhadas ›</a></article>
        <article style={card}><small style={{ color: '#1872d3', fontWeight: 800 }}>PLANEJAMENTO E ORIENTAÇÕES</small><h2>Registros pedagógicos</h2><p><Link to="/gestao-municipal?tab=indicadores">Consultar indicadores</Link> · <Link to="/gestao-municipal?tab=relatorios">Emitir relatório</Link></p><p>Indicadores, relatórios pedagógicos e calendários ficam vinculados aos registros oficiais.</p></article>
        <article style={card}><small style={{ color: '#1872d3', fontWeight: 800 }}>IDEB E RESULTADOS</small><h2>Desempenho da rede</h2>{dashboard.academic?.ideb?.length ? dashboard.academic.ideb.map((item) => <p key={item.ano}><b>{item.ano}</b>: {item.valor}</p>) : <p>Ainda não existem avaliações IDEB registradas no banco.</p>}</article>
        <article style={card}><small style={{ color: '#1872d3', fontWeight: 800 }}>REGISTROS OFICIAIS</small><h2>Visitas, orientações e pareceres</h2><p>Utilize Agenda, Demandas e Relatórios para que cada ação permaneça registrada no banco e no histórico de auditoria.</p><Link to="/gestao-municipal">Abrir gestão municipal</Link></article>
      </section>
      <section id="financeiro" style={{ ...card, marginTop: 18 }}>
        <small style={{ color: '#1872d3', fontWeight: 800 }}>GESTÃO FINANCEIRA E PRESTAÇÃO DE CONTAS</small>
        <h2>Acompanhamento financeiro da rede</h2>
        <p>Consulta de recursos, despesas, saldos e pendências. O Superintendente pode emitir parecer técnico, sem aprovar lançamentos, pagamentos ou prestações.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, margin: '18px 0' }}>
          {[['Recursos alocados', money(financeSummary.allocated)], ['Despesas registradas', money(financeSummary.used)], ['Saldo disponível', money(financeSummary.balance)], ['Pendências', number(financeSummary.pending)]].map(([label, value]) => <div key={label} style={{ background: '#f4f8fe', borderRadius: 10, padding: 16 }}><small>{label}</small><strong style={{ display: 'block', fontSize: 22, color: '#1263bd', marginTop: 8 }}>{value}</strong></div>)}
        </div>
        <h3>Recursos por unidade</h3>
        <div style={{ overflow: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={th}>Escola</th><th style={th}>Categoria</th><th style={th}>Alocado</th><th style={th}>Utilizado</th><th style={th}>Saldo</th><th style={th}>Situação</th></tr></thead><tbody>{(finance.allocations || []).map((item) => <tr key={item.id}><td style={td}>{item.escola}</td><td style={td}>{item.categoria}</td><td style={td}>{money(item.valor_alocado)}</td><td style={td}>{money(item.valor_utilizado)}</td><td style={td}>{money(item.saldo)}</td><td style={td}>{item.status}</td></tr>)}</tbody></table></div>
        {!(finance.allocations || []).length && <p>Não há recursos financeiros lançados para o período selecionado.</p>}
        <h3 style={{ marginTop: 24 }}>Prestação de contas</h3>
        <div style={{ overflow: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={th}>Competência</th><th style={th}>Escola</th><th style={th}>Categoria</th><th style={th}>Responsável</th><th style={th}>Situação</th></tr></thead><tbody>{(finance.statements || []).map((item) => <tr key={item.id}><td style={td}>{item.competencia}</td><td style={td}>{item.escola}</td><td style={td}>{item.categoria}</td><td style={td}>{item.enviada_por || 'Não informado'}</td><td style={td}>{item.status}</td></tr>)}</tbody></table></div>
        {!(finance.statements || []).length && <p>Nenhuma prestação de contas encaminhada até o momento.</p>}
        <button type="button" onClick={() => window.print()}>Emitir relatório de prestação de contas</button>
      </section>
      <p style={{ borderLeft: '4px solid #1263bd', background: '#eaf3ff', padding: 16, marginTop: 22 }}><b>Acesso do Superintendente:</b> consulta integral de dados pedagógicos e financeiros, emissão de relatórios, pareceres técnicos e solicitações de correção. <strong>Não pode criar ou excluir usuários, alocar recursos, registrar despesas ou aprovar pagamentos e prestações de contas.</strong></p>
    </main>
  </div>;
}
