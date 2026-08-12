import React,{useEffect,useMemo,useState}from'react';
import{Link}from'react-router-dom';
import{api}from'./services/api';

const card={background:'#fff',padding:20,borderRadius:14,boxShadow:'0 3px 15px #dce5f080'};
const field={display:'block',width:'100%',padding:10,marginTop:5,boxSizing:'border-box',border:'1px solid #b9c9df',borderRadius:7};

export default function ProfessorBancoQuestoes({token,data,schedule,onChanged}){
 const[questions,setQuestions]=useState([]),[exams,setExams]=useState([]),[msg,setMsg]=useState(''),[error,setError]=useState('');
 const[q,setQ]=useState({turmaId:'',tipo:'Objetiva',enunciado:'',alternativas:['','','',''],respostaGabarito:'',imagem:'',valor:'1'});
 const[exam,setExam]=useState({turmaId:'',titulo:'',data:'',instrucoes:'Leia atentamente e responda todas as questões.',questaoIds:[]});
 async function load(){try{const[a,b]=await Promise.all([api.listProfessorQuestions(token),api.listProfessorExams(token)]);setQuestions(a);setExams(b)}catch(e){setError(e.message)}}
 useEffect(()=>{load()},[token]);
 const selectedClass=data.turmas.find(t=>String(t.id)===String(exam.turmaId));
 const compatible=questions.filter(x=>!selectedClass||x.disciplina===selectedClass.componenteCurricular);
 const availableDates=useMemo(()=>{const result=[];const hs=schedule.filter(h=>String(h.turmaId)===String(exam.turmaId));for(let i=0;i<90;i++){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+i);const slots=hs.filter(h=>h.diaSemana===d.getDay());if(slots.length)result.push({value:d.toISOString().slice(0,10),label:d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})+' · '+slots.map(h=>h.horaInicio+'–'+h.horaFim).join(', ')})}return result},[schedule,exam.turmaId]);
 function imageFile(e){const file=e.target.files?.[0];if(!file)return;if(file.size>1500000){setError('A imagem deve ter no máximo 1,5 MB.');return}const reader=new FileReader();reader.onload=()=>setQ(v=>({...v,imagem:String(reader.result)}));reader.readAsDataURL(file)}
 async function saveQuestion(e){e.preventDefault();setError('');setMsg('');try{await api.createProfessorQuestion(q,token);setMsg('Questão adicionada ao seu banco.');setQ({...q,enunciado:'',alternativas:['','','',''],respostaGabarito:'',imagem:'',valor:'1'});await load()}catch(x){setError(x.message)}}
 function toggle(id){setExam(v=>({...v,questaoIds:v.questaoIds.includes(id)?v.questaoIds.filter(x=>x!==id):[...v.questaoIds,id]}))}
 async function saveExam(e){e.preventDefault();setError('');setMsg('');try{const saved=await api.createProfessorExam(exam,token);setMsg('Prova criada e lançada no calendário da turma.');setExam({...exam,titulo:'',data:'',questaoIds:[]});await load();if(onChanged)await onChanged();window.open('/professor/provas/'+saved.id+'/imprimir','_blank')}catch(x){setError(x.message)}}
 return <section style={{marginTop:24}}>
  <h1>📚 Banco de questões e criação de provas</h1>
  <p>Crie questões reutilizáveis da sua disciplina, monte avaliações e gere a versão oficial para impressão.</p>
  {msg&&<p style={{background:'#e5f7ec',color:'#16613d',padding:12,borderRadius:8}}>{msg}</p>}
  {error&&<p style={{background:'#fee',color:'#a22',padding:12,borderRadius:8}}>{error}</p>}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(360px,1fr))',gap:18}}>
   <form onSubmit={saveQuestion} style={card}>
    <h2>➕ Nova questão</h2>
    <label>Turma e disciplina<select required value={q.turmaId} onChange={e=>setQ({...q,turmaId:e.target.value})} style={field}><option value="">Selecione</option>{data.turmas.map(t=><option key={t.id} value={t.id}>{t.nome} — {t.componenteCurricular}</option>)}</select></label>
    <label>Tipo<select value={q.tipo} onChange={e=>setQ({...q,tipo:e.target.value})} style={field}><option>Objetiva</option><option>Discursiva</option><option>Verdadeiro ou falso</option></select></label>
    <label>Enunciado<textarea required rows="4" value={q.enunciado} onChange={e=>setQ({...q,enunciado:e.target.value})} style={field}/></label>
    {q.tipo==='Objetiva'&&q.alternativas.map((a,i)=><label key={i}>Alternativa {String.fromCharCode(65+i)}<input value={a} onChange={e=>{const arr=[...q.alternativas];arr[i]=e.target.value;setQ({...q,alternativas:arr})}} style={field}/></label>)}
    <label>Resposta/gabarito<input value={q.respostaGabarito} onChange={e=>setQ({...q,respostaGabarito:e.target.value})} placeholder="Ex.: B ou resposta esperada" style={field}/></label>
    <label>Valor da questão<input type="number" min=".1" max="10" step=".1" value={q.valor} onChange={e=>setQ({...q,valor:e.target.value})} style={field}/></label>
    <label>Link de imagem<input type="url" value={q.imagem.startsWith('data:')?'':q.imagem} onChange={e=>setQ({...q,imagem:e.target.value})} placeholder="https://..." style={field}/></label>
    <label>Ou enviar imagem<input type="file" accept="image/png,image/jpeg,image/webp" onChange={imageFile} style={field}/></label>
    {q.imagem&&<img src={q.imagem} alt="Prévia da questão" style={{maxWidth:'100%',maxHeight:180,marginTop:10,borderRadius:8}}/>}
    <button style={{marginTop:14,background:'#0a9f68',color:'#fff',border:0,padding:'12px 18px',borderRadius:8,fontWeight:700}}>💾 Salvar no banco</button>
   </form>
   <form onSubmit={saveExam} style={card}>
    <h2>🧾 Montar prova</h2>
    <label>Turma<select required value={exam.turmaId} onChange={e=>setExam({...exam,turmaId:e.target.value,data:'',questaoIds:[]})} style={field}><option value="">Selecione</option>{data.turmas.map(t=><option key={t.id} value={t.id}>{t.nome} — {t.componenteCurricular}</option>)}</select></label>
    <label>Título<input required value={exam.titulo} onChange={e=>setExam({...exam,titulo:e.target.value})} placeholder="Ex.: Avaliação da I Unidade" style={field}/></label>
    <label>Data e horário da grade<select required value={exam.data} onChange={e=>setExam({...exam,data:e.target.value})} style={field}><option value="">Selecione uma data disponível</option>{availableDates.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}</select></label>
    <label>Instruções<textarea rows="3" value={exam.instrucoes} onChange={e=>setExam({...exam,instrucoes:e.target.value})} style={field}/></label>
    <h3>Selecionar questões ({exam.questaoIds.length})</h3>
    <div style={{maxHeight:420,overflow:'auto',border:'1px solid #dce5f0',borderRadius:8}}>
     {compatible.map((item,i)=><label key={item.id} style={{display:'block',padding:12,borderBottom:'1px solid #edf1f7',cursor:'pointer'}}><input type="checkbox" checked={exam.questaoIds.includes(item.id)} onChange={()=>toggle(item.id)}/> <b>{i+1}. {item.tipo}</b> · {item.valor} ponto(s)<div style={{margin:'6px 0 0 24px'}}>{item.enunciado}</div>{item.imagem&&<img src={item.imagem} alt="" style={{maxWidth:160,maxHeight:90,margin:'8px 0 0 24px'}}/>}</label>)}
     {!compatible.length&&<p style={{padding:12}}>Cadastre questões desta disciplina para montar a prova.</p>}
    </div>
    <p><b>Valor selecionado:</b> {compatible.filter(x=>exam.questaoIds.includes(x.id)).reduce((s,x)=>s+Number(x.valor),0).toFixed(1)} ponto(s)</p>
    <button style={{background:'#176fe3',color:'#fff',border:0,padding:'12px 18px',borderRadius:8,fontWeight:700}}>🖨️ Criar prova e abrir impressão</button>
   </form>
  </div>
  <div style={{...card,marginTop:18}}><h2>🗂️ Provas criadas</h2>{exams.map(x=><div key={x.id} style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',padding:'12px 0',borderBottom:'1px solid #edf1f7'}}><b>{x.titulo}</b><span>{x.turma} · {new Date(String(x.data).slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR')} · {x.horaInicio} às {x.horaFim}</span><span>{x.quantidadeQuestoes} questões · {x.valorTotal} pontos</span><Link to={'/professor/provas/'+x.id+'/imprimir'} target="_blank" style={{marginLeft:'auto'}}>🖨️ Abrir e imprimir</Link></div>)}{!exams.length&&<p>Nenhuma prova criada.</p>}</div>
 </section>
}
