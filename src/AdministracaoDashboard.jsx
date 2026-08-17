import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Building2,
  ChevronRight,
  ClipboardList,
  FolderClock,
  Megaphone,
  PackageCheck,
  Search,
  Settings2,
  ShoppingCart,
  Truck,
  UsersRound,
  Warehouse,
} from 'lucide-react';
import { api } from './services/api';
import AdministracaoSidebar from './AdministracaoSidebar';
import './administracao-dashboard.css';

const emptyOverview = {
  totals: { schools: 0, students: 0, classes: 0, professors: 0, employees: 0 },
  upcomingMeetings: 0,
};

function PlannedBadge() {
  return <small className="administration-planned">Em implantação</small>;
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
    <AdministracaoSidebar user={user} onLogout={onLogout}/>

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
