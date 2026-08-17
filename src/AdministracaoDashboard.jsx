import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileArchive,
  FileBarChart,
  FolderClock,
  LayoutDashboard,
  LogOut,
  Megaphone,
  PackageCheck,
  Search,
  Settings2,
  ShoppingCart,
  Truck,
  UserRound,
  UsersRound,
  Warehouse,
  Wrench,
} from 'lucide-react';
import { api } from './services/api';
import './administracao-dashboard.css';

const emptyOverview = {
  totals: { schools: 0, students: 0, classes: 0, professors: 0, employees: 0 },
  upcomingMeetings: 0,
};

const navigationGroups = [
  {
    label: 'GESTÃO DE PESSOAS',
    items: [
      { label: 'Funcionários', icon: UsersRound, planned: true },
      { label: 'Vínculos e Lotações', icon: Building2, planned: true },
      { label: 'Férias e Afastamentos', icon: CalendarDays, planned: true },
      { label: 'Documentos Funcionais', icon: FileArchive, planned: true },
    ],
  },
  {
    label: 'OPERAÇÕES',
    items: [
      { label: 'Demandas', icon: Megaphone, to: '/administracao/demandas' },
      { label: 'Patrimônio', icon: PackageCheck, planned: true },
      { label: 'Almoxarifado', icon: Warehouse, planned: true },
      { label: 'Transporte', icon: Truck, planned: true },
      { label: 'Manutenção', icon: Wrench, planned: true },
    ],
  },
  {
    label: 'ADMINISTRATIVO',
    items: [
      { label: 'Documentos e Protocolo', icon: FolderClock, planned: true },
      { label: 'Solicitações', icon: ClipboardList, planned: true },
      { label: 'Compras', icon: ShoppingCart, planned: true },
      { label: 'Contratos', icon: FileArchive, planned: true },
      { label: 'Agenda', icon: CalendarDays, planned: true },
    ],
  },
  {
    label: 'REDE MUNICIPAL',
    items: [
      { label: 'Escolas', icon: Building2, planned: true },
      { label: 'Turmas', icon: UsersRound, planned: true },
      { label: 'Alunos (consulta)', icon: UserRound, planned: true },
      { label: 'Indicadores (consulta)', icon: FileBarChart, planned: true },
    ],
  },
];

function PlannedBadge() {
  return <small className="administration-planned">Em implantação</small>;
}

function NavigationItem({ item }) {
  const Icon = item.icon;
  if (item.to) {
    return <Link to={item.to}><Icon aria-hidden="true"/><span>{item.label}</span><ChevronRight aria-hidden="true"/></Link>;
  }
  return <span className="administration-nav-disabled" aria-disabled="true"><Icon aria-hidden="true"/><span>{item.label}</span><PlannedBadge/></span>;
}

export default function AdministracaoDashboard({ token, user, onLogout }) {
  const [overview, setOverview] = useState(emptyOverview);
  const [demands, setDemands] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setError('');
        const [network, schoolDemands] = await Promise.all([
          api.getMunicipalOverview(token),
          api.listMunicipalDemands(token),
        ]);
        if (!active) return;
        setOverview(network || emptyOverview);
        setDemands(schoolDemands || []);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [token]);

  const demandSummary = useMemo(() => {
    const open = demands.filter((item) => item.status !== 'Demanda resolvida').length;
    const authorized = demands.filter((item) => /autorizada|execução/i.test(item.status || '')).length;
    const urgent = demands.filter((item) => /urgente|alta/i.test(item.urgencia || item.prioridade || '')).length;
    return { open, authorized, urgent };
  }, [demands]);

  const metrics = [
    { label: 'Funcionários vinculados', value: overview.totals.employees, icon: UsersRound, detail: 'Toda a rede municipal', tone: 'blue' },
    { label: 'Escolas', value: overview.totals.schools, icon: Building2, detail: 'Unidades acompanhadas', tone: 'blue' },
    { label: 'Demandas abertas', value: demandSummary.open, icon: Megaphone, detail: 'Aguardando andamento', tone: demandSummary.open ? 'orange' : 'blue' },
    { label: 'Execuções autorizadas', value: demandSummary.authorized, icon: ClipboardList, detail: 'Prontas para atendimento', tone: demandSummary.authorized ? 'green' : 'blue' },
    { label: 'Patrimônio', value: '—', icon: PackageCheck, detail: 'Módulo em implantação', tone: 'muted' },
    { label: 'Transportes', value: '—', icon: Truck, detail: 'Módulo em implantação', tone: 'muted' },
    { label: 'Documentos pendentes', value: '—', icon: FolderClock, detail: 'Módulo em implantação', tone: 'muted' },
    { label: 'Solicitações', value: '—', icon: ClipboardList, detail: 'Módulo em implantação', tone: 'muted' },
  ];

  const recentDemands = demands.slice(0, 5);

  return <div className="administration-shell">
    <aside className="administration-sidebar">
      <div className="administration-brand"><span>S</span><div><strong>SIEDU</strong><small>Secretaria Administrativa</small></div></div>
      <nav aria-label="Navegação da Secretaria Administrativa">
        <Link className="active" to="/administracao"><LayoutDashboard aria-hidden="true"/><span>Visão Geral</span></Link>
        {navigationGroups.map((group) => <section key={group.label}><h2>{group.label}</h2>{group.items.map((item) => <NavigationItem item={item} key={item.label}/>)}</section>)}
        <section><h2>GESTÃO</h2><span className="administration-nav-disabled" aria-disabled="true"><FileBarChart aria-hidden="true"/><span>Relatórios</span><PlannedBadge/></span><span className="administration-nav-disabled" aria-disabled="true"><Bell aria-hidden="true"/><span>Notificações</span><PlannedBadge/></span></section>
      </nav>
      <div className="administration-user"><div><UserRound aria-hidden="true"/><span><strong>{user?.nome || 'Usuário administrativo'}</strong><small>{user?.perfil}</small></span></div><button type="button" onClick={onLogout}><LogOut aria-hidden="true"/> Sair</button></div>
    </aside>

    <main className="administration-main">
      <header className="administration-topbar"><div><small>GESTÃO ADMINISTRATIVA MUNICIPAL</small><h1>Visão Geral Administrativa</h1><p>Operação, atendimento e acompanhamento de toda a rede municipal.</p></div><div className="administration-top-actions"><label><Search aria-hidden="true"/><input aria-label="Pesquisar no portal" placeholder="Pesquisar" disabled/><PlannedBadge/></label><button type="button" disabled aria-label="Configurações em implantação"><Settings2 aria-hidden="true"/></button></div></header>

      {error && <p className="administration-feedback">Não foi possível atualizar o painel: {error}</p>}
      {loading && <p className="administration-loading">Atualizando dados administrativos...</p>}

      <section className="administration-metrics">{metrics.map(({ label, value, icon: Icon, detail, tone }) => <article className={`tone-${tone}`} key={label}><span><Icon aria-hidden="true"/></span><strong>{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</strong><h2>{label}</h2><p>{detail}</p></article>)}</section>

      <section className="administration-workspace">
        <article className="administration-panel administration-demands"><header><div><small>OPERAÇÃO PRIORITÁRIA</small><h2>Demandas das escolas</h2><p>Receba e execute as demandas autorizadas pela gestão municipal.</p></div><Link to="/administracao/demandas">Abrir módulo <ChevronRight aria-hidden="true"/></Link></header><div className="administration-demand-summary"><span><strong>{demandSummary.open}</strong>Em acompanhamento</span><span><strong>{demandSummary.authorized}</strong>Autorizadas</span><span className={demandSummary.urgent ? 'urgent' : ''}><strong>{demandSummary.urgent}</strong>Alta prioridade</span></div>{recentDemands.length ? <div className="administration-demand-list">{recentDemands.map((demand) => <div key={demand.id}><span><b>{demand.titulo}</b><small>{demand.escola || 'Rede municipal'} · {demand.status}</small></span><em>{demand.urgencia || demand.prioridade || 'Normal'}</em></div>)}</div> : <div className="administration-empty"><Boxes aria-hidden="true"/><p>Nenhuma demanda disponível neste momento.</p></div>}</article>

        <article className="administration-panel administration-roadmap"><header><div><small>IMPLANTAÇÃO GRADUAL</small><h2>Próximos módulos operacionais</h2><p>A estrutura está preparada sem liberar funções incompletas.</p></div></header><div><span><PackageCheck aria-hidden="true"/><b>Patrimônio</b><small>Cadastro, tombamento e movimentação</small></span><span><Warehouse aria-hidden="true"/><b>Almoxarifado</b><small>Estoque, separação e entrega</small></span><span><FolderClock aria-hidden="true"/><b>Protocolo</b><small>Documentos e tramitação administrativa</small></span><span><ShoppingCart aria-hidden="true"/><b>Compras</b><small>Solicitação, aprovação e recebimento</small></span></div></article>
      </section>
    </main>
  </div>;
}
