import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './services/api';
import { destinationFor } from './permissions';
import './aprendizagem-gestao.css';

const today = new Date().toISOString().slice(0, 10);
const inDays = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const emptyCycle = { turmaId: '', disciplina: '', titulo: '', descricao: '', instrucoes: '', dataInicio: today, dataFim: inDays(14), valorMaximo: 10, cicloNumero: 1, status: 'Publicada' };
const emptyTrail = { turmaId: '', disciplina: '', titulo: '', objetivo: '', conteudos: '', exercicios: '', criterioResultado: '', status: 'Publicada' };
const emptySaeb = { titulo: '', anoLetivo: new Date().getFullYear(), areaConhecimento: 'Língua Portuguesa e Matemática', matrizReferencia: '', serieAno: '', turmaId: '', dataAplicacao: inDays(21), horaInicio: '08:00', duracaoMinutos: 120, quantidadeQuestoes: 40, instrucoes: '', status: 'Programado' };
const formatDate = (value) => value ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '—';

function Field({ label, children, wide = false }) {
  return <label className={wide ? 'learning-wide' : ''}><span>{label}</span>{children}</label>;
}

export default function AprendizagemGestao({ user, token }) {
  const [data, setData] = useState({ permissoes: {}, turmas: [], ciclos: [], trilhas: [], simuladosSaeb: [] });
  const [cycle, setCycle] = useState(emptyCycle);
  const [trail, setTrail] = useState(emptyTrail);
  const [saeb, setSaeb] = useState(emptySaeb);
  const [editingTrail, setEditingTrail] = useState(null);
  const [grading, setGrading] = useState(null);
  const [grades, setGrades] = useState({});
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const reload = () => api.getLearningManagement(token).then(setData);
  useEffect(() => { reload().catch((requestError) => setError(requestError.message)); }, [token]);

  const gradeSixClasses = useMemo(() => data.turmas.filter((item) => Number(String(item.serieAno || '').match(/\d+/)?.[0] || 0) >= 6), [data.turmas]);
  const chosenCycleClass = data.turmas.find((item) => String(item.id) === String(cycle.turmaId) && (!cycle.disciplina || item.disciplina === cycle.disciplina));

  function chooseCycleClass(value) {
    const item = gradeSixClasses.find((entry) => `${entry.id}|${entry.disciplina || ''}` === value);
    setCycle((current) => ({ ...current, turmaId: item?.id || '', disciplina: item?.disciplina || current.disciplina }));
  }

  async function submitCycle(event) {
    event.preventDefault(); setError('');
    try {
      await api.createCycleAssessment(cycle, token);
      setNotice('Avaliação de Ciclo publicada para a turma.'); setCycle(emptyCycle); await reload();
    } catch (requestError) { setError(requestError.message); }
  }

  async function submitTrail(event) {
    event.preventDefault(); setError('');
    try {
      if (editingTrail) await api.updateRevisionTrail(editingTrail, trail, token);
      else await api.createRevisionTrail(trail, token);
      setNotice(editingTrail ? 'Trilha revisada após a análise do resultado.' : 'Trilha disponibilizada aos alunos.');
      setEditingTrail(null); setTrail(emptyTrail); await reload();
    } catch (requestError) { setError(requestError.message); }
  }

  function editTrail(item) {
    setEditingTrail(item.id);
    setTrail({ turmaId: item.turmaId, disciplina: item.disciplina, titulo: item.titulo, objetivo: item.objetivo, conteudos: item.conteudos, exercicios: item.exercicios, criterioResultado: item.criterioResultado || '', status: item.status });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function openGrades(item) {
    try {
      const result = await api.getCycleResults(item.id, token);
      setGrading({ ...item, ...result });
      setGrades(Object.fromEntries(result.alunos.map((student) => [student.alunoId, { pontos: student.pontos ?? '', feedback: student.feedback || '' }])));
    } catch (requestError) { setError(requestError.message); }
  }

  async function saveGrade(student) {
    try {
      const value = grades[student.alunoId];
      if (value?.pontos === '') throw new Error('Informe a nota antes de salvar.');
      await api.saveCycleResult(grading.id, { alunoId: student.alunoId, pontos: value.pontos, feedback: value.feedback }, token);
      setNotice(`Nota de ${student.aluno} salva.`); await reload();
    } catch (requestError) { setError(requestError.message); }
  }

  async function submitSaeb(event) {
    event.preventDefault(); setError('');
    try {
      await api.createSaebSimulation(saeb, token);
      setNotice('Simulado SAEB definido para a rede municipal.'); setSaeb(emptySaeb); await reload();
    } catch (requestError) { setError(requestError.message); }
  }

  const update = (setter) => (event) => setter((current) => ({ ...current, [event.target.name]: event.target.value }));

  return <div className="learning-management">
    <header><div><small>GESTÃO PEDAGÓGICA</small><h1>Aprendizagem, Ciclos e SAEB</h1><p>Planeje intervenções com base nos resultados reais das turmas.</p></div><Link to={destinationFor(user)}>← Voltar ao painel</Link></header>
    {notice && <p className="learning-notice">{notice}</p>}
    {error && <p className="learning-error">{error}</p>}

    <main>
      {data.permissoes.criarCiclo && <section className="learning-panel accent-blue">
        <div className="learning-heading"><span>01</span><div><h2>Avaliação de Ciclo</h2><p>Atividade quinzenal por disciplina, com nota definida pelo professor, somente a partir do 6º ano.</p></div></div>
        <form className="learning-form" onSubmit={submitCycle}>
          <Field label="Turma e disciplina"><select required value={chosenCycleClass ? `${chosenCycleClass.id}|${chosenCycleClass.disciplina || ''}` : ''} onChange={(event) => chooseCycleClass(event.target.value)}><option value="">Selecione</option>{gradeSixClasses.map((item) => <option key={`${item.id}-${item.disciplina}`} value={`${item.id}|${item.disciplina || ''}`}>{item.nome} · {item.serieAno} · {item.disciplina}</option>)}</select></Field>
          <Field label="Título"><input required name="titulo" value={cycle.titulo} onChange={update(setCycle)} /></Field>
          <Field label="Ciclo"><input required min="1" max="30" type="number" name="cicloNumero" value={cycle.cicloNumero} onChange={update(setCycle)} /></Field>
          <Field label="Valor máximo"><input required min="1" step="0.1" type="number" name="valorMaximo" value={cycle.valorMaximo} onChange={update(setCycle)} /></Field>
          <Field label="Início"><input required type="date" name="dataInicio" value={cycle.dataInicio} onChange={update(setCycle)} /></Field>
          <Field label="Entrega (até 15 dias)"><input required type="date" name="dataFim" value={cycle.dataFim} onChange={update(setCycle)} /></Field>
          <Field label="Descrição" wide><textarea name="descricao" value={cycle.descricao} onChange={update(setCycle)} /></Field>
          <Field label="Instruções" wide><textarea name="instrucoes" value={cycle.instrucoes} onChange={update(setCycle)} /></Field>
          <button type="submit">Publicar avaliação</button>
        </form>
      </section>}

      {data.permissoes.editarTrilha && <section className="learning-panel accent-green">
        <div className="learning-heading"><span>02</span><div><h2>Trilhas de Revisão</h2><p>Professor e coordenador podem criar e editar a trilha depois de analisar o resultado.</p></div></div>
        <form className="learning-form" onSubmit={submitTrail}>
          <Field label="Turma"><select required name="turmaId" value={trail.turmaId} onChange={(event) => { const item = data.turmas.find((entry) => String(entry.id) === event.target.value); setTrail((current) => ({ ...current, turmaId: event.target.value, disciplina: item?.disciplina || current.disciplina })); }}><option value="">Selecione</option>{data.turmas.map((item) => <option key={`${item.id}-${item.disciplina || 'geral'}`} value={item.id}>{item.nome} · {item.serieAno}{item.disciplina ? ` · ${item.disciplina}` : ''}</option>)}</select></Field>
          <Field label="Disciplina"><input required name="disciplina" value={trail.disciplina} onChange={update(setTrail)} /></Field>
          <Field label="Título" wide><input required name="titulo" value={trail.titulo} onChange={update(setTrail)} /></Field>
          <Field label="Objetivo" wide><textarea required name="objetivo" value={trail.objetivo} onChange={update(setTrail)} /></Field>
          <Field label="Conteúdos sugeridos" wide><textarea required name="conteudos" value={trail.conteudos} onChange={update(setTrail)} /></Field>
          <Field label="Exercícios" wide><textarea required name="exercicios" value={trail.exercicios} onChange={update(setTrail)} /></Field>
          <Field label="Resultado que motivou a revisão" wide><textarea name="criterioResultado" value={trail.criterioResultado} onChange={update(setTrail)} placeholder="Ex.: estudantes abaixo de 6,0 no Ciclo 2" /></Field>
          <button type="submit">{editingTrail ? 'Salvar nova versão' : 'Disponibilizar trilha'}</button>{editingTrail && <button className="secondary" type="button" onClick={() => { setEditingTrail(null); setTrail(emptyTrail); }}>Cancelar edição</button>}
        </form>
      </section>}

      {data.permissoes.definirSaeb && <section className="learning-panel accent-purple">
        <div className="learning-heading"><span>03</span><div><h2>Simulado SAEB</h2><p>Avaliação diagnóstica definida pela Secretaria e Coordenação de Ensino do município.</p></div></div>
        <form className="learning-form" onSubmit={submitSaeb}>
          <Field label="Título" wide><input required name="titulo" value={saeb.titulo} onChange={update(setSaeb)} /></Field>
          <Field label="Área de conhecimento"><input required name="areaConhecimento" value={saeb.areaConhecimento} onChange={update(setSaeb)} /></Field>
          <Field label="Série/ano (vazio = toda rede)"><input name="serieAno" value={saeb.serieAno} onChange={update(setSaeb)} /></Field>
          <Field label="Turma específica (opcional)"><select name="turmaId" value={saeb.turmaId} onChange={update(setSaeb)}><option value="">Toda a rede/série</option>{data.turmas.map((item) => <option key={item.id} value={item.id}>{item.nome} · {item.serieAno}</option>)}</select></Field>
          <Field label="Data"><input required type="date" name="dataAplicacao" value={saeb.dataAplicacao} onChange={update(setSaeb)} /></Field>
          <Field label="Horário"><input required type="time" name="horaInicio" value={saeb.horaInicio} onChange={update(setSaeb)} /></Field>
          <Field label="Duração (minutos)"><input required type="number" min="15" max="360" name="duracaoMinutos" value={saeb.duracaoMinutos} onChange={update(setSaeb)} /></Field>
          <Field label="Questões"><input required type="number" min="1" max="200" name="quantidadeQuestoes" value={saeb.quantidadeQuestoes} onChange={update(setSaeb)} /></Field>
          <Field label="Matriz de referência" wide><textarea required name="matrizReferencia" value={saeb.matrizReferencia} onChange={update(setSaeb)} /></Field>
          <Field label="Instruções" wide><textarea name="instrucoes" value={saeb.instrucoes} onChange={update(setSaeb)} /></Field>
          <button type="submit">Programar Simulado SAEB</button>
        </form>
      </section>}

      <section className="learning-list-grid">
        <article className="learning-panel"><h2>Avaliações de Ciclo</h2>{data.ciclos.map((item) => <div className="learning-row" key={item.id}><div><b>{item.titulo}</b><small>{item.turma} · {item.disciplina} · {formatDate(item.dataFim)}</small></div><span>{item.resultadosLancados} nota(s)</span>{data.permissoes.criarCiclo && <button type="button" onClick={() => openGrades(item)}>Lançar notas</button>}</div>)}{!data.ciclos.length && <p>Nenhuma avaliação cadastrada.</p>}</article>
        <article className="learning-panel"><h2>Trilhas publicadas</h2>{data.trilhas.map((item) => <div className="learning-row" key={item.id}><div><b>{item.titulo}</b><small>{item.turma} · {item.disciplina} · versão {item.versao}</small></div>{data.permissoes.editarTrilha && <button type="button" onClick={() => editTrail(item)}>Editar após resultado</button>}</div>)}{!data.trilhas.length && <p>Nenhuma trilha cadastrada.</p>}</article>
        <article className="learning-panel"><h2>Agenda SAEB</h2>{data.simuladosSaeb.map((item) => <div className="learning-row" key={item.id}><div><b>{item.titulo}</b><small>{formatDate(item.dataAplicacao)} · {item.areaConhecimento} · {item.turma || item.serieAno || 'Toda a rede'}</small></div><span>{item.status}</span></div>)}{!data.simuladosSaeb.length && <p>Nenhum simulado programado.</p>}</article>
      </section>
    </main>

    {grading && <div className="learning-modal" role="dialog" aria-modal="true"><section><header><div><small>LANÇAMENTO DE NOTAS</small><h2>{grading.titulo}</h2><p>Valor máximo: {Number(grading.valorMaximo).toFixed(1)}</p></div><button type="button" onClick={() => setGrading(null)}>Fechar</button></header>{grading.alunos.map((student) => <div className="learning-grade-row" key={student.alunoId}><b>{student.aluno}</b><input aria-label={`Nota de ${student.aluno}`} type="number" min="0" max={grading.valorMaximo} step="0.1" value={grades[student.alunoId]?.pontos ?? ''} onChange={(event) => setGrades((current) => ({ ...current, [student.alunoId]: { ...current[student.alunoId], pontos: event.target.value } }))} /><input aria-label={`Feedback de ${student.aluno}`} placeholder="Feedback ao aluno" value={grades[student.alunoId]?.feedback || ''} onChange={(event) => setGrades((current) => ({ ...current, [student.alunoId]: { ...current[student.alunoId], feedback: event.target.value } }))} /><button type="button" onClick={() => saveGrade(student)}>Salvar</button></div>)}</section></div>}
  </div>;
}
