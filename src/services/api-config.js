const DEFAULT_PRODUCTION_API_URL = 'https://backendsiedu-production.up.railway.app/api';

function normalizeUrl(value) {
  return value?.trim().replace(/\/+$/, '') || '';
}

export function resolveApiUrl({ configuredUrl, hostname = '' } = {}) {
  const normalized = normalizeUrl(configuredUrl);
  if (normalized) return normalized;

  // A URL de preview nunca deve acessar dados de produção por omissão.
  if (hostname.endsWith('.vercel.app')) return null;

  return DEFAULT_PRODUCTION_API_URL;
}

export const API_CONFIGURATION_ERROR =
  'A homologação do SIEDU ainda não possui uma API configurada. Defina VITE_API_URL no ambiente Preview da Vercel.';
