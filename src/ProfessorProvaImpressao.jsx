import React,{useEffect,useState}from'react';
import{Link,useParams}from'react-router-dom';
import{api}from'./services/api';

export default function ProfessorProvaImpressao({token}){
 const{id}=useParams(),[exam,setExam]=useState(null),[error,setError]=useState('');
 useEffect(()=>{api.getProfessorExam(id,token).then(setExam).catch(e=>setError(e.message))},[id,token]);
 if(error)return <main style={{padding:30}}><p>{error}</p><Link to="/professor/atividades">Voltar</Link></main>;
 if(!exam)return <main style={{padding:30}}>Carregando prova...</main>;
 return <main style={{maxWidth:900,margin:'auto',padding:28,fontFamily:'Arial',color:'#111',background:'#fff'}}>
  <style>{`@media print{.no-print{display:none!important}body{background:#fff}.print-page{box-shadow:none!important;margin:0!important;padding:0!important}@page{size:A4;margin:15mm}}`}</style>
  <div className="no-print" style={{display:'flex',gap:12,marginBottom:20}}><Link to="/professor/atividades">← Voltar</Link><button onClick={()=>window.print()} style={{marginLeft:'auto',background:'#176fe3',color:'#fff',border:0,padding:'10px 18px',borderRadius:7}}>🖨️ Imprimir prova</button></div>
  <article className="print-page">
   <header style={{display:'grid',gridTemplateColumns:'110px 1fr',gap:18,alignItems:'center',borderBottom:'2px solid #111',paddingBottom:12}}>
    <img src="/images/prefeitura-transparent.svg" alt="Prefeitura Municipal de Pindobaçu" style={{width:105,height:85,objectFit:'contain'}}/>
    <div style={{textAlign:'center'}}><b>PREFEITURA MUNICIPAL DE PINDOBAÇU</b><div>SECRETARIA MUNICIPAL DE EDUCAÇÃO — SIEDU</div><h2 style={{margin:'8px 0'}}>{exam.titulo}</h2></div>
   </header>
   <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:10,margin:'16px 0'}}>
    <span><b>Aluno(a):</b> ______________________________________________</span><span><b>Data:</b> {new Date(String(exam.data).slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR')}</span>
    <span><b>Turma:</b> {exam.turma} · {exam.turno||''} · Sala {exam.sala||'-'}</span><span><b>Nota:</b> ______ / {exam.valorTotal}</span>
    <span><b>Disciplina:</b> {exam.disciplina}</span><span><b>Professor:</b> {exam.professor}</span>
   </div>
   {exam.instrucoes&&<div style={{border:'1px solid #555',padding:10,marginBottom:18}}><b>Instruções:</b> {exam.instrucoes}</div>}
   {exam.questoes.map((q,i)=><section key={q.id} style={{margin:'0 0 24px',pageBreakInside:'avoid'}}>
    <p><b>{i+1}. ({q.valor} ponto{Number(q.valor)!==1?'s':''})</b> {q.enunciado}</p>
    {q.imagem&&<img src={q.imagem} alt={'Imagem da questão '+(i+1)} style={{display:'block',maxWidth:'75%',maxHeight:300,margin:'10px auto',objectFit:'contain'}}/>}
    {q.tipo==='Objetiva'&&q.alternativas.map((a,j)=><p key={j} style={{marginLeft:24}}>({String.fromCharCode(65+j)}) {a}</p>)}
    {q.tipo==='Verdadeiro ou falso'&&<p style={{marginLeft:24}}>( &nbsp; ) Verdadeiro &nbsp;&nbsp;&nbsp; ( &nbsp; ) Falso</p>}
    {q.tipo==='Discursiva'&&<div>{[1,2,3,4].map(n=><div key={n} style={{borderBottom:'1px solid #888',height:27}}/>)}</div>}
   </section>)}
   <footer style={{marginTop:30,borderTop:'1px solid #777',paddingTop:8,textAlign:'center',fontSize:12}}>Documento gerado pelo SIEDU · Prefeitura Municipal de Pindobaçu</footer>
  </article>
 </main>
}
