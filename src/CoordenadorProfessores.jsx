import React from 'react';
import { Link } from 'react-router-dom';

const areas = [
  ['📘', 'Acompanhamento pedagógico', 'Supervisionar planos de aula, observar aulas e orientar didáticas.', '/coordenacao/planos'],
  ['🎓', 'Formação continuada', 'Planejar e registrar capacitações, HTPC e encontros formativos.', '/gestao-municipal?tab=agenda'],
  ['🤝', 'Mediação pedagógica', 'Mediar relações entre professores, direção e famílias.', '/coordenacao'],
  ['⚠️', 'Ocorrências e acompanhamento', 'Registrar ocorrências e acompanhar encaminhamentos disciplinares.', '/coordenacao'],
  ['📊', 'Avaliação institucional', 'Aplicar e analisar avaliações diagnósticas e resultados da rede.', '/gestao-municipal?tab=indicadores'],
];
const steps = [
  ['1', 'Coordenador define diretrizes', 'BNCC, calendário e metas'], ['2', 'Professor elabora plano de aula', 'Objetivos, conteúdos e metodologia'],
  ['3', 'Coordenador revisa e aprova', 'Feedback, ajustes e aprovação'], ['4', 'Professor executa e registra', 'Aula, conteúdo e frequência no diário'],
  ['5', 'Sistema gera indicadores', 'Frequência, notas e IDEB'], ['6', 'Coordenador monitora', 'Acompanha turmas e professores'],
  ['7', 'Aluno/turma em risco', 'Convoca reunião com o professor'], ['8', 'Plano de intervenção', 'Definição conjunta de estratégias'],
  ['9', 'Professor aplica e coordenador acompanha', 'Avaliação do resultado e novo ciclo'],
];

export default function CoordenadorProfessores({ user, onLogout }) {
  return <div style={{ minHeight: '100vh', background: '#f4f7fc', color: '#09245a', fontFamily: 'Arial, sans-serif' }}>
    <header style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 4%', background: '#fff', borderBottom: '1px solid #dce5f0' }}><Link to="/coordenacao">← Portal do Coordenador</Link><b style={{ fontSize: 23 }}>👩‍🏫 Módulo de Professores</b><span style={{ marginLeft: 'auto' }}>{user?.nome}</span><button type="button" onClick={onLogout}>Sair</button></header>
    <main style={{ maxWidth: 1280, margin: 'auto', padding: '30px 4%' }}><small style={{ color: '#1476ef', fontWeight: 900, letterSpacing: '.12em' }}>COORDENAÇÃO PEDAGÓGICA</small><h1 style={{ margin: '7px 0' }}>Professores e aprendizagem</h1><p style={{ color: '#607399' }}>Integre planejamento, acompanhamento, formação e intervenção pedagógica em um único fluxo.</p>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, margin: '24px 0' }}>{areas.map(([icon, title, text, link]) => <Link key={title} to={link} style={{ padding: 20, borderRadius: 13, background: '#fff', border: '1px solid #dce7f5', textDecoration: 'none', color: '#09245a', boxShadow: '0 5px 16px #123a7a0b' }}><span style={{ fontSize: 28 }}>{icon}</span><h2 style={{ fontSize: 17, margin: '10px 0 6px' }}>{title}</h2><p style={{ margin: 0, color: '#607399', lineHeight: 1.45, fontSize: 13 }}>{text}</p><strong style={{ display: 'block', marginTop: 13, color: '#1476ef', fontSize: 12 }}>Acessar módulo →</strong></Link>)}</section>
      <section style={{ padding: 22, borderRadius: 13, background: '#fff', border: '1px solid #dce7f5', boxShadow: '0 5px 16px #123a7a0b' }}><h2 style={{ marginTop: 0 }}>Como coordenador e professor trabalham juntos</h2><div style={{ display: 'grid', gap: 9 }}>{steps.map(([number, title, text], index) => <div key={number} style={{ display: 'grid', gridTemplateColumns: '34px 1fr', gap: 12, alignItems: 'center', padding: '11px 0', borderBottom: index === steps.length - 1 ? 0 : '1px solid #edf1f7' }}><b style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: '50%', background: index === 2 || index === 7 ? '#176fe3' : '#eaf2ff', color: index === 2 || index === 7 ? '#fff' : '#176fe3' }}>{number}</b><span><strong>{title}</strong><small style={{ display: 'block', marginTop: 3, color: '#607399' }}>{text}</small></span>{index < steps.length - 1 && <span style={{ display: 'none' }}>↓</span>}</div>)}</div></section>
    </main>
  </div>;
}
