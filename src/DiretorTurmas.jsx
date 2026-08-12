import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from './services/api';
import './diretor-turmas.css';

function DiretorAreaLayout({ user, onLogout, children }) {
  return (
    <div className="director-area">
      <aside className="director-area-sidebar">
        <div className="director-area-brand">
          <img src="/images/sigepin.png" alt="SIEDU" />
          <strong>SIEDU</strong>
          <small>Sistema Integrado de Educação</small>
        </div>

        <Link to="/diretor">⌂ Dashboard</Link>

        <nav>
          <h3>Gestão escolar</h3>
          <Link className="active" to="/diretor/turmas">Turmas</Link>
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

      <div className="director-area-content">
        <header className="director-area-topbar">
          <div>
            <strong>Portal do Diretor</strong>
            <small>Gestão da Escola</small>
          </div>
          <span>{user?.nome || 'Diretor(a)'}</span>
          <button type="button" onClick={onLogout}>Sair</button>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}

function PageTitle({ eyebrow, title, description, actions }) {
  return (
    <section className="director-page-title">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="director-title-actions">{actions}</div>}
    </section>
  );
}

function EmptyState({ title, description, action }) {
  return (
    <div className="director-table-empty">
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

function LoadingState({ text = 'Carregando dados do PostgreSQL...' }) {
  return (
    <div className="director-table-empty">
      <strong>{text}</strong>
    </div>
  );
}

function formatDate(value) {
  if (!value) return 'Não informada';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(
    new Date(value),
  );
}

export function ConsultaTurmas({ user, onLogout, token }) {
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.listAcademicClasses({}, token)
      .then((data) => {
        if (active) setClasses(data || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const filteredClasses = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return classes;

    return classes.filter((schoolClass) => [
      schoolClass.nome,
      schoolClass.serieAno,
      schoolClass.turno,
      schoolClass.coordenador,
      schoolClass.escola,
    ]
      .join(' ')
      .toLocaleLowerCase('pt-BR')
      .includes(term));
  }, [classes, search]);

  const totalStudents = classes.reduce(
    (total, schoolClass) => total + schoolClass.alunosMatriculados,
    0,
  );
  const totalVacancies = classes.reduce(
    (total, schoolClass) => total + schoolClass.vagasDisponiveis,
    0,
  );

  return (
    <DiretorAreaLayout user={user} onLogout={onLogout}>
      <PageTitle
        eyebrow="GESTÃO ESCOLAR"
        title="Consulta de turmas"
        description="Dados reais de organização, ocupação e professores das unidades autorizadas."
        actions={(
          <Link className="director-primary-action" to="/diretor/cadastrar-turma">
            Cadastrar turma
          </Link>
        )}
      />

      <section className="director-summary-grid">
        <article>
          <span>Turmas</span>
          <strong>{classes.length}</strong>
          <small>Total cadastrado</small>
        </article>
        <article>
          <span>Alunos</span>
          <strong>{totalStudents}</strong>
          <small>Matriculados nas turmas</small>
        </article>
        <article>
          <span>Vagas disponíveis</span>
          <strong>{totalVacancies}</strong>
          <small>Conforme a capacidade</small>
        </article>
        <article>
          <span>Fonte dos dados</span>
          <strong>Banco</strong>
          <small>PostgreSQL conectado</small>
        </article>
      </section>

      <section className="director-list-panel">
        <div className="director-list-toolbar">
          <div>
            <h2>Turmas da unidade</h2>
            <p>{filteredClasses.length} turma(s) encontrada(s)</p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar turma, escola, turno ou coordenador"
          />
        </div>

        {error && <p className="error">{error}</p>}
        {loading ? (
          <LoadingState />
        ) : filteredClasses.length === 0 ? (
          <EmptyState
            title="Nenhuma turma cadastrada"
            description="Cadastre a primeira turma para começar a organizar alunos e professores."
            action={<Link to="/diretor/cadastrar-turma">Cadastrar primeira turma</Link>}
          />
        ) : (
          <div className="director-table-scroll">
            <table className="director-data-table">
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Turno</th>
                  <th>Alunos</th>
                  <th>Vagas</th>
                  <th>Professores</th>
                  <th>Coordenador</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((schoolClass) => (
                  <tr key={schoolClass.id}>
                    <td>
                      <strong>{schoolClass.nome}</strong>
                      <small>{schoolClass.serieAno} · {schoolClass.escola}</small>
                    </td>
                    <td>{schoolClass.turno}</td>
                    <td>{schoolClass.alunosMatriculados} de {schoolClass.capacidade}</td>
                    <td>
                      <span className={schoolClass.vagasDisponiveis ? 'status-open' : 'status-full'}>
                        {schoolClass.vagasDisponiveis
                          ? `${schoolClass.vagasDisponiveis} vagas`
                          : 'Turma completa'}
                      </span>
                    </td>
                    <td>
                      {schoolClass.professores.length
                        ? schoolClass.professores
                          .map((teacher) => `${teacher.nome} (${teacher.componenteCurricular})`)
                          .join(', ')
                        : 'Não informado'}
                    </td>
                    <td>{schoolClass.coordenador || 'Não informado'}</td>
                    <td>
                      <Link
                        className="director-row-action"
                        to={`/diretor/turmas/${schoolClass.id}`}
                      >
                        Ver turma
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DiretorAreaLayout>
  );
}

export function DetalhesTurma({ user, onLogout, token }) {
  const { turmaId } = useParams();
  const [schoolClass, setSchoolClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.getAcademicClass(turmaId, token)
      .then((data) => {
        if (active) setSchoolClass(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, turmaId]);

  if (loading) {
    return (
      <DiretorAreaLayout user={user} onLogout={onLogout}>
        <LoadingState text="Carregando a turma..." />
      </DiretorAreaLayout>
    );
  }

  if (error || !schoolClass) {
    return (
      <DiretorAreaLayout user={user} onLogout={onLogout}>
        <EmptyState
          title="Turma não encontrada"
          description={error || 'A turma solicitada não está disponível.'}
          action={<Link to="/diretor/turmas">Voltar para turmas</Link>}
        />
      </DiretorAreaLayout>
    );
  }

  return (
    <DiretorAreaLayout user={user} onLogout={onLogout}>
      <PageTitle
        eyebrow="DETALHES DA TURMA"
        title={`${schoolClass.nome} · ${schoolClass.serieAno}`}
        description={`${schoolClass.turno} · ${schoolClass.escola} · Coordenador(a): ${schoolClass.coordenador || 'não informado'}`}
        actions={(
          <Link className="director-back-action" to="/diretor/turmas">
            ← Voltar para turmas
          </Link>
        )}
      />

      <section className="director-summary-grid">
        <article>
          <span>Alunos matriculados</span>
          <strong>{schoolClass.alunosMatriculados}</strong>
          <small>Na turma</small>
        </article>
        <article>
          <span>Capacidade</span>
          <strong>{schoolClass.capacidade}</strong>
          <small>Total de alunos</small>
        </article>
        <article>
          <span>Vagas disponíveis</span>
          <strong>{schoolClass.vagasDisponiveis}</strong>
          <small>{schoolClass.vagasDisponiveis ? 'Matrículas abertas' : 'Turma completa'}</small>
        </article>
        <article>
          <span>Ano letivo</span>
          <strong>{schoolClass.anoLetivo}</strong>
          <small>{schoolClass.status}</small>
        </article>
      </section>

      <section className="director-class-info">
        <div>
          <h2>Professores da turma</h2>
          <div className="teacher-tags">
            {schoolClass.professores.length
              ? schoolClass.professores.map((teacher) => (
                  <span key={`${teacher.id}-${teacher.componenteCurricular}`}>
                    {teacher.nome} · {teacher.componenteCurricular}
                  </span>
                ))
              : <p>Nenhum professor informado.</p>}
          </div>
        </div>
        <Link
          className="director-primary-action"
          to={`/diretor/matricular-aluno?turmaId=${schoolClass.id}&escolaId=${schoolClass.escolaId}`}
        >
          Matricular aluno
        </Link>
      </section>

      <section className="director-list-panel">
        <div className="director-list-toolbar">
          <div>
            <h2>Alunos da turma</h2>
            <p>Clique em um aluno para consultar sua ficha.</p>
          </div>
        </div>

        {schoolClass.alunos.length === 0 ? (
          <EmptyState
            title="Nenhum aluno matriculado"
            description="As matrículas realizadas para esta turma aparecerão aqui."
            action={(
              <Link to={`/diretor/matricular-aluno?turmaId=${schoolClass.id}&escolaId=${schoolClass.escolaId}`}>
                Matricular primeiro aluno
              </Link>
            )}
          />
        ) : (
          <div className="director-table-scroll">
            <table className="director-data-table">
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>Aluno</th>
                  <th>Responsável</th>
                  <th>Contato</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {schoolClass.alunos.map((student) => (
                  <tr key={student.id}>
                    <td>{student.matricula}</td>
                    <td><strong>{student.nome}</strong></td>
                    <td>{student.responsavel || 'Não informado'}</td>
                    <td>{student.contatoResponsavel || 'Não informado'}</td>
                    <td>
                      <Link
                        className="director-row-action"
                        to={`/diretor/turmas/${schoolClass.id}/alunos/${student.id}`}
                      >
                        Ver aluno
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DiretorAreaLayout>
  );
}

export function DetalhesAluno({ user, onLogout, token }) {
  const { turmaId, alunoId } = useParams();
  const [schoolClass, setSchoolClass] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api.getAcademicClass(turmaId, token),
      api.getAcademicStudent(alunoId, token),
    ])
      .then(([classData, studentData]) => {
        if (!active) return;
        setSchoolClass(classData);
        setStudent(studentData);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [alunoId, token, turmaId]);

  if (loading) {
    return (
      <DiretorAreaLayout user={user} onLogout={onLogout}>
        <LoadingState text="Carregando a ficha do aluno..." />
      </DiretorAreaLayout>
    );
  }

  if (error || !schoolClass || !student) {
    return (
      <DiretorAreaLayout user={user} onLogout={onLogout}>
        <EmptyState
          title="Aluno não encontrado"
          description={error || 'Não foi possível localizar a matrícula solicitada.'}
          action={<Link to="/diretor/turmas">Voltar para turmas</Link>}
        />
      </DiretorAreaLayout>
    );
  }

  const enrollment = student.matriculas.find(
    (item) => String(item.turmaId) === String(turmaId),
  );
  const mainResponsible = student.responsaveis.find(
    (item) => item.contatoPrincipal,
  ) || student.responsaveis[0];
  const absences = student.faltas || [];
  const grades = student.notas || [];

  return (
    <DiretorAreaLayout user={user} onLogout={onLogout}>
      <PageTitle
        eyebrow="FICHA DO ALUNO"
        title={student.nome}
        description={`Matrícula ${enrollment?.numero || 'não localizada'} · ${schoolClass.nome} · ${schoolClass.serieAno}`}
        actions={(
          <Link className="director-back-action" to={`/diretor/turmas/${schoolClass.id}`}>
            ← Voltar para a turma
          </Link>
        )}
      />

      <section className="student-info-grid">
        <article>
          <span>Data de nascimento</span>
          <strong>{formatDate(student.dataNascimento)}</strong>
        </article>
        <article>
          <span>Responsável</span>
          <strong>{mainResponsible?.nome || 'Não informado'}</strong>
        </article>
        <article>
          <span>Contato do responsável</span>
          <strong>{mainResponsible?.telefonePrincipal || 'Não informado'}</strong>
        </article>
        <article>
          <span>Total de faltas</span>
          <strong>{absences.length}</strong>
        </article>
      </section>

      <section className="student-record-grid">
        <article className="director-list-panel">
          <h2>Histórico de faltas</h2>
          {absences.length === 0 ? (
            <div className="compact-empty">
              Nenhuma falta registrada. O módulo de frequência será conectado na próxima etapa.
            </div>
          ) : (
            <table className="director-data-table">
              <thead>
                <tr><th>Data</th><th>Disciplina</th><th>Situação</th></tr>
              </thead>
              <tbody>
                {absences.map((absence) => (
                  <tr key={`${absence.data}-${absence.disciplina}`}>
                    <td>{absence.data}</td>
                    <td>{absence.disciplina}</td>
                    <td>{absence.situacao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className="director-list-panel">
          <h2>Notas</h2>
          {grades.length === 0 ? (
            <div className="compact-empty">
              Nenhuma nota registrada. O módulo de avaliações será conectado na próxima etapa.
            </div>
          ) : (
            <table className="director-data-table">
              <thead>
                <tr><th>Disciplina</th><th>Etapa</th><th>Nota</th></tr>
              </thead>
              <tbody>
                {grades.map((grade) => (
                  <tr key={`${grade.disciplina}-${grade.etapa}`}>
                    <td>{grade.disciplina}</td>
                    <td>{grade.etapa}</td>
                    <td>{grade.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      </section>
    </DiretorAreaLayout>
  );
}
