import { API_CONFIGURATION_ERROR, resolveApiUrl } from './api-config.js';

const API_URL = resolveApiUrl({
  configuredUrl: import.meta.env.VITE_API_URL,
  hostname: typeof window === 'undefined' ? '' : window.location.hostname,
});

function requireApiUrl() {
  if (!API_URL) throw new Error(API_CONFIGURATION_ERROR);
  return API_URL;
}

async function request(path, options = {}, token) {
  const response = await fetch(`${requireApiUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const responseText = response.status === 204 ? '' : await response.text();
  let payload = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = { message: 'O servidor respondeu em um formato inesperado. Tente novamente em instantes.' };
    }
  }
  if (!response.ok) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new CustomEvent('siedu:session-expired'));
    }
    throw new Error(
      payload?.message || 'Não foi possível concluir a solicitação.',
    );
  }

  return payload;
}

function buildQuery(filters = {}) {
  return new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== '' && value != null),
  ).toString();
}

function getWithFilters(path, filters, token) {
  const query = buildQuery(filters);
  return request(`${path}${query ? `?${query}` : ''}`, {}, token);
}

function post(path, data, token) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

async function download(path, filename, token) {
  const response = await fetch(`${requireApiUrl()}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) {
    let message = 'Não foi possível baixar o arquivo.';
    try { message = (await response.json()).message || message; } catch { /* resposta sem JSON */ }
    throw new Error(message);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename || 'arquivo'; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  login(usuario, senha) {
    return post('/auth/login', { usuario, senha });
  },

  requestPasswordRecovery(identificador) {
    return post('/auth/recuperar-senha', { identificador });
  },

  resetPassword(data) {
    return post('/auth/redefinir-senha', data);
  },

  changePassword(senhaAtual, novaSenha, token) {
    return post('/auth/alterar-senha', { senhaAtual, novaSenha }, token);
  },

  acceptTerms(token) {
    return post('/auth/termos', {}, token);
  },

  listUsers(filtersOrToken, token) {
    const filters = typeof filtersOrToken === 'string'
      ? {}
      : (filtersOrToken || {});
    const authToken = typeof filtersOrToken === 'string'
      ? filtersOrToken
      : token;

    return getWithFilters('/users', filters, authToken);
  },

  createUser(data, token) {
    return post('/users', data, token);
  },

  updateUser(id, data, token) {
    return request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token);
  },

  updateUserSchools(id, escolaIds, token) {
    return request(`/users/${id}/schools`, {
      method: 'PATCH',
      body: JSON.stringify({ escolaIds }),
    }, token);
  },

  listPersonnelLeaves(token) { return request('/personnel-leaves', {}, token); },
  createPersonnelLeave(data, token) { return post('/personnel-leaves', data, token); },
  updatePersonnelLeave(id, data, token) { return request(`/personnel-leaves/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token); },
  updatePersonnelLeaveStatus(id, status, token) { return request(`/personnel-leaves/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token); },
  downloadPersonnelLeaveDocument(id, filename, token) { return download(`/personnel-leaves/${id}/document`, filename, token); },

  deleteUser(id, token) {
    return request(`/users/${id}`, { method: 'DELETE' }, token);
  },

  listSchools(filtersOrToken, token) {
    const filters = typeof filtersOrToken === 'string'
      ? {}
      : (filtersOrToken || {});
    const authToken = typeof filtersOrToken === 'string'
      ? filtersOrToken
      : token;

    return getWithFilters('/schools', filters, authToken);
  },

  getManagerSchoolOverview(id, token) {
    return request(`/schools/${id}/overview`, {}, token);
  },

  listManagerSchoolStudents(id, filters, token) {
    return getWithFilters(`/schools/${id}/students`, filters, token);
  },

  updateSchool(id, data, token) {
    return request(`/schools/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token);
  },

  createSchool(data, token) {
    return post('/schools', data, token);
  },

  listDirectors(token) {
    return request('/reference/directors', {}, token);
  },

  listUserTypes(token) {
    return request('/reference/user-types', {}, token);
  },

  listTransport(token) {
    return request('/transport', {}, token);
  },

  createVehicle(data, token) {
    return post('/transport/vehicles', data, token);
  },

  createDriver(data, token) {
    return post('/transport/drivers', data, token);
  },

  createAttendant(data, token) {
    return post('/transport/attendants', data, token);
  },

  createRoute(data, token) {
    return post('/transport/routes', data, token);
  },

  addStudentToRoute(routeId, data, token) {
    return post(`/transport/routes/${routeId}/students`, data, token);
  },

  createVehicleMaintenance(data, token) {
    return post('/transport/maintenance', data, token);
  },

  updateMaintenanceStatus(id, status, token) {
    return request(`/transport/maintenance/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, token);
  },

  updateVehicle(id, data, token) {
    return request(`/transport/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token);
  },

  updateDriver(id, data, token) {
    return request(`/transport/drivers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token);
  },

  updateRouteStatus(id, ativo, token) {
    return request(`/transport/routes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ ativo }) }, token);
  },

  updateTransportStudentStatus(id, ativo, token) {
    return request(`/transport/students/${id}/status`, { method: 'PATCH', body: JSON.stringify({ ativo }) }, token);
  },

  getSchoolFinance(token) {
    return request('/finance', {}, token);
  },

  createSchoolAllocation(data, token) {
    return post('/finance/allocations', data, token);
  },

  createSchoolExpense(data, token) {
    return post('/finance/expenses', data, token);
  },

  createSchoolStatement(data, token) {
    return post('/finance/statements', data, token);
  },

  auditSchoolAllocation(id, data, token) {
    return post(`/finance/allocations/${id}/audit`, data, token);
  },

  reviewSchoolStatement(id, data, token) {
    return request(`/finance/statements/${id}/review`, { method: 'PATCH', body: JSON.stringify(data) }, token);
  },

  getManagerDashboard(token) {
    return request('/dashboard/manager', {}, token);
  },

  getMunicipalOverview(token) { return request('/municipal/overview', {}, token); },
  getIdebAnalysis(token) { return request('/municipal/ideb/analysis', {}, token); },
  listIdeb(token) { return request('/municipal/ideb', {}, token); },
  importIdeb(registros, token) { return post('/municipal/ideb/import', { registros }, token); },
  listMunicipalMeetings(token) { return request('/municipal/meetings', {}, token); },
  createMunicipalMeeting(data, token) { return post('/municipal/meetings', data, token); },
  updateMunicipalMeetingStatus(id, status, token) { return request(`/municipal/meetings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token); },
  listMunicipalDemands(token) { return request('/municipal/demands', {}, token); },
  createMunicipalDemand(data, token) { return post('/municipal/demands', data, token); },
  decideMunicipalDemand(id, data, token) { return post(`/municipal/demands/${id}/decision`, data, token); },
  executeMunicipalDemand(id, data, token) { return post(`/municipal/demands/${id}/execution`, data, token); },
