import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from './services/api';
import './aluno-portal.css';

const sections = [
  ['inicio', '⌂', 'Início'],
  ['turma', '🎓', 'Turma e horários'],
  ['materiais', '📚', 'Materiais'],
  ['atividades', '📝', 'Atividades'],
  ['notas', '📊', 'Notas e boletim'],
  ['frequencia', '✓', 'Frequência'],
  ['calendario', '📅', 'Calendário'],
  ['notificacoes', '🔔', 'Notificações'],
];

const initialData = {
  aluno: null,
  disciplinas: [],
  horarios: [],
  materiais: [],
  atividades: [],
  notas: [],
  medias: [],
  frequencia: { registros: [], aulas: 0, faltas: 0, percentual: 100 },
  calendario: [],
  notificacoes: [],
  resumo: { disciplinas: 0, materiais: 0, pendencias: 0, notificacoesNaoLidas: 0 },
};

const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const date = (value) => value ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '—';
const grade = (value) => value == null ? 'Aguardando' : Number(value).toFixed(1);
const safeExternalUrl = (value) => /^https?:\/\//i.test(value || '') ? value : null;
const statusClass = (value = '') => `student-status student-status-${value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`;

function Empty({ children }) {
  return <div className="student-empty">{children}</div>;
}

function SectionTitle({ eyebrow, title, description, action }) {
  return <div className="student-section-title">
    <div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
    {action}
  </div>;
}

export default function AlunoPortal({ user, token, onLogout }) {
  const location = useLocation();
  const current = location.pathname.split('/').filter(Boolean)[1] || 'inicio';
  const selected = sections.some(([slug]) => slug === current) ? current : 'inicio';
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getStudentPortal(token)
      .then((result) => { if (active) setData({ ...initialData, ...result }); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const nextActivities = useMemo(
    () => data.atividades.filter((item) => ['Pendente', 'Atrasada', 'Programada'].includes(item.status)).slice(0, 4),
    [data.atividades],
  );
  const overallAverage = data.medias.length
    ? data.medias.reduce((total, item) => total + Number(item.media), 0) / data.medias.length
    : null;

  function renderHome() {
    return <>
      <section className="student-hero">
        <div><span>PORTAL DO ALUNO</span><h1>Olá, {data.aluno?.nomeSocial || data.aluno?.nome || user?.nome?.split(' ')[0]}! 👋</h1><p>Acompanhe sua vida escolar de forma simples, segura e organizada.</p></div>
        <div className="student-enrollment"><small>MATRÍCULA</small><strong>{data.aluno?.matricula || '—'}</strong><span>{data.aluno?.turma || 'Turma não vinculada'}</span></div>
      </section>
      <section className="student-summary-grid">
        <article><span className="student-icon blue">📚</span><div><small>Disciplinas</small><strong>{data.resumo.disciplinas}</strong><p>na turma atual</p></div></article>
        <article><span className="student-icon green">✓</span><div><small>Frequência</small><strong>{data.frequencia.percentual}%</strong><p>{data.frequencia.faltas} falta(s)</p></div></article>
        <article><span className="student-icon purple">📊</span><div><small>Média geral</small><strong>{grade(overallAverage)}</strong><p>notas lançadas</p></div></article>
        <article><span className="student-icon orange">📝</span><div><small>Pendências</small><strong>{data.resumo.pendencias}</strong><p>atividades e avaliações</p></div></article>
      </section>
      <section className="student-two-columns">
        <article className="student-card"><div className="student-card-heading"><div><small>PRÓXIMOS PRAZOS</small><h2>Atividades e avaliações</h2></div><Link to="/aluno/atividades">Ver todas</Link></div>
          {nextActivities.length ? nextActivities.map((item) => <div className="student-list-row" key={`${item.tipo}-${item.id}`}><span className="student-date"><b>{date(item.prazo).slice(0, 5)}</b><small>{item.tipo}</small></span><div><b>{item.titulo}</b><p>{item.disciplina || 'Atividade da turma'} · {item.horaInicio || 'Horário não informado'}</p></div><span className={statusClass(item.status)}>{item.status}</span></div>) : <Empty>Nenhuma atividade pendente.</Empty>}
        </article>
        <article className="student-card"><div className="student-card-heading"><div><small>ATUALIZAÇÕES</small><h2>Notificações</h2></div><Link to="/aluno/notificacoes">Ver todas</Link></div>
          {data.notificacoes.slice(0, 4).map((item) => <div className="student-notice" key={item.id}><span>{item.tipo === 'Nota' ? '📊' : item.tipo === 'Atividade' ? '📝' : '🔔'}</span><div><b>{item.titulo}</b><p>{item.mensagem}</p></div>{!item.lida && <i>Nova</i>}</div>)}
          {!data.notificacoes.length && <Empty>Nenhuma notificação.</Empty>}
        </article>
      </section>
      <div className="student-security">🔒 <div><b>Seus dados estão protegidos</b><p>Este acesso mostra somente informações vinculadas à sua própria matrícula.</p></div></div>
    </>;
  }

  function renderClass() {
    return <><SectionTitle eyebrow="VIDA ESCOLAR" title="Turma, disciplinas e horários" description="Professores e horários vinculados à sua matrícula atual." />
      <section className="student-school-card"><div><small>ESCOLA</small><h2>{data.aluno?.escola || '—'}</h2><p>{data.aluno?.etapaEnsino} · {data.aluno?.serieAno} · Turno {data.aluno?.turno}</p></div><div><small>TURMA</small><strong>{data.aluno?.turma || '—'}</strong><p>Sala {data.aluno?.sala || 'não informada'}</p></div></section>
      <section className="student-two-columns">
        <article className="student-card"><h2>Disciplinas e professores</h2>{data.disciplinas.map((item) => <div className="student-list-row" key={`${item.disciplina}-${item.professor}`}><span className="student-avatar">{item.disciplina?.[0]}</span><div><b>{item.disciplina}</b><p>{item.professor}</p></div>{item.titular && <span className="student-status student-status-entregue">Titular</span>}</div>)}{!data.disciplinas.length && <Empty>Nenhuma disciplina vinculada.</Empty>}</article>
        <article className="student-card"><h2>Grade de horários</h2><div className="student-table-wrap"><table><thead><tr><th>Dia</th><th>Horário</th><th>Disciplina</th><th>Sala</th></tr></thead><tbody>{data.horarios.map((item) => <tr key={item.id}><td>{weekdays[item.diaSemana]}</td><td>{item.horaInicio}–{item.horaFim}</td><td><b>{item.disciplina}</b><small>{item.professor}</small></td><td>{item.sala || '—'}</td></tr>)}</tbody></table></div>{!data.horarios.length && <Empty>Nenhum horário cadastrado.</Empty>}</article>
      </section></>;
  }

  function renderMaterials() {
    return <><SectionTitle eyebrow="BIBLIOTECA DIGITAL" title="Materiais para consulta e download" description="Conteúdos publicados pelos professores da sua turma." />
      <section className="student-material-grid">{data.materiais.map((item) => <article className="student-card" key={item.id}><span className="student-file-icon">{item.tipo === 'Vídeo' ? '🎬' : item.tipo === 'Link' ? '🔗' : '📄'}</span><small>{item.tipo} · {item.disciplina}</small><h2>{item.titulo}</h2><p>{item.descricao}</p>{item.conteudoTexto && <div className="student-material-text">{item.conteudoTexto}</div>}<small>Professor(a): {item.professor}</small><div className="student-actions">{safeExternalUrl(item.urlExterna) && <a href={safeExternalUrl(item.urlExterna)} target="_blank" rel="noreferrer">Abrir conteúdo</a>}{item.arquivoDados && <a href={item.arquivoDados} download={item.arquivoNome || item.titulo}>⬇ Baixar {item.arquivoNome || 'arquivo'}</a>}</div></article>)}{!data.materiais.length && <Empty>Nenhum material publicado para sua turma.</Empty>}</section></>;
  }

  function renderActivities() {
    return <><SectionTitle eyebrow="ORGANIZAÇÃO" title="Atividades, avaliações e pendências" description="Prazos e orientações informados pelos seus professores." />
      <article className="student-card"><div className="student-table-wrap"><table><thead><tr><th>Prazo</th><th>Atividade</th><th>Disciplina</th><th>Valor</th><th>Status</th></tr></thead><tbody>{data.atividades.map((item) => <tr key={`${item.tipo}-${item.id}`}><td>{date(item.prazo)}</td><td><b>{item.titulo}</b><small>{item.descricao || item.instrucoes || item.tipo}</small></td><td>{item.disciplina || '—'}</td><td>{item.valor ? `${Number(item.valor).toFixed(1)} pts` : '—'}</td><td><span className={statusClass(item.status)}>{item.status}</span></td></tr>)}</tbody></table></div>{!data.atividades.length && <Empty>Nenhuma atividade cadastrada.</Empty>}</article></>;
  }

  function renderGrades() {
    return <><SectionTitle eyebrow="DESEMPENHO" title="Notas, médias e boletim" description="Resultados lançados pelos professores." action={<button className="student-print" type="button" onClick={() => window.print()}>🖨 Imprimir boletim</button>} />
      <section className="student-average-grid">{data.medias.map((item) => <article key={`${item.disciplina}-${item.bimestre}`}><small>{item.disciplina} · {item.bimestre}º bimestre</small><strong>{grade(item.media)}</strong><span className={item.media >= 6 ? 'positive' : 'attention'}>{item.media >= 6 ? 'Acima da média' : 'Requer atenção'}</span></article>)}{!data.medias.length && <Empty>Nenhuma média calculada.</Empty>}</section>
      <article className="student-card student-report"><div className="student-report-head"><img src="/images/prefeitura.png" alt="Prefeitura de Pindobaçu"/><div><h2>Boletim escolar</h2><p>{data.aluno?.nome} · {data.aluno?.turma} · {data.aluno?.anoLetivo}</p></div></div><div className="student-table-wrap"><table><thead><tr><th>Data</th><th>Disciplina</th><th>Avaliação</th><th>Bimestre</th><th>Nota</th></tr></thead><tbody>{data.notas.map((item) => <tr key={item.id}><td>{date(item.data)}</td><td>{item.disciplina}</td><td><b>{item.titulo}</b><small>Vale {Number(item.valorMaximo).toFixed(1)} pontos</small></td><td>{item.bimestre}º</td><td><strong className={item.nota != null && item.nota < 6 ? 'grade-low' : 'grade-ok'}>{grade(item.nota)}</strong></td></tr>)}</tbody></table></div>{!data.notas.length && <Empty>Nenhuma nota lançada.</Empty>}</article></>;
  }

  function renderAttendance() {
    return <><SectionTitle eyebrow="ACOMPANHAMENTO" title="Frequência e faltas" description="Presenças registradas no diário de classe." />
      <section className="student-attendance"><article><small>FREQUÊNCIA</small><strong>{data.frequencia.percentual}%</strong><p>Percentual acumulado</p></article><article><small>AULAS REGISTRADAS</small><strong>{data.frequencia.aulas}</strong><p>No período atual</p></article><article><small>FALTAS</small><strong>{data.frequencia.faltas}</strong><p>Consulte as datas abaixo</p></article></section>
      <article className="student-card"><div className="student-table-wrap"><table><thead><tr><th>Data</th><th>Disciplina</th><th>Professor</th><th>Situação</th><th>Observação</th></tr></thead><tbody>{data.frequencia.registros.map((item) => <tr key={item.id}><td>{date(item.data)}</td><td>{item.disciplina}</td><td>{item.professor}</td><td><span className={item.presente ? 'student-status student-status-entregue' : 'student-status student-status-atrasada'}>{item.presente ? 'Presente' : item.justificada ? 'Falta justificada' : 'Falta'}</span></td><td>{item.observacao || '—'}</td></tr>)}</tbody></table></div>{!data.frequencia.registros.length && <Empty>Nenhum registro de frequência.</Empty>}</article></>;
  }

  function renderCalendar() {
    return <><SectionTitle eyebrow="AGENDA ESCOLAR" title="Calendário" description="Atividades, avaliações, reuniões e eventos destinados à sua turma." />
      <section className="student-timeline">{data.calendario.map((item) => <article key={`${item.origem}-${item.id}`}><time><b>{date(item.data).slice(0, 5)}</b><span>{item.horaInicio || 'Dia inteiro'}</span></time><div><small>{item.origem} · {item.tipo}</small><h2>{item.titulo}</h2><p>{item.disciplina || item.observacao || 'Evento da turma'}</p></div></article>)}{!data.calendario.length && <Empty>Nenhum evento no calendário.</Empty>}</section></>;
  }

  function renderNotifications() {
    return <><SectionTitle eyebrow="CENTRAL DE AVISOS" title="Notificações" description="Atualizações importantes da sua vida escolar." />
      <article className="student-card">{data.notificacoes.map((item) => <div className={`student-notice student-notice-full ${item.lida ? '' : 'unread'}`} key={item.id}><span>🔔</span><div><small>{item.tipo} · {new Date(item.criadoEm).toLocaleString('pt-BR')}</small><b>{item.titulo}</b><p>{item.mensagem}</p></div>{!item.lida && <i>Nova</i>}</div>)}{!data.notificacoes.length && <Empty>Nenhuma notificação.</Empty>}</article></>;
  }

  const content = {
    inicio: renderHome,
    turma: renderClass,
    materiais: renderMaterials,
    atividades: renderActivities,
    notas: renderGrades,
    frequencia: renderAttendance,
    calendario: renderCalendar,
    notificacoes: renderNotifications,
  }[selected];

  return <div className="student-portal">
    <aside className="student-sidebar"><div className="student-brand"><img src="/images/sigepin.png" alt="SIEDU-PINDOBAÇU"/><div><strong>SIEDU</strong><small>Portal do Aluno</small></div></div><nav>{sections.map(([slug, icon, label]) => <Link className={selected === slug ? 'active' : ''} to={slug === 'inicio' ? '/aluno' : `/aluno/${slug}`} key={slug}><span>{icon}</span>{label}{slug === 'notificacoes' && data.resumo.notificacoesNaoLidas > 0 && <i>{data.resumo.notificacoesNaoLidas}</i>}</Link>)}</nav><div className="student-sidebar-footer"><b>Prefeitura de Pindobaçu</b><small>Secretaria Municipal de Educação</small></div></aside>
    <div className="student-shell"><header className="student-topbar"><div><small>{data.aluno?.escola || 'Rede Municipal de Ensino'}</small><strong>{data.aluno?.turma || 'Portal do Aluno'}</strong></div><div className="student-user"><span>{(data.aluno?.nome || user?.nome || 'A').charAt(0)}</span><div><b>{data.aluno?.nomeSocial || data.aluno?.nome || user?.nome}</b><small>Aluno(a)</small></div><button type="button" onClick={onLogout}>Sair</button></div></header>
      <main className="student-content">{loading ? <div className="student-loading">Carregando seus dados escolares...</div> : error ? <div className="student-error"><h1>Não foi possível carregar o portal</h1><p>{error}</p><button type="button" onClick={() => window.location.reload()}>Tentar novamente</button></div> : content()}</main>
    </div>
  </div>;
}
