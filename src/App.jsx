import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { api } from './services/api';
import GestorDashboard from './GestorDashboard';
import SuperintendenciaDashboard from './SuperintendenciaDashboard';
import {
  DetalhesEscolaGestor,
  ListaEscolasGestor,
} from './GestorEscolas';
import { DocumentosEscolares, Frequencia, HistoricoEscolar } from './DiretorFerramentas';
import FinanceiroEscolar from './FinanceiroEscolar';
import SairDoSistema from './SairDoSistema';
import DiretorDashboard from './DiretorDashboard';
import CadastroDiretor from './CadastrosDiretor';
import TransporteEscolar from './TransporteEscolar';
import RecuperarSenha from './RecuperarSenha';
import AuditoriaSistema from './AuditoriaSistema';
import Usuarios from './UsuariosGestao';
import { passwordValidation } from './validation';
import {
  ConsultaTurmas,
  DetalhesAluno,
  DetalhesTurma,
} from './DiretorTurmas';

function Layout({ children, onLogout, variant = 'gestor' }) {
  const isDirectorPortal = variant === 'diretor';

  return (
    <main className="app-page">
      <header>
        <strong>
          SIEDU-PINDOBAÇU &middot; {isDirectorPortal ? 'Portal do Diretor' : 'Portal do Gestor'}
        </strong>
        <nav>
          <Link to={isDirectorPortal ? '/diretor' : '/gestor'}>Painel</Link>
          {isDirectorPortal ? (
            <>
              <a href="#pedagogica">Gest&atilde;o pedag&oacute;gica</a>
              <a href="#administrativa">Administra&ccedil;&atilde;o</a>
            </>
          ) : (
            <>
              <Link to="/usuarios">Usu&aacute;rios e perfis</Link>
              <Link to="/gestor/escolas">Escolas</Link>
              <Link to="/transportes">Transportes</Link>
            </>
          )}
          <button className="link-button" onClick={onLogout}>
            Sair
          </button>
        </nav>
      </header>
      {children}
    </main>
  );
}
function Login({ onLogin }) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lembrar, setLembrar] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function entrar(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await api.login(usuario, senha);
      onLogin(result, lembrar);
      navigate(result.user.deveAlterarSenha ? '/alterar-senha' : destinationFor(result.user));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="prefeitura-highlight">
          <img
            src="/images/prefeitura.png"
            alt="Prefeitura Municipal de Pindoba&ccedil;u"
          />
          <span>
            Prefeitura Municipal de Pindoba&ccedil;u
            <small>Secretaria Municipal de Educa&ccedil;&atilde;o</small>
          </span>
        </div>

        <div className="brand-top">
          <img src="/images/sigepin.png" alt="SIEDU-PINDOBAÇU" className="system-logo" />
          <div>
            <h1>SIEDU-PINDOBAÇU</h1>
            <p>
              Sistema Integrado de Educa&ccedil;&atilde;o
              <br />
              de Pindoba&ccedil;u - BA
            </p>
          </div>
        </div>

        <div className="brand-message">
          <h2>
            Educa&ccedil;&atilde;o hoje,
            <br />
            oportunidades <span>amanh&atilde;,</span>
            <br />
            um futuro melhor para todos.
          </h2>
          <i />
          <p>
            O SIEDU-PINDOBAÇU integra escolas, alunos, professores, gestores e comunidade
            em uma plataforma moderna, segura e eficiente.
          </p>
        </div>

        <div className="benefits">
          <p>
            <b aria-hidden="true">&#9679;</b>
            <span>
              <strong>Gest&atilde;o integrada</strong>
              Todos os processos escolares em um &uacute;nico sistema.
            </span>
          </p>
          <p>
            <b aria-hidden="true">&#9670;</b>
            <span>
              <strong>Informa&ccedil;&otilde;es seguras</strong>
              Seus dados protegidos com tecnologia de ponta.
            </span>
          </p>
          <p>
            <b aria-hidden="true">&#8599;</b>
            <span>
              <strong>Acesso f&aacute;cil e r&aacute;pido</strong>
              Interface intuitiva para facilitar sua rotina.
            </span>
          </p>
        </div>

        <div className="city-brand">
          <img
            src="/images/prefeitura.png"
            alt="Prefeitura Municipal de Pindoba&ccedil;u"
          />
          <span>
            Prefeitura Municipal de Pindoba&ccedil;u
            <br />
            Secretaria Municipal de Educa&ccedil;&atilde;o
          </span>
        </div>
      </section>

      <section className="login-form-area">
        <form className="login-card" onSubmit={entrar}>
          <div className="login-icon">
            <img src="/images/sigepin.png" alt="" />
          </div>
          <h2>Acesse sua conta</h2>
          <p>Digite seu usu&aacute;rio e senha para entrar no sistema</p>

          <label>
            Usu&aacute;rio ou e-mail
            <input
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
              required
              placeholder="Digite seu usu&aacute;rio ou e-mail"
            />
          </label>

          <label>
            Senha
            <div className="password-input-wrapper">
              <input
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                required
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                className="password-visibility-button"
                onClick={() => setMostrarSenha((valorAtual) => !valorAtual)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={mostrarSenha}
                title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <span aria-hidden="true">{mostrarSenha ? '🙈' : '👁'}</span>
              </button>
            </div>
          </label>

          <div className="login-options">
            <label>
              <input
                type="checkbox"
                checked={lembrar}
                onChange={(event) => setLembrar(event.target.checked)}
              />
              Lembrar-me
            </label>
            <Link to="/recuperar-senha">Esqueci minha senha</Link>
          </div>

          {error && <p className="error">{error}</p>}

          <button disabled={loading}>
            {loading ? 'Entrando...' : <> &#128274; Entrar no Sistema</>}
          </button>

          <div className="login-divider">ou acesse com</div>
          <div className="social-buttons">
            <button type="button">Google</button>
            <button type="button">Microsoft</button>
          </div>
        </form>

        <footer>
          &copy; Olhos de &Aacute;guia Desenvolvimento &middot; Vers&atilde;o do app 0.0.1 &middot; Todos os direitos reservados
        </footer>
      </section>
    </main>
  );
}
function Gestor({ user, onLogout, token }) {
  return isSuperintendent(user)
    ? <SuperintendenciaDashboard user={user} onLogout={onLogout} token={token} />
    : <GestorDashboard user={user} onLogout={onLogout} token={token} />;
}
function Diretor({ user, onLogout, token }) {
  return (
    <DiretorDashboard
      user={user}
      onLogout={onLogout}
      token={token}
    />
  );
}

function Transportes({ token, onLogout }) {
  const [data, setData] = useState({ vehicles: [], drivers: [], attendants: [], routes: [] });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [vehicle, setVehicle] = useState({ prefixo: '', tipo: '', placa: '', marcaModelo: '', anoFabricacao: '', situacaoPropriedade: 'Prefeitura', estado: 'Em operacao', ultimaManutencao: '', itensManutencao: '' });
  const [driver, setDriver] = useState({ nome: '', cnh: '', telefone: '' });
  const [attendant, setAttendant] = useState({ nome: '', telefone: '' });
  const [route, setRoute] = useState({ nome: '', turno: 'Matutino', veiculoId: '', motoristaId: '', acompanhanteId: '' });

  async function load() {
    try { setData(await api.listTransport(token)); } catch (requestError) { setError(requestError.message); }
  }

  useEffect(() => { load(); }, []);

  async function save(event, action, values, reset) {
    event.preventDefault();
    try {
      await action(values, token);
      setMessage('Cadastro realizado com sucesso.');
      reset();
      load();
    } catch (requestError) { setError(requestError.message); }
  }

  return (
    <Layout onLogout={onLogout}>
      <section className="hero">
        <span className="eyebrow">GEST&Atilde;O ADMINISTRATIVA</span>
        <h1>Transporte escolar e rotas</h1>
        <p>Cadastro exclusivo da Secretaria de Educa&ccedil;&atilde;o e Gest&atilde;o Municipal.</p>
      </section>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <section className="transport-forms">
        <form className="panel" onSubmit={(event) => save(event, api.createVehicle, vehicle, () => setVehicle({ prefixo: '', tipo: '', placa: '', marcaModelo: '', anoFabricacao: '', situacaoPropriedade: 'Prefeitura', estado: 'Em operacao', ultimaManutencao: '', itensManutencao: '' }))}>
          <h2>Ve&iacute;culo</h2>
          <label>Prefixo<input value={vehicle.prefixo} onChange={(event) => setVehicle({ ...vehicle, prefixo: event.target.value })} required /></label>
          <label>Tipo<input value={vehicle.tipo} onChange={(event) => setVehicle({ ...vehicle, tipo: event.target.value })} placeholder="Onibus, van ou micro-onibus" required /></label>
          <label>Placa<input value={vehicle.placa} onChange={(event) => setVehicle({ ...vehicle, placa: event.target.value })} /></label>
          <label>Modelo<input value={vehicle.marcaModelo} onChange={(event) => setVehicle({ ...vehicle, marcaModelo: event.target.value })} required /></label>
          <label>Ano<input type="number" min="1950" value={vehicle.anoFabricacao} onChange={(event) => setVehicle({ ...vehicle, anoFabricacao: event.target.value ? Number(event.target.value) : null })} required /></label>
          <label>Propriedade<select value={vehicle.situacaoPropriedade} onChange={(event) => setVehicle({ ...vehicle, situacaoPropriedade: event.target.value })}><option value="Prefeitura">Pertence a Prefeitura</option><option value="Locado">Locado</option></select></label>
          <label>Estado<select value={vehicle.estado} onChange={(event) => setVehicle({ ...vehicle, estado: event.target.value })}><option>Em operacao</option><option>Em manutencao</option></select></label>
          <label>Ultima manutencao<input type="date" value={vehicle.ultimaManutencao} onChange={(event) => setVehicle({ ...vehicle, ultimaManutencao: event.target.value })} /></label>
          <label>Itens da manutencao<input value={vehicle.itensManutencao} onChange={(event) => setVehicle({ ...vehicle, itensManutencao: event.target.value })} /></label>
          <div className="form-actions"><button>Cadastrar ve&iacute;culo</button><Link className="form-return" to="/gestor">&larr; Voltar ao painel</Link></div>
        </form>
        <form className="panel" onSubmit={(event) => save(event, api.createDriver, driver, () => setDriver({ nome: '', cnh: '', telefone: '' }))}>
          <h2>Motorista</h2>
          <label>Nome<input value={driver.nome} onChange={(event) => setDriver({ ...driver, nome: event.target.value })} required /></label>
          <label>CNH<input value={driver.cnh} onChange={(event) => setDriver({ ...driver, cnh: event.target.value })} required /></label>
          <label>Telefone<input value={driver.telefone} onChange={(event) => setDriver({ ...driver, telefone: event.target.value })} /></label>
          <div className="form-actions"><button>Cadastrar motorista</button><Link className="form-return" to="/gestor">&larr; Voltar ao painel</Link></div>
        </form>
        <form className="panel" onSubmit={(event) => save(event, api.createAttendant, attendant, () => setAttendant({ nome: '', telefone: '' }))}>
          <h2>Acompanhante</h2>
          <label>Nome<input value={attendant.nome} onChange={(event) => setAttendant({ ...attendant, nome: event.target.value })} required /></label>
          <label>Telefone<input value={attendant.telefone} onChange={(event) => setAttendant({ ...attendant, telefone: event.target.value })} /></label>
          <div className="form-actions"><button>Cadastrar acompanhante</button><Link className="form-return" to="/gestor">&larr; Voltar ao painel</Link></div>
        </form>
        <form className="panel" onSubmit={(event) => save(event, api.createRoute, { ...route, veiculoId: Number(route.veiculoId), motoristaId: Number(route.motoristaId), acompanhanteId: route.acompanhanteId ? Number(route.acompanhanteId) : null }, () => setRoute({ nome: '', turno: 'Matutino', veiculoId: '', motoristaId: '', acompanhanteId: '' }))}>
          <h2>Rota</h2>
          <label>Nome da rota<input value={route.nome} onChange={(event) => setRoute({ ...route, nome: event.target.value })} required /></label>
          <label>Turno<select value={route.turno} onChange={(event) => setRoute({ ...route, turno: event.target.value })}><option>Matutino</option><option>Vespertino</option><option>Noturno</option></select></label>
          <label>Veiculo<select value={route.veiculoId} onChange={(event) => setRoute({ ...route, veiculoId: event.target.value })} required><option value="">Selecione</option>{data.vehicles.map((item) => <option key={item.id} value={item.id}>{item.prefixo}</option>)}</select></label>
          <label>Motorista<select value={route.motoristaId} onChange={(event) => setRoute({ ...route, motoristaId: event.target.value })} required><option value="">Selecione</option>{data.drivers.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
          <label>Acompanhante<select value={route.acompanhanteId} onChange={(event) => setRoute({ ...route, acompanhanteId: event.target.value })}><option value="">Sem acompanhante</option>{data.attendants.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
          <div className="form-actions"><button>Cadastrar rota</button><Link className="form-return" to="/gestor">&larr; Voltar ao painel</Link></div>
        </form>
      </section>
      <section className="panel transport-list"><h2>Rotas cadastradas</h2><table><thead><tr><th>Rota</th><th>Turno</th><th>Veiculo</th><th>Motorista</th><th>Acompanhante</th></tr></thead><tbody>{data.routes.map((item) => <tr key={item.id}><td>{item.nome}</td><td>{item.turno}</td><td>{item.veiculo}</td><td>{item.motorista}</td><td>{item.acompanhante || '-'}</td></tr>)}</tbody></table></section>
    </Layout>
  );
}
function Escolas({ token, onLogout }) {
  const [schools, setSchools] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    nome: '',
    codigoRede: '',
    categoria: 'Escola Municipal',
    localidade: '',
    inep: '',
    telefone: '',
    endereco: '',
    diretorUsuarioId: '',
  });

  async function load() {
    try {
      const [schoolList, directorList] = await Promise.all([
        api.listSchools(token),
        api.listDirectors(token),
      ]);
      setSchools(schoolList);
      setDirectors(directorList);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function create(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const school = await api.createSchool(
        {
          ...form,
          diretorUsuarioId: form.diretorUsuarioId ? Number(form.diretorUsuarioId) : null,
        },
        token,
      );
      setMessage(`Escola cadastrada: ${school.nome}`);
      setForm({
        nome: '',
        codigoRede: '',
        categoria: 'Escola Municipal',
        localidade: '',
        inep: '',
        telefone: '',
        endereco: '',
        diretorUsuarioId: form.diretorUsuarioId,
      });
      load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <Layout onLogout={onLogout}>
      <section className="hero">
        <span className="eyebrow">GEST&Atilde;O ADMINISTRATIVA</span>
        <h1>Cadastro de escolas</h1>
        <p>
          Organize as unidades da rede municipal e vincule cada escola &agrave;
          Secretaria de Educa&ccedil;&atilde;o.
        </p>
      </section>

      <section className="two-columns schools-layout">
        <form className="panel" onSubmit={create}>
          <h2>Nova escola</h2>
          <label>
            Nome da escola
            <input name="nome" value={form.nome} onChange={change} required />
          </label>
          <label>
            C&oacute;digo da rede municipal
            <input
              name="codigoRede"
              value={form.codigoRede}
              onChange={change}
              placeholder="Ex.: 37"
            />
          </label>
          <label>
            Categoria
            <select name="categoria" value={form.categoria} onChange={change}>
              <option>Creche</option>
              <option>Centro de Educa&ccedil;&atilde;o Infantil</option>
              <option>Escola Municipal</option>
              <option>Col&eacute;gio Municipal</option>
              <option>Centro de Atividades Educacionais</option>
            </select>
          </label>
          <label>
            Localidade
            <input
              name="localidade"
              value={form.localidade}
              onChange={change}
              placeholder="Sede, distrito ou comunidade"
            />
          </label>
          <label>
            C&oacute;digo INEP
            <input name="inep" value={form.inep} onChange={change} />
          </label>
          <label>
            Telefone
            <input name="telefone" value={form.telefone} onChange={change} />
          </label>
          <label>
            Endere&ccedil;o
            <input name="endereco" value={form.endereco} onChange={change} />
          </label>
          <label>
            Diretor da escola
            <select name="diretorUsuarioId" value={form.diretorUsuarioId} onChange={change}>
              <option value="">Vincular posteriormente</option>
              {directors.map((director) => (
                <option key={director.id} value={director.id}>
                  {director.nome} ({director.usuario})
                </option>
              ))}
            </select>
          </label>
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
          <div className="form-actions"><button type="submit">Cadastrar escola</button><Link className="form-return" to="/gestor/escolas">&larr; Voltar para escolas</Link></div>
        </form>

        <section className="panel">
          <h2>Unidades cadastradas ({schools.length})</h2>
          <table>
            <thead>
              <tr>
                <th>C&oacute;digo</th>
                <th>Unidade escolar</th>
                <th>Categoria</th>
                <th>Localidade</th>
                <th>INEP</th>
                <th>Diretor</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr key={school.id}>
                  <td><strong>{school.codigo_rede || '-'}</strong></td>
                  <td><strong>{school.nome}</strong></td>
                  <td>{school.categoria || '-'}</td>
                  <td>{school.localidade || '-'}</td>
                  <td>{school.inep || '-'}</td>
                  <td>{school.diretor || 'N&atilde;o vinculado'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>
    </Layout>
  );
}
function AlterarSenha({ token, user, onComplete }) {
  const navigate = useNavigate();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    const validationError = passwordValidation(novaSenha);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await api.changePassword(senhaAtual, novaSenha, token);
      onComplete();
      navigate(destinationFor(user));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="login">
      <form onSubmit={submit}>
        <span className="eyebrow">PRIMEIRO ACESSO</span>
        <div className="password-form-header"><h1>Crie sua nova senha</h1><SairDoSistema /></div>
        <p>
          Por seguran&ccedil;a, altere a senha tempor&aacute;ria antes de continuar.
        </p>
        <label>
          Senha tempor&aacute;ria
          <input
            type="password"
            value={senhaAtual}
            onChange={(event) => setSenhaAtual(event.target.value)}
            required
          />
        </label>
        <label>
          Nova senha
          <input
            type="password"
            minLength="8"
            value={novaSenha}
            onChange={(event) => setNovaSenha(event.target.value)}
            required
          />
        </label>
        <small>
          Use pelo menos 8 caracteres, com letra maiúscula, minúscula e número.
        </small>
        {error && <p className="error">{error}</p>}
        <div className="form-actions"><button>Salvar nova senha</button><Link className="form-return" to="/gestor">&larr; Voltar ao painel</Link></div>
      </form>
    </main>
  );
}
function Protected({ token, children }) { return token ? children : <Navigate to="/login" replace />; }
function readStoredSession(storage) {
  try {
    return JSON.parse(storage.getItem('sigepin_session') || 'null');
  } catch {
    storage.removeItem('sigepin_session');
    return null;
  }
}

function readSession() {
  return readStoredSession(sessionStorage) || readStoredSession(localStorage);
}

const schoolPortalProfiles = new Set([
  'Diretor',
  'Vice-Diretor',
  'Coordenador Pedagógico',
  'Secretário Escolar',
  'Auxiliar/Assistente Administrativo',
  'Professor',
  'Auxiliar de Vida Escolar / Cuidador'
]);

function isDirector(user) {
  return schoolPortalProfiles.has(user?.perfil);
}

function isSuperintendent(user) {
  return user?.perfil === 'Superintendente / Diretor de Ensino';
}

function destinationFor(user) {
  if (isDirector(user)) return '/diretor';
  if (isSuperintendent(user)) return '/superintendencia';
  return '/gestor';
}

export default function App() {
  const [session, setSession] = useState(readSession);

  function login(data, lembrar) {
    setSession(data);
    localStorage.removeItem('sigepin_session');
    sessionStorage.removeItem('sigepin_session');
    const storage = lembrar ? localStorage : sessionStorage;
    storage.setItem('sigepin_session', JSON.stringify(data));
  }

  function logout() {
    if (!window.confirm('Tem certeza que quer sair do sistema?')) {
      return;
    }
    setSession(null);
    localStorage.removeItem('sigepin_session');
    sessionStorage.removeItem('sigepin_session');
  }

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={login} />} />
      <Route path="/recuperar-senha" element={<RecuperarSenha />} />

      <Route
        path="/superintendencia"
        element={
          <Protected token={session?.token}>
            {isSuperintendent(session?.user) ? <SuperintendenciaDashboard user={session?.user} onLogout={logout} token={session?.token} /> : <Navigate to={destinationFor(session?.user)} replace />}
          </Protected>
        }
      />

      <Route
        path="/gestor"
        element={
          <Protected token={session?.token}>
            {isDirector(session?.user) ? (
              <Navigate to="/diretor" replace />
            ) : (
              <Gestor
                user={session?.user}
                onLogout={logout}
                token={session?.token}
              />
            )}
          </Protected>
        }
      />

      <Route
        path="/diretor"
        element={
          <Protected token={session?.token}>
            <Diretor
              user={session?.user}
              onLogout={logout}
              token={session?.token}
            />
          </Protected>
        }
      />

      <Route
        path="/transportes"
        element={
          <Protected token={session?.token}>
            {isDirector(session?.user) ? (
              <Navigate to="/diretor" replace />
            ) : (
              <TransporteEscolar
                token={session?.token}
                user={session?.user}
                onLogout={logout}
              />
            )}
          </Protected>
        }
      />

      <Route
        path="/escolas"
        element={
          <Protected token={session?.token}>
            {isDirector(session?.user) ? (
              <Navigate to="/diretor" replace />
            ) : (
              <Navigate to="/gestor/escolas" replace />
            )}
          </Protected>
        }
      />

      <Route
        path="/escolas/cadastrar"
        element={
          <Protected token={session?.token}>
            {isDirector(session?.user) ? (
              <Navigate to="/diretor" replace />
            ) : (
              <Escolas token={session?.token} onLogout={logout} />
            )}
          </Protected>
        }
      />

      <Route
        path="/gestor/escolas"
        element={
          <Protected token={session?.token}>
            {isDirector(session?.user) ? (
              <Navigate to="/diretor" replace />
            ) : (
              <ListaEscolasGestor
                token={session?.token}
                user={session?.user}
                onLogout={logout}
              />
            )}
          </Protected>
        }
      />

      <Route
        path="/gestor/escolas/:escolaId"
        element={
          <Protected token={session?.token}>
            {isDirector(session?.user) ? (
              <Navigate to="/diretor" replace />
            ) : (
              <DetalhesEscolaGestor
                token={session?.token}
                user={session?.user}
                onLogout={logout}
              />
            )}
          </Protected>
        }
      />

      <Route
        path="/usuarios"
        element={
          <Protected token={session?.token}>
            {isDirector(session?.user) || isSuperintendent(session?.user) ? (
              <Navigate to={isSuperintendent(session?.user) ? "/superintendencia" : "/diretor"} replace />
            ) : (
              <Usuarios
                token={session?.token}
                onLogout={logout}
              />
            )}
          </Protected>
        }
      />

      <Route
        path="/gestor/financeiro"
        element={
          <Protected token={session?.token}>
            {isDirector(session?.user) ? (
              <Navigate to="/diretor/financeiro" replace />
            ) : (
              <FinanceiroEscolar
                token={session?.token}
                user={session?.user}
                onLogout={logout}
                portal="gestor"
              />
            )}
          </Protected>
        }
      />

      <Route
        path="/gestor/auditoria"
        element={
          <Protected token={session?.token}>
            {isDirector(session?.user) ? (
              <Navigate to="/diretor" replace />
            ) : (
              <AuditoriaSistema
                token={session?.token}
                user={session?.user}
                onLogout={logout}
              />
            )}
          </Protected>
        }
      />

      <Route
        path="/diretor/financeiro"
        element={
          <Protected token={session?.token}>
            <FinanceiroEscolar
              token={session?.token}
              user={session?.user}
              onLogout={logout}
              portal="diretor"
            />
          </Protected>
        }
      />

      <Route
        path="/diretor/cadastrar-professor"
        element={
          <Protected token={session?.token}>
            <CadastroDiretor
              type="professor"
              token={session?.token}
              onLogout={logout}
            />
          </Protected>
        }
      />
      <Route
        path="/diretor/cadastrar-turma"
        element={
          <Protected token={session?.token}>
            <CadastroDiretor
              type="turma"
              token={session?.token}
              onLogout={logout}
            />
          </Protected>
        }
      />
      <Route
        path="/diretor/cadastrar-secretario"
        element={
          <Protected token={session?.token}>
            <CadastroDiretor
              type="secretario"
              token={session?.token}
              onLogout={logout}
            />
          </Protected>
        }
      />
      <Route
        path="/diretor/matricular-aluno"
        element={
          <Protected token={session?.token}>
            <CadastroDiretor
              type="matricula"
              token={session?.token}
              onLogout={logout}
            />
          </Protected>
        }
      />
      <Route
        path="/diretor/imprimir-documentos"
        element={
          <Protected token={session?.token}>
            <CadastroDiretor
              type="documentos"
              token={session?.token}
              onLogout={logout}
            />
          </Protected>
        }
      />

      <Route
        path="/diretor/turmas"
        element={
          <Protected token={session?.token}>
            <ConsultaTurmas
              user={session?.user}
              onLogout={logout}
              token={session?.token}
            />
          </Protected>
        }
      />
      <Route
        path="/diretor/turmas/:turmaId"
        element={
          <Protected token={session?.token}>
            <DetalhesTurma
              user={session?.user}
              onLogout={logout}
              token={session?.token}
            />
          </Protected>
        }
      />
      <Route
        path="/diretor/turmas/:turmaId/alunos/:alunoId"
        element={
          <Protected token={session?.token}>
            <DetalhesAluno
              user={session?.user}
              onLogout={logout}
              token={session?.token}
            />
          </Protected>
        }
      />

      <Route path="/diretor/frequencia" element={<Protected token={session?.token}><Frequencia /></Protected>} />
      <Route path="/diretor/historicos" element={<Protected token={session?.token}><HistoricoEscolar /></Protected>} />
      <Route path="/diretor/documentos" element={<Protected token={session?.token}><DocumentosEscolares /></Protected>} />

      <Route
        path="/alterar-senha"
        element={
          <Protected token={session?.token}>
            <AlterarSenha
              token={session?.token}
              user={session?.user}
              onComplete={() => login({
                ...session,
                user: { ...session.user, deveAlterarSenha: false },
              })}
            />
          </Protected>
        }
      />

      <Route path="*" element={<Navigate to={destinationFor(session?.user)} replace />} />
    </Routes>
  );
}
