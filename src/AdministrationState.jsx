import React from 'react';
import { EmptyState, ErrorState, Skeleton } from './SieduUI';

export function AdministrationSkeleton({ rows = 4, label = 'Carregando dados' }) {
  return <Skeleton rows={rows} label={label}/>;
}

export function AdministrationEmpty({ title, description, action }) {
  return <EmptyState title={title} description={description} action={action}/>;
}

export function AdministrationError({ message, onRetry }) {
  return <ErrorState message={message} onRetry={onRetry}/>;
}
