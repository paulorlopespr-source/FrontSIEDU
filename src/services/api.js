const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(path, options = {}, token) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) {
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

  listUsers(token) {
    return request('/users', {}, token);
  },

  createUser(data, token) {
    return post('/users', data, token);
  },

  updateUserSchools(id, escolaIds, token) {
    return request(`/users/${id}/schools`, {
      method: 'PATCH',
      body: JSON.stringify({ escolaIds }),
    }, token);
  },

  deleteUser(id, token) {
    return request(`/users/${id}`, { method: 'DELETE' }, token);
  },

  listSchools(token) {
    return request('/schools', {}, token);
  },

  getManagerSchoolOverview(id, token) {
    return request(`/schools/${id}/overview`, {}, token);
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

  getManagerDashboard(token) {
    return request('/dashboard/manager', {}, token);
  },

  getProfessorDashboard(token) {
    return request('/professor/dashboard', {}, token);
  },

  getProfessorClassStudents(classId, token) {
    return request(`/professor/classes/${classId}/students`, {}, token);
  },

  getProfessorStudentHistory(studentId, classId, token) {
    return request(`/professor/students/${studentId}/history?turmaId=${classId}`, {}, token);
  },

  listProfessorDiaries(token) {
    return request('/professor/diaries', {}, token);
  },

  saveProfessorDiary(data, token) {
    return post('/professor/diaries', data, token);
  },

  listAudit(filters, token) {
    return getWithFilters('/audit', filters, token);
  },

  getAcademicSummary(filters, token) {
    return getWithFilters('/academic/summary', filters, token);
  },

  getAcademicContext(token) {
    return request('/academic/context', {}, token);
  },

  listAcademicClasses(filters, token) {
    return getWithFilters('/academic/classes', filters, token);
  },

  getAcademicClass(id, token) {
    return request(`/academic/classes/${id}`, {}, token);
  },

  createAcademicClass(data, token) {
    return post('/academic/classes', data, token);
  },

  assignTeacherToClass(classId, data, token) {
    return post(`/academic/classes/${classId}/teachers`, data, token);
  },

  listAcademicStudents(filters, token) {
    return getWithFilters('/academic/students', filters, token);
  },

  getAcademicStudent(id, token) {
    return request(`/academic/students/${id}`, {}, token);
  },

  enrollNewStudent(data, token) {
    return post('/academic/students/enroll', data, token);
  },

  enrollExistingStudent(data, token) {
    return post('/academic/enrollments', data, token);
  },

  listAcademicTeachers(filters, token) {
    return getWithFilters('/academic/teachers', filters, token);
  },

  createAcademicTeacher(data, token) {
    return post('/academic/teachers', data, token);
  },

  listAcademicEmployees(filters, token) {
    return getWithFilters('/academic/employees', filters, token);
  },

  createAcademicEmployee(data, token) {
    return post('/academic/employees', data, token);
  },
};
