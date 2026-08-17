import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, UserPlus, UsersRound } from 'lucide-react';
import AdministracaoSidebar from './AdministracaoSidebar';
import UsuariosGestao from './UsuariosGestao';

export default function AdministracaoPessoas({ token, user, onLogout, bindingsOnly = false }) {
  return <div className="administration-shell">
    <AdministracaoSidebar user={user} onLogout={onLogout}/>
    <main className="administration-main administration-people-page">
      <header className="administration-topbar">
        <div><small>SECRETARIA ADMINISTRATIVA &gt; GESTÃO DE PESSOAS</small><h1>{bindingsOnly ? 'Vínculos e Lotações' : 'Funcionários'}</h1><p>{bindingsOnly ? 'Controle das unidades e setores em que cada servidor atua.' : 'Gestão dos servidores e colaboradores vinculados à rede municipal.'}</p></div>
        <div className="administration-page-actions">
          <Link to={bindingsOnly ? '/administracao/funcionarios' : '/administracao/vinculos'}>{bindingsOnly ? <UsersRound aria-hidden="true"/> : <Building2 aria-hidden="true"/>}{bindingsOnly ? 'Ver funcionários' : 'Ver lotações'}</Link>
          {!bindingsOnly && <a href="#novo-funcionario" className="primary"><UserPlus aria-hidden="true"/>Novo funcionário</a>}
        </div>
      </header>
      <UsuariosGestao token={token} onLogout={onLogout} embedded administrationMode bindingsOnly={bindingsOnly}/>
    </main>
  </div>;
}
