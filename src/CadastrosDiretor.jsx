import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from './services/api';
import './cadastros-diretor.css';
import { isValidCpf, isValidEmail } from './validation';

const currentYear = new Date().getFullYear();

const initialValues = {
  professor: {
    escolaId: '',
    nome: '',
    cpf: '',
    rg: '',
    email: '',
    telefone: '',
    matriculaFuncional: '',
    formacao: '',
    disciplina: '',
    tipoVinculo: 'Efetivo',
    cargaHorariaSemanal: '',
  },
  turma: {
    escolaId: '',
    anoLetivo: String(currentYear),
    nome: '',
    etapaEnsino: 'Ensino Fundamental',
    serie: '',
    turno: 'Matutino',
    capacidade: '',
    sala: '',
    coordenadorUsuarioId: '',
    professorId: '',
    componenteCurricular: '',
  },
  secretario: {
    escolaId: '',
    nome: '',
    cpf: '',
    rg: '',
    email: '',
    telefone: '',
    matriculaFuncional: '',
    tipoVinculo: 'Efetivo',
    dataAdmissao: '',
  },
  matricula: {
    escolaId: '',
    turmaId: '',
    anoLetivo: String(currentYear),
    nome: '',
    nomeSocial: '',
    dataNascimento: '',
    cpf: '',
    rg: '',
    certidaoNascimento: '',
    genero: '',
    necessidadeEducacionalEspecial: false,
    descricaoNecessidade: '',
    cep: '',
    logradouro: '',
    numeroEndereco: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: 'BA',
    responsavel: '',
    parentesco: '',
    cpfResponsavel: '',
    rgResponsavel: '',
    emailResponsavel: '',
    contatoResponsavel: '',
    contatoAlternativo: '',
    profissaoResponsavel: '',
    resideComAluno: true,
  },
  documentos: {
    tipo: '',
    aluno: '',
    finalidade: '',
  },
};

const titles = {
  professor: 'Cadastrar professor',
  turma: 'Cadastrar turma',
  secretario: 'Cadastrar secretário escolar',
  matricula: 'Matricular aluno',
  documentos: 'Impressão de documentos',
};

function TextField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = true,
  ...props
}) {
  return (
    <label>
      {label}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      />
    </label>
  );
}

function SchoolField({ schools, value, onChange }) {
  return (
    <label className="cadastro-full-field">
      Unidade escolar
      <select name="escolaId" value={value} onChange={onChange} required>
        <option value="">Selecione a escola</option>
        {schools.map((school) => (
          <option key={school.id} value={school.id}>
            {school.nome}{school.inep ? ` · INEP ${school.inep}` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionTitle({ children }) {
  return <h2 className="cadastro-section-title">{children}</h2>;
}

export default function CadastroDiretor({ type, token, onLogout }) {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(() => ({ ...initialValues[type] }));
  const [schools, setSchools] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [doneMessage, setDoneMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(type !== 'documentos');
  const [submitting, setSubmitting] = useState(false);

  const backPath = ['turma', 'matricula'].includes(type)
    ? '/diretor/turmas'
    : '/diretor';

  useEffect(() => {
    if (type === 'documentos') return undefined;

    let active = true;
    api.getAcademicContext(token)
      .then((context) => {
        if (!active) return;
        setSchools(context.escolas || []);
        setCoordinators(context.coordenadores || []);
        const requestedSchoolId = searchParams.get('escolaId');
        const requestedSchool = context.escolas?.find(
          (school) => String(school.id) === requestedSchoolId,
        );

        if (requestedSchool || context.escolas?.length === 1) {
          setForm((current) => ({
            ...current,
            escolaId: String(requestedSchool?.id || context.escolas[0].id),
          }));
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoadingOptions(false);
      });

    return () => {
      active = false;
    };
  }, [searchParams, token, type]);

  useEffect(() => {
    if (!form.escolaId || !['turma', 'matricula'].includes(type)) return;

    let active = true;
    const filters = {
      escolaId: form.escolaId,
      anoLetivo: form.anoLetivo || currentYear,
    };

    Promise.all([
      api.listAcademicClasses(filters, token),
      api.listAcademicTeachers({ escolaId: form.escolaId }, token),
    ])
      .then(([classData, teacherData]) => {
        if (!active) return;
        setClasses(classData || []);
        setTeachers(teacherData || []);

        const requestedClassId = searchParams.get('turmaId');
        if (
          type === 'matricula'
          && requestedClassId
          && classData.some((schoolClass) => String(schoolClass.id) === requestedClassId)
        ) {
          setForm((current) => ({
            ...current,
            turmaId: requestedClassId,
          }));
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });

    return () => {
      active = false;
    };
  }, [form.anoLetivo, form.escolaId, searchParams, token, type]);

  const schoolCoordinators = useMemo(
    () => coordinators.filter(
      (coordinator) => String(coordinator.escolaId) === String(form.escolaId),
    ),
    [coordinators, form.escolaId],
  );

  function change(event) {
    const { checked, name, type: inputType, value } = event.target;
    setDoneMessage('');
    setError('');
    setForm((current) => ({
      ...current,
      [name]: inputType === 'checkbox' ? checked : value,
      ...(name === 'escolaId' ? { turmaId: '', professorId: '' } : {}),
    }));
  }

  function validatePersonFields() {
    if (form.cpf && !isValidCpf(form.cpf)) {
      throw new Error('CPF inválido. Confira os onze números informados.');
    }
    if (form.email && !isValidEmail(form.email)) {
      throw new Error('E-mail inválido. Informe um endereço completo.');
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setDoneMessage('');
    setSubmitting(true);

    try {
      if (type === 'documentos') {
        setDoneMessage('Documento preparado para impressão.');
        window.setTimeout(() => window.print(), 150);
        return;
      }

      if (!form.escolaId) throw new Error('Selecione a unidade escolar.');

      if (['professor', 'secretario'].includes(type)) {
        validatePersonFields();
      }

      if (type === 'professor') {
        await api.createAcademicTeacher({
          escolaId: Number(form.escolaId),
          nomeCompleto: form.nome,
          cpf: form.cpf,
          rg: form.rg || undefined,
          email: form.email,
          telefone: form.telefone || undefined,
          matriculaFuncional: form.matriculaFuncional || undefined,
          formacao: form.formacao || undefined,
          especialidade: form.disciplina || undefined,
          tipoVinculo: form.tipoVinculo,
          cargaHorariaSemanal: form.cargaHorariaSemanal || undefined,
        }, token);
        setDoneMessage('Professor cadastrado e vinculado à escola com sucesso.');
      }

      if (type === 'secretario') {
        await api.createAcademicEmployee({
          escolaId: Number(form.escolaId),
          nomeCompleto: form.nome,
          cpf: form.cpf,
          rg: form.rg || undefined,
          email: form.email,
          telefone: form.telefone || undefined,
          cargo: 'Secretário Escolar',
          matriculaFuncional: form.matriculaFuncional || undefined,
          tipoVinculo: form.tipoVinculo,
          dataAdmissao: form.dataAdmissao || undefined,
        }, token);
        setDoneMessage('Secretário escolar cadastrado com sucesso.');
      }

      if (type === 'turma') {
        const createdClass = await api.createAcademicClass({
          escolaId: Number(form.escolaId),
          anoLetivo: Number(form.anoLetivo),
          nome: form.nome,
          etapaEnsino: form.etapaEnsino,
          serieAno: form.serie,
          turno: form.turno,
          capacidade: Number(form.capacidade),
          sala: form.sala || undefined,
          coordenadorUsuarioId: form.coordenadorUsuarioId
            ? Number(form.coordenadorUsuarioId)
            : undefined,
        }, token);

        if (form.professorId) {
          if (!form.componenteCurricular) {
            throw new Error('Informe o componente curricular do professor selecionado.');
          }
          await api.assignTeacherToClass(createdClass.id, {
            professorId: Number(form.professorId),
            componenteCurricular: form.componenteCurricular,
            titular: true,
          }, token);
        }
        setDoneMessage('Turma cadastrada com sucesso.');
      }

      if (type === 'matricula') {
        if (form.cpf && !isValidCpf(form.cpf)) {
          throw new Error('CPF do aluno inválido.');
        }
        if (form.cpfResponsavel && !isValidCpf(form.cpfResponsavel)) {
          throw new Error('CPF do responsável inválido.');
        }
        if (form.emailResponsavel && !isValidEmail(form.emailResponsavel)) {
          throw new Error('E-mail do responsável inválido.');
        }

        const result = await api.enrollNewStudent({
          escolaId: Number(form.escolaId),
          turmaId: Number(form.turmaId),
          anoLetivo: Number(form.anoLetivo),
          aluno: {
            nomeCompleto: form.nome,
            nomeSocial: form.nomeSocial || undefined,
            dataNascimento: form.dataNascimento,
            cpf: form.cpf || undefined,
            rg: form.rg || undefined,
            certidaoNascimento: form.certidaoNascimento || undefined,
            genero: form.genero || undefined,
            necessidadeEducacionalEspecial: form.necessidadeEducacionalEspecial,
            descricaoNecessidade: form.descricaoNecessidade || undefined,
            endereco: {
              cep: form.cep || undefined,
              logradouro: form.logradouro || undefined,
              numero: form.numeroEndereco || undefined,
              complemento: form.complemento || undefined,
              bairro: form.bairro || undefined,
              cidade: form.cidade || undefined,
              uf: form.uf || undefined,
            },
          },
          responsavel: {
            nomeCompleto: form.responsavel,
            cpf: form.cpfResponsavel || undefined,
            rg: form.rgResponsavel || undefined,
            email: form.emailResponsavel || undefined,
            telefonePrincipal: form.contatoResponsavel,
            telefoneAlternativo: form.contatoAlternativo || undefined,
            profissao: form.profissaoResponsavel || undefined,
            endereco: form.resideComAluno
              ? {
                  cep: form.cep || undefined,
                  logradouro: form.logradouro || undefined,
                  numero: form.numeroEndereco || undefined,
                  complemento: form.complemento || undefined,
                  bairro: form.bairro || undefined,
                  cidade: form.cidade || undefined,
                  uf: form.uf || undefined,
                }
              : {},
          },
          parentesco: form.parentesco,
          resideComAluno: form.resideComAluno,
        }, token);
        setDoneMessage(
          `Cadastro efetuado com sucesso. Matrícula: ${result.matricula.numero}`,
        );
      }

      const selectedSchool = form.escolaId;
      setForm({ ...initialValues[type], escolaId: selectedSchool });
      if (type === 'matricula') {
        const refreshedClasses = await api.listAcademicClasses({
          escolaId: selectedSchool,
          anoLetivo: currentYear,
        }, token);
        setClasses(refreshedClasses);
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const noSchools = type !== 'documentos' && !loadingOptions && schools.length === 0;

  return (
    <main className="cadastro-diretor">
      <header>
        <div>
          <span>GESTÃO ESCOLAR</span>
          <h1>{titles[type]}</h1>
          <p>Dados gravados no PostgreSQL e vinculados à unidade autorizada.</p>
        </div>
        <div className="cadastro-header-actions">
          <Link to={backPath}>← Voltar</Link>
          <button type="button" onClick={onLogout}>Sair</button>
        </div>
      </header>

      <form onSubmit={submit}>
        <div className="cadastro-fields">
          {type !== 'documentos' && (
            <SchoolField
              schools={schools}
              value={form.escolaId}
              onChange={change}
            />
          )}

          {type === 'professor' && (
            <>
              <SectionTitle>Dados do professor</SectionTitle>
              <TextField label="Nome completo" name="nome" value={form.nome} onChange={change} />
              <TextField label="CPF" name="cpf" value={form.cpf} onChange={change} placeholder="000.000.000-00" />
              <TextField label="RG" name="rg" value={form.rg} onChange={change} required={false} />
              <TextField label="E-mail" name="email" value={form.email} onChange={change} type="email" />
              <TextField label="Telefone" name="telefone" value={form.telefone} onChange={change} required={false} />
              <TextField label="Matrícula da Secretaria de Educação" name="matriculaFuncional" value={form.matriculaFuncional} onChange={change} required={false} readOnly />
              <TextField label="Formação" name="formacao" value={form.formacao} onChange={change} required={false} />
              <TextField label="Disciplina/especialidade" name="disciplina" value={form.disciplina} onChange={change} required={false} />
              <TextField label="Tipo de vínculo" name="tipoVinculo" value={form.tipoVinculo} onChange={change} />
              <TextField label="Carga horária semanal" name="cargaHorariaSemanal" value={form.cargaHorariaSemanal} onChange={change} type="number" min="1" max="168" required={false} />
            </>
          )}

          {type === 'turma' && (
            <>
              <SectionTitle>Organização da turma</SectionTitle>
              <TextField label="Ano letivo" name="anoLetivo" value={form.anoLetivo} onChange={change} type="number" min="2000" max="2200" />
              <TextField label="Nome da turma" name="nome" value={form.nome} onChange={change} placeholder="Ex.: 7º Ano A" />
              <TextField label="Etapa de ensino" name="etapaEnsino" value={form.etapaEnsino} onChange={change} />
              <TextField label="Ano/série" name="serie" value={form.serie} onChange={change} placeholder="Ex.: 7º ano" />
              <label>
                Turno
                <select name="turno" value={form.turno} onChange={change} required>
                  <option>Matutino</option>
                  <option>Vespertino</option>
                  <option>Noturno</option>
                  <option>Integral</option>
                </select>
              </label>
              <TextField label="Capacidade" name="capacidade" value={form.capacidade} onChange={change} type="number" min="1" max="200" />
              <TextField label="Sala" name="sala" value={form.sala} onChange={change} required={false} />
              <label>
                Coordenador responsável
                <select name="coordenadorUsuarioId" value={form.coordenadorUsuarioId} onChange={change}>
                  <option value="">Não informado</option>
                  {schoolCoordinators.map((coordinator) => (
                    <option key={coordinator.id} value={coordinator.id}>{coordinator.nome}</option>
                  ))}
                </select>
              </label>
              <label>
                Professor titular inicial
                <select name="professorId" value={form.professorId} onChange={change}>
                  <option value="">Adicionar depois</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.nome}</option>
                  ))}
                </select>
              </label>
              <TextField
                label="Componente curricular"
                name="componenteCurricular"
                value={form.componenteCurricular}
                onChange={change}
                required={Boolean(form.professorId)}
                placeholder="Ex.: Matemática"
              />
            </>
          )}

          {type === 'secretario' && (
            <>
              <SectionTitle>Dados do secretário escolar</SectionTitle>
              <TextField label="Nome completo" name="nome" value={form.nome} onChange={change} />
              <TextField label="CPF" name="cpf" value={form.cpf} onChange={change} placeholder="000.000.000-00" />
              <TextField label="RG" name="rg" value={form.rg} onChange={change} required={false} />
              <TextField label="E-mail" name="email" value={form.email} onChange={change} type="email" />
              <TextField label="Telefone" name="telefone" value={form.telefone} onChange={change} />
              <TextField label="Matrícula da Secretaria de Educação" name="matriculaFuncional" value={form.matriculaFuncional} onChange={change} required={false} readOnly />
              <TextField label="Tipo de vínculo" name="tipoVinculo" value={form.tipoVinculo} onChange={change} />
              <TextField label="Data de admissão" name="dataAdmissao" value={form.dataAdmissao} onChange={change} type="date" required={false} />
            </>
          )}

          {type === 'matricula' && (
            <>
              <SectionTitle>Dados do aluno</SectionTitle>
              <TextField label="Nome completo" name="nome" value={form.nome} onChange={change} />
              <TextField label="Nome social" name="nomeSocial" value={form.nomeSocial} onChange={change} required={false} />
              <TextField label="Data de nascimento" name="dataNascimento" value={form.dataNascimento} onChange={change} type="date" />
              <TextField label="CPF do aluno" name="cpf" value={form.cpf} onChange={change} placeholder="Opcional" required={false} />
              <TextField label="RG do aluno" name="rg" value={form.rg} onChange={change} required={false} />
              <TextField label="Certidão de nascimento" name="certidaoNascimento" value={form.certidaoNascimento} onChange={change} required={false} />
              <label>
                Gênero
                <select name="genero" value={form.genero} onChange={change}>
                  <option value="">Não informado</option>
                  <option>Feminino</option>
                  <option>Masculino</option>
                  <option>Outro</option>
                  <option>Prefere não informar</option>
                </select>
              </label>
              <label className="cadastro-check-field">
                <input
                  type="checkbox"
                  name="necessidadeEducacionalEspecial"
                  checked={form.necessidadeEducacionalEspecial}
                  onChange={change}
                />
                Possui necessidade educacional especial
              </label>
              {form.necessidadeEducacionalEspecial && (
                <TextField label="Descrição da necessidade" name="descricaoNecessidade" value={form.descricaoNecessidade} onChange={change} />
              )}

              <SectionTitle>Endereço do aluno</SectionTitle>
              <TextField label="CEP" name="cep" value={form.cep} onChange={change} required={false} />
              <TextField label="Logradouro" name="logradouro" value={form.logradouro} onChange={change} required={false} />
              <TextField label="Número" name="numeroEndereco" value={form.numeroEndereco} onChange={change} required={false} />
              <TextField label="Complemento" name="complemento" value={form.complemento} onChange={change} required={false} />
              <TextField label="Bairro" name="bairro" value={form.bairro} onChange={change} required={false} />
              <TextField label="Cidade" name="cidade" value={form.cidade} onChange={change} required={false} />
              <TextField label="UF" name="uf" value={form.uf} onChange={change} maxLength="2" required={false} />

              <SectionTitle>Responsável</SectionTitle>
              <TextField label="Nome do responsável" name="responsavel" value={form.responsavel} onChange={change} />
              <TextField label="Parentesco" name="parentesco" value={form.parentesco} onChange={change} placeholder="Ex.: Mãe, pai, avó" />
              <TextField label="CPF do responsável" name="cpfResponsavel" value={form.cpfResponsavel} onChange={change} required={false} />
              <TextField label="RG do responsável" name="rgResponsavel" value={form.rgResponsavel} onChange={change} required={false} />
              <TextField label="E-mail do responsável" name="emailResponsavel" value={form.emailResponsavel} onChange={change} type="email" required={false} />
              <TextField label="Contato principal" name="contatoResponsavel" value={form.contatoResponsavel} onChange={change} placeholder="Telefone ou celular" />
              <TextField label="Contato alternativo" name="contatoAlternativo" value={form.contatoAlternativo} onChange={change} required={false} />
              <TextField label="Profissão" name="profissaoResponsavel" value={form.profissaoResponsavel} onChange={change} required={false} />
              <label className="cadastro-check-field">
                <input
                  type="checkbox"
                  name="resideComAluno"
                  checked={form.resideComAluno}
                  onChange={change}
                />
                Responsável reside no mesmo endereço do aluno
              </label>

              <SectionTitle>Matrícula</SectionTitle>
              <TextField label="Ano letivo" name="anoLetivo" value={form.anoLetivo} onChange={change} type="number" min="2000" max="2200" />
              <label>
                Turma
                <select name="turmaId" value={form.turmaId} onChange={change} required>
                  <option value="">Selecione uma turma com vaga</option>
                  {classes.map((schoolClass) => (
                    <option
                      key={schoolClass.id}
                      value={schoolClass.id}
                      disabled={schoolClass.vagasDisponiveis <= 0}
                    >
                      {schoolClass.nome} · {schoolClass.serieAno} · {schoolClass.turno}
                      {' '}({schoolClass.vagasDisponiveis} vaga(s))
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {type === 'documentos' && (
            <>
              <TextField label="Tipo de documento" name="tipo" value={form.tipo} onChange={change} />
              <TextField label="Aluno" name="aluno" value={form.aluno} onChange={change} />
              <TextField label="Finalidade" name="finalidade" value={form.finalidade} onChange={change} />
            </>
          )}
        </div>

        {loadingOptions && <p className="cadastro-info">Carregando dados da escola...</p>}
        {noSchools && (
          <p className="cadastro-warning">
            Seu usuário ainda não possui uma unidade escolar vinculada.
          </p>
        )}
        {type === 'matricula' && form.escolaId && classes.length === 0 && (
          <p className="cadastro-warning">
            Cadastre uma turma ativa antes de realizar a matrícula.
          </p>
        )}
        {error && <p className="error">{error}</p>}
        {doneMessage && <p className="cadastro-success">{doneMessage}</p>}

        <div className="cadastro-actions">
          <button
            disabled={
              submitting
              || loadingOptions
              || noSchools
              || (type === 'matricula' && classes.length === 0)
            }
          >
            {submitting
              ? 'Salvando...'
              : type === 'documentos'
                ? 'Gerar e imprimir'
                : 'Salvar cadastro'}
          </button>
          <Link to={backPath}>← Voltar</Link>
        </div>
      </form>
    </main>
  );
}
