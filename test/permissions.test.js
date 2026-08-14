import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessSchoolPortal, canManageLearning, canManageSchoolCalendar, canManageSchoolStaff, destinationFor, isStudent } from '../src/permissions.js';

test('direciona cada perfil implementado ao portal correto', () => {
  assert.equal(destinationFor({ perfil: 'Super Administrador' }), '/gestor');
  assert.equal(destinationFor({ perfil: 'Secretário Municipal de Educação' }), '/gestor');
  assert.equal(destinationFor({ perfil: 'Superintendente / Diretor de Ensino' }), '/superintendencia');
  assert.equal(destinationFor({ perfil: 'Coordenador Pedagógico Municipal' }), '/coordenacao');
  assert.equal(destinationFor({ perfil: 'Diretor' }), '/diretor');
  assert.equal(destinationFor({ perfil: 'Professor' }), '/professor');
  assert.equal(destinationFor({ perfil: 'Aluno' }), '/aluno');
});

test('isola o Portal do Aluno dos demais perfis', () => {
  assert.equal(isStudent({ perfil: 'Aluno' }), true);
  assert.equal(isStudent({ perfil: 'Professor' }), false);
  assert.equal(isStudent({ perfil: 'Diretor' }), false);
});

test('não entrega o portal do gestor a perfis sem tela própria', () => {
  assert.equal(destinationFor({ perfil: 'Motorista' }), '/perfil-sem-portal');
  assert.equal(destinationFor({ perfil: 'Psicólogo' }), '/perfil-sem-portal');
});

test('limita ações de direção aos gestores da escola', () => {
  assert.equal(canAccessSchoolPortal({ perfil: 'Secretário Escolar' }), true);
  assert.equal(canManageSchoolStaff({ perfil: 'Secretário Escolar' }), false);
  assert.equal(canManageSchoolStaff({ perfil: 'Diretor' }), true);
});

test('separa gestão da aprendizagem do acesso exclusivo do aluno', () => {
  assert.equal(canManageLearning({ perfil: 'Professor' }), true);
  assert.equal(canManageLearning({ perfil: 'Coordenador Pedagógico Municipal' }), true);
  assert.equal(canManageLearning({ perfil: 'Secretário Municipal de Educação' }), true);
  assert.equal(canManageLearning({ perfil: 'Aluno' }), false);
});

test('limita a gestão do calendário à Secretaria e Coordenação Municipal', () => {
  assert.equal(canManageSchoolCalendar({ perfil: 'Secretário Municipal de Educação' }), true);
  assert.equal(canManageSchoolCalendar({ perfil: 'Coordenador Pedagógico Municipal' }), true);
  assert.equal(canManageSchoolCalendar({ perfil: 'Professor' }), false);
  assert.equal(canManageSchoolCalendar({ perfil: 'Aluno' }), false);
});
