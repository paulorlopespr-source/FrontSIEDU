import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './services/api';
import { canAccessSchoolFinance, canCreateSchoolDemand, canManageLearning, canManageSchoolAcademics, canManageSchoolStaff } from './permissions';
import './diretor-dashboard.css';

const emptySummary = {
  alunosMatriculados: 0,
  funcionariosAtivos: 0,
  professoresAtivos: 0,
  turmasAtivas: 0,
};

export default function DiretorDashboard({ user, onLogout, token }) {
  const [summary, setSummary] = useState(emptySummary);
  const [schools, setSchools] = useState([]);
  const [demands, setDemands] = useState([]);
  const [demandNotifications, setDemandNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mayManageStaff = canManageSchoolStaff(user);
  const mayManageAcademics = canManageSchoolAcademics(user);
  const mayAccessFinance = canAccessSchoolFinance(user);
  const mayManageLearning = canManageLearning(user);
  const mayCreateDemand = canCreateSchoolDemand(user);
  const portalTitle = user?.perfil || 'Gestão escolar';

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const context = await api.getAcademicContext(token);
        const accessibleSchools = context.escolas || [];
        const selectedSchoolId = accessibleSchools.length === 1
          ? accessibleSchools[0].id
          : undefined;
        const [academicSummary, demandItems, notifications] = await Promise.all([
          api.getAcademicSummary(selectedSchoolId ? { escolaId: selectedSchoolId } : {}, token),
          api.listMunicipalDemands(token).catch(() => []),
          api.listDemandNotifications(token).catch(() => []),
        ]);

        if (!active) return;
        setSchools(accessibleSchools);
        setDemands(demandItems || []);
        setDemandNotifications(notifications || []);
        setSummary({
          ...emptySummary,
          ...academicSummary,
        });
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [token]);

  const cards = useMemo(() => ([
    [
      'Alunos matriculados',
      summary.alunosMatriculados,
      'Alunos da unidade',
      '\u{1F465}',
    ],
    [
      'Professores ativos',
      summary.professoresAtivos,
      'Equipe docente',
      '\u{1F469}\u200D\u{1F3EB}',
    ],
    [
      'Turmas ativas',
      summary.turmasAtivas,
      'Organização escolar',
      '\u{1F393}',
    ],
    [
      'Funcionários ativos',
      summary.funcionariosAtivos,
      'Equipe da unidade',
      '\u{1F9D1}\u200D\u{1F4BC}',
    ],
    [
      'Pendências da escola',
      demands.filter((item) => item.status !== 'Demanda resolvida').length,
      demandNotifications.some((item) => !item.lidaEm) ? 'Há atualização da Secretaria' : 'Solicitações em acompanhamento',
      '\u{1F4CB}',
    ],
  ]), [summary, demands, demandNotifications]);

  const schoolDescription = useMemo(() => {
    if (loading) return 'Carregando dados da unidade...';
    if (error) return error;
    if (schools.length === 0) return 'Nenhuma unidade escolar vinculada.';
    if (schools.length === 1) {
      const school = schools[0];
      return `${school.nome}${school.inep ? ` · INEP ${school.inep}` : ''}`;
    }
    return `${schools.length} unidades escolares vinculadas.`;
  }, [error, loading, schools]);

  return (
    <div className="director-dashboard">
      <aside className="director-side">
        <div className="director-brand">
          <img src="/images/sigepin.png" alt="SIEDU-PINDOBAÇU" />
          <b>SIEDU-PINDOBAÇU</b>
          <span>Sistema Integrado de Educação</span>
        </div>

        <Link className="director-current" to="/diretor">
          &#8962; Dashboard
        </Link>

        <nav>
          <h3>Gestão escolar</h3>
          {mayManageAcademics && <Link to="/diretor/turmas">Turmas</Link>}
          {mayManageStaff && <Link to="/diretor/cadastrar-professor">Professores</Link>}
          {mayManageAcademics && <Link to="/diretor/matricular-aluno">Alunos</Link>}
          {mayManageAcademics && <Link to="/diretor/frequencia">Frequência</Link>}
          {mayManageLearning && <Link to="/aprendizagem">Trilhas de revisão</Link>}

          <h3>Administração</h3>
          {mayCreateDemand && <Link to="/diretor/demandas">Solicitações e demandas</Link>}
          {mayManageAcademics && <Link to="/diretor/documentos">Documentos</Link>}
          {mayAccessFinance && <Link to="/diretor/financeiro">Gestão financeira</Link>}
          {mayManageAcademics && <Link to="/diretor/historicos">Históricos escolares</Link>}
        </nav>

        <button type="button" onClick={onLogout}>
          Sair do sistema
        </button>
      </aside>

      <div className="director-main">
        <header>
          <span>&#9776;</span>
          <div>
            <b>Portal de {portalTitle}</b>
            <small>Gestão da Escola</small>
          </div>
          <input placeholder="Pesquisar alunos, turmas, professores, documentos..." />
          <strong>{user?.nome || 'Diretor(a)'}</strong>
          <button
            className="director-header-logout"
            type="button"
            onClick={onLogout}
          >
            Sair
          </button>
        </header>

        <main>
          <section className="director-welcome">
            <div>
              <h1>Olá, {user?.nome || portalTitle}!</h1>
              <p>Acompanhe os principais indicadores da sua escola.</p>
            </div>
            <article>
              <b>Unidade escolar vinculada</b>
              <span>{schoolDescription}</span>
            </article>
          </section>

          {error && (
            <p className="director-dashboard-error" role="alert">
              Não foi possível atualizar os indicadores: {error}
            </p>
          )}

          <section className="director-cards">
            {cards.map(([title, value, description, icon]) => (
              <article key={title}>
                <i>{icon}</i>
                <div>
                  <b>{title}</b>
                  <strong>{loading ? '...' : value}</strong>
                  <small>{description}</small>
                </div>
              </article>
            ))}
          </section>

          <section id="acoes" className="director-quick">
            <h2>Ações rápidas</h2>
            {mayManageStaff && <Link to="/diretor/cadastrar-professor">Cadastrar professor</Link>}
            {mayManageAcademics && <Link to="/diretor/cadastrar-turma">Cadastrar turma</Link>}
            {mayManageStaff && <Link to="/diretor/cadastrar-secretario">Cadastrar secretário</Link>}
            {mayManageAcademics && <Link to="/diretor/matricular-aluno">Matricular aluno</Link>}
            {mayManageAcademics && <Link to="/diretor/imprimir-documentos">Impressão de documentos</Link>}
            {mayManageLearning && <Link to="/aprendizagem">Editar trilhas após resultados</Link>}
            {mayCreateDemand && <Link to="/diretor/demandas">Enviar solicitação à Secretaria</Link>}
            {!mayManageStaff && !mayManageAcademics && <p>Este perfil possui somente consulta aos indicadores da unidade.</p>}
          </section>

          <section className="director-grid">
            <article className="director-panel">
              <h2>Resumo do desempenho</h2>
              <div className="director-empty">
                Sem turmas e avaliações registradas.
              </div>
              {mayManageAcademics && <Link to="/diretor/frequencia">
                Ver frequência e desempenho &rarr;
              </Link>}
            </article>

            <article className="director-panel">
              <h2>Avisos da Secretaria</h2>
              <div className="director-empty">Nenhum aviso recebido.</div>
              {mayManageAcademics && <Link to="/diretor/documentos">Ver documentos &rarr;</Link>}
            </article>

            <article className="director-panel">
              <h2>Pendências da escola</h2>
              <div className="director-empty">{demands.length === 0 ? 'Nenhuma demanda registrada.' : `${demands.filter((item) => item.status !== 'Demanda resolvida').length} demanda(s) em acompanhamento e ${demands.filter((item) => item.status === 'Demanda resolvida').length} resolvida(s).`}</div>
              {mayCreateDemand && <Link to="/diretor/demandas">Abrir solicitações e demandas &rarr;</Link>}
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
