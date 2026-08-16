import React, { useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './services/api';
import { isValidCpf, isValidEmail } from './validation';
import './usuarios-vinculos.css';

const profiles = [
  'Secretário Municipal de Educação', 'Superintendente / Diretor de Ensino',
  'Coordenador Pedagógico Municipal', 'Secretaria Administrativa da Educação',
  'Diretor', 'Vice-Diretor', 'Coordenador Pedagógico', 'Secretário Escolar',
  'Auxiliar/Assistente Administrativo', 'Professor',
  'Auxiliar de Vida Escolar / Cuidador', 'Auxiliar de Serviços Gerais',
  'Motorista', 'Monitor de Transporte Escolar', 'Merendeira/Cozinheira',
  'Porteiro/Vigia', 'Psicólogo', 'Assistente Social', 'Nutricionista',
];
const schoolProfiles = new Set([
  'Diretor', 'Vice-Diretor', 'Coordenador Pedagógico', 'Secretário Escolar',
  'Auxiliar/Assistente Administrativo', 'Professor',
  'Auxiliar de Vida Escolar / Cuidador', 'Auxiliar de Serviços Gerais',
  'Merendeira/Cozinheira', 'Porteiro/Vigia',
]);
const multiSchoolProfiles = new Set(['Coordenador Pedagógico']);
const tabs = [
  { id: 'pessoais', number: 1, label: 'Dados pessoais' },
  { id: 'funcionais', number: 2, label: 'Dados funcionais' },
  { id: 'acesso', number: 3, label: 'Acesso ao SIEDU' },
];

const emptyForm = {
  fotoBase64: '', nome: '', nomeSocial: '', cpf: '', dataNascimento: '',
  genero: '', telefoneInstitucional: '', email: '', emailPessoal: '',
  enderecoResidencial: '', contatoEmergenciaNome: '', contatoEmergenciaTelefone: '',
  matriculaFuncional: '', cargo: '', funcaoExercida: '', tipoVinculo: '',
  situacaoFuncional: 'ativo', dataAdmissao: '', dataDesligamento: '',
  cargaHorariaSemanal: '', turnosTrabalho: [], secretariaSetor: '',
  disciplinasText: '', turmasText: '', gestorImediato: '',
  observacoesAdministrativas: '', usuario: '', tipoUsuarioId: '', escolaIds: [],
  situacaoAcesso: 'pendente',
};

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'PF';
}

function splitList(value) {
  return [...new Set(value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean))];
}

function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      reject(new Error('Escolha uma foto JPG, PNG ou WebP.'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('A foto deve ter no máximo 2 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a foto.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('O arquivo não contém uma imagem válida.'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        const sx = (image.naturalWidth - side) / 2;
        const sy = (image.naturalHeight - side) / 2;
        context.drawImage(image, sx, sy, side, side, 0, 0, 512, 512);
        resolve(canvas.toDataURL('image/webp', 0.86));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function SchoolBindingSelector({ schools, profile, selectedIds, onChange, allowEmpty = false }) {
  const multiple = multiSchoolProfiles.has(profile);
  const groupName = useId();
  function select(id) {
    if (!multiple) return onChange([id]);
    onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  }
  return (
    <fieldset className="school-binding-fieldset">
      <legend>{multiple ? 'Unidades escolares autorizadas' : 'Unidade escolar autorizada'}</legend>
      <p className="school-binding-help">{multiple ? 'Selecione todas as escolas em que este perfil poderá atuar.' : 'Este perfil pode atuar em somente uma escola.'}</p>
      {allowEmpty && !multiple && (
        <label className="school-binding-option">
          <input type="radio" name={`${groupName}-none`} checked={!selectedIds.length} onChange={() => onChange([])} />
          <span>Sem escola vinculada</span>
        </label>
      )}
      <div className="school-binding-options">
        {schools.map((school) => (
          <label className="school-binding-option" key={school.id}>
            <input type={multiple ? 'checkbox' : 'radio'} name={multiple ? `${groupName}-${school.id}` : groupName}
              checked={selectedIds.includes(school.id)} onChange={() => select(school.id)} />
            <span>{school.nome}</span>
          </label>
        ))}
      </div>
      {!schools.length && <p className="school-binding-empty">Cadastre uma escola antes de criar este vínculo.</p>}
    </fieldset>
  );
}

function Field({ label, required, help, children, wide = false }) {
  return (
    <label className={wide ? 'field-wide' : ''}>
      <span>{label}{required && <b aria-label="obrigatório"> *</b>}</span>
      {children}
      {help && <small>{help}</small>}
    </label>
  );
}

export default function UsuariosGestao({ token, onLogout }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pagination, setPagination] = useState({
    pagina: 1,
    limite: 25,
    total: 0,
    totalPaginas: 0,
  });
  const [schools, setSchools] = useState([]);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState('pessoais');
  const [editingBinding, setEditingBinding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [credentials, setCredentials] = useState(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const result = await api.listUsers({
        busca: search.trim(),
        page,
        limit,
      }, token);

      const data = Array.isArray(result?.dados) ? result.dados : [];

      if (data.length === 0 && page > 1) {
        setPage(1);
        return;
      }

      setUsers(data);
      setPagination(result?.paginacao || {
        pagina: page,
        limite: limit,
        total: 0,
        totalPaginas: 0,
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    Promise.all([
      api.listSchools(token),
      api.listUserTypes(token),
    ])
      .then(([schoolList, typeList]) => {
        if (!active) return;

        const visible = typeList.filter((type) => profiles.includes(type.nome));
        setSchools(schoolList);
        setTypes([...new Map(visible.map((type) => [type.nome, type])).values()]);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timeout);
  }, [token, search, page, limit]);
  const selectedType = useMemo(
    () => types.find((type) => String(type.id) === String(form.tipoUsuarioId)),
    [types, form.tipoUsuarioId],
  );

  function change(event) {
    const { name, value } = event.target;
    setError('');
    setMessage('');
    setForm((current) => ({
      ...current, [name]: value,
      ...(name === 'tipoUsuarioId' ? { escolaIds: [] } : {}),
    }));
  }

  function toggleTurn(value) {
    setForm((current) => ({
      ...current,
      turnosTrabalho: current.turnosTrabalho.includes(value)
        ? current.turnosTrabalho.filter((turn) => turn !== value)
        : [...current.turnosTrabalho, value],
    }));
  }

  async function choosePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const fotoBase64 = await resizePhoto(file);
      setForm((current) => ({ ...current, fotoBase64 }));
    } catch (photoError) {
      event.target.value = '';
      setError(photoError.message);
    }
  }

  function validateTab(tab) {
    if (tab === 'pessoais') {
      if (form.nome.trim().length < 3) return 'Informe o nome completo.';
      if (!isValidCpf(form.cpf)) return 'CPF inválido. Confira os onze números.';
      if (form.email && !isValidEmail(form.email)) return 'E-mail institucional inválido.';
      if (form.emailPessoal && !isValidEmail(form.emailPessoal)) return 'E-mail pessoal inválido.';
    }
    if (tab === 'funcionais') {
      if (!form.cargo || !form.funcaoExercida || !form.tipoVinculo || !form.dataAdmissao) {
        return 'Preencha cargo, função, vínculo e data de admissão.';
      }
      if (form.situacaoFuncional === 'desligado' && !form.dataDesligamento) return 'Informe a data de desligamento.';
      if (form.dataDesligamento && form.dataDesligamento < form.dataAdmissao) return 'A data de desligamento não pode ser anterior à admissão.';
    }
    if (tab === 'acesso') {
      if (!form.usuario.trim() || !form.tipoUsuarioId) return 'Informe o login e o perfil de acesso.';
      if (selectedType?.requerEscola && !form.escolaIds.length) return 'Selecione ao menos uma unidade escolar.';
      if (selectedType?.nome === 'Professor' && !splitList(form.disciplinasText).length) return 'Informe ao menos uma disciplina para o professor.';
    }
    return '';
  }

  function goNext() {
    const problem = validateTab(activeTab);
    if (problem) return setError(problem);
    setError('');
    setActiveTab(activeTab === 'pessoais' ? 'funcionais' : 'acesso');
  }

  async function create(event) {
    event.preventDefault();
    const problem = validateTab('pessoais') || validateTab('funcionais') || validateTab('acesso');
    if (problem) return setError(problem);
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await api.createUser({
        ...form,
        tipoUsuarioId: Number(form.tipoUsuarioId),
        escolaId: form.escolaIds[0] || null,
        disciplinas: splitList(form.disciplinasText),
        turmasAtendidas: splitList(form.turmasText),
      }, token);
      setCredentials(result.senhaTemporaria ? {
        nome: result.user.nome, usuario: result.user.usuario,
        senha: result.senhaTemporaria, doisFatores: result.doisFatoresObrigatorio,
      } : null);
      setMessage(result.senhaTemporaria
        ? 'Funcionário cadastrado. Entregue as credenciais por um canal seguro.'
        : 'Cadastro funcional criado sem acesso operacional ao portal.');
      setForm(emptyForm);
      setActiveTab('pessoais');
      await loadUsers();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  async function saveBindings() {
    if (!editingBinding) return;
    try {
      await api.updateUserSchools(editingBinding.id, editingBinding.escolaIds, token);
      setEditingBinding(null);
      setMessage('Unidades autorizadas atualizadas e registradas no histórico.');
      await loadUsers();
    } catch (requestError) { setError(requestError.message); }
  }

  async function remove(id) {
    if (!window.confirm('Excluir este cadastro funcional? Esta ação não poderá ser desfeita.')) return;
    try {
      await api.deleteUser(id, token);
      setMessage('Cadastro excluído.');
      await loadUsers();
    } catch (requestError) { setError(requestError.message); }
  }

  async function toggleAccess(item) {
    try {
      const next = item.situacaoAcesso === 'ativo' && item.ativo ? 'bloqueado' : 'ativo';
      await api.updateUser(item.id, { situacaoAcesso: next }, token);
      setMessage(next === 'ativo' ? 'Acesso do funcionário reativado.' : 'Acesso do funcionário bloqueado sem excluir o cadastro.');
      await loadUsers();
    } catch (requestError) { setError(requestError.message); }
  }

  return (
    <main className="app-page user-management-page">
      <header className="user-management-header">
        <strong>SIEDU-PINDOBAÇU · Portal do Gestor</strong>
        <nav><Link to="/gestor">Painel</Link><Link to="/gestor/escolas">Escolas</Link><button type="button" onClick={onLogout}>Sair</button></nav>
      </header>

      <section className="hero">
        <span className="eyebrow">GESTÃO DE PESSOAS E ACESSOS</span>
        <h1>Cadastro funcional</h1>
        <p>Dados pessoais, vínculo profissional e permissões organizados em um único cadastro auditável.</p>
      </section>

      {(error || message) && <section className="user-feedback" aria-live="polite">{error && <p className="error">{error}</p>}{message && <p className="success">{message}</p>}</section>}

      {credentials && (
        <section className="first-access-card" aria-live="polite">
          <div><span>CREDENCIAIS DE PRIMEIRO ACESSO</span><h2>{credentials.nome}</h2><p>A senha deverá ser alterada no primeiro acesso.{credentials.doisFatores && ' Este perfil deverá ativar autenticação em dois fatores.'}</p></div>
          <dl><div><dt>Login</dt><dd>{credentials.usuario}</dd></div><div><dt>Senha temporária</dt><dd>{credentials.senha}</dd></div></dl>
          <button type="button" onClick={() => setCredentials(null)}>Já anotei, fechar</button>
        </section>
      )}

      <section className="user-management-grid final-registration-grid">
        <form className="panel user-create-panel final-registration" onSubmit={create}>
          <div className="registration-title"><div><span>NOVO FUNCIONÁRIO</span><h2>Formulário de cadastro</h2></div><em>* Campos obrigatórios</em></div>
          <div className="registration-tabs" role="tablist" aria-label="Etapas do cadastro">
            {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}><b>{tab.number}</b><span>{tab.label}</span></button>)}
          </div>

          {activeTab === 'pessoais' && (
            <section className="registration-step" role="tabpanel">
              <div className="profile-photo-field field-wide">
                <div className="profile-photo-preview">{form.fotoBase64 ? <img src={form.fotoBase64} alt="Prévia da foto de perfil" /> : <span>{initials(form.nome)}</span>}</div>
                <div><strong>Foto de perfil</strong><p>Opcional · JPG, PNG ou WebP · até 2 MB. A imagem é recortada em 512 × 512 e os metadados são removidos.</p><label className="photo-button">{form.fotoBase64 ? 'Alterar foto' : 'Adicionar foto'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} /></label>{form.fotoBase64 && <button className="photo-remove" type="button" onClick={() => setForm((current) => ({ ...current, fotoBase64: '' }))}>Remover</button>}</div>
              </div>
              <div className="registration-fields">
                <Field label="Nome completo" required><input name="nome" value={form.nome} onChange={change} autoComplete="name" /></Field>
                <Field label="Nome social"><input name="nomeSocial" value={form.nomeSocial} onChange={change} /></Field>
                <Field label="CPF" required><input name="cpf" value={form.cpf} onChange={change} placeholder="000.000.000-00" maxLength="14" inputMode="numeric" /></Field>
                <Field label="Data de nascimento"><input type="date" name="dataNascimento" value={form.dataNascimento} onChange={change} /></Field>
                <Field label="Sexo/gênero"><select name="genero" value={form.genero} onChange={change}><option value="">Não informado</option><option>Feminino</option><option>Masculino</option><option>Não binário</option><option>Outro</option><option>Prefere não informar</option></select></Field>
                <Field label="Telefone / WhatsApp institucional"><input name="telefoneInstitucional" value={form.telefoneInstitucional} onChange={change} type="tel" /></Field>
                <Field label="E-mail institucional"><input name="email" value={form.email} onChange={change} type="email" /></Field>
                <Field label="E-mail pessoal"><input name="emailPessoal" value={form.emailPessoal} onChange={change} type="email" /></Field>
                <Field label="Endereço" wide><input name="enderecoResidencial" value={form.enderecoResidencial} onChange={change} /></Field>
                <Field label="Contato de emergência"><input name="contatoEmergenciaNome" value={form.contatoEmergenciaNome} onChange={change} placeholder="Nome" /></Field>
                <Field label="Telefone de emergência" help="Acesso restrito à administração."><input name="contatoEmergenciaTelefone" value={form.contatoEmergenciaTelefone} onChange={change} type="tel" /></Field>
              </div>
            </section>
          )}

          {activeTab === 'funcionais' && (
            <section className="registration-step" role="tabpanel">
              <div className="registration-fields">
                <Field label="Matrícula da Secretaria de Educação"><input name="matriculaFuncional" value={form.matriculaFuncional} onChange={change} placeholder="Gerada automaticamente (SEdu####)" readOnly /></Field>
                <Field label="Cargo" required><input name="cargo" value={form.cargo} onChange={change} /></Field>
                <Field label="Função exercida" required><input name="funcaoExercida" value={form.funcaoExercida} onChange={change} /></Field>
                <Field label="Tipo de vínculo" required><select name="tipoVinculo" value={form.tipoVinculo} onChange={change}><option value="">Selecione</option><option value="efetivo">Efetivo</option><option value="contratado">Contratado</option><option value="comissionado">Comissionado</option><option value="temporario">Temporário</option><option value="cedido">Cedido</option><option value="estagiario">Estagiário</option><option value="terceirizado">Terceirizado</option></select></Field>
                <Field label="Situação funcional" required><select name="situacaoFuncional" value={form.situacaoFuncional} onChange={change}><option value="ativo">Ativo</option><option value="afastado">Afastado</option><option value="licenca">Em licença</option><option value="cedido">Cedido</option><option value="desligado">Desligado</option></select></Field>
                <Field label="Data de admissão" required><input type="date" name="dataAdmissao" value={form.dataAdmissao} onChange={change} /></Field>
                {form.situacaoFuncional === 'desligado' && <Field label="Data de desligamento" required><input type="date" name="dataDesligamento" value={form.dataDesligamento} onChange={change} /></Field>}
                <Field label="Carga horária semanal"><input type="number" min="1" max="80" step="0.5" name="cargaHorariaSemanal" value={form.cargaHorariaSemanal} onChange={change} /></Field>
                <fieldset className="turn-selector field-wide"><legend>Turno(s) de trabalho</legend>{[['matutino','Matutino'],['vespertino','Vespertino'],['noturno','Noturno'],['integral','Integral']].map(([value, label]) => <label key={value}><input type="checkbox" checked={form.turnosTrabalho.includes(value)} onChange={() => toggleTurn(value)} /> {label}</label>)}</fieldset>
                <Field label="Secretaria / setor"><input name="secretariaSetor" value={form.secretariaSetor} onChange={change} /></Field>
                <Field label="Gestor responsável imediato"><input name="gestorImediato" value={form.gestorImediato} onChange={change} /></Field>
                <Field label="Disciplina(s)" help="Obrigatório para professor. Separe por vírgula." wide><input name="disciplinasText" value={form.disciplinasText} onChange={change} placeholder="Ex.: Matemática, Ciências" /></Field>
                <Field label="Turmas atendidas" help="Separe por vírgula." wide><input name="turmasText" value={form.turmasText} onChange={change} placeholder="Ex.: 6º A, 7º B" /></Field>
                <Field label="Observações administrativas" help="Informação restrita à administração." wide><textarea name="observacoesAdministrativas" value={form.observacoesAdministrativas} onChange={change} rows="3" /></Field>
              </div>
            </section>
          )}

          {activeTab === 'acesso' && (
            <section className="registration-step" role="tabpanel">
              <div className="access-notice field-wide"><strong>Segurança do primeiro acesso</strong><p>O sistema gera uma senha temporária, força a criação de uma nova senha e registra alterações de perfil e unidades. Perfis estratégicos deverão ativar autenticação em dois fatores.</p></div>
              <div className="registration-fields">
                <Field label="Login" required help="Use o e-mail institucional ou um identificador único."><input name="usuario" value={form.usuario} onChange={change} autoComplete="off" /></Field>
                <Field label="Perfil de acesso" required><select name="tipoUsuarioId" value={form.tipoUsuarioId} onChange={change}><option value="">Selecione</option>{types.map((type) => <option key={type.id} value={type.id}>Nível {type.nivel} · {type.nome}</option>)}</select></Field>
                <Field label="Situação do acesso" required><select name="situacaoAcesso" value={form.situacaoAcesso} onChange={change}><option value="pendente">Pendente — aguardando primeiro acesso</option><option value="ativo">Ativo</option><option value="bloqueado">Bloqueado</option><option value="desligado">Desligado</option></select></Field>
                <div className="security-summary"><span>Primeiro acesso</span><strong>Troca de senha obrigatória</strong></div>
                <div className="security-summary"><span>Autenticação em dois fatores</span><strong>{selectedType?.nivel <= 3 ? 'Obrigatória para este perfil' : 'Conforme política do perfil'}</strong></div>
              </div>
              {selectedType?.requerEscola && <SchoolBindingSelector schools={schools} profile={selectedType.nome} selectedIds={form.escolaIds} onChange={(escolaIds) => setForm((current) => ({ ...current, escolaIds }))} />}
            </section>
          )}

          <div className="registration-actions">
            {activeTab !== 'pessoais' && <button className="button-secondary" type="button" onClick={() => setActiveTab(activeTab === 'acesso' ? 'funcionais' : 'pessoais')}>Voltar</button>}
            {activeTab !== 'acesso' ? <button type="button" onClick={goNext}>Continuar</button> : <button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Concluir cadastro'}</button>}
            <Link className="form-return" to="/gestor">Cancelar</Link>
          </div>
          <small className="privacy-note">Colete apenas os dados necessários à finalidade administrativa. Informações pessoais e observações restritas são protegidas pelos controles de acesso e auditoria do SIEDU.</small>
        </form>

        <section className="panel user-list-panel">
          <div className="user-list-heading">
            <div>
              <h2>Funcionários cadastrados</h2>
              <p>Perfis profissionais da rede municipal.</p>
            </div>

            <div className="user-list-tools">
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar funcionário, matrícula, perfil ou CPF"
              />
              <span>{loading ? 'Carregando...' : pagination.total + ' cadastro(s)'}</span>
            </div>
          </div>
          <div className="user-table-scroll"><table><thead><tr><th>Funcionário</th><th>Perfil</th><th>Unidades</th><th>Acesso</th><th>Ações</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><div className="employee-cell"><span className="employee-avatar">{initials(item.nome)}</span><div><strong>{item.nomeSocial || item.nome}</strong><small>{item.matriculaFuncional || item.usuario}</small></div></div></td><td>{item.perfil}</td><td><div className="school-tags">{(item.escolas || []).map((school) => <span key={school.id}>{school.nome}</span>)}{!item.escolas?.length && <em>Sem vínculo</em>}</div></td><td><span className={`access-status status-${item.situacaoAcesso || 'pendente'}`}>{item.deve_alterar_senha ? 'Primeiro acesso' : item.situacaoAcesso || (item.ativo ? 'Ativo' : 'Inativo')}</span>{item.doisFatoresObrigatorio && <small>2FA obrigatório</small>}</td><td><div className="user-row-actions">{schoolProfiles.has(item.perfil) && <button className="button-secondary" type="button" onClick={() => setEditingBinding({ id: item.id, nome: item.nome, perfil: item.perfil, escolaIds: (item.escolas || []).map((school) => school.id) })}>Escolas</button>}<button className="button-secondary" type="button" onClick={()=>toggleAccess(item)}>{item.situacaoAcesso==='ativo'&&item.ativo?'Bloquear':'Reativar'}</button><button className="danger" type="button" onClick={() => remove(item.id)}>Excluir</button></div></td></tr>)}</tbody></table></div>
          <div className="user-pagination">
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
              Página {pagination.totalPaginas ? pagination.pagina : 0}
              {' '}de {pagination.totalPaginas}
            </span>

            <div>
              <button
                type="button"
                disabled={pagination.pagina <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={pagination.pagina >= pagination.totalPaginas}
                onClick={() => setPage((current) => current + 1)}
              >
                Próxima
              </button>
            </div>
          </div>

          {editingBinding && <section className="school-binding-editor"><div className="school-binding-editor-heading"><div><span>EDITAR UNIDADES AUTORIZADAS</span><h3>{editingBinding.nome}</h3><p>{editingBinding.perfil}</p></div><button className="binding-close" type="button" onClick={() => setEditingBinding(null)}>Fechar</button></div><SchoolBindingSelector schools={schools} profile={editingBinding.perfil} selectedIds={editingBinding.escolaIds} allowEmpty onChange={(escolaIds) => setEditingBinding((current) => ({ ...current, escolaIds }))} /><div className="binding-actions"><button type="button" onClick={saveBindings}>Salvar vínculos</button><button className="button-secondary" type="button" onClick={() => setEditingBinding(null)}>Cancelar</button></div></section>}
        </section>
      </section>
    </main>
  );
}
