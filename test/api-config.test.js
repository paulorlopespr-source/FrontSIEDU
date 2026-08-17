import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiUrl } from '../src/services/api-config.js';

test('usa a API explicitamente configurada e remove a barra final', () => {
  assert.equal(
    resolveApiUrl({ configuredUrl: ' https://api-homolog.example/api/ ' }),
    'https://api-homolog.example/api',
  );
});

test('impede que previews Vercel caiam silenciosamente em produção', () => {
  assert.equal(
    resolveApiUrl({ hostname: 'front-siedu-git-minha-branch.vercel.app' }),
    null,
  );
});

test('preserva o fallback atual fora de previews Vercel', () => {
  assert.equal(
    resolveApiUrl({ hostname: 'siedu.exemplo.gov.br' }),
    'https://backendsiedu-production.up.railway.app/api',
  );
});
