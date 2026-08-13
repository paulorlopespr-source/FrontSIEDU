import React from 'react';
import { Link } from 'react-router-dom';
import './aluno-dashboard.css';

const menu = [
  ['⌂', 'Visão geral', '/aluno'],
  ['★', 'Minhas notas', '#notas'],
  ['✓', 'Frequência', '#frequencia'],
  ['▣', 'Boletim', '#boletim'],
  ['◷', 'Horário de aulas', '#horario'],
  ['□', 'Calendário escolar', '#calendario'],
  ['✎', 'Atividades e provas', '#atividades'],
  ['▤', 'Materiais de estudo', '#materiais'],
  ['▱', 'Documentos', '#documentos'],
  ['▰', 'Transporte escolar', '#transporte'],
];

const shortcuts = [
  ['★', 'Minhas notas', 'Acompanhe os lançamentos por disciplina', '#notas', 'azul'],
  ['✓', 'Frequência', 'Consulte presença e faltas', '#frequencia', 'verde'],
  ['▣', 'Boletim', 'Veja o resultado do período letivo', '#boletim', 'roxo'],
  ['◷', 'Meu horário', 'Confira as aulas de hoje', '#horario', 'laranja'],
];

const todayClasses = [
  ['07:30', 'Matemática', 'Professor não informado'],
  ['08:20', 'Língua Portuguesa', 'Professor não informado'],
  ['09:30', 'Ciências', 'Professor não informado'],
  ['10:20', 'História', 'Professor não informado'],
];

function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || 'Aluno';
}

export default function AlunoDashboard({ user, onLogout }) {
  const writtenDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="aluno-portal">
      <aside className="aluno-sidebar">
        <div className="aluno-brand">
          <img src="/images/sigepin.png" alt="SIEDU-PINDOBAÇU" />
          <div><strong>SIEDU-PINDOBAÇU</strong><span>Portal do Aluno</span></div>
        </div>
        <nav aria-label="Menu do aluno">
          {menu.map(([icon, label, href], index) => (
            href.startsWith('/')
              ? <Link className={index === 0 ? 'ativo' : ''} to={href} key={label}><i>{icon}</i>{label}</Link>
              : <a href={href} key={label}><i>{icon}</i>{label}</a>
          ))}
        </nav>
        <div className="aluno-sidebar-bottom">
          <a href="#ajuda"><i>?</i>Central de ajuda</a>
          <a href="#perfil"><i>♙</i>Meu perfil</a>
          <button type="button" onClick={onLogout}><i>↪</i>Sair do sistema</button>
        </div>
        <div className="aluno-city">
          <img src="/images/prefeitura.png" alt="Prefeitura de Pindobaçu" />
          <span>Prefeitura Municipal<br />de Pindobaçu</span>
        </div>
      </aside>

      <div className="aluno-main">
        <header className="aluno-topbar">
          <div><strong>Portal do Aluno</strong><span>Secretaria Municipal de Educação</span></div>
          <label><span>⌕</span><input aria-label="Pesquisar" placeholder="Pesquisar no portal..." /></label>
          <div className="aluno-top-actions"><button type="button" aria-label="Notificações">♢</button><button type="button" aria-label="Mensagens">✉</button></div>
          <div className="aluno-user"><b>{firstName(user?.nome).slice(0, 1)}</b><span><strong>{user?.nome || 'Aluno'}</strong><small>Estudante</small></span></div>
        </header>

        <main className="aluno-content">
          <section className="aluno-welcome">
            <div><small>{writtenDate}</small><h1>Olá, {firstName(user?.nome)}! 👋</h1><p>Acompanhe aqui sua vida escolar e organize seus estudos.</p></div>
            <div className="aluno-school-card"><span>Unidade escolar</span><strong>Aguardando vínculo da matrícula</strong><small>Turma e ano letivo aparecerão após a integração</small></div>
          </section>

          <section className="aluno-shortcuts" aria-label="Acessos rápidos">
            {shortcuts.map(([icon, title, text, href, color]) => <a href={href} className={color} key={title}><i>{icon}</i><span><strong>{title}</strong><small>{text}</small></span><b>›</b></a>)}
          </section>

          <section className="aluno-grid">
            <article className="aluno-panel aluno-schedule" id="horario">
              <header><div><h2>Aulas de hoje</h2><p>Seu horário diário</p></div><a href="#calendario">Ver semana ›</a></header>
              <div className="aluno-unavailable">O horário será preenchido automaticamente quando o usuário estiver vinculado a uma matrícula e turma.</div>
              <div className="aluno-class-list" aria-hidden="true">
                {todayClasses.map(([time, subject, teacher]) => <p key={`${time}-${subject}`}><time>{time}</time><i /><span><b>{subject}</b><small>{teacher}</small></span></p>)}
              </div>
            </article>

            <article className="aluno-panel aluno-performance" id="notas">
              <header><div><h2>Meu desempenho</h2><p>Resumo do período atual</p></div><a href="#boletim">Ver boletim ›</a></header>
              <div className="aluno-empty-chart"><span>◎</span><strong>Notas ainda não disponíveis</strong><small>Os resultados aparecerão após os lançamentos dos professores.</small></div>
              <footer><span><i className="azul" /> Média do aluno</span><span><i className="verde" /> Média da turma</span></footer>
            </article>

            <article className="aluno-panel aluno-tasks" id="atividades">
              <header><div><h2>Próximas atividades</h2><p>Provas, trabalhos e entregas</p></div><a href="#calendario">Ver calendário ›</a></header>
              <div className="aluno-empty"><span>✓</span><strong>Nenhuma atividade pendente</strong><small>As atividades publicadas pelos professores aparecerão aqui.</small></div>
            </article>

            <article className="aluno-panel aluno-frequency" id="frequencia">
              <header><div><h2>Minha frequência</h2><p>Presença no ano letivo</p></div><a href="#frequencia">Ver detalhes ›</a></header>
              <div className="frequency-ring"><span>—<small>sem dados</small></span></div>
              <p>A frequência será calculada com os registros do diário de classe.</p>
            </article>
          </section>

          <section className="aluno-services" id="documentos">
            <header><h2>Serviços para você</h2><p>Acesso rápido aos recursos escolares</p></header>
            <div>
              <a href="#materiais"><i>▤</i><span><b>Materiais didáticos</b><small>Conteúdos enviados pelos professores</small></span></a>
              <a href="#documentos"><i>▱</i><span><b>Documentos escolares</b><small>Declarações e comprovantes</small></span></a>
              <a href="#transporte"><i>▰</i><span><b>Transporte escolar</b><small>Rota, veículo e horários</small></span></a>
              <a href="#mensagens"><i>✉</i><span><b>Mensagens</b><small>Comunicação com a escola</small></span></a>
            </div>
          </section>

          <footer className="aluno-footer"><span>© Olhos de Águia Desenvolvimento</span><span>SIEDU-PINDOBAÇU · Portal do Aluno</span></footer>
        </main>
      </div>
    </div>
  );
}
