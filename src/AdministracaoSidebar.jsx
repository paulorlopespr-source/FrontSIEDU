import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Bell, Building2, CalendarDays, ChevronRight, ClipboardList, FileArchive,
  FileBarChart, FolderClock, LayoutDashboard, LogOut, Megaphone, PackageCheck,
  ShoppingCart, Truck, UserRound, UsersRound, Warehouse, Wrench,
} from 'lucide-react';

const navigationGroups = [
  { label: 'GESTÃO DE PESSOAS', items: [
    { label: 'Funcionários', icon: UsersRound, to: '/administracao/funcionarios' }, { label: 'Vínculos e Lotações', icon: Building2, to: '/administracao/vinculos' },
    { label: 'Férias e Afastamentos', icon: CalendarDays, to: '/administracao/afastamentos' }, { label: 'Documentos Funcionais', icon: FileArchive },
  ] },
  { label: 'OPERAÇÕES', items: [
    { label: 'Demandas', icon: Megaphone, to: '/administracao/demandas' },
    { label: 'Patrimônio', icon: PackageCheck, to: '/administracao/patrimonio' }, { label: 'Almoxarifado', icon: Warehouse, to: '/administracao/almoxarifado' },
    { label: 'Transporte', icon: Truck }, { label: 'Manutenção', icon: Wrench, to: '/administracao/manutencao' },
  ] },
  { label: 'ADMINISTRATIVO', items: [
    { label: 'Documentos e Protocolo', icon: FolderClock }, { label: 'Solicitações', icon: ClipboardList },
    { label: 'Compras', icon: ShoppingCart }, { label: 'Contratos', icon: FileArchive }, { label: 'Agenda', icon: CalendarDays },
  ] },
  { label: 'REDE MUNICIPAL', items: [
    { label: 'Escolas', icon: Building2 }, { label: 'Turmas', icon: UsersRound },
    { label: 'Alunos (consulta)', icon: UserRound }, { label: 'Indicadores (consulta)', icon: FileBarChart },
  ] },
  { label: 'GESTÃO', items: [
    { label: 'Relatórios', icon: FileBarChart }, { label: 'Notificações', icon: Bell },
  ] },
];

function PlannedBadge() {
  return <small className="administration-planned">Em implantação</small>;
}

function NavigationItem({ item }) {
  const Icon = item.icon;
  if (item.to) {
    return <NavLink to={item.to} className={({ isActive }) => isActive ? 'active' : undefined}><Icon aria-hidden="true"/><span>{item.label}</span><ChevronRight aria-hidden="true"/></NavLink>;
  }
  return <span className="administration-nav-disabled" aria-disabled="true"><Icon aria-hidden="true"/><span>{item.label}</span><PlannedBadge/></span>;
}

export default function AdministracaoSidebar({ user, onLogout }) {
  return <aside className="administration-sidebar">
    <Link className="administration-brand" to="/administracao" aria-label="SIEDU — Secretaria Administrativa">
      <span>S</span><div><strong>SIEDU</strong><small>Secretaria Administrativa</small></div>
    </Link>
    <nav aria-label="Navegação da Secretaria Administrativa">
      <NavLink to="/administracao" end className={({ isActive }) => isActive ? 'active' : undefined}><LayoutDashboard aria-hidden="true"/><span>Visão Geral</span></NavLink>
      {navigationGroups.map((group) => <section key={group.label}><h2>{group.label}</h2>{group.items.map((item) => <NavigationItem item={item} key={item.label}/>)}</section>)}
    </nav>
    <div className="administration-user"><div><UserRound aria-hidden="true"/><span><strong>{user?.nome || 'Usuário administrativo'}</strong><small>{user?.perfil}</small></span></div><button type="button" onClick={onLogout}><LogOut aria-hidden="true"/> Sair</button></div>
  </aside>;
}
