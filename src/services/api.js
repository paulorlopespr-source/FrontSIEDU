const API_URL = import.meta.env.VITE_API_URL || 'https://backendsiedu-production.up.railway.app/api';

async function request(path, options = {}, token) {
  const response = await fetch(`${API_URL}${path}`, {
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
  const response = await fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
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
  listDemandNotifications(token) { return request('/municipal/demands/notifications', {}, token); },
  readDemandNotification(id, token) { return request(`/municipal/demands/notifications/${id}/read`, { method: 'PATCH' }, token); },
  downloadDemandAttachment(demandId, attachmentId, filename, token) { return download(`/municipal/demands/${demandId}/attachments/${attachmentId}`, filename, token); },
  downloadMunicipalReport(type, token) { return download(`/municipal/reports/${type}.csv`, `relatorio-${type}.csv`, token); },

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

  getProfessorGradebook(classId, token) {
    return request(`/professor/gradebook/${classId}`, {}, token);
  },

  createProfessorAssessment(classId, data, token) {
    return post(`/professor/gradebook/${classId}/assessments`, data, token);
  },

  saveProfessorGrades(classId, notas, token) {
    return request(`/professor/gradebook/${classId}/grades`, { method: 'PUT', body: JSON.stringify({ notas }) }, token);
  },

  listProfessorLessonPlans(token) {
    return request('/professor/lesson-plans', {}, token);
  },

  createProfessorLessonPlan(data, token) {
    return post('/professor/lesson-plans', data, token);
  },

  updateProfessorLessonPlan(id, data, token) {
    return request(`/professor/lesson-plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
  },

  submitProfessorLessonPlan(id, token) {
    return post(`/professor/lesson-plans/${id}/submit`, {}, token);
  },

  getProfessorLessonPlanHistory(id, token) {
    return request(`/professor/lesson-plans/${id}/history`, {}, token);
  },

  listLessonPlansForReview(status, token) {
    return request(`/professor/lesson-plans/review${status ? `?status=${encodeURIComponent(status)}` : ''}`, {}, token);
  },

  reviewProfessorLessonPlan(id, acao, parecer, token) {
    return request(`/professor/lesson-plans/${id}/review`, { method: 'PUT', body: JSON.stringify({ acao, parecer }) }, token);
  },

  getProfessorSchedule(token) {
    return request('/professor/schedule', {}, token);
  },

  listProfessorActivities(token) {
    return request('/professor/activities', {}, token);
  },

  createProfessorActivity(data, token) {
    return post('/professor/activities', data, token);
  },

  updateProfessorActivity(id, data, token) {
    return request(`/professor/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
  },

  cancelProfessorActivity(id, motivo, token) {
    return request(`/professor/activities/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ motivo }) }, token);
  },

  listProfessorQuestions(token) {
    return request('/professor/questions', {}, token);
  },

  createProfessorQuestion(data, token) {
    return post('/professor/questions', data, token);
  },

  listProfessorExams(token) {
    return request('/professor/exams', {}, token);
  },

  createProfessorExam(data, token) {
    return post('/professor/exams', data, token);
  },

  getProfessorExam(id, token) {
    return request(`/professor/exams/${id}`, {}, token);
  },

  listClassMaterials(turmaId, token) {
    return request(`/professor/materials${turmaId ? `?turmaId=${turmaId}` : ''}`, {}, token);
  },

  createClassMaterial(data, token) {
    return post('/professor/materials', data, token);
  },

  updateClassMaterial(id, data, token) {
    return request(`/professor/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
  },

  deleteClassMaterial(id, token) {
    return request(`/professor/materials/${id}`, { method: 'DELETE' }, token);
  },

  downloadClassMaterial(id, filename, token) {
    return download(`/professor/materials/${id}/attachment`, filename, token);
  },

  getProfessorProfile(token) { return request('/professor/profile', {}, token); },
  updateProfessorProfile(data, token) { return request('/professor/profile', { method: 'PUT', body: JSON.stringify(data) }, token); },
  updateProfessorPhoto(foto, token) { return request('/professor/profile/photo', { method: 'PUT', body: JSON.stringify({ foto }) }, token); },
  deleteProfessorPhoto(token) { return request('/professor/profile/photo', { method: 'DELETE' }, token); },
  listProfessorMessageContacts(token) { return request('/professor/messages/contacts', {}, token); },
  listProfessorMessages(token) { return request('/professor/messages', {}, token); },
  sendProfessorMessage(data, token) { return post('/professor/messages', data, token); },
  readProfessorMessage(id, token) { return request(`/professor/messages/${id}/read`, { method: 'PATCH' }, token); },
  getProfessorHistory(token) { return request('/professor/history', {}, token); },

  getProfessorClassReports(token) {
    return request('/professor/reports/classes', {}, token);
  },

  getProfessorClassReport(classId, token) {
    return request(`/professor/reports/classes/${classId}`, {}, token);
  },

  getProfessorStudentReport(studentId, classId, token) {
    return request(`/professor/reports/students/${studentId}?turmaId=${classId}`, {}, token);
  },

  getProfessorCalendar(year, token) {
    return request(`/professor/calendar?year=${year}`, {}, token);
  },

  getStudentPortal(token) {
    return request('/student/portal', {}, token);
  },

  getLearningManagement(token) {
    return request('/learning/management', {}, token);
  },

  createCycleAssessment(data, token) {
    return post('/learning/cycles', data, token);
  },

  getCycleResults(id, token) {
    return request(`/learning/cycles/${id}/results`, {}, token);
  },

  saveCycleResult(id, data, token) {
    return request(`/learning/cycles/${id}/results`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  },

  createRevisionTrail(data, token) {
    return post('/learning/trails', data, token);
  },

  updateRevisionTrail(id, data, token) {
    return request(`/learning/trails/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  },

  createSaebSimulation(data, token) {
    return post('/learning/saeb', data, token);
  },

  getCalendarManagement(year, token) {
    return request(`/calendar/management?year=${year}`, {}, token);
  },

  createSchoolCalendarEvent(data, token) {
    return post('/calendar/events', data, token);
  },

  updateSchoolCalendarEvent(id, data, token) {
    return request(`/calendar/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  },

  deleteSchoolCalendarEvent(id, token) {
    return request(`/calendar/events/${id}`, { method: 'DELETE' }, token);
  },

  createProfessorCalendarEvent(data, token) {
    return post('/professor/calendar-events', data, token);
  },

  deleteProfessorCalendarEvent(id, token) {
    return request(`/professor/calendar-events/${id}`, { method: 'DELETE' }, token);
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

