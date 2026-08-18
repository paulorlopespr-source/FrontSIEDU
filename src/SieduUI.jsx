import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Inbox, LoaderCircle, RefreshCw, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Button({ variant = 'primary', size = 'medium', icon: Icon, children, className = '', type = 'button', ...props }) {
  return <button type={type} className={`siedu-button is-${variant} is-${size} ${className}`.trim()} {...props}>{Icon && <Icon aria-hidden="true"/>}<span>{children}</span></button>;
}

export function Field({ label, htmlFor, required = false, hint, error, children, className = '' }) {
  return <div className={`siedu-field ${error ? 'has-error' : ''} ${className}`.trim()}><label htmlFor={htmlFor}>{label}{required && <span aria-hidden="true"> *</span>}</label>{children}{error ? <small className="siedu-field-error" id={`${htmlFor}-error`}>{error}</small> : hint && <small className="siedu-field-hint">{hint}</small>}</div>;
}

export const Input = React.forwardRef(function Input({ className = '', error, ...props }, ref) {
  return <input ref={ref} className={`siedu-input ${className}`.trim()} aria-invalid={error ? 'true' : undefined} aria-describedby={error && props.id ? `${props.id}-error` : props['aria-describedby']} {...props}/>;
});

export const Select = React.forwardRef(function Select({ className = '', error, children, ...props }, ref) {
  return <select ref={ref} className={`siedu-select ${className}`.trim()} aria-invalid={error ? 'true' : undefined} aria-describedby={error && props.id ? `${props.id}-error` : props['aria-describedby']} {...props}>{children}</select>;
});

export const Textarea = React.forwardRef(function Textarea({ className = '', error, ...props }, ref) {
  return <textarea ref={ref} className={`siedu-textarea ${className}`.trim()} aria-invalid={error ? 'true' : undefined} aria-describedby={error && props.id ? `${props.id}-error` : props['aria-describedby']} {...props}/>;
});

export function Card({ as: Component = 'section', className = '', children, ...props }) {
  return <Component className={`siedu-card ${className}`.trim()} {...props}>{children}</Component>;
}

export function KpiCard({ label, value, description, icon: Icon, tone = 'info', to }) {
  const content = <>{Icon && <span className="siedu-kpi-icon"><Icon aria-hidden="true"/></span>}<strong>{value}</strong><h2>{label}</h2>{description && <p>{description}</p>}</>;
  return to ? <Link className={`siedu-kpi is-${tone} is-actionable`} to={to}>{content}</Link> : <article className={`siedu-kpi is-${tone}`}>{content}</article>;
}

export function Badge({ tone = 'neutral', children, className = '' }) {
  return <span className={`siedu-badge is-${tone} ${className}`.trim()}>{children}</span>;
}

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
