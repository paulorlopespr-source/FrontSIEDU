import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, BarChart3, Bus, CheckCircle2, CircleDollarSign, ClipboardCheck, FileBarChart, FileCheck2, LogOut, Menu, ReceiptText, Search, ShieldCheck, WalletCards, X } from 'lucide-react';
import { api } from './services/api';
import { prefeituraLogo } from './prefeitura-logo';
import './financeiro-fiscal.css';

const routes = [
  ['Painel Financeiro e Fiscal', BarChart3, '/financeiro'],
  ['Orçamento e Execução', CircleDollarSign, '/financeiro/orcamento'],
  ['Despesas e Pagamentos', WalletCards, '/financeiro/despesas'],
  ['Prestação de Contas', ClipboardCheck, '/financeiro/prestacoes'],
  ['Relatórios Fiscais', FileBarChart, '/financeiro/relatorios'],
  ['Transportes', Bus, '/transportes'],
  ['Auditorias e Inspeções', ShieldCheck, '/financeiro/auditorias'],
];

const config = {
  orcamento: { title: 'Orçamento e Execução', subtitle: 'Acompanhe recursos autorizados, utilizados e disponíveis por unidade.', icon: CircleDollarSign },
  despesas: { title: 'Despesas e Pagamentos', subtitle: 'Consulte os lançamentos, fornecedores, documentos fiscais e pagamentos.', icon: WalletCards },
  prestacoes: { title: 'Prestação de Contas', subtitle: 'Acompanhe a entrega e a análise das prestações de cada escola.', icon: ClipboardCheck },
  relatorios: { title: 'Relatórios Fiscais', subtitle: 'Visão consolidada da execução financeira da rede municipal.', icon: FileBarChart },
  auditorias: { title: 'Auditorias e Inspeções', subtitle: 'Monitore pendências, conformidade e rastreabilidade dos recursos.', icon: ShieldCheck },
};

const money = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (value) => value ? new Date(value).toLocaleDateString('pt-BR') : '—';
const statusClass = (value = '') => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

function Sidebar({ user, onLogout, open, setOpen }) {
  return <>
    <button className="finance-menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />} Menu</button>
    {open && <button className="finance-backdrop" onClick={() => setOpen(false)} aria-label="Fechar menu" />}
    <aside className={`finance-sidebar ${open ? 'open' : ''}`}>
      <div className="finance-contractor"><img className="finance-city-logo" src={prefeituraLogo} alt="Identidade da instituição contratante" /><span><strong>Instituição contratante</strong><small>Secretaria de Educação</small></span></div>
      <Link className="sidebar-system-home" to="/financeiro"><img src="/images/siedu-logo-transparent.svg" alt="SIEDU — Sistema Integrado de Educação" /></Link>
      <nav><small>SECRETARIA FINANCEIRA</small>{routes.map(([label, Icon, href]) => <NavLink end={href === '/financeiro'} className={({ isActive }) => isActive ? 'active' : ''} to={href} key={label} onClick={() => setOpen(false)}><Icon /><span>{label}</span></NavLink>)}</nav>
      <footer><div><b>{user?.nome}</b><small>{user?.perfil}</small></div><button onClick={onLogout}><LogOut />Sair</button></footer>
    </aside>
  </>;
}

function Empty({ children }) { return <div className="finance-module-empty"><FileCheck2 /><b>Nenhum registro encontrado</b><p>{children}</p></div>; }

export default function FinanceiroFiscalModulo({ token, user, onLogout, module }) {
  const [data, setData] = useState({ allocations: [], expenses: [], statements: [], schools: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const page = config[module] || config.orcamento;
  useEffect(() => { let active = true; setLoading(true); api.getSchoolFinance(token).then(value => active && setData(value)).catch(e => active && setError(e.message)).finally(() => active && setLoading(false)); return () => { active = false; }; }, [token]);
  const totals = useMemo(() => { const allocated = data.allocations.reduce((sum, item) => sum + Number(item.valor_alocado || 0), 0); const spent = data.expenses.reduce((sum, item) => sum + Number(item.valor || 0), 0); return { allocated, spent, balance: allocated - spent, pending: data.statements.filter(item => item.status !== 'Aprovada').length }; }, [data]);
  const match = value => JSON.stringify(value).toLowerCase().includes(query.toLowerCase());
  const allocations = data.allocations.filter(match);
  const expenses = data.expenses.filter(match);
  const statements = data.statements.filter(match);
  const Icon = page.icon;

  return <div className="finance-shell"><Sidebar user={user} onLogout={onLogout} open={open} setOpen={setOpen} /><main className="finance-main">
    <header className="finance-module-head"><div><Link to="/financeiro"><ArrowLeft /> Voltar ao painel</Link><h1><Icon />{page.title}</h1><p>{page.subtitle}</p></div><label><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar nos registros..." /></label></header>
    {error && <section className="finance-error"><AlertTriangle /><div><b>Não foi possível carregar os dados</b><p>{error}</p></div></section>}
    {loading ? <div className="finance-loading">Carregando informações financeiras…</div> : <>
      <section className="finance-module-summary"><article><CircleDollarSign /><span><small>Orçamento autorizado</small><b>{money(totals.allocated)}</b></span></article><article><ReceiptText /><span><small>Total executado</small><b>{money(totals.spent)}</b></span></article><article><WalletCards /><span><small>Saldo disponível</small><b>{money(totals.balance)}</b></span></article><article><ClipboardCheck /><span><small>Prestações pendentes</small><b>{totals.pending}</b></span></article></section>
      {module === 'orcamento' && <section className="finance-panel finance-module-table"><header><div><h2>Recursos por unidade</h2><p>Valores autorizados, utilizados e saldo atual.</p></div></header>{allocations.length ? <div className="finance-table-wrap"><table><thead><tr><th>Unidade</th><th>Origem / categoria</th><th>Competência</th><th>Autorizado</th><th>Utilizado</th><th>Saldo</th><th>Situação</th></tr></thead><tbody>{allocations.map(item => <tr key={item.id}><td><b>{item.escola}</b></td><td>{item.origem || '—'}<small>{item.categoria}</small></td><td>{item.competencia || '—'}</td><td>{money(item.valor_alocado)}</td><td>{money(item.valor_utilizado)}</td><td><b>{money(item.saldo)}</b></td><td><span className={`finance-status ${statusClass(item.status)}`}>{item.status || 'Regular'}</span></td></tr>)}</tbody></table></div> : <Empty>Os recursos cadastrados aparecerão aqui.</Empty>}</section>}
      {module === 'despesas' && <section className="finance-panel finance-module-table"><header><div><h2>Lançamentos e pagamentos</h2><p>Histórico de despesas com documento fiscal.</p></div></header>{expenses.length ? <div className="finance-table-wrap"><table><thead><tr><th>Data</th><th>Unidade</th><th>Tipo / categoria</th><th>Fornecedor</th><th>Documento</th><th>Valor</th></tr></thead><tbody>{expenses.map(item => <tr key={item.id}><td>{date(item.data_lancamento)}</td><td><b>{item.escola}</b></td><td>{item.tipo}<small>{item.categoria}</small></td><td>{item.fornecedor || '—'}</td><td>{item.numero_nota_fiscal || '—'}</td><td><b>{money(item.valor)}</b></td></tr>)}</tbody></table></div> : <Empty>As despesas registradas pelas unidades aparecerão aqui.</Empty>}</section>}
      {module === 'prestacoes' && <section className="finance-panel finance-module-table"><header><div><h2>Prestações recebidas</h2><p>Situação da análise por competência e unidade.</p></div></header>{statements.length ? <div className="finance-table-wrap"><table><thead><tr><th>Competência</th><th>Unidade</th><th>Categoria</th><th>Responsável</th><th>Situação</th></tr></thead><tbody>{statements.map(item => <tr key={item.id}><td>{item.competencia}</td><td><b>{item.escola}</b></td><td>{item.categoria}</td><td>{item.enviada_por || 'Não informado'}</td><td><span className={`finance-status ${statusClass(item.status)}`}>{item.status}</span></td></tr>)}</tbody></table></div> : <Empty>As prestações encaminhadas pelas escolas aparecerão aqui.</Empty>}</section>}
      {module === 'relatorios' && <section className="finance-report-grid"><article className="finance-panel"><header><div><h2>Execução consolidada</h2><p>Indicadores gerais da rede.</p></div></header><div className="finance-report-progress"><span><b>Percentual executado</b><strong>{totals.allocated ? ((totals.spent / totals.allocated) * 100).toFixed(1) : 0}%</strong></span><i><b style={{ width: `${Math.min(100, totals.allocated ? totals.spent / totals.allocated * 100 : 0)}%` }} /></i></div></article><article className="finance-panel"><header><div><h2>Resumo documental</h2><p>Volume de registros disponíveis.</p></div></header><ul className="finance-report-list"><li><span>Recursos orçamentários</span><b>{data.allocations.length}</b></li><li><span>Despesas registradas</span><b>{data.expenses.length}</b></li><li><span>Prestações de contas</span><b>{data.statements.length}</b></li><li><span>Unidades acompanhadas</span><b>{data.schools.length}</b></li></ul></article></section>}
      {module === 'auditorias' && <section className="finance-audit-grid"><article className="finance-panel"><header><div><h2>Itens para inspeção</h2><p>Recursos com pendência ou justificativa registrada.</p></div></header>{allocations.filter(item => item.status === 'Com pendencia' || item.justificativa).length ? allocations.filter(item => item.status === 'Com pendencia' || item.justificativa).map(item => <div className="finance-audit-card" key={item.id}><AlertTriangle /><div><b>{item.escola}</b><small>{item.categoria} · {money(item.valor_alocado)}</small><p>{item.justificativa || 'Recurso sinalizado para conferência.'}</p></div><span>{item.status}</span></div>) : <Empty>Nenhuma pendência financeira foi identificada.</Empty>}</article><article className="finance-panel"><header><div><h2>Controles de conformidade</h2><p>Proteções aplicadas ao módulo.</p></div></header><div className="finance-audit"><ShieldCheck /><div><b>Rastreabilidade ativa</b><small>Autoria, documentos e histórico preservados.</small></div><span>Ativo</span></div><div className="finance-audit"><CheckCircle2 /><div><b>Acesso por perfil</b><small>Conteúdo restrito à Secretaria Financeira.</small></div><span>Protegido</span></div></article></section>}
    </>}
    <footer className="finance-legal"><ShieldCheck />Informações protegidas pela Lei de Responsabilidade Fiscal e pela LGPD.</footer>
  </main></div>;
}
