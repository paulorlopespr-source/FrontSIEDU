import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './services/api';
import {
  canCreateSchoolDemand,
  canDecideSchoolDemand,
  canExecuteSchoolDemand,
  destinationFor,
} from './permissions';
import './demandas-escolares.css';

const initialForm = {
  escolaId: '',
  titulo: '',
  categoria: 'Material ou insumo',
  descricao: '',
  prioridade: 'Normal',
  prazo: '',
};

const urgencyLabel = (value) => value === 'Alta' ? 'Urgência alta' : value === 'Baixa' ? 'Urgência baixa' : 'Urgência normal';
const dateTime = (value) => value ? new Date(value).toLocaleString('pt-BR') : '—';
const allowedAttachmentTypes = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain',
]);
const fileSize = (bytes) => bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`;
const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Não foi possível ler o arquivo selecionado.'));
  reader.readAsDataURL(file);
});

export default function DemandasEscolares({ user, token, onLogout }) {
  const director = canCreateSchoolDemand(user);
  const secretary = canDecideSchoolDemand(user);
  const administration = canExecuteSchoolDemand(user);
  const [demands, setDemands] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [attachment, setAttachment] = useState(null);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const attachmentInput = useRef(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const requests = [api.listMunicipalDemands(token), api.listDemandNotifications(token)];
      if (director) requests.push(api.getAcademicContext(token));
      const [items, alerts, context] = await Promise.all(requests);
      const units = context?.escolas || [];
      setDemands(items || []);
      setNotifications(alerts || []);
      setSchools(units);
      setForm((current) => ({ ...current, escolaId: current.escolaId || units[0]?.id || '' }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  const openDemands = useMemo(() => demands.filter((item) => item.status !== 'Demanda resolvida'), [demands]);
  const unread = useMemo(() => notifications.filter((item) => !item.lidaEm).length, [notifications]);

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function selectAttachment(event) {
    const file = event.target.files?.[0] || null;
    setError('');
    if (!file) return setAttachment(null);
    if (!allowedAttachmentTypes.has(file.type)) {
      event.target.value = '';
      setAttachment(null);
      return setError('Tipo de arquivo não permitido. Envie imagem, PDF, Word, Excel ou TXT.');
    }
    if (file.size > 5_000_000) {
      event.target.value = '';
      setAttachment(null);
      return setError('O anexo deve ter no máximo 5 MB.');
    }
    return setAttachment(file);
  }

  function removeAttachment() {
    setAttachment(null);
    if (attachmentInput.current) attachmentInput.current.value = '';
  }

  async function perform(action, success) {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(success);
      await load();
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function submitDemand(event) {
    event.preventDefault();
    let anexo = null;
    try {
      if (attachment) anexo = { nome: attachment.name, dados: await readAsDataUrl(attachment) };
    } catch (readError) {
      setError(readError.message);
      return;
    }
    const saved = await perform(
      () => api.createMunicipalDemand({
        ...form,
        escolaId: Number(form.escolaId),
        prazo: form.prazo || null,
        anexo,
      }, token),
      'Demanda enviada diretamente à Secretaria Municipal de Educação.',
    );
    if (saved) {
      setForm((current) => ({ ...initialForm, escolaId: current.escolaId }));
      removeAttachment();
    }
  }

  async function downloadAttachment(demandId, item) {
    setError('');
    try {
      await api.downloadDemandAttachment(demandId, item.id, item.nome, token);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function secretaryAction(demand, action) {
    const defaults = {
      autorizar: 'Autorizo a execução desta demanda pela Secretaria Administrativa.',
      analisar: 'Demanda mantida em análise pela Secretaria de Educação.',
      pendente: 'Demanda mantida pendente pela Secretaria de Educação.',
    };
    return perform(
      () => api.decideMunicipalDemand(demand.id, { acao: action, mensagem: notes[demand.id] || defaults[action] }, token),
      action === 'autorizar' ? 'Demanda autorizada e Secretaria Administrativa notificada.' : 'Situação atualizada.',
    );
  }

  function administrationAction(demand, action) {
    const defaults = {
      pendente: 'A tarefa permanece pendente para execução.',
      concluir: 'Tarefa executada e demanda concluída.',
    };
    return perform(
      () => api.executeMunicipalDemand(demand.id, { acao: action, mensagem: notes[demand.id] || defaults[action] }, token),
      action === 'concluir' ? 'Tarefa concluída. Secretaria de Educação e Direção notificadas.' : 'Tarefa mantida como pendente.',
    );
  }

  function markRead(id) {
    return perform(() => api.readDemandNotification(id, token), 'Notificação marcada como lida.');
  }

  const title = administration ? 'Secretaria Administrativa da Educação' : secretary ? 'Solicitações e Demandas' : 'Demandas da Escola';
  const subtitle = administration
    ? 'Execute as tarefas autorizadas pela Secretaria Municipal de Educação.'
    : secretary
      ? 'Analise, autorize ou mantenha pendentes as solicitações encaminhadas pelas escolas.'
      : 'Registre necessidades patrimoniais, estruturais, tecnológicas, didáticas e de insumos.';

  return <main className="demand-page">
    <header className="demand-header">
      <div><small>FLUXO INTEGRADO ENTRE ESCOLA E SECRETARIAS</small><h1>{title}</h1><p>{subtitle}</p></div>
      <div><Link to={destinationFor(user)}>← Voltar ao painel</Link><b>{user?.nome}</b><button type="button" onClick={onLogout}>Sair</button></div>
    </header>

    <section className="demand-summary">
      <article><span>Demandas visíveis</span><strong>{demands.length}</strong></article>
      <article><span>Em aberto</span><strong>{openDemands.length}</strong></article>
      <article><span>Notificações não lidas</span><strong>{unread}</strong></article>
      <article><span>Resolvidas</span><strong>{demands.length - openDemands.length}</strong></article>
    </section>

    {error && <p className="demand-feedback error" role="alert">{error}</p>}
    {message && <p className="demand-feedback success">{message}</p>}

    {notifications.length > 0 && <section className="demand-panel notifications-panel">
      <h2>Notificações do setor</h2>
      <div className="notification-grid">{notifications.slice(0, 6).map((item) => <article className={`notification ${item.cor} ${item.lidaEm ? 'read' : ''}`} key={item.id}>
        <div><b>{item.titulo}</b><p>{item.mensagem}</p><small>{dateTime(item.criadoEm)}</small></div>
        {!item.lidaEm && <button type="button" disabled={saving} onClick={() => markRead(item.id)}>Marcar como lida</button>}
      </article>)}</div>
    </section>}

    {director && <form className="demand-panel demand-form" onSubmit={submitDemand}>
      <div className="wide"><small>NOVA SOLICITAÇÃO</small><h2>Enviar demanda à Secretaria de Educação</h2></div>
      <label>Unidade escolar<select name="escolaId" value={form.escolaId} onChange={change} required>{schools.map((school) => <option key={school.id} value={school.id}>{school.nome}</option>)}</select></label>
      <label>Tipo da demanda<select name="categoria" value={form.categoria} onChange={change}><option>Patrimônio</option><option>Material ou insumo</option><option>Infraestrutura</option><option>Tecnologia</option><option>Material didático</option><option>Manutenção</option><option>Outro</option></select></label>
      <label>Grau de urgência<select name="prioridade" value={form.prioridade} onChange={change}><option value="Alta">Urgência alta — vermelho</option><option value="Normal">Urgência normal — verde</option><option value="Baixa">Urgência baixa — cinza</option></select></label>
      <label>Prazo necessário<input type="date" name="prazo" value={form.prazo} onChange={change}/></label>
      <label className="wide">Qual é a demanda?<input name="titulo" value={form.titulo} onChange={change} placeholder="Ex.: Substituição de lâmpadas da sala 4" required/></label>
      <label className="wide">Justificativa<textarea name="descricao" value={form.descricao} onChange={change} rows="5" placeholder="Descreva a necessidade, quantidade, local e impacto para a escola." required/></label>
      <div className="wide demand-attachment-picker">
        <span>Anexo para comprovar a demanda <small>(opcional)</small></span>
        <div>
          <label className="attachment-button">📎 Enviar imagem ou arquivo<input ref={attachmentInput} type="file" onChange={selectAttachment} accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"/></label>
          {attachment && <span className="selected-attachment"><b>{attachment.name}</b> · {fileSize(attachment.size)} <button type="button" onClick={removeAttachment}>Remover</button></span>}
        </div>
        <small>Formatos aceitos: JPG, PNG, WebP, PDF, Word, Excel e TXT. Limite de 5 MB.</small>
      </div>
      <button disabled={saving || !schools.length}>{saving ? 'Enviando…' : 'Enviar demanda à Secretaria'}</button>
    </form>}

    <section className="demand-panel">
      <h2>{administration ? 'Tarefas autorizadas para execução' : secretary ? 'Fila de solicitações das escolas' : 'Acompanhamento das demandas enviadas'}</h2>
      {loading ? <p>Carregando demandas…</p> : demands.length === 0 ? <div className="demand-empty">Nenhuma demanda disponível neste perfil.</div> : <div className="demand-list">{demands.map((demand) => {
        const resolved = demand.status === 'Demanda resolvida';
        const secretaryPending = ['Enviada à Secretaria', 'Em análise pela Secretaria', 'Pendente na Secretaria'].includes(demand.status);
        const adminPending = ['Autorizada para execução', 'Pendente na Administração'].includes(demand.status);
        return <article className={`demand-card ${resolved ? 'resolved' : administration ? 'task-pending' : ''}`} key={demand.id}>
          <header><div><span className={`urgency ${demand.prioridade.toLowerCase()}`}>{urgencyLabel(demand.prioridade)}</span><small>#{demand.id} · {demand.categoria}</small><h3>{demand.titulo}</h3></div><span className={`workflow-status ${resolved ? 'done' : ''}`}>{demand.status}</span></header>
          <p>{demand.descricao}</p>
          {demand.anexos?.length > 0 && <div className="demand-attachments"><b>Comprovantes anexados</b>{demand.anexos.map((item) => <button type="button" key={item.id} onClick={() => downloadAttachment(demand.id, item)}>📎 {item.nome} <small>({fileSize(item.tamanho)})</small></button>)}</div>}
          <dl><div><dt>Escola</dt><dd>{demand.escola}</dd></div><div><dt>Enviada por</dt><dd>{demand.criadoPor}</dd></div><div><dt>Registrada</dt><dd>{dateTime(demand.criadoEm)}</dd></div><div><dt>Prazo</dt><dd>{demand.prazo ? new Date(`${demand.prazo}T12:00:00`).toLocaleDateString('pt-BR') : 'Não definido'}</dd></div></dl>
          {((secretary && secretaryPending) || (administration && adminPending)) && <div className="demand-actions">
            <label>Despacho/observação<textarea value={notes[demand.id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [demand.id]: event.target.value }))} placeholder="Registre a orientação deste encaminhamento."/></label>
            {secretary && <div><button className="authorize" type="button" disabled={saving} onClick={() => secretaryAction(demand, 'autorizar')}>Autorizar execução</button><button type="button" disabled={saving} onClick={() => secretaryAction(demand, 'analisar')}>Manter em análise</button><button className="pending" type="button" disabled={saving} onClick={() => secretaryAction(demand, 'pendente')}>Deixar pendente</button></div>}
            {administration && <div><button className="complete" type="button" disabled={saving} onClick={() => administrationAction(demand, 'concluir')}>Tarefa concluída</button><button className="pending" type="button" disabled={saving} onClick={() => administrationAction(demand, 'pendente')}>Tarefa pendente</button></div>}
          </div>}
          {demand.historico?.length > 0 && <details><summary>Histórico completo ({demand.historico.length})</summary>{demand.historico.map((item) => <p className="history-item" key={item.id}><b>{item.usuario || 'Sistema'}</b> — {item.mensagem}<small>{item.statusAnterior || 'Início'} → {item.statusNovo} · {dateTime(item.criadoEm)}</small></p>)}</details>}
        </article>;
      })}</div>}
    </section>
  </main>;
}
