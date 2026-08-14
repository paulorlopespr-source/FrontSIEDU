import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessSchoolPortal, canManageSchoolStaff, destinationFor } from '../src/permissions.js';

test('direciona cada perfil implementado ao portal correto', () => {
  assert.equal(destinationFor({ perfil: 'Super Administrador' }), '/gestor');
  assert.equal(destinationFor({ perfil: 'Secretário Municipal de Educação' }), '/gestor');
  assert.equal(destinationFor({ perfil: 'Superintendente / Diretor de Ensino' }), '/superintendencia');
  assert.equal(destinationFor({ perfil: 'Coordenador Pedagógico Municipal' }), '/coordenacao');
  assert.equal(destinationFor({ perfil: 'Diretor' }), '/diretor');
  assert.equal(destinationFor({ perfil: 'Professor' }), '/professor');
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
