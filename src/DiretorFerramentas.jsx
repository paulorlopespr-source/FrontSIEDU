import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './diretor-ferramentas.css';
import SairDoSistema from './SairDoSistema';

const students = ['Selecione o aluno'];

function PageHeader({ title, description }) {
  return (
    <header className="school-tool-header">
      <div>
        <span>GEST&Atilde;O ESCOLAR</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="school-tool-header-actions"><Link to="/diretor">&larr; Voltar ao Portal do Diretor</Link><SairDoSistema /></div>
    </header>
  );
}

export function Frequencia() {
  const [saved, setSaved] = useState(false);
  return (
    <main className="school-tool-page">
      <PageHeader title="Controle de frequ&ecirc;ncia" description="Registre a presen&ccedil;a dos alunos por turma e data." />
      <section className="school-tool-card">
        <div className="tool-fields"><label>Turma<select><option>Selecione a turma</option></select></label><label>Data<input type="date" /></label></div>
        <div className="empty-school-data">As turmas e alunos aparecer&atilde;o aqui assim que forem cadastrados e vinculados &agrave; escola.</div>
        <button type="button" onClick={() => setSaved(true)}>Salvar frequ&ecirc;ncia</button>
        {saved && <p className="tool-success">Frequ&ecirc;ncia preparada para registro. Cadastre alunos e turmas para iniciar o lan&ccedil;amento real.</p>}
      </section>
    </main>
  );
}

export function HistoricoEscolar() {
  return (
    <main className="school-tool-page">
      <PageHeader title="Hist&oacute;rico escolar" description="Consulte o percurso acad&ecirc;mico e emita o hist&oacute;rico do aluno." />
      <section className="school-tool-card">
        <label>Aluno<select>{students.map((student) => <option key={student}>{student}</option>)}</select></label>
        <div className="empty-school-data">Nenhum aluno matriculado foi encontrado nesta unidade escolar.</div>
        <div className="tool-actions"><button type="button" disabled>Consultar hist&oacute;rico</button><button type="button" className="tool-outline" disabled>Imprimir hist&oacute;rico</button></div>
      </section>
    </main>
  );
}

export function DocumentosEscolares() {
  const [document, setDocument] = useState('Declaracao de matricula');
  return (
    <main className="school-tool-page">
      <PageHeader title="Documentos escolares" description="Emita declara&ccedil;&otilde;es, comprovantes e documentos da vida escolar." />
      <section className="school-tool-card">
        <div className="tool-fields"><label>Tipo de documento<select value={document} onChange={(event) => setDocument(event.target.value)}><option>Declaracao de matricula</option><option>Declaracao de frequencia</option><option>Historico escolar</option></select></label><label>Aluno<select><option>Selecione o aluno</option></select></label></div>
        <div className="empty-school-data">O documento ser&aacute; liberado quando existir um aluno matriculado na unidade.</div>
        <div className="tool-actions"><button type="button" disabled>Gerar documento</button><button type="button" className="tool-outline" disabled onClick={() => window.print()}>Imprimir</button></div>
      </section>
    </main>
  );
}