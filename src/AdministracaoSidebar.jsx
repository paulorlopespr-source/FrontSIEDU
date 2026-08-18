import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { prefeituraLogo } from './prefeitura-logo';
import {
  Building2, CalendarDays, ChevronRight, ClipboardList, FileArchive,
  FolderClock, LayoutDashboard, LogOut, Megaphone, PackageCheck,
  Menu, Truck, UserRound, UsersRound, Warehouse, Wrench, X,
} from 'lucide-react';

const navigationGroups = [
  { label: 'GESTÃO DE PESSOAS', items: [
    { label: 'Funcionários', icon: UsersRound, to: '/administracao/funcionarios' }, { label: 'Vínculos e Lotações', icon: Building2, to: '/administracao/vinculos' },
    { label: 'Férias e Afastamentos', icon: CalendarDays, to: '/administracao/afastamentos' }, { label: 'Documentos Funcionais', icon: FileArchive, to: '/administracao/documentos-funcionais' },
  ] },
  { label: 'OPERAÇÕES', items: [
    { label: 'Demandas', icon: Megaphone, to: '/administracao/demandas' },
    { label: 'Patrimônio', icon: PackageCheck, to: '/administracao/patrimonio' }, { label: 'Almoxarifado', icon: Warehouse, to: '/administracao/almoxarifado' },
    { label: 'Transporte', icon: Truck, to: '/administracao/transporte' }, { label: 'Manutenção', icon: Wrench, to: '/administracao/manutencao' },
  ] },
  { label: 'ADMINISTRATIVO', items: [
    { label: 'Documentos e Protocolo', icon: FolderClock, to: '/administracao/protocolo' }, { label: 'Solicitações', icon: ClipboardList, to: '/administracao/solicitacoes' },
  ] },
];

function NavigationItem({ item, onNavigate }) {
  const Icon = item.icon;
  return <NavLink to={item.to} onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : undefined}><Icon aria-hidden="true"/><span>{item.label}</span><ChevronRight aria-hidden="true"/></NavLink>;
}

export default function AdministracaoSidebar({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  return <><button className="administration-menu-toggle" type="button" aria-expanded={open} aria-controls="administration-navigation" onClick={() => setOpen(value => !value)}>{open ? <X/> : <Menu/>}<span>Menu</span></button>
  {open && <button className="administration-menu-backdrop" aria-label="Fechar menu" onClick={() => setOpen(false)}/>}
  <aside className={`administration-sidebar ${open ? 'is-open' : ''}`} id="administration-navigation">
    <div className="administration-city-brand">
      <img src={prefeituraLogo} alt="Prefeitura Municipal de Pindobaçu — Governo que cuida da gente"/>
    </div>
    <Link className="sidebar-system-home" to="/administracao" aria-label="Voltar à página inicial da Secretaria Administrativa"><img src="/images/siedu-logo-transparent.svg" alt="SIEDU — Sistema Integrado de Educação"/></Link>
    <nav aria-label="Navegação da Secretaria Administrativa">
      <NavLink to="/administracao" end onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : undefined}><LayoutDashboard aria-hidden="true"/><span>Visão Geral</span></NavLink>
      {navigationGroups.map((group) => <section key={group.label}><h2>{group.label}</h2>{group.items.map((item) => <NavigationItem item={item} onNavigate={() => setOpen(false)} key={item.label}/>)}</section>)}
    </nav>
    <div className="administration-user"><div><UserRound aria-hidden="true"/><span><strong>{user?.nome || 'Usuário administrativo'}</strong><small>{user?.perfil}</small></span></div><button type="button" onClick={onLogout}><LogOut aria-hidden="true"/> Sair</button></div>
  </aside></>;
}
