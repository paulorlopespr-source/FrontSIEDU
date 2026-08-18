import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import './administration-state.css';

export function AdministrationSkeleton({ rows = 4, label = 'Carregando dados' }) {
  return <div className="administration-skeleton" role="status" aria-label={label}>
    {Array.from({ length: rows }, (_, index) => <span key={index}/>) }
  </div>;
}

export function AdministrationEmpty({ title, description, action }) {
  return <div className="administration-state administration-state-empty">
    <Inbox aria-hidden="true"/><strong>{title}</strong><p>{description}</p>{action}
  </div>;
}

export function AdministrationError({ message, onRetry }) {
  return <div className="administration-state administration-state-error" role="alert">
    <AlertCircle aria-hidden="true"/><div><strong>Não foi possível carregar os dados</strong><p>{message}</p></div>
    {onRetry && <button type="button" onClick={onRetry}><RefreshCw aria-hidden="true"/>Tentar novamente</button>}
  </div>;
}
