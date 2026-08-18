import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell, BookOpenCheck, Boxes, Building2, CalendarDays, ChevronRight,
  ClipboardList, FileClock, FileText, GraduationCap, Home, Menu, Package,
  Plus, School, ShieldCheck, Truck, UserRound, Users, Wrench, X,
} from 'lucide-react';
import {
  canAccessSchoolDemands, canAccessSchoolFinance, canManageSchoolAcademics,
  canManageSchoolStaff, destinationFor, isEducationAdministration,
  isFinanceFiscal, isMunicipalCoordinator, isMunicipalManager, isProfessor,
  isStudent, isSuperintendent,
} from './permissions';
import './mobile-navigation.css';

const item = (label, to, icon) => ({ label, to, icon });

function modulesFor(user) {
  if (isEducationAdministration(user)) return [
    item('Funcionários', '/administracao/funcionarios', Users),
    item('Vínculos e lotações', '/administracao/vinculos', Building2),
    item('Férias e afastamentos', '/administracao/afastamentos', CalendarDays),
    item('Documentos funcionais', '/administracao/documentos-funcionais', FileText),
    item('Demandas', '/administracao/demandas', ClipboardList),
    item('Patrimônio', '/administracao/patrimonio', Package),
    item('Almoxarifado', '/administracao/almoxarifado', Boxes),
    item('Transporte', '/administracao/transporte', Truck),
    item('Manutenção', '/administracao/manutencao', Wrench),
    item('Documentos e protocolo', '/administracao/protocolo', FileClock),
    item('Solicitações', '/administracao/solicitacoes', BookOpenCheck),
  ];
  if (isProfessor(user)) return [
    item('Minhas turmas', '/professor/turmas', School), item('Diário de classe', '/professor/diario', BookOpenCheck),
    item('Notas', '/professor/notas', GraduationCap), item('Planejamento', '/professor/planejamento', ClipboardList),
    item('Planos de aula', '/professor/planos', FileText), item('Atividades', '/professor/atividades', BookOpenCheck),
    item('Materiais', '/professor/materiais', Boxes), item('Calendário', '/professor/calendario', CalendarDays),
    item('Relatórios', '/professor/relatorios', FileText), item('Mensagens', '/professor/mensagens', Bell),
  ];
  if (isMunicipalCoordinator(user)) return [
    item('Professores', '/coordenacao/professores', Users), item('Alunos', '/coordenacao/alunos', GraduationCap),
    item('Turmas', '/coordenacao/turmas', School), item('Planos', '/coordenacao/planos', FileText),
    item('Frequência', '/coordenacao/frequencia', BookOpenCheck), item('Avaliações', '/coordenacao/avaliacoes', ClipboardList),
    item('Relatórios', '/coordenacao/relatorios', FileText), item('Agenda', '/coordenacao/agenda', CalendarDays),
    item('Comunicação', '/coordenacao/comunicacao', Bell),
  ];
  if (isMunicipalManager(user)) return [
    item('Rede municipal', '/gestao-municipal', Building2), item('Escolas', '/gestor/escolas', School),
    item('Usuários e perfis', '/usuarios', Users), item('Demandas', '/gestor/demandas', ClipboardList),
    item('Financeiro', '/gestor/financeiro', FileText), item('Transportes', '/transportes', Truck),
    item('Auditoria', '/gestor/auditoria', ShieldCheck), item('Calendário escolar', '/calendario-escolar', CalendarDays),
  ];
  if (isSuperintendent(user)) return [
    item('Gestão municipal', '/gestao-municipal', Building2), item('Aprendizagem', '/aprendizagem', GraduationCap),
    item('Calendário escolar', '/calendario-escolar', CalendarDays),
  ];
  if (isFinanceFiscal(user)) return [item('Painel financeiro', '/financeiro', FileText), item('Transportes', '/transportes', Truck)];
  if (isStudent(user)) return [item('Portal do aluno', '/aluno', GraduationCap)];

  const schoolItems = [];
  if (canManageSchoolAcademics(user)) schoolItems.push(
    item('Turmas', '/diretor/turmas', School), item('Frequência', '/diretor/frequencia', BookOpenCheck),
    item('Históricos', '/diretor/historicos', FileText), item('Documentos', '/diretor/documentos', FileText),
  );
  if (canManageSchoolStaff(user)) schoolItems.push(item('Cadastrar professor', '/diretor/cadastrar-professor', Users));
  if (canAccessSchoolFinance(user)) schoolItems.push(item('Financeiro escolar', '/diretor/financeiro', FileText));
  if (canAccessSchoolDemands(user)) schoolItems.push(item('Demandas', '/diretor/demandas', ClipboardList));
  schoolItems.push(item('Almoxarifado', '/diretor/almoxarifado', Boxes));
  return schoolItems;
}

function quickActionFor(user) {
  if (isEducationAdministration(user)) return item('Nova solicitação', '/administracao/solicitacoes', Plus);
  if (isProfessor(user)) return item('Abrir diário', '/professor/diario', Plus);
  if (isMunicipalCoordinator(user)) return item('Abrir agenda', '/coordenacao/agenda', Plus);
  if (isMunicipalManager(user)) return item('Ver demandas', '/gestor/demandas', Plus);
  if (canManageSchoolAcademics(user)) return item('Nova matrícula', '/diretor/matricular-aluno', Plus);
  return item('Início', destinationFor(user), Plus);
}

export default function MobileNavigation({ user, onLogout }) {
  const location = useLocation();
  const [panel, setPanel] = useState(null);
  const modules = useMemo(() => modulesFor(user), [user]);
  const quickAction = quickActionFor(user);
  const QuickActionIcon = quickAction.icon;
  const home = destinationFor(user);

  useEffect(() => setPanel(null), [location.pathname]);
  useEffect(() => {
    if (!panel) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && setPanel(null);
    document.body.classList.add('mobile-nav-open');
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.classList.remove('mobile-nav-open'); window.removeEventListener('keydown', onKeyDown); };
  }, [panel]);

  if (!user) return null;
  const PanelIcon = panel === 'notifications' ? Bell : panel === 'profile' ? UserRound : Menu;

  return <>
    <nav className="mobile-bottom-nav" aria-label="Navegação principal móvel">
      <Link className={location.pathname === home ? 'active' : ''} to={home}><Home/><span>Início</span></Link>
      <button type="button" onClick={() => setPanel('notifications')} aria-expanded={panel === 'notifications'}><Bell/><span>Avisos</span></button>
      <Link className="mobile-quick-action" to={quickAction.to} aria-label={quickAction.label}><QuickActionIcon/><span>{quickAction.label}</span></Link>
      <button type="button" onClick={() => setPanel('modules')} aria-expanded={panel === 'modules'}><Menu/><span>Módulos</span></button>
      <button type="button" onClick={() => setPanel('profile')} aria-expanded={panel === 'profile'}><UserRound/><span>Perfil</span></button>
    </nav>
    {panel && <div className="mobile-drawer-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setPanel(null)}>
      <section className="mobile-drawer" role="dialog" aria-modal="true" aria-label={panel === 'modules' ? 'Módulos disponíveis' : panel === 'profile' ? 'Perfil e sessão' : 'Avisos'}>
        <header><span><PanelIcon/><strong>{panel === 'modules' ? 'Módulos' : panel === 'profile' ? 'Meu perfil' : 'Avisos'}</strong></span><button type="button" onClick={() => setPanel(null)} aria-label="Fechar"><X/></button></header>
        {panel === 'modules' && <div className="mobile-module-list">{modules.map(({ label, to, icon: Icon }) => <Link key={to} to={to} className={location.pathname === to ? 'active' : ''}><Icon/><span>{label}</span><ChevronRight/></Link>)}</div>}
        {panel === 'notifications' && <div className="mobile-empty-state"><Bell/><strong>Central de avisos</strong><p>Sem uma contagem geral disponível. Consulte os módulos abaixo para ver alertas e pendências atualizados.</p><h3>Urgentes</h3><span>Nenhum alerta geral recebido.</span><h3>Pendências</h3>{modules.slice(0, 2).map(({ label, to }) => <Link key={to} to={to}>{label}<ChevronRight/></Link>)}<h3>Informativas</h3>{modules[2] && <Link to={modules[2].to}>{modules[2].label}<ChevronRight/></Link>}</div>}
        {panel === 'profile' && <div className="mobile-profile-panel"><div className="mobile-profile-identity"><span>{String(user.nome || 'U').slice(0, 2).toUpperCase()}</span><div><strong>{user.nome}</strong><small>{user.perfil}</small></div></div><Link to="/alterar-senha">Alterar senha<ChevronRight/></Link><button type="button" className="mobile-logout" onClick={onLogout}>Sair do sistema</button></div>}
      </section>
    </div>}
  </>;
}
