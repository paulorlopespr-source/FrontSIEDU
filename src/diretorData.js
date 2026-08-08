const TURMAS_KEY = 'siepin_diretor_turmas';
const PROFESSORES_KEY = 'siepin_diretor_professores';
const SECRETARIOS_KEY = 'siepin_diretor_secretarios';

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getTurmas() {
  return read(TURMAS_KEY);
}

export function saveTurmas(turmas) {
  return write(TURMAS_KEY, turmas);
}

export function addTurma(turma) {
  const turmas = getTurmas();
  const novaTurma = {
    id: createId('turma'),
    nome: turma.nome,
    serie: turma.serie,
    turno: turma.turno,
    capacidade: Number(turma.capacidade),
    professores: turma.professores
      .split(',')
      .map((nome) => nome.trim())
      .filter(Boolean),
    coordenador: turma.coordenador,
    desempenho: Number(turma.desempenho || 0),
    alunos: [],
  };

  saveTurmas([...turmas, novaTurma]);
  return novaTurma;
}

export function addAluno(turmaId, aluno) {
  let alunoCriado = null;
  const turmas = getTurmas().map((turma) => {
    if (turma.id !== turmaId) {
      return turma;
    }

    const ano = new Date().getFullYear();
    const sequencia = String(
      getTurmas().reduce((total, item) => total + item.alunos.length, 0) + 1,
    ).padStart(3, '0');

    alunoCriado = {
      id: createId('aluno'),
      matricula: `${ano}${sequencia}`,
      nome: aluno.nome,
      dataNascimento: aluno.dataNascimento,
      responsavel: aluno.responsavel,
      contatoResponsavel: aluno.contatoResponsavel,
      faltas: [],
      notas: [],
    };

    return {
      ...turma,
      alunos: [...turma.alunos, alunoCriado],
    };
  });

  saveTurmas(turmas);
  return alunoCriado;
}

export function addProfessor(professor) {
  const professores = read(PROFESSORES_KEY);
  const novoProfessor = { id: createId('professor'), ...professor };
  write(PROFESSORES_KEY, [...professores, novoProfessor]);
  return novoProfessor;
}

export function addSecretario(secretario) {
  const secretarios = read(SECRETARIOS_KEY);
  const novoSecretario = { id: createId('secretario'), ...secretario };
  write(SECRETARIOS_KEY, [...secretarios, novoSecretario]);
  return novoSecretario;
}
