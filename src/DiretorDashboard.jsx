import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './services/api';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        const academicSummary = await api.getAcademicSummary(
          selectedSchoolId ? { escolaId: selectedSchoolId } : {},
          token,
        );

        if (!active) return;
        setSchools(accessibleSchools);
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
      0,
      'Sem pendências',
      '\u{1F4CB}',
    ],
  ]), [summary]);

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
          <img src="/images/sigepin.png" alt="SIEDU" />
          <b>SIEDU</b>
          <span>Sistema Integrado de Educação</span>
        </div>

        <Link className="director-current" to="/diretor">
          &#8962; Dashboard
        </Link>

        <nav>
          <h3>Gestão escolar</h3>
          <Link to="/diretor/turmas">Turmas</Link>
          <Link to="/diretor/cadastrar-professor">Professores</Link>
          <Link to="/diretor/matricular-aluno">Alunos</Link>
          <Link to="/diretor/frequencia">Frequência</Link>

          <h3>Administração</h3>
          <Link to="/diretor/documentos">Documentos</Link>
          <Link to="/diretor/financeiro">Gestão financeira</Link>
          <Link to="/diretor/historicos">Históricos escolares</Link>
        </nav>

        <button type="button" onClick={onLogout}>
          Sair do sistema
        </button>
      </aside>

      <div className="director-main">
        <header>
          <span>&#9776;</span>
          <div>
            <b>Portal do Diretor</b>
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
              <h1>Bom dia, Diretor(a) {user?.nome || ''}!</h1>
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
            <Link to="/diretor/cadastrar-professor">Cadastrar professor</Link>
            <Link to="/diretor/cadastrar-turma">Cadastrar turma</Link>
            <Link to="/diretor/cadastrar-secretario">Cadastrar secretário</Link>
            <Link to="/diretor/matricular-aluno">Matricular aluno</Link>
            <Link to="/diretor/imprimir-documentos">Impressão de documentos</Link>
          </section>

          <section className="director-grid">
            <article className="director-panel">
              <h2>Resumo do desempenho</h2>
              <div className="director-empty">
                Sem turmas e avaliações registradas.
              </div>
              <Link to="/diretor/frequencia">
                Ver frequência e desempenho &rarr;
              </Link>
            </article>

            <article className="director-panel">
              <h2>Avisos da Secretaria</h2>
              <div className="director-empty">Nenhum aviso recebido.</div>
              <Link to="/diretor/documentos">Ver documentos &rarr;</Link>
            </article>

            <article className="director-panel">
              <h2>Pendências da escola</h2>
              <div className="director-empty">
                Nenhuma pendência registrada.
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
