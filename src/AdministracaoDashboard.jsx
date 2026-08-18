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
  UsersRound,
} from 'lucide-react';
import { api } from './services/api';
import AdministracaoSidebar from './AdministracaoSidebar';
import { AdministrationError, AdministrationSkeleton } from './AdministrationState';
import { AppShell, KpiCard, PageHeader } from './SieduUI';
import './administracao-dashboard.css';

const emptyOverview = {
  totals: { schools: 0, students: 0, classes: 0, professors: 0, employees: 0 },
  upcomingMeetings: 0,
};

export default function AdministracaoDashboard({ token, user, onLogout }) {
  const [overview, setOverview] = useState(emptyOverview);
  const [demands, setDemands] = useState([]);
  const [assetSummary, setAssetSummary] = useState({ divergencia: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(active = () => true) {
      setLoading(true);
      try {
        setError('');
        const [network, schoolDemands, assets] = await Promise.all([
          api.getMunicipalOverview(token),
          api.listMunicipalDemands(token),
          api.listAssets(token),
        ]);
        if (!active()) return;
        setOverview(network || emptyOverview);
        setDemands(schoolDemands || []);
        setAssetSummary(assets?.resumo || { divergencia: 0 });
      } catch (requestError) {
        if (active()) setError(requestError.message);
      } finally {
        if (active()) setLoading(false);
      }
  }
  useEffect(() => {
    let active = true;
    load(() => active);
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
    { label: 'Patrimônios com pendência', value: assetSummary.divergencia || 0, icon: PackageCheck, detail: 'Bens com divergência cadastrada', tone: assetSummary.divergencia ? 'orange' : 'blue' },
    { label: 'Solicitações pendentes', value: demandSummary.authorized, icon: ClipboardList, detail: 'Execuções aguardando atendimento', tone: demandSummary.authorized ? 'orange' : 'blue' },
  ];

  const recentDemands = demands.slice(0, 5);

  return <AppShell className="administration-shell" sidebar={<AdministracaoSidebar user={user} onLogout={onLogout}/> }>
    <main className="administration-main">
      <PageHeader eyebrow="Gestão administrativa municipal" title="Visão Geral Administrativa" description="Operação, atendimento e acompanhamento de toda a rede municipal." breadcrumbs={[{ label: 'Início', to: '/administracao' }, { label: 'Visão geral' }]}/>

      {error && <AdministrationError message={error} onRetry={() => load()}/>}
      {loading && <div className="administration-dashboard-skeleton"><AdministrationSkeleton rows={4} label="Atualizando painel administrativo"/></div>}

      {!loading && <section className="administration-metrics">{metrics.map(({ label, value, icon: Icon, detail, tone }, index) => {
        const destination = ['/administracao/funcionarios', null, '/administracao/demandas', '/administracao/patrimonio', '/administracao/solicitacoes'][index];
        return <KpiCard key={label} label={label} value={typeof value === 'number' ? value.toLocaleString('pt-BR') : value} description={detail} icon={Icon} tone={tone === 'orange' ? 'warning' : 'info'} to={destination}/>;
      })}</section>}

      {!loading && <section className="administration-workspace">
        <article className="administration-panel administration-demands"><header><div><small>OPERAÇÃO PRIORITÁRIA</small><h2>Demandas das escolas</h2><p>Receba e execute as demandas autorizadas pela gestão municipal.</p></div><Link to="/administracao/demandas">Abrir módulo <ChevronRight aria-hidden="true"/></Link></header><div className="administration-demand-summary"><span><strong>{demandSummary.open}</strong>Em acompanhamento</span><span><strong>{demandSummary.authorized}</strong>Autorizadas</span><span className={demandSummary.urgent ? 'urgent' : ''}><strong>{demandSummary.urgent}</strong>Alta prioridade</span></div>{recentDemands.length ? <div className="administration-demand-list">{recentDemands.map((demand) => <div key={demand.id}><span><b>{demand.titulo}</b><small>{demand.escola || 'Rede municipal'} · {demand.status}</small></span><em>{demand.urgencia || demand.prioridade || 'Normal'}</em></div>)}</div> : <div className="administration-empty"><Boxes aria-hidden="true"/><p>Nenhuma demanda disponível neste momento.</p></div>}</article>

        <article className="administration-panel administration-roadmap administration-quick-actions"><header><div><small>ACESSO DIRETO</small><h2>Ações rápidas</h2><p>Atalhos para as rotinas mais utilizadas.</p></div></header><div><Link to="/administracao/funcionarios"><UsersRound aria-hidden="true"/><b>Cadastrar funcionário</b><small>Cadastro funcional auditável</small></Link><Link to="/administracao/vinculos"><Building2 aria-hidden="true"/><b>Alterar lotação</b><small>Vínculos com escolas e setores</small></Link><Link to="/administracao/demandas"><Megaphone aria-hidden="true"/><b>Acompanhar demandas</b><small>Triagem e execução operacional</small></Link><Link to="/administracao/protocolo"><FolderClock aria-hidden="true"/><b>Registrar documento</b><small>Protocolo administrativo digital</small></Link></div></article>
      </section>}
    </main>
  </AppShell>;
}
