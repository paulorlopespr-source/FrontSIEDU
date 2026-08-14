import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { GestorSidebar, GestorTopbar } from './GestorDashboard';
import { api } from './services/api';
import './gestor-rede.css';

const modules = {
  alunos: { title: 'Alunos da rede', description: 'Matrículas ativas consolidadas por unidade escolar.', key: 'alunos', suffix: '', icon: '👥' },
  professores: { title: 'Professores da rede', description: 'Docentes com vínculo registrado em cada unidade.', key: 'professores', suffix: '', icon: '👩‍🏫' },
  turmas: { title: 'Turmas da rede', description: 'Turmas ativas distribuídas entre as escolas municipais.', key: 'turmas', suffix: '', icon: '🎓' },
  matriculas: { title: 'Matrículas', description: 'Matrículas ativas acompanhadas por unidade escolar.', key: 'alunos', suffix: '', icon: '🗂️' },
  frequencia: { title: 'Frequência escolar', description: 'Frequência consolidada a partir dos diários de classe.', key: 'frequencia', suffix: '%', icon: '✓' },
};

const emptyOverview = { totals: {}, schools: [] };

function display(value, suffix = '') {
  const number = Number(value || 0);
  return suffix ? `${number.toFixed(1).replace('.', ',')}${suffix}` : number.toLocaleString('pt-BR');
}

export default function GestorRede({ token, user, onLogout }) {
  const { modulo } = useParams();
  const config = modules[modulo];
  const [overview, setOverview] = useState(emptyOverview);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getMunicipalOverview(token)
      .then((payload) => active && setOverview(payload || emptyOverview))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token, modulo]);

  const schools = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return overview.schools || [];
    return (overview.schools || []).filter((school) => [school.nome, school.localidade, school.codigoInep]
      .some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(term)));
  }, [overview.schools, search]);

  if (!config) return <Navigate to="/gestor" replace />;
  const total = config.key === 'frequencia'
    ? (overview.schools?.length ? overview.schools.reduce((sum, item) => sum + Number(item.frequencia || 0), 0) / overview.schools.length : 0)
    : overview.schools?.reduce((sum, item) => sum + Number(item[config.key] || 0), 0) || 0;

  return <div className="gestor-dashboard manager-network-page">
    <GestorSidebar onLogout={onLogout} />
    <div className="dashboard-main">
      <GestorTopbar user={user} onLogout={onLogout} />
      <main className="dashboard-content manager-network-content">
        <section className="network-heading">
          <div><span>GESTÃO ESCOLAR MUNICIPAL</span><h1>{config.icon} {config.title}</h1><p>{config.description}</p></div>
          <div><Link to="/gestor/escolas">Abrir unidades de ensino</Link>{modulo === 'professores' && <Link to="/usuarios?perfil=Professor">Gerenciar professores</Link>}</div>
        </section>

        <section className="network-summary">
          <article><span>Total consolidado</span><strong>{display(total, config.suffix)}</strong></article>
          <article><span>Unidades monitoradas</span><strong>{display(overview.schools?.length)}</strong></article>
          <article><span>Alunos matriculados</span><strong>{display(overview.totals?.students)}</strong></article>
          <article><span>Turmas ativas</span><strong>{display(overview.totals?.classes)}</strong></article>
        </section>

        <section className="network-panel">
          <header><div><h2>Consolidado por escola</h2><p>Selecione uma unidade para consultar seus registros detalhados.</p></div><label>⌕ <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar escola, localidade ou INEP" /></label></header>
          {loading && <p className="network-state">Atualizando dados da rede...</p>}
          {error && <p className="network-error">{error}</p>}
          {!loading && !error && <div className="network-table"><table><thead><tr><th>Unidade de ensino</th><th>{config.title}</th><th>Alunos</th><th>Turmas</th><th>Professores</th><th>Ação</th></tr></thead><tbody>{schools.map((school) => <tr key={school.id}><td><b>{school.nome}</b><small>{school.localidade || 'Localidade não informada'} · INEP {school.codigoInep || '—'}</small></td><td><strong>{display(school[config.key], config.suffix)}</strong></td><td>{display(school.alunos)}</td><td>{display(school.turmas)}</td><td>{display(school.professores)}</td><td><Link to={`/gestor/escolas/${school.id}`}>Abrir escola →</Link></td></tr>)}</tbody></table></div>}
          {!loading && !error && !schools.length && <p className="network-state">Nenhuma unidade corresponde à busca.</p>}
        </section>
      </main>
    </div>
  </div>;
}
