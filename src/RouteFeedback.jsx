import React from 'react';
import { Link } from 'react-router-dom';
import { destinationFor } from './permissions';

function FeedbackPage({ code, title, description, user }) {
  return (
    <main className="route-feedback">
      <section>
        <img src="/images/sigepin.png" alt="SIEDU-PINDOBAÇU" />
        <span>{code}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div>
          <Link className="button" to={destinationFor(user)}>{user ? 'Voltar ao meu painel' : 'Ir para o login'}</Link>
          <button type="button" className="route-secondary" onClick={() => window.history.back()}>Voltar à página anterior</button>
        </div>
      </section>
    </main>
  );
}

export const AccessDenied = ({ user }) => <FeedbackPage code="403" title="Acesso não autorizado" description="Seu perfil não possui permissão para abrir esta área do SIEDU." user={user} />;
export const UnsupportedProfile = ({ user }) => <FeedbackPage code="PERFIL" title="Portal ainda não configurado" description={`O perfil ${user?.perfil || 'informado'} está ativo, mas ainda não possui um portal operacional nesta versão beta.`} />;
export const NotFound = ({ user }) => <FeedbackPage code="404" title="Página não encontrada" description="O endereço informado não existe ou foi alterado. Use um dos caminhos seguros abaixo." user={user} />;
