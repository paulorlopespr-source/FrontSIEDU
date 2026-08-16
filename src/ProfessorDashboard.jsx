import React, { useEffect, useState } from 'react';
import { api } from './services/api';

const panel = { background:'#fff', borderRadius:14, padding:20, boxShadow:'0 3px 16px #dbe4f280' };
export default function ProfessorDashboard({ user, token, onLogout }) {
  const [data,setData]=useState({ professor:null, turmas:[], resumo:{ turmas:0, alunos:0, aulas:0, atividades:0, avaliacoes:0, faltasHoje:0 } });
  const [profile,setProfile]=useState({tema:'claro',corDestaque:'#176fe3',foto:null});
  const [notice,setNotice]=useState('');
  useEffect(()=>{ Promise.all([api.getProfessorDashboard(token),api.getProfessorProfile(token)]).then(([dashboard,personal])=>{setData(dashboard);setProfile(personal)}).catch(e=>setNotice(e.message)); },[token]);
  const shortcuts=[
    ['👥','Minhas Turmas','Acesse somente suas turmas e alunos'],
    ['📖','Diário de Classe','Registre aulas, conteúdo e frequência'],
    ['✅','Lançar Notas','Lance e edite notas das avaliações'],
    ['✍️','Planejamento de Aula','Planeje aulas, objetivos e conteúdos'],
    ['📋','Plano de Aula','Envie seus planos para aprovação'],
    ['📝','Atividades e Avaliações','Programe atividades, provas e testes'],
    ['▶️','Materiais da Aula','Compartilhe vídeos, textos e arquivos'],
    ['📊','Relatórios','Relatórios das suas próprias turmas'],
    ['📅','Calendário Escolar','Eventos, reuniões e datas importantes'],
    ['🧭','Ciclos e Trilhas','Avaliações quinzenais, notas e revisão por resultado'],
    ['✉️','Mensagens','Comunicação com coordenação, gestão e turmas'],
    ['⚙️','Meu Perfil','Foto, senha, contatos e personalização'],
  ];
  const dark=profile.tema==='escuro'||(profile.tema==='sistema'&&window.matchMedia?.('(prefers-color-scheme: dark)').matches);const accent=profile.corDestaque||'#176fe3';
  return <div style={{minHeight:'100vh',background:dark?'#101827':'#f5f8fd',color:dark?'#edf4ff':'#071f52',fontFamily:'Arial,sans-serif'}}>
    <header style={{height:78,background:'#fff',display:'flex',alignItems:'center',gap:24,padding:'0 3%',boxShadow:'0 2px 12px #dbe4f270'}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}><img className="portal-header-logo" src="/images/prefeitura.png" alt="Prefeitura Municipal de Pindobaçu"/><b style={{fontSize:22}}>☰ &nbsp; Portal do Professor</b></div>
      <div style={{margin:'0 auto',width:'min(42vw,500px)',border:'1px solid #d5e0ef',borderRadius:11,padding:'13px 18px',color:'#7183a3'}}>⌕ &nbsp; Pesquisar alunos, turmas e conteúdos...</div>
      {profile.foto&&<img src={profile.foto} alt="Foto do professor" style={{width:46,height:46,borderRadius:'50%',objectFit:'cover'}}/>}<div><b>{profile.nome||user?.nome||'Professor(a)'}</b><small style={{display:'block',color:'#607399'}}>{data.professor?.disciplina||'Professor da Rede Municipal'}</small></div>
      <button type="button" onClick={onLogout}>Sair</button>
    </header>
    <main style={{display:'grid',gridTemplateColumns:'250px 1fr',minHeight:'calc(100vh - 78px)'}}>
      <aside style={{background:`linear-gradient(${accent},#042958)`,color:'#fff',padding:'28px 16px'}}>
        <h1 style={{margin:0,fontSize:30}}>🎓 SIEDU</h1><p style={{fontSize:13}}>Sistema Integrado de Educação</p>
        {[['🏠 Início','/professor'],['👥 Minhas Turmas','/professor/turmas'],['📖 Diário de Classe','/professor/diario'],['✅ Lançar Notas','/professor/notas'],['✍️ Planejamento de Aula','/professor/planejamento'],['📋 Plano de Aula','/professor/planos'],['📝 Atividades e Avaliações','/professor/atividades'],['▶️ Materiais da Aula','/professor/materiais'],['📊 Relatórios','/professor/relatorios'],['✉️ Mensagens','/professor/mensagens'],['📅 Calendário','/professor/calendario'],['⚙️ Configurações','/professor/perfil']].map(([label,path],i)=><button type="button" key={label} onClick={()=>window.location.assign(path)} style={{display:'block',width:'100%',color:'#fff',border:0,padding:'12px 10px',marginTop:i===0?20:2,borderRadius:8,background:i===0?'#1476ef':'transparent',textAlign:'left'}}>{label}</button>)}
        <p style={{marginTop:40,borderTop:'1px solid #ffffff33',paddingTop:18,fontSize:12}}>Prefeitura Municipal de Pindobaçu - Bahia</p>
      </aside>
      <section style={{padding:'34px 3.5%'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:20,flexWrap:'wrap'}}><div><h1>Olá, Professor {user?.nome?.split(' ')[0]}! 👋</h1><p>Gerencie exclusivamente suas turmas, aulas e avaliações.</p></div><blockquote style={{...panel,maxWidth:300,color:'#1459bd'}}>“Ensinar não é transferir conhecimento, mas criar possibilidades.”<br/><b>— Paulo Freire</b></blockquote></div>
        {notice&&<p style={{background:'#fff1f1',color:'#a52626',padding:12}}>{notice}</p>}
        <h2>Acesso rápido</h2><section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:13}}>{shortcuts.map(([icon,title,desc])=><button key={title} type="button" onClick={()=>title==='Minhas Turmas'?window.location.assign('/professor/turmas'):title==='Diário de Classe'?window.location.assign('/professor/diario'):title==='Lançar Notas'?window.location.assign('/professor/notas'):title==='Planejamento de Aula'?window.location.assign('/professor/planejamento'):title==='Plano de Aula'?window.location.assign('/professor/planos'):title==='Atividades e Avaliações'?window.location.assign('/professor/atividades'):title==='Materiais da Aula'?window.location.assign('/professor/materiais'):title==='Relatórios'?window.location.assign('/professor/relatorios'):title==='Calendário Escolar'?window.location.assign('/professor/calendario'):title==='Ciclos e Trilhas'?window.location.assign('/aprendizagem'):title==='Mensagens'?window.location.assign('/professor/mensagens'):title==='Meu Perfil'?window.location.assign('/professor/perfil'):setNotice(title+' aberto para sua área de trabalho.')} style={{...panel,border:0,textAlign:'left',display:'flex',gap:14,color:'#071f52'}}><span style={{fontSize:27}}>{icon}</span><span><b>{title}</b><small style={{display:'block',marginTop:6,color:'#566b91'}}>{desc}</small></span></button>)}</section>
        <section style={{display:'grid',gridTemplateColumns:'1.15fr 1fr .8fr',gap:16,marginTop:18}}>
          <article style={panel}><h3>📚 Minhas turmas atribuídas</h3>{data.turmas.length?data.turmas.map(t=><p key={t.id} style={{borderTop:'1px solid #edf1f7',paddingTop:10}}><b>{t.nome}</b> — {t.componenteCurricular||'Componente não informado'}<br/><small>{t.turno} · {t.alunosMatriculados} alunos · Sala {t.sala||'-'}</small></p>):<p>Nenhuma turma atribuída ao professor.</p>}</article>
          <article style={panel}><h3>📅 Próximas atividades</h3><p><b>15 AGO</b> — Avaliação bimestral</p><p><b>18 AGO</b> — Entrega de planejamento</p><p><b>22 AGO</b> — Conselho de classe</p><p><b>25 AGO</b> — Reunião pedagógica</p></article>
          <article style={panel}><h3>📊 Resumo</h3>{[['Aulas',data.resumo.aulas],['Atividades',data.resumo.atividades],['Avaliações',data.resumo.avaliacoes],['Turmas',data.resumo.turmas]].map(([l,v])=><p key={l} style={{display:'flex',justifyContent:'space-between'}}><span>{l}</span><b>{v}</b></p>)}<p style={{color:data.resumo.faltasHoje?'#d62828':'#16864b'}}><b>{data.resumo.faltasHoje}</b> faltas registradas hoje</p></article>
        </section>
        <p style={{marginTop:20,background:'#eaf3ff',borderLeft:'4px solid #176fe3',padding:14}}><b>Segurança:</b> este perfil acessa apenas turmas vinculadas ao seu cadastro. Não pode cadastrar usuários, escolas, turmas, funcionários ou alterar dados de outras unidades.</p>
      </section>
    </main>
  </div>;
}
