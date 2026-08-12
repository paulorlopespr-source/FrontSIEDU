import React,{useEffect,useState}from'react';
import{Link}from'react-router-dom';
import{api}from'./services/api';

const card={background:'#fff',padding:20,borderRadius:14,boxShadow:'0 3px 15px #dce5f080'};
const input={display:'block',width:'100%',padding:10,marginTop:5,boxSizing:'border-box',border:'1px solid #b9c9df',borderRadius:7};
const icons={Texto:'📝',Vídeo:'🎬',Livro:'📚',Slide:'📊',Documento:'📄',Imagem:'🖼️',Link:'🔗',Outro:'📎'};

export default function ProfessorMateriais({token}){
 const[data,setData]=useState({turmas:[]}),[items,setItems]=useState([]),[filter,setFilter]=useState(''),[msg,setMsg]=useState(''),[error,setError]=useState('');
 const[form,setForm]=useState({turmaId:'',titulo:'',tipo:'Texto',descricao:'',conteudoTexto:'',urlExterna:'',arquivoDados:'',arquivoNome:'',arquivoMime:''});
 async function load(){try{const[d,m]=await Promise.all([api.getProfessorDashboard(token),api.listClassMaterials(filter,token)]);setData(d);setItems(m)}catch(e){setError(e.message)}}
 useEffect(()=>{load()},[token,filter]);
 function chooseFile(e){const file=e.target.files?.[0];if(!file)return;if(file.size>5000000){setError('O arquivo deve ter no máximo 5 MB.');return}const reader=new FileReader();reader.onload=()=>setForm(v=>({...v,arquivoDados:String(reader.result),arquivoNome:file.name,arquivoMime:file.type||'application/octet-stream'}));reader.readAsDataURL(file)}
 async function save(e){e.preventDefault();setError('');setMsg('');try{await api.createClassMaterial(form,token);setMsg('Material publicado para os alunos da turma.');setForm({...form,titulo:'',descricao:'',conteudoTexto:'',urlExterna:'',arquivoDados:'',arquivoNome:'',arquivoMime:''});await load()}catch(x){setError(x.message)}}
 async function edit(item){const titulo=window.prompt('Título do material:',item.titulo);if(titulo===null)return;const descricao=window.prompt('Descrição:',item.descricao||'');if(descricao===null)return;try{await api.updateClassMaterial(item.id,{titulo,descricao,conteudoTexto:item.conteudoTexto,urlExterna:item.urlExterna,publicado:item.publicado},token);setMsg('Material atualizado.');await load()}catch(x){setError(x.message)}}
 async function remove(item){if(!window.confirm('Excluir definitivamente o material “'+item.titulo+'”?'))return;try{await api.deleteClassMaterial(item.id,token);setMsg('Material excluído.');await load()}catch(x){setError(x.message)}}
 return <div style={{minHeight:'100vh',background:'#f4f7fc',color:'#09245a',fontFamily:'Arial'}}>
  <header style={{background:'#fff',padding:'12px 4%',display:'flex',alignItems:'center',gap:18,borderBottom:'1px solid #dce5f0'}}><img src="/images/prefeitura.png" alt="Prefeitura Municipal de Pindobaçu" style={{width:78,height:62,objectFit:'contain'}}/><div><b style={{fontSize:22}}>Materiais da Aula — SIEDU</b><small style={{display:'block'}}>Biblioteca digital das turmas do professor</small></div><Link to="/professor" style={{marginLeft:'auto'}}>← Portal do Professor</Link></header>
  <main style={{maxWidth:1280,margin:'auto',padding:'28px 4%'}}><h1>▶️ Materiais para ensino e aprendizagem</h1><p>Compartilhe textos, vídeos, livros, slides, imagens, documentos e links. Os alunos podem visualizar e baixar, sem permissão para alterar ou excluir.</p>
  {msg&&<p style={{background:'#e5f7ec',color:'#16613d',padding:12,borderRadius:8}}>{msg}</p>}{error&&<p style={{background:'#fee',color:'#a22',padding:12,borderRadius:8}}>{error}</p>}
  <section style={{display:'grid',gridTemplateColumns:'minmax(330px,.8fr) minmax(500px,1.5fr)',gap:20}}>
   <form onSubmit={save} style={card}><h2>➕ Publicar material</h2>
    <label>Turma<select required value={form.turmaId} onChange={e=>setForm({...form,turmaId:e.target.value})} style={input}><option value="">Selecione</option>{data.turmas.map(t=><option key={t.id} value={t.id}>{t.nome} — {t.componenteCurricular}</option>)}</select></label>
    <label>Tipo<select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} style={input}>{Object.keys(icons).map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Título<input required value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})} style={input}/></label>
    <label>Descrição<textarea rows="3" value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} style={input}/></label>
    <label>Texto/conteúdo<textarea rows="6" value={form.conteudoTexto} onChange={e=>setForm({...form,conteudoTexto:e.target.value})} placeholder="Digite orientações, resumo, conteúdo ou atividade..." style={input}/></label>
    <label>Link externo<input type="url" value={form.urlExterna} onChange={e=>setForm({...form,urlExterna:e.target.value})} placeholder="YouTube, livro digital, apresentação ou site" style={input}/></label>
    <label>Arquivo para visualizar ou baixar<input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp,.mp4,.webm" onChange={chooseFile} style={input}/></label>
    {form.arquivoNome&&<p>📎 {form.arquivoNome}</p>}<small>Limite: 5 MB. Para vídeos maiores, utilize um link externo.</small>
    <button style={{display:'block',marginTop:15,background:'#176fe3',color:'#fff',border:0,borderRadius:8,padding:'12px 18px',fontWeight:700}}>📤 Publicar para os alunos</button>
   </form>
   <section><div style={{...card,marginBottom:16,display:'flex',alignItems:'center',gap:14}}><h2 style={{margin:0}}>📂 Biblioteca da aula</h2><select value={filter} onChange={e=>setFilter(e.target.value)} style={{...input,width:'auto',marginLeft:'auto'}}><option value="">Todas as turmas</option>{data.turmas.map(t=><option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>{items.map(item=><article key={item.id} style={card}><div style={{fontSize:36}}>{icons[item.tipo]||'📎'}</div><small>{item.tipo} · {item.disciplina}</small><h3>{item.titulo}</h3><p><b>{item.turma}</b></p>{item.descricao&&<p>{item.descricao}</p>}{item.conteudoTexto&&<div style={{whiteSpace:'pre-wrap',background:'#f4f7fc',padding:10,borderRadius:7,maxHeight:150,overflow:'auto'}}>{item.conteudoTexto}</div>}<div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>{item.urlExterna&&<a href={item.urlExterna} target="_blank" rel="noreferrer">🔗 Abrir link</a>}{item.arquivoDados&&<a href={item.arquivoDados} download={item.arquivoNome||item.titulo}>⬇️ Baixar {item.arquivoNome||'arquivo'}</a>}</div><div style={{display:'flex',gap:8,marginTop:14,borderTop:'1px solid #edf1f7',paddingTop:10}}><button type="button" onClick={()=>edit(item)}>✏️ Alterar</button><button type="button" onClick={()=>remove(item)} style={{color:'#a52222'}}>🗑️ Excluir</button></div><small style={{display:'block',marginTop:10,color:'#607399'}}>Professor: {item.professor}</small></article>)}{!items.length&&<div style={card}>Nenhum material publicado.</div>}</div>
   </section>
  </section></main>
 </div>
}
