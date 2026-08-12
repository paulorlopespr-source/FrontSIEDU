import React, { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './services/api';
import { isValidCpf, isValidEmail } from './validation';
import './usuarios-vinculos.css';

const educationEmployeeProfiles = [
  'Motorista',
  'Auxiliar de Serviços Gerais',
  'Auxiliar de Vida Escolar (AVE)',
  'Secretaria Administrativa',
  'Secretaria Escolar',
  'Diretor',
  'Coordenador',
  'Professor',
];

const managedSchoolProfiles = new Set(educationEmployeeProfiles);

const emptyForm = {
  nome: '',
  cpf: '',
  email: '',
  tipoUsuarioId: '',
  escolaIds: [],
};

function SchoolBindingSelector({
  schools,
  profile,
  selectedIds,
  onChange,
  allowEmpty = false,
}) {
  const multiple = profile === 'Coordenador';
  const groupName = useId();

  function selectSchool(schoolId) {
    if (!multiple) {
      onChange([schoolId]);
      return;
    }

    const selected = selectedIds.includes(schoolId);
    onChange(
      selected
        ? selectedIds.filter((id) => id !== schoolId)
        : [...selectedIds, schoolId],
    );
  }

  return (
    <fieldset className="school-binding-fieldset">
      <legend>
        {multiple ? 'Unidades escolares' : 'Unidade escolar'}
      </legend>

      <p className="school-binding-help">
        {multiple
          ? 'O Coordenador pode atuar em mais de uma escola.'
          : 'Este perfil pode atuar em somente uma escola.'}
      </p>

      {allowEmpty && !multiple && (
        <label className="school-binding-option">
          <input
            type="radio"
            name={`${groupName}-school-binding`}
            checked={selectedIds.length === 0}
            onChange={() => onChange([])}
          />
          <span>Sem escola vinculada</span>
        </label>
      )}

      <div className="school-binding-options">
        {schools.map((school) => (
          <label className="school-binding-option" key={school.id}>
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={multiple
                ? `${groupName}-school-${school.id}`
                : `${groupName}-school-binding`}
              checked={selectedIds.includes(school.id)}
              onChange={() => selectSchool(school.id)}
            />
            <span>{school.nome}</span>
          </label>
        ))}
      </div>

      {schools.length === 0 && (
        <p className="school-binding-empty">
          Cadastre uma escola antes de criar o vínculo.
        </p>
      )}
    </fieldset>
  );
}

export default function UsuariosGestao({ token, onLogout }) {
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingBinding, setEditingBinding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingBinding, setSavingBinding] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [firstAccessCredentials, setFirstAccessCredentials] = useState(null);

  async function load() {
    setLoading(true);

    try {
      const [userList, schoolList, typeList] = await Promise.all([
        api.listUsers(token),
        api.listSchools(token),
        api.listUserTypes(token),
      ]);
      const visibleTypes = typeList.filter(
        (type) => educationEmployeeProfiles.includes(type.nome),
      );
      const uniqueTypes = [
        ...new Map(
          visibleTypes.map((type) => [type.nome, type]),
        ).values(),
      ];

      setUsers(userList);
      setSchools(schoolList);
      setTypes(uniqueTypes);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  const selectedType = types.find(
    (type) => String(type.id) === String(form.tipoUsuarioId),
  );

  function change(event) {
    const { name, value } = event.target;
    setError('');
    setMessage('');
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'tipoUsuarioId' ? { escolaIds: [] } : {}),
    }));
  }

  async function create(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!isValidCpf(form.cpf)) {
      setError('CPF inválido. Confira os onze números informados.');
      return;
    }

    if (form.email.trim() && !isValidEmail(form.email)) {
      setError('E-mail inválido. Informe um endereço completo.');
      return;
    }

    if (form.escolaIds.length === 0) {
      setError('Selecione ao menos uma unidade escolar.');
      return;
    }

    try {
      const result = await api.createUser({
        ...form,
        tipoUsuarioId: Number(form.tipoUsuarioId),
        escolaId: form.escolaIds[0] || null,
        escolaIds: form.escolaIds,
      }, token);

      setMessage(
        'Cadastro efetuado com sucesso. Guarde as credenciais de primeiro acesso abaixo.',
      );
      setFirstAccessCredentials({
        nome: result.user.nome,
        usuario: result.user.usuario,
        senhaTemporaria: result.senhaTemporaria,
      });
      setForm(emptyForm);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function startBindingEdit(item) {
    setError('');
    setMessage('');
    setEditingBinding({
      id: item.id,
      nome: item.nome,
      perfil: item.perfil,
      escolaIds: (item.escolas || []).map((school) => school.id),
    });
  }

  async function saveBindings() {
    if (!editingBinding) return;

    setSavingBinding(true);
    setError('');
    setMessage('');

    try {
      await api.updateUserSchools(
        editingBinding.id,
        editingBinding.escolaIds,
        token,
      );
      setMessage('Vínculos escolares atualizados com sucesso.');
      setEditingBinding(null);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingBinding(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Excluir este cadastro do banco municipal?')) {
      return;
    }

    setError('');
    setMessage('');

    try {
      await api.deleteUser(id, token);
      setMessage('Usuário excluído com sucesso.');
      if (editingBinding?.id === id) setEditingBinding(null);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="app-page user-management-page">
      <header className="user-management-header">
        <strong>SIEDU-PINDOBAÇU · Portal do Gestor</strong>
        <nav>
          <Link to="/gestor">Painel</Link>
          <Link to="/gestor/escolas">Escolas</Link>
          <button type="button" onClick={onLogout}>Sair</button>
        </nav>
      </header>

      <section className="hero">
        <span className="eyebrow">ACESSO RESTRITO</span>
        <h1>Usuários, perfis e escolas</h1>
        <p>
          Cadastre usuários e gerencie as unidades escolares vinculadas.
        </p>
      </section>

      {(error || message) && (
        <section className="user-feedback" aria-live="polite">
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
        </section>
      )}

      {firstAccessCredentials && (
        <section className="first-access-card" aria-live="polite">
          <div>
            <span>CREDENCIAIS DE PRIMEIRO ACESSO</span>
            <h2>{firstAccessCredentials.nome}</h2>
            <p>
              Anote estas informações agora. A senha deverá ser trocada quando
              o usuário entrar pela primeira vez.
            </p>
          </div>
          <dl>
            <div>
              <dt>Usuário</dt>
              <dd>{firstAccessCredentials.usuario}</dd>
            </div>
            <div>
              <dt>Senha temporária</dt>
              <dd>{firstAccessCredentials.senhaTemporaria}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => setFirstAccessCredentials(null)}
          >
            Já anotei, fechar
          </button>
        </section>
      )}

      <section className="user-management-grid">
        <form className="panel user-create-panel" onSubmit={create}>
          <h2>Cadastrar funcionário</h2>

          <label>
            Nome completo
            <input name="nome" value={form.nome} onChange={change} required />
          </label>

          <label>
            CPF
            <input
              name="cpf"
              value={form.cpf}
              onChange={change}
              required
              placeholder="000.000.000-00"
              maxLength="14"
            />
          </label>

          <label>
            E-mail (opcional)
            <input
              name="email"
              value={form.email}
              onChange={change}
              type="email"
            />
          </label>

          <label>
            Perfil
            <select
              name="tipoUsuarioId"
              value={form.tipoUsuarioId}
              onChange={change}
              required
            >
              <option value="">Selecione</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.nome}
                </option>
              ))}
            </select>
          </label>

          {selectedType && (
            <SchoolBindingSelector
              schools={schools}
              profile={selectedType.nome}
              selectedIds={form.escolaIds}
              onChange={(escolaIds) => setForm((current) => ({
                ...current,
                escolaIds,
              }))}
            />
          )}

          <div className="form-actions">
            <button type="submit">Criar usuário</button>
            <Link className="form-return" to="/gestor">
              &larr; Voltar ao painel
            </Link>
          </div>

          <small>
            A senha temporária deverá ser alterada no primeiro acesso.
          </small>
        </form>

        <section className="panel user-list-panel">
          <div className="user-list-heading">
            <div>
              <h2>Funcionários cadastrados</h2>
              <p>Perfis profissionais da rede municipal de educação.</p>
            </div>
            <span>{loading ? 'Carregando...' : `${users.length} usuário(s)`}</span>
          </div>

          <div className="user-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Unidades vinculadas</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.nome}</strong>
                      <small>{item.usuario}</small>
                    </td>
                    <td>{item.perfil}</td>
                    <td>
                      <div className="school-tags">
                        {(item.escolas || []).map((school) => (
                          <span key={school.id}>{school.nome}</span>
                        ))}
                        {(!item.escolas || item.escolas.length === 0) && (
                          <em>Sem vínculo escolar</em>
                        )}
                      </div>
                    </td>
                    <td>
                      {item.deve_alterar_senha
                        ? 'Primeiro acesso'
                        : item.ativo
                          ? 'Ativo'
                          : 'Inativo'}
                    </td>
                    <td>
                      <div className="user-row-actions">
                        {managedSchoolProfiles.has(item.perfil) && (
                          <button
                            className="button-secondary"
                            type="button"
                            onClick={() => startBindingEdit(item)}
                          >
                            Gerenciar escolas
                          </button>
                        )}
                        <button
                          className="danger"
                          type="button"
                          onClick={() => remove(item.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editingBinding && (
            <section className="school-binding-editor">
              <div className="school-binding-editor-heading">
                <div>
                  <span>EDITAR VÍNCULOS</span>
                  <h3>{editingBinding.nome}</h3>
                  <p>{editingBinding.perfil}</p>
                </div>
                <button
                  className="binding-close"
                  type="button"
                  onClick={() => setEditingBinding(null)}
                >
                  Fechar
                </button>
              </div>

              <SchoolBindingSelector
                schools={schools}
                profile={editingBinding.perfil}
                selectedIds={editingBinding.escolaIds}
                allowEmpty
                onChange={(escolaIds) => setEditingBinding((current) => ({
                  ...current,
                  escolaIds,
                }))}
              />

              <div className="binding-actions">
                <button
                  type="button"
                  disabled={savingBinding}
                  onClick={saveBindings}
                >
                  {savingBinding ? 'Salvando...' : 'Salvar vínculos'}
                </button>
                <button
                  className="button-secondary"
                  type="button"
                  disabled={savingBinding}
                  onClick={() => setEditingBinding(null)}
                >
                  Cancelar
                </button>
              </div>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}
