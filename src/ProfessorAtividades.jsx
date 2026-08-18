import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './services/api';
import ProfessorBancoQuestoes from './ProfessorBancoQuestoes';

const box = { background: '#fff', padding: 20, borderRadius: 14, boxShadow: '0 3px 15px #dce5f080' };
const input = { display: 'block', width: '100%', padding: 10, marginTop: 5, boxSizing: 'border-box' };
const types = { Atividade: '#176fe3', Prova: '#d62d4f', Avaliação: '#ef8b10', Trabalho: '#0aa56c', Seminário: '#7350df' };
const initial = { turmaId: '', tipo: 'Atividade', titulo: '', descricao: '', data: '', valor: '', bimestre: 1, instrucoes: '', materiais: '', competencias: '' };

export default function ProfessorAtividades({ token }) {
  const [data, setData] = useState({ turmas: [] });
  const [schedule, setSchedule] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const [dashboard, hours, activities] = await Promise.all([api.getProfessorDashboard(token), api.getProfessorSchedule(token), api.listProfessorActivities(token)]);
      setData(dashboard); setSchedule(hours); setEvents(activities);
    } catch (requestError) { setError(requestError.message); }
  }
  useEffect(() => { load(); }, [token]);

  const selectedSchedules = schedule.filter((item) => String(item.turmaId) === String(form.turmaId));
  const availableDates = useMemo(() => {
    const result = [];
    for (let index = 0; index < 120; index += 1) {
      const day = new Date(); day.setHours(12, 0, 0, 0); day.setDate(day.getDate() + index);
      if (selectedSchedules.some((item) => item.diaSemana === day.getDay())) result.push(day.toISOString().slice(0, 10));
    }
    if (form.data && !result.includes(form.data)) result.unshift(form.data);
    return result;
  }, [selectedSchedules, form.data]);

  async function save(event) {
    event.preventDefault(); setError(''); setMsg('');
    try {
      if (editing) await api.updateProfessorActivity(editing, { ...form, turmaId: Number(form.turmaId) }, token);
      else await api.createProfessorActivity({ ...form, turmaId: Number(form.turmaId) }, token);
      setMsg(editing ? 'Atividade atualizada no calendário, diário e notas.' : 'Atividade programada; quando possui valor, também aparece no lançamento de notas.');
      setForm(initial); setEditing(null); await load();
    } catch (requestError) { setError(requestError.message); }
  }

  function startEdit(item) {
    setEditing(item.id);
    setForm({ turmaId: String(item.turmaId), tipo: item.tipo, titulo: item.titulo, descricao: item.descricao || '', data: String(item.data).slice(0, 10), valor: item.valor || '', bimestre: item.bimestre || 1, instrucoes: item.instrucoes || '', materiais: item.materiais || '', competencias: (item.competencias || []).join(', ') });
    window.scrollTo(0, 0);
  }

  async function cancel(item) {
    const motivo = window.prompt(`Motivo do cancelamento de “${item.titulo}”:`);
    if (!motivo) return;
    try { await api.cancelProfessorActivity(item.id, motivo, token); setMsg('Atividade cancelada e removida do calendário e das notas.'); await load(); }
    catch (requestError) { setError(requestError.message); }
  }

  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const grouped = events.reduce((accumulator, item) => { const key = String(item.data).slice(0, 10); (accumulator[key] ||= []).push(item); return accumulator; }, {});

  return <div style={{ minHeight: '100vh', background: '#f4f7fc', color: '#09245a', fontFamily: 'Arial' }}>
    <header style={{ background: '#fff', padding: '12px 4%', display: 'flex', alignItems: 'center', gap: 18, borderBottom: '1px solid #dce5f0' }}><img src="/images/prefeitura-transparent.svg" alt="Prefeitura Municipal de Pindobaçu" style={{ width: 78, height: 62, objectFit: 'contain' }} /><div><b style={{ fontSize: 22 }}>Atividades e Avaliações — SIEDU</b><small style={{ display: 'block' }}>Integração com diário, calendário e notas</small></div><Link to="/professor" style={{ marginLeft: 'auto' }}>← Portal do Professor</Link></header>
    <main style={{ maxWidth: 1300, margin: 'auto', padding: '28px 4%' }}><h1>📝 Atividades, provas e avaliações</h1>{msg && <p style={{ background: '#e5f7ec', color: '#16613d', padding: 12 }}>{msg}</p>}{error && <p style={{ background: '#fee', color: '#a22', padding: 12 }}>{error}</p>}
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(320px,.8fr) minmax(450px,1.4fr)', gap: 18 }}>
        <form onSubmit={save} style={box}><h2>{editing ? 'Editar atividade' : 'Nova programação'}</h2>
          <label>Turma<select required value={form.turmaId} onChange={(event) => setForm({ ...form, turmaId: event.target.value, data: '' })} style={input}><option value="">Selecione</option>{data.turmas.map((item) => <option key={item.id} value={item.id}>{item.nome} — {item.componenteCurricular}</option>)}</select></label>
          {form.turmaId && <div style={{ background: '#eef5ff', padding: 10, margin: '10px 0' }}><b>Horários cadastrados:</b>{selectedSchedules.map((item) => <p key={item.id}>{days[item.diaSemana]} · {item.horaInicio} às {item.horaFim}</p>)}</div>}
          <label>Tipo<select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })} style={input}>{Object.keys(types).map((type) => <option key={type}>{type}</option>)}</select></label>
          <label>Título<input required value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} style={input} /></label>
          <label>Data no horário da turma<select required value={form.data} onChange={(event) => setForm({ ...form, data: event.target.value })} style={input}><option value="">Selecione</option>{availableDates.map((value) => <option key={value} value={value}>{new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</option>)}</select></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><label>Valor em pontos<input type="number" min=".1" max="10" step=".1" value={form.valor} onChange={(event) => setForm({ ...form, valor: event.target.value })} style={input} /></label><label>Bimestre<select value={form.bimestre} onChange={(event) => setForm({ ...form, bimestre: event.target.value })} style={input}>{[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value}º</option>)}</select></label></div>
          <label>Descrição<textarea rows="3" value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} style={input} /></label>
          <label>Instruções<textarea rows="3" value={form.instrucoes} onChange={(event) => setForm({ ...form, instrucoes: event.target.value })} style={input} /></label>
          <label>Competências<input value={form.competencias} onChange={(event) => setForm({ ...form, competencias: event.target.value })} style={input} /></label>
          <label>Materiais<textarea rows="2" value={form.materiais} onChange={(event) => setForm({ ...form, materiais: event.target.value })} style={input} /></label>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button style={{ background: '#176fe3', color: '#fff', border: 0, borderRadius: 8, padding: '12px 18px', fontWeight: 700 }}>{editing ? '💾 Salvar alterações' : '📅 Programar'}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(initial); }}>Cancelar edição</button>}</div>
        </form>
        <section style={box}><h2>Calendário de atividades</h2>{Object.keys(grouped).sort().map((date) => <article key={date} style={{ borderLeft: '4px solid #176fe3', padding: '4px 0 4px 14px', marginBottom: 18 }}><h3>{new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</h3>{grouped[date].map((item) => <div key={item.id} style={{ borderTop: '1px solid #edf1f7', padding: '10px 0', opacity: item.status === 'Cancelada' ? .65 : 1 }}><span style={{ background: item.status === 'Cancelada' ? '#718096' : types[item.tipo] || '#607399', color: '#fff', padding: '5px 9px', borderRadius: 12 }}>{item.status === 'Cancelada' ? 'Cancelada' : item.tipo}</span><b style={{ marginLeft: 10 }}>{item.titulo}</b><p>{item.horaInicio}–{item.horaFim} · {item.turma} · {item.disciplina}{item.valor ? ` · ${item.valor} ponto(s) · integrado às notas` : ''}</p>{item.motivoCancelamento && <small>Motivo: {item.motivoCancelamento}</small>}{item.status !== 'Cancelada' && <div style={{ display: 'flex', gap: 8 }}><button type="button" onClick={() => startEdit(item)}>✏️ Editar</button><button type="button" onClick={() => cancel(item)} style={{ color: '#a22' }}>🚫 Cancelar atividade</button></div>}</div>)}</article>)}{!events.length && <p>Nenhuma atividade programada.</p>}</section>
      </section>
      <ProfessorBancoQuestoes token={token} data={data} schedule={schedule} onChanged={load} />
    </main>
  </div>;
}
