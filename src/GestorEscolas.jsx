import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GestorSidebar, GestorTopbar } from './GestorDashboard';
import { api } from './services/api';
import './gestor-escolas.css';

function GestorSchoolShell({ children, user, onLogout }) {
  return (
    <div className="gestor-dashboard manager-schools-page">
      <GestorSidebar onLogout={onLogout} />
      <div className="dashboard-main">
        <GestorTopbar user={user} onLogout={onLogout} />
        <main className="dashboard-content manager-schools-content">
          {children}
        </main>
      </div>
    </div>
  );
}

function valueOrDash(value) {
  return value || 'Não informado';
}

function formatDate(value) {
  if (!value) return 'Não informada';
  return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR');
}

function schoolFormFromData(school, secretaries) {
  return {
    nome: school.nome || '',
    codigoRede: school.codigoRede || '',
    categoria: school.categoria || '',
    localidade: school.localidade || '',
    inep: school.inep || '',
    telefone: school.telefone || '',
    endereco: school.endereco || '',
    cep: school.cep || '',
    fotoUrl: school.fotoUrl || '',
    diretorUsuarioId: school.diretorUsuarioId || '',
    secretarioUsuarioId: secretaries[0]?.id || '',
  };
}

export function ListaEscolasGestor({ token, user, onLogout }) {
  const [schools, setSchools] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pagination, setPagination] = useState({
    pagina: 1,
    limite: 25,
    total: 0,
    totalPaginas: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const timeout = setTimeout(() => {
      setLoading(true);
      setError('');

      api.listSchools({
        busca: search.trim(),
        page,
        limit,
      }, token)
        .then((data) => {
          if (!active) return;

          setSchools(data.dados || []);
          setPagination(data.paginacao || {
            pagina: page,
            limite: limit,
            total: 0,
            totalPaginas: 1,
          });
        })
        .catch((requestError) => {
          if (active) setError(requestError.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [token, search, page, limit]);

  const linkedDirectors = schools.filter((school) => school.diretor_usuario_id).length;
  const localities = new Set(
    schools.map((school) => school.localidade).filter(Boolean),
  ).size;

  return (
    <GestorSchoolShell user={user} onLogout={onLogout}>
      <section className="manager-school-heading">
        <div>
          <span className="manager-eyebrow">GESTÃO ESCOLAR</span>
          <h1>Unidades de ensino</h1>
          <p>
            Consulte as escolas da rede municipal e acompanhe equipe gestora,
            turmas e estudantes de cada unidade.
          </p>
        </div>
        <Link className="manager-primary-button" to="/escolas/cadastrar">
          + Cadastrar nova escola
        </Link>
      </section>

      <section className="manager-school-stats">
        <article>
          <span>Escolas encontradas</span>
          <strong>{pagination.total}</strong>
        </article>
        <article>
          <span>Diretores nesta página</span>
          <strong>{linkedDirectors}</strong>
        </article>
        <article>
          <span>Localidades nesta página</span>
          <strong>{localities}</strong>
        </article>
      </section>

      <section className="manager-school-panel">
        <header className="manager-panel-header">
          <div>
            <h2>Lista de escolas da rede</h2>
            <p>Selecione uma unidade para abrir sua ficha completa.</p>
          </div>
          <label className="manager-list-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nome, código, localidade ou diretor"
            />
          </label>
        </header>

        {loading && <p className="manager-state">Carregando unidades...</p>}
        {error && <p className="manager-error">{error}</p>}

        {!loading && !error && schools.length > 0 && (
          <div className="manager-school-grid">
            {schools.map((school) => (
              <article className="manager-school-card" key={school.id}>
                <div className="manager-school-code">
                  {school.codigo_rede || String(school.id).padStart(2, '0')}
                </div>
                <div className="manager-school-card-body">
                  <span>{valueOrDash(school.categoria)}</span>
                  <h3>{school.nome}</h3>
                  <p>{valueOrDash(school.localidade)}</p>
                  <dl>
                    <div>
                      <dt>Diretor</dt>
                      <dd>{school.diretor || 'Aguardando vínculo'}</dd>
                    </div>
                    <div>
                      <dt>INEP</dt>
                      <dd>{school.inep || 'Não informado'}</dd>
                    </div>
                  </dl>
                </div>
                <Link to={`/gestor/escolas/${school.id}`}>Abrir unidade →</Link>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && schools.length === 0 && (
          <p className="manager-state">Nenhuma escola corresponde à busca.</p>
        )}

        {!loading && !error && pagination.total > 0 && (
          <div className="manager-pagination">
            <label>
              Por página
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>

            <span>
              Página {pagination.pagina} de {Math.max(pagination.totalPaginas, 1)}
            </span>

            <div>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPaginas}
                onClick={() => setPage((current) => current + 1)}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </section>
    </GestorSchoolShell>
  );
}

function TeamMember({ title, member, emptyText }) {
  return (
    <article className="manager-team-card">
      <span>{title}</span>
      {member ? (
        <>
          <strong>{member.nome}</strong>
          <small>{member.email || member.usuario || 'Contato não informado'}</small>
        </>
      ) : (
        <strong className="manager-empty-team">{emptyText}</strong>
      )}
    </article>
  );
}

export function DetalhesEscolaGestor({ token, user, onLogout }) {
  const { escolaId } = useParams();
  const [data, setData] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    api.getManagerSchoolOverview(escolaId, token)
      .then((overview) => {
        if (active) setData(overview);
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
  }, [escolaId, token]);

  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLocaleLowerCase('pt-BR');
    const students = data?.alunos || [];
    if (!term) return students;

    return students.filter((student) => [
      student.nome,
      student.matricula,
      student.turma,
      student.responsavel,
    ].some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(term)));
  }, [data, studentSearch]);

  async function openStudent(studentId) {
    setStudentLoading(true);
    setError('');

    try {
      const student = await api.getAcademicStudent(studentId, token);
      setSelectedStudent(student);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setStudentLoading(false);
    }
  }

  async function openEdit() {
    setError('');
    setSuccess('');

    try {
      const userList = users.length ? users : await api.listUsers(token);
      if (!users.length) setUsers(userList);
      setForm(schoolFormFromData(data.escola, data.secretarios));
      setEditing(true);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function changeForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function selectPhoto(event) {
    const image = event.target.files?.[0];
    if (!image) return;

    if (!image.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem válido.');
      return;
    }

    if (image.size > 2 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, fotoUrl: reader.result }));
      setError('');
    };
    reader.readAsDataURL(image);
  }

  async function saveSchool(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.updateSchool(escolaId, {
        ...form,
        diretorUsuarioId: form.diretorUsuarioId
          ? Number(form.diretorUsuarioId)
          : null,
        secretarioUsuarioId: form.secretarioUsuarioId
          ? Number(form.secretarioUsuarioId)
          : null,
      }, token);
      const overview = await api.getManagerSchoolOverview(escolaId, token);
      setData(overview);
      setEditing(false);
      setSuccess('Dados da escola atualizados com sucesso.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const directors = users.filter((currentUser) => currentUser.perfil === 'Diretor');
  const secretaries = users.filter((currentUser) => (
    currentUser.perfil === 'Secretaria Escolar'
    || currentUser.perfil === 'Secretário Escolar'
  ));
  const displayedDirector = data?.diretor || (
    data?.escola?.diretorNome
      ? { nome: data.escola.diretorNome, usuario: 'Cadastro funcional' }
      : null
  );

  return (
    <GestorSchoolShell user={user} onLogout={onLogout}>
      <div className="manager-detail-navigation">
        <Link to="/gestor/escolas">← Voltar para escolas</Link>
        <div>
          <button type="button" className="manager-edit-button" onClick={openEdit}>
            Editar escola
          </button>
          <Link to="/usuarios">Gerenciar vínculos</Link>
          <Link className="manager-primary-button" to="/diretor/matricular-aluno">
            + Matricular aluno
          </Link>
        </div>
      </div>

      {loading && <p className="manager-state manager-school-panel">Carregando dados da escola...</p>}
      {error && <p className="manager-error">{error}</p>}
      {success && <p className="manager-success">{success}</p>}

      {!loading && data && (
        <>
          <section className="manager-school-detail-hero">
            {data.escola.fotoUrl ? (
              <img
                className="manager-school-photo"
                src={data.escola.fotoUrl}
                alt={`Fachada da ${data.escola.nome}`}
              />
            ) : (
              <div className="manager-school-code large">
                {data.escola.codigoRede || String(data.escola.id).padStart(2, '0')}
              </div>
            )}
            <div>
              <span>{valueOrDash(data.escola.categoria)}</span>
              <h1>{data.escola.nome}</h1>
              <p>
                {valueOrDash(data.escola.localidade)}
                {data.escola.endereco ? ` · ${data.escola.endereco}` : ''}
              </p>
            </div>
            <dl>
              <div><dt>INEP</dt><dd>{valueOrDash(data.escola.inep)}</dd></div>
              <div><dt>Telefone</dt><dd>{valueOrDash(data.escola.telefone)}</dd></div>
              <div><dt>CEP</dt><dd>{valueOrDash(data.escola.cep)}</dd></div>
            </dl>
          </section>

          <section className="manager-school-stats detail">
            <article><span>Salas utilizadas</span><strong>{data.resumo.salas}</strong></article>
            <article><span>Turmas ativas</span><strong>{data.resumo.turmas}</strong></article>
            <article><span>Alunos matriculados</span><strong>{data.resumo.alunos}</strong></article>
            <article><span>Professores vinculados</span><strong>{data.resumo.professores}</strong></article>
            <article><span>Profissionais vinculados</span><strong>{data.resumo.profissionais}</strong></article>
          </section>

          <section className="manager-school-panel">
            <header className="manager-panel-header">
              <div>
                <h2>Equipe gestora vinculada</h2>
                <p>Vínculos controlados pela Secretaria Municipal de Educação.</p>
              </div>
              <Link to="/usuarios">Alterar vínculos →</Link>
            </header>
            <div className="manager-team-grid">
              <TeamMember
                title="Diretor(a)"
                member={displayedDirector}
                emptyText="Diretor não vinculado"
              />
              {data.coordenadores.map((coordinator) => (
                <TeamMember
                  key={coordinator.id}
                  title="Coordenador(a)"
                  member={coordinator}
                />
              ))}
              {data.secretarios.map((secretary) => (
                <TeamMember
                  key={secretary.id}
                  title="Secretário(a) escolar"
                  member={secretary}
                />
              ))}
              {!data.coordenadores.length && (
                <TeamMember title="Coordenação" emptyText="Coordenador não vinculado" />
              )}
              {!data.secretarios.length && (
                <TeamMember title="Secretaria escolar" emptyText="Secretário não vinculado" />
              )}
            </div>
          </section>

          <section className="manager-school-panel">
            <header className="manager-panel-header">
              <div>
                <h2>Profissionais vinculados à unidade</h2>
                <p>
                  Relação importada do demonstrativo institucional de julho de 2026.
                </p>
              </div>
              <strong className="manager-professional-total">
                {data.profissionais.length} profissionais
              </strong>
            </header>
            <div className="manager-table-wrap">
              <table className="manager-table professionals">
                <thead>
                  <tr>
                    <th>Profissional</th>
                    <th>Função</th>
                    <th>Vínculo / carga</th>
                    <th>Setor</th>
                    <th>Formação</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.profissionais.map((professional) => (
                    <tr key={professional.id}>
                      <td><strong>{professional.nome}</strong></td>
                      <td>{professional.cargo}</td>
                      <td>
                        {professional.tipoVinculo}
                        {professional.cargaHoraria ? ` / ${professional.cargaHoraria}` : ''}
                      </td>
                      <td>{professional.setor || '-'}</td>
                      <td>{professional.formacao || '-'}</td>
                      <td>{professional.observacoes || '-'}</td>
                    </tr>
                  ))}
                  {!data.profissionais.length && (
                    <tr>
                      <td colSpan="6" className="manager-empty-row">
                        Nenhum profissional cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="manager-school-panel">
            <header className="manager-panel-header">
              <div>
                <h2>Turmas da unidade</h2>
                <p>{data.turmas.length} turma(s) registrada(s).</p>
              </div>
              <Link to="/diretor/cadastrar-turma">+ Cadastrar turma</Link>
            </header>
            <div className="manager-table-wrap">
              <table className="manager-table">
                <thead>
                  <tr>
                    <th>Turma</th>
                    <th>Ano / série</th>
                    <th>Turno</th>
                    <th>Sala</th>
                    <th>Alunos</th>
                    <th>Vagas</th>
                    <th>Coordenador</th>
                  </tr>
                </thead>
                <tbody>
                  {data.turmas.map((schoolClass) => (
                    <tr key={schoolClass.id}>
                      <td><strong>{schoolClass.nome}</strong></td>
                      <td>{schoolClass.serieAno}</td>
                      <td>{schoolClass.turno}</td>
                      <td>{schoolClass.sala || '-'}</td>
                      <td>{schoolClass.alunosMatriculados}</td>
                      <td>{schoolClass.vagasDisponiveis}</td>
                      <td>{schoolClass.coordenador || 'Não vinculado'}</td>
                    </tr>
                  ))}
                  {!data.turmas.length && (
                    <tr><td colSpan="7" className="manager-empty-row">Nenhuma turma cadastrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="manager-school-panel">
            <header className="manager-panel-header">
              <div>
                <h2>Alunos matriculados</h2>
                <p>
                  A Secretaria Escolar realiza os cadastros. O acesso municipal
                  pode consultar e administrar todos os registros.
                </p>
              </div>
              <label className="manager-list-search compact">
                <span>⌕</span>
                <input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Buscar aluno, matrícula ou turma"
                />
              </label>
            </header>
            <div className="manager-table-wrap">
              <table className="manager-table students">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Matrícula</th>
                    <th>Turma</th>
                    <th>Responsável</th>
                    <th>Contato</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td><strong>{student.nome}</strong></td>
                      <td>{student.matricula}</td>
                      <td>{student.turma}</td>
                      <td>{student.responsavel || 'Não informado'}</td>
                      <td>{student.contatoResponsavel || 'Não informado'}</td>
                      <td>
                        <button type="button" onClick={() => openStudent(student.id)}>
                          Ver ficha
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filteredStudents.length && (
                    <tr><td colSpan="6" className="manager-empty-row">Nenhum aluno encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {editing && form && (
        <div className="manager-modal-backdrop" role="presentation">
          <form className="manager-edit-modal" onSubmit={saveSchool}>
            <header>
              <div>
                <span>CADASTRO DA UNIDADE</span>
                <h2>Editar escola</h2>
                <p>Atualize os dados institucionais e os vínculos da equipe gestora.</p>
              </div>
              <button type="button" onClick={() => setEditing(false)}>×</button>
            </header>

            <section className="manager-photo-editor">
              {form.fotoUrl ? (
                <img src={form.fotoUrl} alt="Pré-visualização da escola" />
              ) : (
                <div className="manager-photo-placeholder">Foto da escola</div>
              )}
              <div>
                <strong>Imagem da escola</strong>
                <p>Envie uma foto da fachada ou do prédio. Formatos de imagem, até 2 MB.</p>
                <label className="manager-file-button">
                  Selecionar imagem
                  <input type="file" accept="image/*" onChange={selectPhoto} />
                </label>
                {form.fotoUrl && (
                  <button
                    className="manager-remove-photo"
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, fotoUrl: '' }))}
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </section>

            <section className="manager-edit-fields">
              <label>
                Nome da escola
                <input name="nome" value={form.nome} onChange={changeForm} required />
              </label>
              <label>
                Código da rede
                <input name="codigoRede" value={form.codigoRede} onChange={changeForm} />
              </label>
              <label>
                Categoria
                <input name="categoria" value={form.categoria} onChange={changeForm} />
              </label>
              <label>
                Localidade
                <input name="localidade" value={form.localidade} onChange={changeForm} />
              </label>
              <label>
                Número do INEP
                <input name="inep" value={form.inep} onChange={changeForm} />
              </label>
              <label>
                Telefone
                <input name="telefone" value={form.telefone} onChange={changeForm} />
              </label>
              <label>
                CEP
                <input name="cep" value={form.cep} onChange={changeForm} placeholder="00000-000" />
              </label>
              <label className="manager-edit-field-wide">
                Endereço completo
                <input name="endereco" value={form.endereco} onChange={changeForm} placeholder="Rua, número, bairro, cidade" />
              </label>
              <label>
                Diretor(a) vinculado(a)
                <select name="diretorUsuarioId" value={form.diretorUsuarioId} onChange={changeForm}>
                  <option value="">Não vincular agora</option>
                  {directors.map((director) => (
                    <option key={director.id} value={director.id}>
                      {director.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Secretário(a) escolar vinculado(a)
                <select name="secretarioUsuarioId" value={form.secretarioUsuarioId} onChange={changeForm}>
                  <option value="">Não vincular agora</option>
                  {secretaries.map((secretary) => (
                    <option key={secretary.id} value={secretary.id}>
                      {secretary.nome}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <p className="manager-edit-note">
              Professores e coordenadores podem ser gerenciados nos vínculos da
              unidade, pois uma escola pode possuir vários profissionais.
            </p>

            <footer>
              <button type="button" onClick={() => setEditing(false)}>Cancelar</button>
              <button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </footer>
          </form>
        </div>
      )}

      {(selectedStudent || studentLoading) && (
        <div className="manager-modal-backdrop" role="presentation">
          <section className="manager-student-modal" role="dialog" aria-modal="true">
            {studentLoading ? (
              <p className="manager-state">Carregando ficha do aluno...</p>
            ) : (
              <>
                <header>
                  <div>
                    <span>FICHA DO ALUNO</span>
                    <h2>{selectedStudent.nome}</h2>
                  </div>
                  <button type="button" onClick={() => setSelectedStudent(null)}>×</button>
                </header>
                <div className="manager-student-details">
                  <p><span>Data de nascimento</span><strong>{formatDate(selectedStudent.dataNascimento)}</strong></p>
                  <p><span>CPF</span><strong>{selectedStudent.cpf || 'Não informado'}</strong></p>
                  <p><span>Telefone</span><strong>{selectedStudent.telefone || 'Não informado'}</strong></p>
                  <p><span>E-mail</span><strong>{selectedStudent.email || 'Não informado'}</strong></p>
                </div>
                <h3>Responsáveis</h3>
                <div className="manager-responsibles">
                  {selectedStudent.responsaveis.map((responsible) => (
                    <article key={responsible.id}>
                      <strong>{responsible.nome}</strong>
                      <span>{responsible.parentesco || 'Parentesco não informado'}</span>
                      <small>{responsible.telefonePrincipal || responsible.email || 'Contato não informado'}</small>
                    </article>
                  ))}
                  {!selectedStudent.responsaveis.length && <p>Nenhum responsável cadastrado.</p>}
                </div>
                <footer>
                  {selectedStudent.matriculas[0]?.turmaId && (
                    <Link
                      to={`/diretor/turmas/${selectedStudent.matriculas[0].turmaId}/alunos/${selectedStudent.id}`}
                    >
                      Abrir histórico completo
                    </Link>
                  )}
                  <button type="button" onClick={() => setSelectedStudent(null)}>Fechar</button>
                </footer>
              </>
            )}
          </section>
        </div>
      )}
    </GestorSchoolShell>
  );
}
