import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './services/api';
import './transporte-escolar.css';
import { isValidCpf } from './validation';

const emptyData = {
  vehicles: [],
  drivers: [],
  attendants: [],
  routes: [],
  students: [],
  maintenance: [],
  schools: [],
};

const emptyRoute = {
  nome: '',
  descricao: '',
  turno: 'Matutino',
  distanciaKm: '',
  origem: '',
  destino: '',
  horarioSaida: '',
  horarioChegada: '',
  diasSemana: 'Segunda a sexta-feira',
  pontosTexto: '',
  veiculoId: '',
  motoristaId: '',
  acompanhanteId: '',
};

const emptyStudent = {
  rotaId: '',
  escolaId: '',
  matricula: '',
  nome: '',
  turma: '',
  responsavel: '',
  contatoResponsavel: '',
  pontoEmbarque: '',
  pontoDesembarque: '',
};

const emptyVehicle = {
  prefixo: '',
  tipo: '',
  placa: '',
  marcaModelo: '',
  anoFabricacao: '',
  capacidade: '',
  situacaoPropriedade: 'Prefeitura',
  estado: 'Em operacao',
  fotoUrl: '',
  quilometragem: '',
  ultimaManutencao: '',
  proximaManutencao: '',
  itensManutencao: '',
};

const emptyMaintenance = {
  veiculoId: '',
  tipo: 'Preventiva',
  descricao: '',
  itensServicos: '',
  fornecedor: '',
  dataManutencao: '',
  quilometragem: '',
  valor: '',
  numeroNotaFiscal: '',
  comprovanteArquivo: '',
  proximaManutencao: '',
  status: 'Agendada',
};

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function date(value) {
  if (!value) return 'Não informada';
  return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR');
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('O comprovante deve ter no máximo 5 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Não foi possível ler o comprovante.'));
    reader.readAsDataURL(file);
  });
}

function Field({ label, wide = false, children }) {
  return <label className={wide ? 'wide' : ''}>{label}{children}</label>;
}

function RouteMap({ route }) {
  if (!route) {
    return <div className="transport-map-empty">Cadastre ou selecione uma rota para visualizar o itinerário.</div>;
  }

  const stops = Array.isArray(route.pontos_parada) ? route.pontos_parada : [];
  const points = [route.origem, ...stops, route.destino].filter(Boolean);
  const width = 760;
  const coordinates = points.map((_, index) => {
    const interval = points.length > 1 ? (width - 120) / (points.length - 1) : 0;
    return [60 + interval * index, index % 2 === 0 ? 90 : 145];
  });

  return (
    <div className="route-map">
      <div className="route-map-heading">
        <div><strong>{route.nome}</strong><span>{route.dias_semana || 'Dias não informados'} · {route.turno}</span></div>
        <b>{route.distancia_km ? `${route.distancia_km} km` : 'Distância não informada'}</b>
      </div>
      <svg viewBox="0 0 760 230" role="img" aria-label={`Itinerário da rota ${route.nome}`}>
        <defs>
          <linearGradient id="route-line" x1="0" x2="1">
            <stop offset="0" stopColor="#0a70f5" />
            <stop offset="1" stopColor="#0c8a72" />
          </linearGradient>
        </defs>
        {coordinates.length > 1 && (
          <polyline
            points={coordinates.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke="url(#route-line)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {coordinates.map(([x, y], index) => (
          <g key={`${points[index]}-${index}`}>
            <circle cx={x} cy={y} r="15" fill={index === 0 ? '#0a70f5' : index === points.length - 1 ? '#0c8a72' : '#ffffff'} stroke={index === points.length - 1 ? '#0c8a72' : '#0a70f5'} strokeWidth="5" />
            <text x={x} y={y + 4} textAnchor="middle" fill={index === 0 || index === points.length - 1 ? '#ffffff' : '#0a70f5'} fontSize="11" fontWeight="800">{index + 1}</text>
            <text x={x} y={index % 2 === 0 ? y + 40 : y - 30} textAnchor="middle" fill="#153b70" fontSize="11">{points[index].length > 18 ? `${points[index].slice(0, 18)}…` : points[index]}</text>
          </g>
        ))}
      </svg>
      <ol className="route-itinerary-list">
        {points.map((point, index) => <li key={`${point}-${index}`}><b>{index === 0 ? 'Origem' : index === points.length - 1 ? 'Destino' : `Parada ${index}`}</b><span>{point}</span></li>)}
      </ol>
    </div>
  );
}

export default function TransporteEscolar({ token, user, onLogout }) {
  const [tab, setTab] = useState('rotas');
  const [data, setData] = useState(emptyData);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [route, setRoute] = useState(emptyRoute);
  const [student, setStudent] = useState(emptyStudent);
  const [vehicle, setVehicle] = useState(emptyVehicle);
  const [driver, setDriver] = useState({ nome: '', cpf: '', cnh: '', telefone: '', validadeCnh: '' });
  const [attendant, setAttendant] = useState({ nome: '', cpf: '', telefone: '' });
  const [maintenance, setMaintenance] = useState(emptyMaintenance);

  async function load() {
    setLoading(true);
    try {
      const payload = await api.listTransport(token);
      setData(payload);
      const firstRoute = payload.routes[0]?.id || '';
      const firstVehicle = payload.vehicles[0]?.id || '';
      setSelectedRouteId((current) => current || firstRoute);
      setStudent((current) => ({ ...current, rotaId: current.rotaId || firstRoute, escolaId: current.escolaId || payload.schools[0]?.id || '' }));
      setRoute((current) => ({ ...current, veiculoId: current.veiculoId || firstVehicle, motoristaId: current.motoristaId || payload.drivers[0]?.id || '' }));
      setMaintenance((current) => ({ ...current, veiculoId: current.veiculoId || firstVehicle }));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  const selectedRoute = data.routes.find((item) => String(item.id) === String(selectedRouteId));
  const selectedRouteStudents = data.students.filter((item) => String(item.rota_id) === String(selectedRouteId));
  const maintenancePending = data.maintenance.filter((item) => ['Agendada', 'Em andamento'].includes(item.status)).length;

  const capacity = useMemo(() => data.vehicles.reduce((total, item) => total + Number(item.capacidade || 0), 0), [data.vehicles]);

  function update(setter) {
    return (event) => setter((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function perform(action, successMessage, reset) {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(successMessage);
      reset?.();
      await load();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setSaving(false);
    }
  }

  function submitRoute(event) {
    event.preventDefault();
    const payload = {
      ...route,
      distanciaKm: route.distanciaKm || null,
      pontosParada: route.pontosTexto.split('\n').map((item) => item.trim()).filter(Boolean),
      veiculoId: Number(route.veiculoId),
      motoristaId: Number(route.motoristaId),
      acompanhanteId: route.acompanhanteId ? Number(route.acompanhanteId) : null,
    };
    delete payload.pontosTexto;
    perform(
      () => api.createRoute(payload, token),
      'Rota e itinerário cadastrados com sucesso.',
      () => setRoute({ ...emptyRoute, veiculoId: data.vehicles[0]?.id || '', motoristaId: data.drivers[0]?.id || '' }),
    );
  }

  function submitStudent(event) {
    event.preventDefault();
    const routeId = student.rotaId;
    const payload = { ...student, escolaId: student.escolaId || null };
    delete payload.rotaId;
    perform(
      () => api.addStudentToRoute(routeId, payload, token),
      'Aluno vinculado à rota com sucesso.',
      () => setStudent({ ...emptyStudent, rotaId: data.routes[0]?.id || '', escolaId: data.schools[0]?.id || '' }),
    );
  }

  function submitVehicle(event) {
    event.preventDefault();
    perform(
      () => api.createVehicle(vehicle, token),
      'Veículo cadastrado com sucesso.',
      () => setVehicle(emptyVehicle),
    );
  }

  function submitDriver(event) {
    event.preventDefault();
    if (driver.cpf && !isValidCpf(driver.cpf)) {
      setError('CPF do motorista inválido.');
      return;
    }
    perform(
      () => api.createDriver(driver, token),
      'Motorista cadastrado com sucesso.',
      () => setDriver({ nome: '', cpf: '', cnh: '', telefone: '', validadeCnh: '' }),
    );
  }

  function submitAttendant(event) {
    event.preventDefault();
    if (attendant.cpf && !isValidCpf(attendant.cpf)) {
      setError('CPF do acompanhante inválido.');
      return;
    }
    perform(
      () => api.createAttendant(attendant, token),
      'Acompanhante cadastrado com sucesso.',
      () => setAttendant({ nome: '', cpf: '', telefone: '' }),
    );
  }

  async function selectMaintenanceReceipt(event) {
    try {
      const comprovanteArquivo = await fileToDataUrl(event.target.files[0]);
      setMaintenance((current) => ({ ...current, comprovanteArquivo }));
    } catch (fileError) {
      setError(fileError.message);
    }
  }

  function submitMaintenance(event) {
    event.preventDefault();
    perform(
      () => api.createVehicleMaintenance(maintenance, token),
      'Manutenção registrada com sucesso.',
      () => setMaintenance({ ...emptyMaintenance, veiculoId: data.vehicles[0]?.id || '' }),
    );
  }

  function changeMaintenanceStatus(id, status) {
    perform(
      () => api.updateMaintenanceStatus(id, status, token),
      'Situação da manutenção atualizada.',
    );
  }

  function toggleRoute(item) { perform(() => api.updateRouteStatus(item.id, !item.ativo, token), `Rota ${item.ativo ? 'desativada' : 'reativada'}.`); }
  function toggleVehicle(item) { perform(() => api.updateVehicle(item.id, { ativo: !item.ativo }, token), `Veículo ${item.ativo ? 'desativado' : 'reativado'}.`); }
  function toggleDriver(item) { perform(() => api.updateDriver(item.id, { ativo: !item.ativo }, token), `Motorista ${item.ativo ? 'desativado' : 'reativado'}.`); }
  function toggleStudent(item) { perform(() => api.updateTransportStudentStatus(item.id, !item.ativo, token), `Vínculo ${item.ativo ? 'desativado' : 'reativado'}.`); }

  if (loading) {
    return <main className="transport-page"><div className="transport-loading">Carregando transporte escolar...</div></main>;
  }

  return (
    <main className="transport-page">
      <header className="transport-header">
        <div><span>GESTÃO ADMINISTRATIVA</span><h1>Transporte escolar e rotas</h1><p>Planejamento de itinerários, alunos transportados e manutenção da frota municipal.</p></div>
        <div className="transport-header-actions"><Link to="/gestor">← Voltar ao Portal do Gestor</Link><strong>{user?.nome}</strong><button type="button" onClick={onLogout}>Sair</button></div>
      </header>

      <section className="transport-summary">
        <article><span>Veículos ativos</span><strong>{data.vehicles.filter((item) => item.ativo).length}</strong><small>Capacidade total: {capacity} lugares</small></article>
        <article><span>Rotas cadastradas</span><strong>{data.routes.length}</strong><small>Itinerários municipais</small></article>
        <article><span>Alunos transportados</span><strong>{data.students.filter((item) => item.ativo).length}</strong><small>Vínculos ativos</small></article>
        <article className={maintenancePending ? 'transport-alert' : ''}><span>Manutenções pendentes</span><strong>{maintenancePending}</strong><small>Agendadas ou em andamento</small></article>
      </section>

      <nav className="transport-tabs">
        {[
          ['rotas', 'Rotas e mapa'],
          ['alunos', 'Alunos por rota'],
          ['frota', 'Frota'],
          ['equipe', 'Equipe'],
          ['manutencao', 'Manutenção'],
        ].map(([value, label]) => <button key={value} type="button" className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{label}</button>)}
      </nav>

      {error && <p className="transport-feedback error">{error}</p>}
      {message && <p className="transport-feedback success">{message}</p>}

      {tab === 'rotas' && (
        <>
          <section className="transport-map-layout">
            <article className="transport-card route-selector">
              <h2>Itinerários cadastrados</h2>
              {data.routes.length === 0 ? <p className="transport-empty">Nenhuma rota cadastrada.</p> : data.routes.map((item) => <div key={item.id} style={{display:'flex',gap:6}}><button type="button" className={String(item.id) === String(selectedRouteId) ? 'selected' : ''} onClick={() => setSelectedRouteId(item.id)}><strong>{item.nome}</strong><span>{item.origem || 'Origem'} → {item.destino || 'Destino'}</span><small>{item.total_alunos} aluno(s) · {item.veiculo} · {item.ativo?'Ativa':'Inativa'}</small></button><button type="button" onClick={()=>toggleRoute(item)}>{item.ativo?'Pausar':'Ativar'}</button></div>)}
            </article>
            <article className="transport-card"><RouteMap route={selectedRoute} /></article>
          </section>

          <form className="transport-card" onSubmit={submitRoute}>
            <h2>Cadastrar rota e itinerário</h2>
            <div className="transport-fields">
              <Field label="Nome da rota"><input name="nome" value={route.nome} onChange={update(setRoute)} required /></Field>
              <Field label="Turno"><select name="turno" value={route.turno} onChange={update(setRoute)}><option>Matutino</option><option>Vespertino</option><option>Noturno</option></select></Field>
              <Field label="Origem"><input name="origem" value={route.origem} onChange={update(setRoute)} required /></Field>
              <Field label="Destino"><input name="destino" value={route.destino} onChange={update(setRoute)} required /></Field>
              <Field label="Horário de saída"><input type="time" name="horarioSaida" value={route.horarioSaida} onChange={update(setRoute)} /></Field>
              <Field label="Horário de chegada"><input type="time" name="horarioChegada" value={route.horarioChegada} onChange={update(setRoute)} /></Field>
              <Field label="Dias de funcionamento"><input name="diasSemana" value={route.diasSemana} onChange={update(setRoute)} required /></Field>
              <Field label="Distância em km"><input type="number" min="0" step="0.1" name="distanciaKm" value={route.distanciaKm} onChange={update(setRoute)} /></Field>
              <Field label="Veículo"><select name="veiculoId" value={route.veiculoId} onChange={update(setRoute)} required><option value="">Selecione</option>{data.vehicles.map((item) => <option key={item.id} value={item.id}>{item.prefixo} · {item.marca_modelo}</option>)}</select></Field>
              <Field label="Motorista"><select name="motoristaId" value={route.motoristaId} onChange={update(setRoute)} required><option value="">Selecione</option>{data.drivers.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></Field>
              <Field label="Acompanhante"><select name="acompanhanteId" value={route.acompanhanteId} onChange={update(setRoute)}><option value="">Sem acompanhante</option>{data.attendants.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></Field>
              <Field label="Paradas — uma por linha" wide><textarea name="pontosTexto" value={route.pontosTexto} onChange={update(setRoute)} placeholder={'Praça Central\nPovoado de Carnaíba\nEscola Municipal'} /></Field>
              <Field label="Descrição" wide><textarea name="descricao" value={route.descricao} onChange={update(setRoute)} /></Field>
            </div>
            <button disabled={saving || !data.vehicles.length || !data.drivers.length}>Cadastrar rota</button>
          </form>
        </>
      )}

      {tab === 'alunos' && (
        <>
          <form className="transport-card" onSubmit={submitStudent}>
            <h2>Vincular aluno a uma rota</h2>
            <div className="transport-fields">
              <Field label="Rota"><select name="rotaId" value={student.rotaId} onChange={update(setStudent)} required><option value="">Selecione</option>{data.routes.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></Field>
              <Field label="Escola"><select name="escolaId" value={student.escolaId} onChange={update(setStudent)}><option value="">Não informada</option>{data.schools.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></Field>
              <Field label="Matrícula"><input name="matricula" value={student.matricula} onChange={update(setStudent)} required /></Field>
              <Field label="Nome do aluno"><input name="nome" value={student.nome} onChange={update(setStudent)} required /></Field>
              <Field label="Turma"><input name="turma" value={student.turma} onChange={update(setStudent)} /></Field>
              <Field label="Responsável"><input name="responsavel" value={student.responsavel} onChange={update(setStudent)} required /></Field>
              <Field label="Contato do responsável"><input name="contatoResponsavel" value={student.contatoResponsavel} onChange={update(setStudent)} required /></Field>
              <Field label="Ponto de embarque"><input name="pontoEmbarque" value={student.pontoEmbarque} onChange={update(setStudent)} required /></Field>
              <Field label="Ponto de desembarque"><input name="pontoDesembarque" value={student.pontoDesembarque} onChange={update(setStudent)} /></Field>
            </div>
            <button disabled={saving || !data.routes.length}>Vincular aluno</button>
          </form>

          <section className="transport-card">
            <div className="transport-section-heading"><div><h2>Alunos por rota</h2><p>Selecione uma rota para consultar seus passageiros.</p></div><select value={selectedRouteId} onChange={(event) => setSelectedRouteId(event.target.value)}><option value="">Selecione</option>{data.routes.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></div>
            {selectedRouteStudents.length === 0 ? <p className="transport-empty">Nenhum aluno vinculado à rota selecionada.</p> : <div className="transport-table-wrap"><table className="transport-table"><thead><tr><th>Matrícula/aluno</th><th>Escola/turma</th><th>Embarque</th><th>Responsável</th><th>Contato</th><th>Vínculo</th></tr></thead><tbody>{selectedRouteStudents.map((item) => <tr key={item.id}><td><b>{item.nome}</b><small>{item.matricula}</small></td><td>{item.escola || 'Não informada'}<small>{item.turma}</small></td><td>{item.ponto_embarque}</td><td>{item.responsavel}</td><td>{item.contato_responsavel}</td><td><button type="button" onClick={()=>toggleStudent(item)}>{item.ativo?'Desativar':'Reativar'}</button></td></tr>)}</tbody></table></div>}
          </section>
        </>
      )}

      {tab === 'frota' && (
        <>
          <form className="transport-card" onSubmit={submitVehicle}>
            <h2>Cadastrar veículo</h2>
            <div className="transport-fields">
              <Field label="Prefixo"><input name="prefixo" value={vehicle.prefixo} onChange={update(setVehicle)} required /></Field>
              <Field label="Placa"><input name="placa" value={vehicle.placa} onChange={update(setVehicle)} /></Field>
              <Field label="Tipo"><input name="tipo" value={vehicle.tipo} onChange={update(setVehicle)} required placeholder="Ônibus, van ou micro-ônibus" /></Field>
              <Field label="Marca/modelo"><input name="marcaModelo" value={vehicle.marcaModelo} onChange={update(setVehicle)} /></Field>
              <Field label="Ano"><input type="number" min="1950" name="anoFabricacao" value={vehicle.anoFabricacao} onChange={update(setVehicle)} /></Field>
              <Field label="Capacidade"><input type="number" min="1" name="capacidade" value={vehicle.capacidade} onChange={update(setVehicle)} /></Field>
              <Field label="Propriedade"><select name="situacaoPropriedade" value={vehicle.situacaoPropriedade} onChange={update(setVehicle)}><option>Prefeitura</option><option>Locado</option></select></Field>
              <Field label="Estado"><select name="estado" value={vehicle.estado} onChange={update(setVehicle)}><option value="Em operacao">Em operação</option><option value="Em manutencao">Em manutenção</option></select></Field>
              <Field label="Quilometragem"><input type="number" min="0" name="quilometragem" value={vehicle.quilometragem} onChange={update(setVehicle)} /></Field>
              <Field label="Foto — endereço do arquivo"><input name="fotoUrl" value={vehicle.fotoUrl} onChange={update(setVehicle)} /></Field>
              <Field label="Última manutenção"><input type="date" name="ultimaManutencao" value={vehicle.ultimaManutencao} onChange={update(setVehicle)} /></Field>
              <Field label="Próxima manutenção"><input type="date" name="proximaManutencao" value={vehicle.proximaManutencao} onChange={update(setVehicle)} /></Field>
              <Field label="Itens da última manutenção" wide><textarea name="itensManutencao" value={vehicle.itensManutencao} onChange={update(setVehicle)} /></Field>
            </div>
            <button disabled={saving}>Cadastrar veículo</button>
          </form>

          <section className="transport-card fleet-grid">
            {data.vehicles.length === 0 ? <p className="transport-empty">Nenhum veículo cadastrado.</p> : data.vehicles.map((item) => <article key={item.id}><div className="vehicle-icon">🚌</div><div><h3>{item.prefixo}</h3><p>{item.marca_modelo || item.tipo} · {item.placa || 'Sem placa'}</p><span className={item.estado === 'Em manutencao' ? 'vehicle-maintenance' : 'vehicle-operating'}>{item.estado === 'Em manutencao' ? 'Em manutenção' : 'Em operação'}</span><small>Próxima manutenção: {date(item.proxima_manutencao)} · {item.ativo?'Ativo':'Inativo'}</small><button type="button" onClick={()=>toggleVehicle(item)}>{item.ativo?'Desativar':'Reativar'}</button></div></article>)}
          </section>
        </>
      )}

      {tab === 'equipe' && (
        <section className="transport-team-grid">
          <form className="transport-card" onSubmit={submitDriver}><h2>Cadastrar motorista</h2><Field label="Nome"><input name="nome" value={driver.nome} onChange={update(setDriver)} required /></Field><Field label="CPF"><input name="cpf" value={driver.cpf} onChange={update(setDriver)} /></Field><Field label="CNH"><input name="cnh" value={driver.cnh} onChange={update(setDriver)} required /></Field><Field label="Validade da CNH"><input type="date" name="validadeCnh" value={driver.validadeCnh} onChange={update(setDriver)} /></Field><Field label="Telefone"><input name="telefone" value={driver.telefone} onChange={update(setDriver)} /></Field><button disabled={saving}>Cadastrar motorista</button></form>
          <form className="transport-card" onSubmit={submitAttendant}><h2>Cadastrar acompanhante</h2><Field label="Nome"><input name="nome" value={attendant.nome} onChange={update(setAttendant)} required /></Field><Field label="CPF"><input name="cpf" value={attendant.cpf} onChange={update(setAttendant)} /></Field><Field label="Telefone"><input name="telefone" value={attendant.telefone} onChange={update(setAttendant)} /></Field><button disabled={saving}>Cadastrar acompanhante</button></form>
          <article className="transport-card team-list"><h2>Equipe cadastrada</h2><h3>Motoristas</h3>{data.drivers.map((item) => <p key={item.id}><b>{item.nome}</b><span>CNH {item.cnh} · {item.ativo?'Ativo':'Inativo'}</span><button type="button" onClick={()=>toggleDriver(item)}>{item.ativo?'Desativar':'Reativar'}</button></p>)}<h3>Acompanhantes</h3>{data.attendants.map((item) => <p key={item.id}><b>{item.nome}</b><span>{item.telefone || 'Sem telefone'}</span></p>)}</article>
        </section>
      )}

      {tab === 'manutencao' && (
        <>
          <form className="transport-card" onSubmit={submitMaintenance}>
            <h2>Registrar manutenção do veículo</h2>
            <div className="transport-fields">
              <Field label="Veículo"><select name="veiculoId" value={maintenance.veiculoId} onChange={update(setMaintenance)} required><option value="">Selecione</option>{data.vehicles.map((item) => <option key={item.id} value={item.id}>{item.prefixo} · {item.placa}</option>)}</select></Field>
              <Field label="Tipo"><select name="tipo" value={maintenance.tipo} onChange={update(setMaintenance)}><option>Preventiva</option><option>Corretiva</option><option value="Inspecao">Inspeção</option></select></Field>
              <Field label="Situação"><select name="status" value={maintenance.status} onChange={update(setMaintenance)}><option>Agendada</option><option>Em andamento</option><option value="Concluida">Concluída</option><option>Cancelada</option></select></Field>
              <Field label="Data"><input type="date" name="dataManutencao" value={maintenance.dataManutencao} onChange={update(setMaintenance)} required /></Field>
              <Field label="Quilometragem"><input type="number" min="0" name="quilometragem" value={maintenance.quilometragem} onChange={update(setMaintenance)} /></Field>
              <Field label="Próxima manutenção"><input type="date" name="proximaManutencao" value={maintenance.proximaManutencao} onChange={update(setMaintenance)} /></Field>
              <Field label="Fornecedor/oficina"><input name="fornecedor" value={maintenance.fornecedor} onChange={update(setMaintenance)} /></Field>
              <Field label="Valor"><input type="number" min="0" step="0.01" name="valor" value={maintenance.valor} onChange={update(setMaintenance)} /></Field>
              <Field label="Número da nota fiscal"><input name="numeroNotaFiscal" value={maintenance.numeroNotaFiscal} onChange={update(setMaintenance)} /></Field>
              <Field label="Comprovante"><input type="file" accept="image/*,.pdf" onChange={selectMaintenanceReceipt} /></Field>
              <Field label="Descrição" wide><textarea name="descricao" value={maintenance.descricao} onChange={update(setMaintenance)} required /></Field>
              <Field label="Itens e serviços executados" wide><textarea name="itensServicos" value={maintenance.itensServicos} onChange={update(setMaintenance)} required /></Field>
            </div>
            <button disabled={saving || !data.vehicles.length}>Registrar manutenção</button>
          </form>

          <section className="transport-card">
            <h2>Histórico de manutenção</h2>
            {data.maintenance.length === 0 ? <p className="transport-empty">Nenhuma manutenção registrada.</p> : <div className="transport-table-wrap"><table className="transport-table"><thead><tr><th>Veículo</th><th>Data/tipo</th><th>Serviços</th><th>Valor</th><th>Próxima</th><th>Situação</th><th>Ação</th></tr></thead><tbody>{data.maintenance.map((item) => <tr key={item.id}><td><b>{item.veiculo}</b><small>{item.placa}</small></td><td>{date(item.data_manutencao)}<small>{item.tipo === 'Inspecao' ? 'Inspeção' : item.tipo}</small></td><td>{item.itens_servicos}</td><td>{money(item.valor)}</td><td>{date(item.proxima_manutencao)}</td><td><span className={`maintenance-status status-${item.status.toLowerCase().replaceAll(' ', '-')}`}>{item.status === 'Concluida' ? 'Concluída' : item.status}</span></td><td>{item.status !== 'Concluida' && item.status !== 'Cancelada' && <button className="table-action" type="button" onClick={() => changeMaintenanceStatus(item.id, item.status === 'Agendada' ? 'Em andamento' : 'Concluida')}>{item.status === 'Agendada' ? 'Iniciar' : 'Concluir'}</button>}</td></tr>)}</tbody></table></div>}
          </section>
        </>
      )}
    </main>
  );
}
