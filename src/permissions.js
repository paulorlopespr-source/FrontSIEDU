export const profiles = Object.freeze({
  SUPER_ADMIN: 'Super Administrador',
  MUNICIPAL_SECRETARY: 'Secretário Municipal de Educação',
  SUPERINTENDENT: 'Superintendente / Diretor de Ensino',
  MUNICIPAL_COORDINATOR: 'Coordenador Pedagógico Municipal',
  DIRECTOR: 'Diretor',
  VICE_DIRECTOR: 'Vice-Diretor',
  SCHOOL_COORDINATOR: 'Coordenador Pedagógico',
  SCHOOL_SECRETARY: 'Secretário Escolar',
  SCHOOL_ASSISTANT: 'Auxiliar/Assistente Administrativo',
  PROFESSOR: 'Professor',
  STUDENT: 'Aluno',
});

const municipalManagers = new Set([profiles.SUPER_ADMIN, profiles.MUNICIPAL_SECRETARY]);
const schoolPortalProfiles = new Set([
  profiles.DIRECTOR,
  profiles.VICE_DIRECTOR,
  profiles.SCHOOL_COORDINATOR,
  profiles.SCHOOL_SECRETARY,
  profiles.SCHOOL_ASSISTANT,
]);
const schoolManagers = new Set([profiles.DIRECTOR, profiles.VICE_DIRECTOR]);
const schoolAcademicProfiles = new Set([
  ...schoolManagers,
  profiles.SCHOOL_COORDINATOR,
  profiles.SCHOOL_SECRETARY,
]);

export const isMunicipalManager = (user) => municipalManagers.has(user?.perfil);
export const isSuperintendent = (user) => user?.perfil === profiles.SUPERINTENDENT;
export const isMunicipalCoordinator = (user) => user?.perfil === profiles.MUNICIPAL_COORDINATOR;
export const isProfessor = (user) => user?.perfil === profiles.PROFESSOR;
export const isStudent = (user) => user?.perfil === profiles.STUDENT;
export const canManageLearning = (user) => Boolean(user && (
  isMunicipalManager(user)
  || isSuperintendent(user)
  || isMunicipalCoordinator(user)
  || isProfessor(user)
  || user.perfil === profiles.SCHOOL_COORDINATOR
));
export const canAccessSchoolPortal = (user) => schoolPortalProfiles.has(user?.perfil);
export const canManageSchoolStaff = (user) => schoolManagers.has(user?.perfil);
export const canManageSchoolAcademics = (user) => schoolAcademicProfiles.has(user?.perfil);
export const canAccessSchoolFinance = (user) => schoolManagers.has(user?.perfil);

export function destinationFor(user) {
  if (!user) return '/login';
  if (isMunicipalManager(user)) return '/gestor';
  if (isSuperintendent(user)) return '/superintendencia';
  if (isMunicipalCoordinator(user)) return '/coordenacao';
  if (canAccessSchoolPortal(user)) return '/diretor';
  if (isProfessor(user)) return '/professor';
  if (isStudent(user)) return '/aluno';
  return '/perfil-sem-portal';
}
