import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Flag,
  MapPin,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { api } from './services/api';
import { destinationFor } from './permissions';
import { canManageSchoolCalendar } from './permissions';
import './calendario-escolar-gestao.css';

const currentYear = new Date().getFullYear();
const emptyForm = {
  escopo: 'Rede', escolaId: '', turmaId: '', titulo: '', tipo: 'Ano letivo',
  disciplina: '', dataInicio: '', dataFim: '', horaInicio: '', horaFim: '',
  observacao: '', destaque: false, cor: '#176fe3', publicado: true,
};
const date = (value) => value ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '—';
const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function CalendarioEscolarGestao({ user, token }) {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth());
  const [view, setView] = useState('month');
  const [data, setData] = useState({ eventos: [], escolas: [], turmas: [], tipos: [] });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try { setData(await api.getCalendarManagement(year, token)); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [year, token]);

  const availableClasses = useMemo(() => data.turmas.filter((item) => (
    !form.escolaId || String(item.escolaId) === String(form.escolaId)
  )), [data.turmas, form.escolaId]);
  const canEdit = canManageSchoolCalendar(user);
  const monthDays = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: total }, (_, index) => index + 1)];
  }, [month, year]);
  const eventsByDay = useMemo(() => data.eventos.reduce((result, event) => {
    const start = new Date(`${String(event.dataInicio).slice(0, 10)}T12:00:00`);
    if (start.getFullYear() === year && start.getMonth() === month) (result[start.getDate()] ||= []).push(event);
    return result;
  }, {}), [data.eventos, month, year]);

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'escopo' ? { escolaId: '', turmaId: '' } : {}),
      ...(name === 'escolaId' ? { turmaId: '' } : {}),
    }));
  }

  function reset() {
    setForm(emptyForm); setEditingId(null); setError('');
  }

  function edit(event) {
    setEditingId(event.id);
    setForm({
      escopo: event.escopo,
      escolaId: event.escolaId || '',
      turmaId: event.turmaId || '',
      titulo: event.titulo,
      tipo: event.tipo,
      disciplina: event.disciplina || '',
      dataInicio: String(event.dataInicio).slice(0, 10),
      dataFim: event.dataFim ? String(event.dataFim).slice(0, 10) : '',
      horaInicio: event.horaInicio || '',
      horaFim: event.horaFim || '',
      observacao: event.observacao || '',
      destaque: Boolean(event.destaque),
      cor: event.cor || '#176fe3',
      publicado: true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save(event) {
    if (!canEdit) return;
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const payload = {
        ...form,
        escolaId: form.escolaId ? Number(form.escolaId) : null,
        turmaId: form.turmaId ? Number(form.turmaId) : null,
      };
      const result = editingId
        ? await api.updateSchoolCalendarEvent(editingId, payload, token)
        : await api.createSchoolCalendarEvent(payload, token);
      setNotice(result.message); reset(); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  async function remove(event) {
    if (!canEdit) return;
    if (!window.confirm(`Remover “${event.titulo}” do calendário dos alunos?`)) return;
    try { await api.deleteSchoolCalendarEvent(event.id, token); setNotice('Evento removido do calendário.'); await load(); }
    catch (requestError) { setError(requestError.message); }
  }

  return <main className="calendar-management-page">
    <header className="calendar-management-header">
      <div><Link to={destinationFor(user)}>← Voltar ao painel</Link><span>GESTÃO MUNICIPAL</span><h1><CalendarDays /> Calendário Escolar</h1><p>Cadastre as datas oficiais que serão apresentadas aos alunos da rede, escola ou turma selecionada.</p></div>
      <label>Ano exibido<input type="number" min="2020" max="2100" value={year} onChange={(event) => setYear(Number(event.target.value))} /></label>
    </header>

    {notice && <p className="calendar-management-notice"><CheckCircle2 size={19} />{notice}</p>}
    {error && <p className="calendar-management-error">{error}</p>}

    <section className="calendar-management-grid">
      {canEdit ? <form className="calendar-event-form" onSubmit={save}>
        <div className="calendar-form-title"><span><Plus /></span><div><small>{editingId ? 'EDIÇÃO' : 'NOVO EVENTO'}</small><h2>{editingId ? 'Atualizar data oficial' : 'Cadastrar data oficial'}</h2></div></div>
        <div className="calendar-form-fields">
          <label className="wide">Título<input name="titulo" value={form.titulo} onChange={change} placeholder="Ex.: 1º Bimestre" required /></label>
          <label>Tipo<select name="tipo" value={form.tipo} onChange={change}>{data.tipos.map((type) => <option key={type}>{type}</option>)}</select></label><label>Cor do evento<select name="cor" value={form.cor} onChange={change}><option value="#176fe3">🔵 Azul — atividade</option><option value="#16a06a">🟢 Verde — formação</option><option value="#f09b1b">🟠 Laranja — avaliação</option><option value="#d83b54">🔴 Vermelho — alerta</option><option value="#7a4fd6">🟣 Roxo — reunião</option></select></label>
          <label>Escopo<select name="escopo" value={form.escopo} onChange={change}><option>Rede</option><option>Escola</option><option>Turma</option></select></label>
          {form.escopo !== 'Rede' && <label>Escola<select name="escolaId" value={form.escolaId} onChange={change} required><option value="">Selecione</option>{data.escolas.map((school) => <option value={school.id} key={school.id}>{school.nome}</option>)}</select></label>}
          {form.escopo === 'Turma' && <label>Turma<select name="turmaId" value={form.turmaId} onChange={change} required><option value="">Selecione</option>{availableClasses.map((item) => <option value={item.id} key={item.id}>{item.nome} — {item.serieAno}</option>)}</select></label>}
          <label>Data inicial<input type="date" name="dataInicio" value={form.dataInicio} onChange={change} required /></label>
          <label>Data final<input type="date" name="dataFim" min={form.dataInicio} value={form.dataFim} onChange={change} /></label>
          <label>Horário inicial<input type="time" name="horaInicio" value={form.horaInicio} onChange={change} /></label>
          <label>Horário final<input type="time" name="horaFim" value={form.horaFim} onChange={change} /></label>
          <label className="wide">Disciplina, se aplicável<input name="disciplina" value={form.disciplina} onChange={change} placeholder="Ex.: Matemática" /></label>
          <label className="wide">Orientações<textarea name="observacao" value={form.observacao} onChange={change} rows="4" placeholder="Informações que o aluno e os responsáveis precisam conhecer." /></label>
          <label className="calendar-check wide"><input type="checkbox" name="destaque" checked={form.destaque} onChange={change} /> Destacar este evento no calendário do aluno</label>
        </div>
        <div className="calendar-form-actions"><button type="submit" disabled={saving}><Save size={18} />{saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Publicar no calendário'}</button>{editingId && <button type="button" className="secondary" onClick={reset}>Cancelar edição</button>}</div>
      </form> : <section className="calendar-event-form calendar-readonly"><div className="calendar-form-title"><span><CalendarDays /></span><div><small>CONSULTA</small><h2>Calendário somente leitura</h2></div></div><p>Seu perfil pode consultar os eventos, mas não pode cadastrá-los ou alterá-los.</p></section>}

      <section className="calendar-events-panel">
        <header><div><small>DATAS PUBLICADAS</small><h2>Calendário de {year}</h2></div><strong>{data.eventos.length}</strong></header>
        <div className="calendar-view-toolbar"><div><button type="button" className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Mensal</button><button type="button" className={view === 'year' ? 'active' : ''} onClick={() => setView('year')}>Anual</button></div>{view === 'month' && <label>Mês<select value={month} onChange={(event) => setMonth(Number(event.target.value))}>{monthNames.map((name, index) => <option value={index} key={name}>{name}</option>)}</select></label>}</div>
        {view === 'month' ? <div className="calendar-month-grid"><div className="calendar-weekdays">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((day) => <b key={day}>{day}</b>)}</div><div className="calendar-month-days">{monthDays.map((day, index) => day ? <div key={day} className={eventsByDay[day] ? 'has-events' : ''}><b>{day}</b>{(eventsByDay[day] || []).slice(0, 2).map((event) => <small title={event.titulo} key={event.id}>{event.titulo}</small>)}</div> : <span key={`empty-${index}`} />)}</div></div> : <div className="calendar-year-grid">{monthNames.map((name, index) => <button type="button" key={name} onClick={() => { setMonth(index); setView('month'); }}>{name}<strong>{data.eventos.filter((event) => { const dateValue = new Date(`${String(event.dataInicio).slice(0, 10)}T12:00:00`); return dateValue.getFullYear() === year && dateValue.getMonth() === index; }).length}</strong></button>)}</div>}
        {loading ? <p className="calendar-management-empty">Carregando calendário...</p> : data.eventos.map((event) => <article className={event.destaque ? 'highlight' : ''} key={event.id}>
          <time><b>{date(event.dataInicio).slice(0, 5)}</b>{event.dataFim && <span>até {date(event.dataFim).slice(0, 5)}</span>}</time>
          <div><small><Flag size={13} />{event.tipo} · {event.escopo}</small><h3>{event.titulo}</h3><p><MapPin size={14} />{event.turma || event.escola || 'Toda a rede'}{event.disciplina ? ` · ${event.disciplina}` : ''}</p>{event.horaInicio && <p><Clock3 size={14} />{event.horaInicio}{event.horaFim ? ` às ${event.horaFim}` : ''}</p>}</div>
          <div className="calendar-row-actions"><button type="button" onClick={() => edit(event)} title="Editar"><Edit3 size={17} /></button><button type="button" onClick={() => remove(event)} title="Remover"><Trash2 size={17} /></button></div>
        </article>)}
        {!loading && !data.eventos.length && <p className="calendar-management-empty">Nenhuma data oficial cadastrada para {year}.</p>}
      </section>
    </section>
  </main>;
}
