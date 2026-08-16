import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from './services/api';
import './gestor-dashboard.css';

const emptyDashboard = {
  summary: {
    schools: 0,
    students: 0,
    professors: 0,
    classes: 0,
    investment: 0,
    spent: 0,
    idebTarget: 0,
  },
  academic: { available: false, ideb: [], performance: [] },
  financeDistribution: [],
  schoolRanking: [],
  alerts: [],
  transport: { vehicles: 0, routes: 0, students: 0, maintenance: 0 },
  users: { active: 0, first_access: 0, directors: 0, coordinators: 0 },
};

const menuGroups = [
  { title: 'Gestão estratégica', items: ['Painel executivo', 'Indicadores do município', 'Metas e resultados', 'Unidades de ensino'] },
  { title: 'Gestão escolar', items: ['Escolas', 'Alunos', 'Professores', 'Turmas', 'Matrículas', 'Frequência', 'Avaliações e IDEB'] },
  { title: 'Gestão administrativa', items: ['Planejamento', 'Solicitações e demandas', 'Orçamento e financeiro', 'Recursos e convênios', 'Transporte escolar', 'Merenda escolar', 'Infraestrutura'] },
  { title: 'Relatórios e documentos', items: ['Relatórios gerenciais', 'Documentos oficiais', 'Prestação de contas'] },
];

const menuLinks = {
  'Painel executivo': '/gestor',
  'Indicadores do município': '/gestao-municipal?tab=indicadores',
  'Metas e resultados': '/gestao-municipal?tab=ideb-analise',
  'Unidades de ensino': '/gestor/escolas',
  Escolas: '/gestor/escolas',
  Alunos: '/gestor/rede/alunos',
  Professores: '/gestor/rede/professores',
  Turmas: '/gestor/rede/turmas',
  Matrículas: '/gestor/rede/matriculas',
  Frequência: '/gestor/rede/frequencia',
  'Avaliações e IDEB': '/gestao-municipal?tab=ideb',
  Planejamento: '/calendario-escolar',
  'Orçamento e financeiro': '/gestor/financeiro?tab=recursos',
  'Recursos e convênios': '/gestor/financeiro?tab=recursos',
  'Transporte escolar': '/transportes',
  'Solicitações e demandas': '/gestor/demandas',
  Infraestrutura: '/gestor/demandas',
  'Merenda escolar': '/gestor/financeiro?tab=despesas',
  'Relatórios gerenciais': '/gestao-municipal?tab=relatorios',
  'Documentos oficiais': '/gestao-municipal?tab=relatorios',
  'Prestação de contas': '/gestor/financeiro?tab=contas',
};

const quickActions = [
  ['Consultar escolas', '/gestor/escolas', '\u{1F3EB}'],
  ['Gerenciar professores', '/usuarios', '\u{1F469}\u200D\u{1F3EB}'],
  ['Gestão financeira', '/gestor/financeiro', '\u{1F4B0}'],
  ['Indicadores municipais', '/gestao-municipal', '\u{1F4C8}'],
  ['Auditoria do sistema', '/gestor/auditoria', '\u{1F6E1}\uFE0F'],
  ['Prestação de contas', '/gestor/financeiro', '\u{1F4C4}'],
  ['Convênios e recursos', '/gestor/financeiro', '\u{1F91D}'],
  ['Transporte escolar', '/transportes', '\u{1F68C}'],
  ['Solicitações e demandas', '/gestor/demandas', '\u{1F4E8}'],
];

function number(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function shortDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('pt-BR');
}

export function GestorSidebar({ onLogout }) {
  const location = useLocation();
  const current = `${location.pathname}${location.search}`;
  const active = (path) => path === '/gestor' ? current === '/gestor' : current === path || (!path.includes('?') && location.pathname.startsWith(path));
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <img src="/images/sigepin.png" alt="SIEDU-PINDOBAÇU" />
        <div><strong>SIEDU-PINDOBAÇU</strong><span>Sistema Integrado de Educação</span></div>
      </div>

      <Link className={`sidebar-current ${current === '/gestor' ? 'active' : ''}`} to="/gestor"><span>⌂</span> Dashboard</Link>

      <nav className="sidebar-menu">
        {menuGroups.map((group) => (
          <section key={group.title}>
            <h2>{group.title}</h2>
            {group.items.map((item) => <Link className={active(menuLinks[item]) ? 'active' : ''} key={item} to={menuLinks[item]}>{item}</Link>)}
          </section>
        ))}
      </nav>

      <section className="sidebar-settings">
        <span>Configurações</span>
        <Link to="/usuarios">Usuários e perfis</Link>
        <Link to="/gestor/auditoria">Auditoria do sistema</Link>
        <button type="button" onClick={onLogout}>Sair do sistema</button>
      </section>

      <div className="sidebar-city">
        <img src="/images/prefeitura.png" alt="Prefeitura de Pindobaçu" />
        <span>Prefeitura Municipal de Pindobaçu</span>
      </div>
    </aside>
  );
}

export function GestorTopbar({ user, onLogout, alertCount = 0 }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const search = (event) => {
    event.preventDefault();
    const value = query.trim().toLocaleLowerCase('pt-BR');
    if (!value) return;
    const target = value.includes('professor') ? '/gestor/rede/professores' : value.includes('aluno') || value.includes('matr') ? '/gestor/rede/alunos' : value.includes('turma') ? '/gestor/rede/turmas' : value.includes('escola') ? '/gestor/escolas' : value.includes('finance') || value.includes('orçamento') ? '/gestor/financeiro' : value.includes('transporte') ? '/transportes' : '/gestao-municipal?tab=relatorios';
    navigate(target);
  };
  return (
    <header className="dashboard-topbar">
      <button className="menu-trigger" type="button" disabled title="Menu já está aberto nesta versão">☰</button>
      <div className="topbar-title"><strong>Portal do Gestor</strong><span>Secretaria Municipal de Educação</span></div>
      <form className="dashboard-search" onSubmit={search} title="Pesquisar módulos da rede"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar escolas, alunos e relatórios..." /></form>
      <div className="topbar-actions">
        <button type="button" disabled title="Use a seção de alertas do painel">🔔{alertCount > 0 && <i>{alertCount}</i>}</button>
        <button type="button" onClick={() => navigate('/gestor/demandas')} title="Abrir solicitações e notificações">✉</button>
        <button type="button" onClick={() => setHelpOpen((value) => !value)} title="Ajuda rápida">?</button>
        {helpOpen && <div className="topbar-help">Use a pesquisa para abrir escolas, alunos, professores, turmas, finanças e relatórios.</div>}
      </div>
      <div className="topbar-user">
        <div className="user-avatar">{user?.nome?.slice(0, 1) || 'G'}</div>
        <div><strong>{user?.nome || 'Gestor Municipal'}</strong><span>Secretaria de Educação</span></div>
      </div>
      <button className="gestor-logout" type="button" onClick={onLogout}>Sair</button>
    </header>
  );
}

function StatCard({ stat }) {
  return (
    <article className={`stat-card ${stat.color}`}>
      <div className="stat-icon">{stat.icon}</div>
      <div><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></div>
      <footer>{stat.link ? <Link to={stat.link}><b>Abrir solicitações</b><span>Ver fluxo e notificações →</span></Link> : <><b>Banco de dados</b><span>atualização automática</span></>}</footer>
    </article>
  );
}

function EmptyAcademicPanel({ title, text }) {
  return (
    <article className="dashboard-panel empty-dashboard-panel">
      <h2>{title}</h2>
      <div className="empty-panel">{text}</div>
      <span className="real-data-label">Sem valores demonstrativos</span>
    </article>
  );
}

function FinancePanel({ distribution, total }) {
  return (
    <article className="dashboard-panel investment-chart">
      <h2>Distribuição real dos recursos</h2>
      {distribution.length === 0 ? (
        <div className="empty-panel">Nenhum recurso financeiro alocado.</div>
      ) : (
        <div className="real-distribution">
          <strong>{money(total)}</strong>
          {distribution.map((item, index) => {
            const percent = total ? (Number(item.value) / total) * 100 : 0;
            return (
              <div className="real-progress" key={item.categoria}>
                <span>{item.categoria}</span>
                <i><b className={index % 2 ? 'green' : 'blue'} style={{ width: `${percent}%` }} /></i>
                <em>{percent.toFixed(1)}%</em>
              </div>
            );
          })}
        </div>
      )}
      <Link to="/gestor/financeiro">Ver execução orçamentária ›</Link>
    </article>
  );
}

function TransportPanel({ transport }) {
  return (
    <article className="dashboard-panel real-transport-panel">
      <h2>Transporte escolar</h2>
      <div>
        <p><strong>{number(transport.vehicles)}</strong><span>Veículos ativos</span></p>
        <p><strong>{number(transport.routes)}</strong><span>Rotas ativas</span></p>
        <p><strong>{number(transport.students)}</strong><span>Alunos transportados</span></p>
        <p className={transport.maintenance ? 'data-alert' : ''}><strong>{number(transport.maintenance)}</strong><span>Manutenções pendentes</span></p>
      </div>
      <Link to="/transportes">Abrir gestão de transporte ›</Link>
    </article>
  );
}

function SchoolRanking({ schools }) {
  return (
    <article className="dashboard-panel ranking-panel">
      <h2>Recursos por escola</h2>
      {schools.length === 0 ? <div className="empty-panel">Nenhuma escola cadastrada.</div> : schools.map((school, index) => (
        <p key={school.id}><span>{index + 1}º</span><b>{school.nome}</b><strong>{money(school.value)}</strong></p>
      ))}
      <Link to="/gestor/financeiro">Ver gestão financeira ›</Link>
    </article>
  );
}

function AlertsPanel({ alerts }) {
  return (
    <article className="dashboard-panel notice-panel">
      <h2>Avisos reais do sistema</h2>
      {alerts.length === 0 ? <div className="empty-panel">Nenhuma pendência ou manutenção aguardando atendimento.</div> : alerts.map((alert) => (
        <p key={alert.id} className={`dashboard-alert-${alert.severity}`}>
          <span>{alert.severity === 'danger' ? '!' : '•'}</span>
          <b>{alert.title}</b>
          <small>{alert.detail}</small>
          <i>{alert.type}{alert.date ? ` · ${shortDate(alert.date)}` : ''}</i>
        </p>
      ))}
    </article>
  );
}

function UsersPanel({ users }) {
  return (
    <article className="dashboard-panel real-users-panel">
      <h2>Usuários e acessos</h2>
      <div><p><b>{number(users.active)}</b><span>Usuários ativos</span></p><p><b>{number(users.directors)}</b><span>Diretores</span></p><p><b>{number(users.coordinators)}</b><span>Coordenadores</span></p><p><b>{number(users.first_access)}</b><span>Primeiro acesso pendente</span></p></div>
      <Link to="/usuarios">Gerenciar usuários ›</Link>
    </article>
  );
}

export default function GestorDashboard({ user, onLogout, token }) {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [idebAnalysis, setIdebAnalysis] = useState(null);
  const [demands, setDemands] = useState([]);
  const [demandNotifications, setDemandNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api.getManagerDashboard(token),
      api.getIdebAnalysis(token).catch(() => null),
      api.listMunicipalDemands(token).catch(() => []),
      api.listDemandNotifications(token).catch(() => []),
    ])
      .then(([payload, analysis, demandItems, notifications]) => { if (active) { setDashboard(payload); setIdebAnalysis(analysis); setDemands(demandItems || []); setDemandNotifications(notifications || []); } })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token]);

  const stats = useMemo(() => [
    { label: 'Escolas ativas', value: number(dashboard.summary.schools), detail: 'Total de escolas', color: 'blue', icon: '🏫' },
    { label: 'Alunos matriculados', value: number(dashboard.summary.students), detail: 'Total no banco', color: 'green', icon: '👥' },
    { label: 'Professores', value: number(dashboard.summary.professors), detail: 'Usuários ativos', color: 'purple', icon: '👩‍🏫' },
    { label: 'Turmas ativas', value: number(dashboard.summary.classes), detail: 'Total no banco', color: 'orange', icon: '🎓' },
    { label: 'Investimento', value: money(dashboard.summary.investment), detail: `Utilizado: ${money(dashboard.summary.spent)}`, color: 'cyan', icon: '📈' },
    { label: 'Meta IDEB', value: Number(dashboard.summary.idebTarget).toFixed(1), detail: dashboard.academic.ideb.length ? 'Última meta oficial registrada' : 'Sem meta cadastrada', color: 'pink', icon: '🎯' },
    { label: 'Frequência média', value: `${Number(dashboard.summary.attendance||0).toFixed(1)}%`, detail: 'Consolidado dos diários', color: 'cyan', icon: '✓' },
    { label: 'Média geral da rede', value: Number(dashboard.summary.average||0).toFixed(1), detail: 'Consolidado das avaliações', color: 'orange', icon: '📊' },
    { label: 'Planos de aula pendentes', value: number(dashboard.summary.pendingPlans), detail: 'Aguardando coordenação', color: 'pink', icon: '📋' },
    { label: 'Solicitações e Demandas', value: number(demands.filter((item) => item.status !== 'Demanda resolvida').length), detail: demandNotifications.some((item) => !item.lidaEm) ? `${demandNotifications.filter((item) => !item.lidaEm).length} nova(s) notificação(ões)` : 'Nenhuma nova notificação', color: demandNotifications.some((item) => !item.lidaEm) ? 'pink' : 'green', icon: '📨', link: '/gestor/demandas' },
  ], [dashboard, demands, demandNotifications]);

  const today = new Date();
  const startOfYear = `01/01/${today.getFullYear()}`;
  const todayLabel = today.toLocaleDateString('pt-BR');
  const writtenDate = today.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="gestor-dashboard" id="dashboard">
      <GestorSidebar onLogout={onLogout} />
      <div className="dashboard-main">
        <GestorTopbar user={user} onLogout={onLogout} alertCount={dashboard.alerts.length + demandNotifications.filter((item) => !item.lidaEm).length} />
        <main className="dashboard-content" id="indicadores">
          <section className="dashboard-welcome">
            <div><h1>Bom dia, Gestor! 👋</h1><p>Visão geral da Rede Municipal de Ensino de Pindobaçu.</p><small>{writtenDate}</small></div>
            <div><button type="button" disabled title="Período atual do relatório">{startOfYear} - {todayLabel}</button><button className="export-button" type="button" onClick={() => window.print()}>⇩ Exportar relatório</button></div>
          </section>

          {error && <p className="dashboard-data-error">{error}</p>}
          {loading && <p className="dashboard-loading">Atualizando indicadores do banco...</p>}

          <section className="stats-grid">{stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}</section>

          <section className="dashboard-management">
            <div><span className="eyebrow">ACESSO ADMINISTRATIVO</span><h2>Gestão municipal integrada</h2><p>Os indicadores abaixo são calculados a partir dos registros reais do PostgreSQL.</p></div>
            <div className="dashboard-management-actions"><Link to="/usuarios">Gerenciar Diretores e Coordenadores</Link><Link to="/usuarios">Cadastrar Funcionários da Educação</Link><Link to="/transportes">Transportes e Rotas Escolares</Link><Link to="/escolas/cadastrar">Cadastrar Escolas da Rede</Link></div>
          </section>

          <section className="dashboard-management" style={{ marginTop: 20 }}>
            <div><span className="eyebrow">ACOMPANHAMENTO PEDAGÓGICO</span><h2>Calendário, IDEB e aprendizagem</h2><p>Ano letivo vigente: <b>{idebAnalysis?.currentSchoolYear || new Date().getFullYear()}</b>. Último ciclo oficial: <b>{idebAnalysis?.latestOfficialYear || 2025}</b>.</p></div>
            <div className="dashboard-management-actions"><Link to="/gestao-municipal?tab=ideb-analise">📈 Análise do IDEB — 10 anos</Link><Link to="/aprendizagem">🧭 Simulado SAEB e aprendizagem</Link><Link to="/calendario-escolar">📅 Gestão do calendário escolar</Link></div>
          </section>

          <section className="dashboard-charts">
            {idebAnalysis?.summaries?.length ? <article className="dashboard-panel"><h2>Resultados do IDEB</h2><p><b>Ano letivo vigente {idebAnalysis.currentSchoolYear}</b> · resultados oficiais até {idebAnalysis.latestOfficialYear}</p>{idebAnalysis.summaries.map(item=><p key={item.stage}><b>{item.stage}</b> — {Number(item.latestValue).toFixed(1)} ({item.latestYear})</p>)}<Link to="/gestao-municipal?tab=ideb-analise">Abrir análise dos últimos 10 anos ›</Link></article> : <EmptyAcademicPanel title="Evolução do IDEB" text="Ainda não existem avaliações IDEB registradas no banco." />}
            <FinancePanel distribution={dashboard.financeDistribution} total={dashboard.summary.investment} />
            <TransportPanel transport={dashboard.transport} />
          </section>

          <section className="dashboard-lower">
            {dashboard.academic.performance.some(item=>item.frequencia||item.media)?<article className="dashboard-panel"><h2>Indicadores de qualidade</h2>{dashboard.academic.performance.slice(0,5).map(item=><p key={item.id}><b>{item.nome}</b> — frequência {Number(item.frequencia).toFixed(1)}% · média {Number(item.media).toFixed(1)}</p>)}<Link to="/gestao-municipal">Ver todas as escolas ›</Link></article>:<EmptyAcademicPanel title="Indicadores de qualidade" text="Frequência e médias serão consolidadas após os lançamentos acadêmicos." />}
            <SchoolRanking schools={dashboard.schoolRanking} />
            <AlertsPanel alerts={dashboard.alerts} />
          </section>

          <section className="dashboard-lower dashboard-real-lower"><UsersPanel users={dashboard.users} /></section>

          <section className="quick-actions"><h2>Ações rápidas</h2><div>{quickActions.map(([label, link, icon]) => <Link key={label} to={link}><span>{icon}</span><b>{label}</b></Link>)}</div></section>
          <footer className="dashboard-footer">© 2026 SIEDU-PINDOBAÇU — Sistema Integrado de Educação de Pindobaçu. Todos os direitos reservados.<span>Versão 0.0.1 · Dados atualizados automaticamente</span></footer>
        </main>
      </div>
    </div>
  );
}
