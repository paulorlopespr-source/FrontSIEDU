import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from './services/api';
const box={background:'#fff',padding:22,borderRadius:14,boxShadow:'0 3px 16px #dce5f080'};
export default function ProfessorDiario({token,user}){
 const [data,setData]=useState({turmas:[]}); const [students,setStudents]=useState([]); const [records,setRecords]=useState([]); const [message,setMessage]=useState(''); const [error,setError]=useState('');
 const [form,setForm]=useState({turmaId:'',data:new Date().toISOString().slice(0,10),quantidadeAulas:1,conteudo:'',metodologia:'',observacoes:'',frequencias:[]});
 useEffect(()=>{Promise.all([api.getProfessorDashboard(token),api.listProfessorDiaries(token)]).then(([d,r])=>{setData(d);setRecords(r);}).catch(e=>setError(e.message));},[token]);
 useEffect(()=>{if(!form.turmaId){setStudents([]);return;} api.getProfessorClassStudents(form.turmaId,token).then(list=>{setStudents(list);setForm(f=>({...f,frequencias:list.map(a=>({alunoId:a.id,presente:true,justificada:false,observacao:''}))}));}).catch(e=>setError(e.message));},[form.turmaId,token]);
 const attendance=(id,patch)=>setForm(f=>({...f,frequencias:f.frequencias.map(x=>x.alunoId===id?{...x,...patch}:x)}));
 async function save(e){e.preventDefault();setError('');setMessage('');try{await api.saveProfessorDiary({...form,turmaId:Number(form.turmaId),quantidadeAulas:Number(form.quantidadeAulas)},token);setMessage('Aula, conteúdo e frequência registrados com sucesso.');setRecords(await api.listProfessorDiaries(token));}catch(err){setError(err.message);}}
 return <div style={{minHeight:'100vh',background:'#f4f7fc',color:'#082458',fontFamily:'Arial'}}>
  <header style={{background:'#fff',padding:'12px 4%',display:'flex',alignItems:'center',gap:20,borderBottom:'1px solid #dce5f0'}}>
   <img src="/images/prefeitura.png" alt="Prefeitura Municipal de Pindobaçu" style={{width:76,height:62,objectFit:'contain'}}/>
   <div><b style={{fontSize:22}}>Diário de Classe — SIEDU</b><small style={{display:'block'}}>Prefeitura Municipal de Pindobaçu · Secretaria Municipal de Educação</small></div>
   <Link to="/professor" style={{marginLeft:'auto'}}>← Portal do Professor</Link>
  </header>
  <main style={{maxWidth:1250,margin:'auto',padding:'28px 4%'}}>
   <div><h1>📖 Registro de aula e frequência</h1><p>Professor: <b>{user?.nome}</b>. O diário permite registrar somente turmas atribuídas ao seu perfil.</p></div>
   {message&&<p style={{background:'#e5f7ec',color:'#15663d',padding:13}}>{message}</p>}{error&&<p style={{background:'#fee',color:'#a22',padding:13}}>{error}</p>}
   <form onSubmit={save} style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:18}}>
    <section style={box}><h2>Dados da aula</h2>
     <label style={{display:'block',marginBottom:14}}>Turma<select required value={form.turmaId} onChange={e=>setForm({...form,turmaId:e.target.value})} style={{display:'block',width:'100%',padding:11,marginTop:5}}><option value="">Selecione sua turma</option>{data.turmas.map(t=><option key={t.id} value={t.id}>{t.nome} — {t.componenteCurricular}</option>)}</select></label>
     <label style={{display:'block',marginBottom:14}}>Data da aula<input required type="date" value={form.data} onChange={e=>setForm({...form,data:e.target.value})} style={{display:'block',width:'100%',padding:10,marginTop:5}}/></label>
     <label style={{display:'block',marginBottom:14}}>Quantidade de aulas<input required type="number" min="1" max="10" value={form.quantidadeAulas} onChange={e=>setForm({...form,quantidadeAulas:e.target.value})} style={{display:'block',width:'100%',padding:10,marginTop:5}}/></label>
     <label style={{display:'block',marginBottom:14}}>Conteúdo ministrado<textarea required rows="5" value={form.conteudo} onChange={e=>setForm({...form,conteudo:e.target.value})} placeholder="Descreva conteúdos, habilidades e objetos de conhecimento..." style={{display:'block',width:'100%',padding:10,marginTop:5}}/></label>
     <label style={{display:'block',marginBottom:14}}>Metodologia<textarea rows="3" value={form.metodologia} onChange={e=>setForm({...form,metodologia:e.target.value})} placeholder="Aula expositiva, atividade prática..." style={{display:'block',width:'100%',padding:10,marginTop:5}}/></label>
     <label style={{display:'block'}}>Observações<textarea rows="3" value={form.observacoes} onChange={e=>setForm({...form,observacoes:e.target.value})} style={{display:'block',width:'100%',padding:10,marginTop:5}}/></label>
    </section>
    <section style={box}><h2>✅ Chamada dos alunos</h2>{!form.turmaId&&<p>Selecione uma turma para carregar os alunos.</p>}{students.map(a=>{const f=form.frequencias.find(x=>x.alunoId===a.id)||{};return <div key={a.id} style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:12,alignItems:'center',padding:'12px 0',borderBottom:'1px solid #edf1f7'}}><b>{a.nomeSocial||a.nome}</b><label style={{color:f.presente?'#17864a':'#c62828'}}><input type="checkbox" checked={f.presente!==false} onChange={e=>attendance(a.id,{presente:e.target.checked,justificada:e.target.checked?false:f.justificada})}/> {f.presente!==false?'Presente':'Falta'}</label><label><input type="checkbox" disabled={f.presente!==false} checked={Boolean(f.justificada)} onChange={e=>attendance(a.id,{justificada:e.target.checked})}/> Justificada</label></div>})}{form.turmaId&&!students.length&&<p>Nenhum aluno matriculado.</p>}
     <button type="submit" disabled={!form.turmaId||!students.length} style={{marginTop:18,background:'#126ee3',color:'#fff',border:0,borderRadius:9,padding:'13px 20px',fontWeight:700}}>💾 Salvar Diário de Classe</button>
    </section>
   </form>
   <section style={{...box,marginTop:18}}><h2>Registros recentes</h2><div style={{overflow:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th>Data</th><th>Turma</th><th>Disciplina</th><th>Conteúdo</th><th>Aulas</th><th>Faltas</th></tr></thead><tbody>{records.map(r=><tr key={r.id}><td>{new Date(r.data).toLocaleDateString('pt-BR')}</td><td>{r.turma}</td><td>{r.disciplina}</td><td>{r.conteudo}</td><td>{r.quantidadeAulas}</td><td style={{color:r.faltas?'#c62828':'#17864a'}}>{r.faltas||0}</td></tr>)}</tbody></table></div>{!records.length&&<p>Nenhuma aula registrada.</p>}</section>
  </main>
 </div>;
}
