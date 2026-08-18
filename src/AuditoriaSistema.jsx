import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './services/api';
import './seguranca.css';

export default function AuditoriaSistema({ token, user, onLogout }) {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ acao: '', entidade: '', limite: '100' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(currentFilters = filters) {
    setLoading(true);
    setError('');
    try {
      setRecords(await api.listAudit(currentFilters, token));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  function submit(event) {
    event.preventDefault();
    load(filters);
  }

  return (
    <main className="audit-page">
      <header className="audit-header">
        <div><span>SEGURANÇA E CONTROLE</span><h1>Auditoria de alterações</h1><p>Histórico de inclusões, alterações, exclusões e operações sensíveis realizadas no SIEDU.</p></div>
        <div><Link to="/gestor">← Voltar ao Portal do Gestor</Link><strong>{user?.nome}</strong><button type="button" onClick={onLogout}>Sair</button></div>
      </header>

      <form className="audit-filters" onSubmit={submit}>
        <label>Ação<select value={filters.acao} onChange={(event) => setFilters({ ...filters, acao: event.target.value })}><option value="">Todas</option><option>CRIAR</option><option>ALTERAR</option><option>EXCLUIR</option><option>LOGIN</option><option>RECUPERAR_SENHA</option><option>REDEFINIR_SENHA</option></select></label>
        <label>Módulo<input value={filters.entidade} onChange={(event) => setFilters({ ...filters, entidade: event.target.value })} placeholder="users, schools, finance..." /></label>
        <label>Quantidade<select value={filters.limite} onChange={(event) => setFilters({ ...filters, limite: event.target.value })}><option>50</option><option>100</option><option>250</option><option>500</option></select></label>
        <button>Filtrar registros</button>
      </form>

      {error && <p className="audit-error">{error}</p>}

      <section className="audit-table-card">
        <div><h2>Registros encontrados</h2><span>{loading ? 'Carregando...' : `${records.length} registro(s)`}</span></div>
        {records.length === 0 && !loading ? <p className="audit-empty">Nenhuma alteração registrada para os filtros selecionados.</p> : (
          <div className="audit-table-wrap"><table><thead><tr><th>Data</th><th>Usuário</th><th>Ação</th><th>Módulo/rota</th><th>IP</th><th>Detalhes</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td>{new Date(record.criado_em).toLocaleString('pt-BR')}</td><td>{record.usuario || 'Operação pública'}</td><td><span className={`audit-action action-${record.acao.toLowerCase()}`}>{record.acao}</span></td><td><b>{record.entidade}</b><small>{record.rota}</small></td><td>{record.ip || '-'}</td><td><details><summary>Visualizar</summary><pre>{JSON.stringify(record.dados, null, 2)}</pre></details></td></tr>)}</tbody></table></div>
        )}
      </section>
    </main>
  );
}
