import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileChartColumn,
  Flag,
  ListChecks,
  Luggage,
  Megaphone,
  NotebookPen,
  RotateCcw,
  Star,
  Sun,
  Target,
  Users,
} from 'lucide-react';
import './aluno-calendar.css';

const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const weekdays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const categories = ['Todos os eventos', 'Avaliações', 'Atividades', 'Simulados', 'Eventos escolares', 'Feriados e recessos', 'Reuniões', 'Avisos'];

const visualConfig = {
  assessment: { Icon: ClipboardCheck, label: 'Avaliação ou prova' },
  cycle: { Icon: Target, label: 'Avaliação de Ciclo' },
  simulation: { Icon: BookOpen, label: 'Simulado' },
  activity: { Icon: NotebookPen, label: 'Atividade' },
  deadline: { Icon: Clock3, label: 'Prazo final' },
  grade: { Icon: Star, label: 'Nota publicada' },
  meeting: { Icon: Users, label: 'Reunião ou conselho' },
  'school-event': { Icon: Flag, label: 'Evento escolar' },
  holiday: { Icon: Sun, label: 'Feriado' },
  vacation: { Icon: Luggage, label: 'Recesso ou férias' },
  notice: { Icon: Megaphone, label: 'Aviso importante' },
  recovery: { Icon: RotateCcw, label: 'Recuperação' },
  report: { Icon: FileChartColumn, label: 'Boletim' },
};

const dateKey = (value) => String(value || '').slice(0, 10);
const parseDate = (value) => new Date(`${dateKey(value)}T12:00:00`);
const sameDay = (left, right) => left && right && dateKey(left) === dateKey(right.toISOString());
const formattedDate = (value) => parseDate(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

function EventIcon({ event, size = 18 }) {
  const { Icon, label } = visualConfig[event.visual] || visualConfig['school-event'];
  return <span className="calendar-event-icon" data-visual={event.visual || 'school-event'} title={label}><Icon size={size} strokeWidth={2.2} aria-hidden="true" /></span>;
}

function eventsOnDay(events, day) {
  const key = dateKey(day.toISOString());
  return events.filter((event) => {
    const start = dateKey(event.dataInicio);
    const end = dateKey(event.dataFim || event.dataInicio);
    return key >= start && key <= end;
  });
}

export default function AlunoCalendar({ events = [] }) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState('month');
  const [category, setCategory] = useState('Todos os eventos');
  const [discipline, setDiscipline] = useState('Todas as disciplinas');
  const [selectedDay, setSelectedDay] = useState(today);

  const disciplines = useMemo(() => [...new Set(events.map((event) => event.disciplina).filter(Boolean))].sort(), [events]);
  const filtered = useMemo(() => events.filter((event) => (
    (category === 'Todos os eventos' || event.categoria === category)
    && (discipline === 'Todas as disciplinas' || event.disciplina === discipline)
  )), [category, discipline, events]);

  const monthEvents = filtered.filter((event) => {
    const start = parseDate(event.dataInicio);
    const end = parseDate(event.dataFim || event.dataInicio);
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 12);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 12);
    return start <= monthEnd && end >= monthStart;
  });
  const yearEvents = filtered.filter((event) => {
    const start = parseDate(event.dataInicio);
    const end = parseDate(event.dataFim || event.dataInicio);
    const yearStart = new Date(cursor.getFullYear(), 0, 1, 12);
    const yearEnd = new Date(cursor.getFullYear(), 11, 31, 12);
    return start <= yearEnd && end >= yearStart;
  });
  const selectedEvents = eventsOnDay(filtered, selectedDay);
  const agendaEvents = view === 'year' ? yearEvents : selectedEvents.length ? selectedEvents : monthEvents;

  function move(amount) {
    if (view === 'year') setCursor((current) => new Date(current.getFullYear() + amount, current.getMonth(), 1));
    else setCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  function showToday() {
    const current = new Date();
    setCursor(new Date(current.getFullYear(), current.getMonth(), 1));
    setSelectedDay(current);
  }

  function renderMonth() {
    const firstWeekday = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
    const totalDays = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: totalDays }, (_, index) => index + 1)];
    while (cells.length % 7) cells.push(null);
    return <div className="student-month-calendar">
      <div className="student-calendar-weekdays">{weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}</div>
      <div className="student-calendar-days">{cells.map((day, index) => {
        if (!day) return <span className="calendar-empty-day" key={`empty-${index}`} />;
        const date = new Date(cursor.getFullYear(), cursor.getMonth(), day, 12);
        const dayEvents = eventsOnDay(filtered, date);
        const isToday = sameDay(date.toISOString(), today);
        const isSelected = sameDay(date.toISOString(), selectedDay);
        return <button type="button" className={`${isToday ? 'today ' : ''}${isSelected ? 'selected' : ''}`} onClick={() => setSelectedDay(date)} key={day} aria-label={`${day} de ${months[cursor.getMonth()]}, ${dayEvents.length} evento(s)`}>
          <b>{day}</b>
          <span className="calendar-day-events">{dayEvents.slice(0, 3).map((event) => <i data-visual={event.visual} key={event.id} title={event.titulo} />)}{dayEvents.length > 3 && <small>+{dayEvents.length - 3}</small>}</span>
        </button>;
      })}</div>
    </div>;
  }

  function renderYear() {
    return <div className="student-year-calendar">{months.map((month, monthIndex) => {
      const monthCount = filtered.filter((event) => {
        const start = parseDate(event.dataInicio);
        const end = parseDate(event.dataFim || event.dataInicio);
        const monthStart = new Date(cursor.getFullYear(), monthIndex, 1, 12);
        const monthEnd = new Date(cursor.getFullYear(), monthIndex + 1, 0, 12);
        return start <= monthEnd && end >= monthStart;
      }).length;
      return <button type="button" key={month} onClick={() => { setCursor(new Date(cursor.getFullYear(), monthIndex, 1)); setView('month'); }}>
        <CalendarDays size={19} aria-hidden="true" /><b>{month}</b><strong>{monthCount}</strong><small>{monthCount === 1 ? 'evento' : 'eventos'}</small>
      </button>;
    })}</div>;
  }

  return <section className="student-calendar-area">
    <header className="student-calendar-toolbar">
      <div className="calendar-view-switch"><button type="button" className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Mensal</button><button type="button" className={view === 'year' ? 'active' : ''} onClick={() => setView('year')}>Anual</button></div>
      <div className="calendar-navigation"><button type="button" onClick={() => move(-1)} aria-label="Período anterior"><ChevronLeft size={19} /></button><h2>{view === 'year' ? cursor.getFullYear() : `${months[cursor.getMonth()]} ${cursor.getFullYear()}`}</h2><button type="button" onClick={() => move(1)} aria-label="Próximo período"><ChevronRight size={19} /></button><button type="button" className="calendar-today" onClick={showToday}>Hoje</button></div>
    </header>

    <div className="student-calendar-filters" aria-label="Filtros do calendário">
      <ListChecks size={19} aria-hidden="true" />
      <div>{categories.map((item) => <button type="button" className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>
      <label><span>Disciplina</span><select value={discipline} onChange={(event) => setDiscipline(event.target.value)}><option>Todas as disciplinas</option>{disciplines.map((item) => <option key={item}>{item}</option>)}</select></label>
    </div>

    <div className="student-calendar-layout">
      <div>{view === 'month' ? renderMonth() : renderYear()}</div>
      <aside className="student-calendar-agenda">
        <div><small>AGENDA</small><h3>{selectedEvents.length ? selectedDay.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) : view === 'year' ? `Eventos de ${cursor.getFullYear()}` : months[cursor.getMonth()]}</h3></div>
        <div className="calendar-agenda-list">{agendaEvents.map((event) => <article data-visual={event.visual} key={event.id}>
          <EventIcon event={event} />
          <div><small>{formattedDate(event.dataInicio)}{event.dataFim && dateKey(event.dataFim) !== dateKey(event.dataInicio) ? ` a ${formattedDate(event.dataFim)}` : ''}{event.horaInicio ? ` · ${event.horaInicio}` : ''}</small><h4>{event.titulo}</h4><p>{event.disciplina || event.tipo} · {event.origem}</p>{event.observacao && <span>{event.observacao}</span>}</div>
        </article>)}{!agendaEvents.length && <p className="calendar-no-events">Nenhum evento encontrado com estes filtros.</p>}</div>
      </aside>
    </div>

    <footer className="student-calendar-legend">
      {Object.entries(visualConfig).map(([visual, config]) => <span key={visual}><EventIcon event={{ visual }} size={15} />{config.label}</span>)}
    </footer>
  </section>;
}
