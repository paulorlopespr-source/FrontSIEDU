import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Inbox, LoaderCircle, RefreshCw, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AppShell({ sidebar, children, className = '' }) {
  return <div className={`siedu-app-shell ${className}`.trim()}>{sidebar}<div className="siedu-app-content">{children}</div></div>;
}

export function Breadcrumb({ items = [] }) {
  if (!items.length) return null;
  return <nav className="siedu-breadcrumb" aria-label="Navegação estrutural">
    {items.map((entry, index) => <React.Fragment key={`${entry.label}-${index}`}>
      {index > 0 && <span aria-hidden="true">/</span>}
      {entry.to ? <Link to={entry.to}>{entry.label}</Link> : <span aria-current="page">{entry.label}</span>}
    </React.Fragment>)}
  </nav>;
}

export function PageHeader({ eyebrow, title, description, breadcrumbs, actions, children }) {
  return <header className="siedu-page-header">
    <div className="siedu-page-heading">
      {breadcrumbs && <Breadcrumb items={breadcrumbs}/>} {eyebrow && <small>{eyebrow}</small>}
      <h1>{title}</h1>{description && <p>{description}</p>}
    </div>
    {(actions || children) && <div className="siedu-page-actions">{actions || children}</div>}
  </header>;
}

export function Skeleton({ rows = 4, label = 'Carregando dados' }) {
  return <div className="siedu-skeleton" role="status" aria-label={label}>
    <span className="siedu-visually-hidden">{label}</span>
    {Array.from({ length: rows }, (_, index) => <i key={index}/>) }
  </div>;
}

export function EmptyState({ title = 'Nenhum registro encontrado', description, action }) {
  return <div className="siedu-state siedu-state-empty"><Inbox aria-hidden="true"/><strong>{title}</strong>{description && <p>{description}</p>}{action}</div>;
}

export function ErrorState({ title = 'Não foi possível carregar os dados', message, onRetry }) {
  return <div className="siedu-state siedu-state-error" role="alert"><AlertCircle aria-hidden="true"/><div><strong>{title}</strong>{message && <p>{message}</p>}</div>{onRetry && <button type="button" onClick={onRetry}><RefreshCw aria-hidden="true"/>Tentar novamente</button>}</div>;
}

export function Feedback({ type = 'success', message, onClose }) {
  if (!message) return null;
  return <div className={`siedu-feedback is-${type}`} role={type === 'error' ? 'alert' : 'status'}>
    {type === 'success' ? <CheckCircle2 aria-hidden="true"/> : type === 'loading' ? <LoaderCircle className="is-spinning" aria-hidden="true"/> : <AlertCircle aria-hidden="true"/>}
    <span>{message}</span>{onClose && <button type="button" onClick={onClose} aria-label="Fechar mensagem"><X/></button>}
  </div>;
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirmar', danger = false, busy = false, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => event.key === 'Escape' && !busy && onCancel?.();
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open, busy, onCancel]);
  if (!open) return null;
  return <div className="siedu-dialog-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onCancel?.()}>
    <section className="siedu-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="siedu-confirm-title">
      <AlertCircle aria-hidden="true"/><h2 id="siedu-confirm-title">{title}</h2><p>{description}</p>
      <footer><button type="button" className="siedu-button-secondary" disabled={busy} onClick={onCancel}>Cancelar</button><button type="button" className={danger ? 'siedu-button-danger' : 'siedu-button-primary'} disabled={busy} onClick={onConfirm}>{busy ? 'Processando…' : confirmLabel}</button></footer>
    </section>
  </div>;
}
