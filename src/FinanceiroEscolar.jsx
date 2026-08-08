import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './services/api';
import './financeiro-escolar.css';

const emptyData = {
  municipal: false,
  schools: [],
  allocations: [],
  expenses: [],
  statements: [],
};

const initialAllocation = {
  escolaId: '',
  categoria: 'Financeiro',
  descricao: '',
  origem: '',
  finalidade: '',
  dataRecebimento: '',
  competencia: '',
  valor: '',
};

const initialExpense = {
  alocacaoId: '',
  tipo: 'Despesa',
  categoria: '',
  descricao: '',
  fornecedor: '',
  valor: '',
  dataLancamento: '',
  numeroNotaFiscal: '',
  comprovanteArquivo: '',
};

const initialStatement = {
  escolaId: '',
  categoria: 'Financeiro',
  competencia: '',
  observacoes: '',
};

const initialAudit = {
  alocacaoId: '',
  status: 'Aprovado',
  justificativa: '',
  dataReuniao: '',
};

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(value) {
  if (!value) return 'Não informada';
  return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR');
}

function statusClass(status) {
  if (status === 'Aprovado' || status === 'Aprovada') return 'approved';
  if (status === 'Com pendencia') return 'pending';
  if (status === 'Reuniao solicitada') return 'meeting';
  return 'monitoring';
}

function statusLabel(status) {
  const labels = {
    'Com pendencia': 'Com pendência',
    'Reuniao solicitada': 'Reunião solicitada',
    'Em acompanhamento': 'Em acompanhamento',
  };
  return labels[status] || status;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Selecione a nota fiscal ou o comprovante.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('O comprovante deve ter no máximo 5 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Não foi possível ler o comprovante.'));
    reader.readAsDataURL(file);
  });
}

function Field({ label, children, wide = false }) {
  return <label className={wide ? 'wide' : ''}>{label}{children}</label>;
}

export default function FinanceiroEscolar({ token, user, onLogout, portal = 'diretor' }) {
  const [tab, setTab] = useState('recursos');
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [allocation, setAllocation] = useState(initialAllocation);
  const [expense, setExpense] = useState(initialExpense);
  const [statement, setStatement] = useState(initialStatement);
  const [audit, setAudit] = useState(initialAudit);

  const backPath = portal === 'gestor' ? '/gestor' : '/diretor';
  const backLabel = portal === 'gestor'
    ? 'Voltar ao Portal do Gestor'
    : 'Voltar ao Portal do Diretor';

  async function load() {
    setLoading(true);
    setError('');
    try {
      const payload = await api.getSchoolFinance(token);
      setData(payload);

      const firstSchool = payload.schools[0]?.id || '';
      const firstAllocation = payload.allocations[0]?.id || '';
      setAllocation((current) => ({ ...current, escolaId: current.escolaId || firstSchool }));
      setStatement((current) => ({ ...current, escolaId: current.escolaId || firstSchool }));
      setExpense((current) => ({ ...current, alocacaoId: current.alocacaoId || firstAllocation }));
      setAudit((current) => ({ ...current, alocacaoId: current.alocacaoId || firstAllocation }));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  const totals = useMemo(() => ({
    allocated: data.allocations.reduce((total, item) => total + Number(item.valor_alocado), 0),
    used: data.expenses.reduce((total, item) => total + Number(item.valor), 0),
    maintenance: data.expenses.filter((item) => item.tipo === 'Manutencao').length,
    pending: data.allocations.filter((item) => item.status === 'Com pendencia').length,
  }), [data]);

  async function perform(action, successMessage, reset) {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await action();
      setMessage(successMessage);
      reset?.();
      await load();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setSaving(false);
    }
  }

  function update(setter) {
    return (event) => setter((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function submitAllocation(event) {
    event.preventDefault();
    perform(
      () => api.createSchoolAllocation(allocation, token),
      'Recurso alocado com sucesso. O valor foi protegido contra alterações.',
      () => setAllocation({ ...initialAllocation, escolaId: data.schools[0]?.id || '' }),
    );
  }

  async function selectReceipt(event) {
    setError('');
    try {
      const comprovanteArquivo = await fileToDataUrl(event.target.files[0]);
      setExpense((current) => ({ ...current, comprovanteArquivo }));
    } catch (fileError) {
      setError(fileError.message);
    }
  }

  function submitExpense(event) {
    event.preventDefault();
    if (!expense.comprovanteArquivo) {
      setError('Anexe a nota fiscal ou o comprovante antes de salvar.');
      return;
    }
    perform(
      () => api.createSchoolExpense(expense, token),
      'Lançamento registrado com nota fiscal. O valor não poderá ser alterado.',
      () => setExpense({ ...initialExpense, alocacaoId: data.allocations[0]?.id || '' }),
    );
  }

  function submitStatement(event) {
    event.preventDefault();
    perform(
      () => api.createSchoolStatement(statement, token),
      'Prestação de contas enviada com sucesso.',
      () => setStatement({ ...initialStatement, escolaId: data.schools[0]?.id || '' }),
    );
  }

  function submitAudit(event) {
    event.preventDefault();
    perform(
      () => api.auditSchoolAllocation(audit.alocacaoId, {
        status: audit.status,
        justificativa: audit.justificativa,
        dataReuniao: audit.dataReuniao || null,
      }, token),
      audit.status === 'Com pendencia'
        ? 'Pendência registrada e destacada para comprovação.'
        : 'Avaliação financeira registrada com sucesso.',
      () => setAudit({ ...initialAudit, alocacaoId: data.allocations[0]?.id || '' }),
    );
  }

  if (loading) {
    return <main className="finance-page"><p className="finance-loading">Carregando gestão financeira...</p></main>;
  }

  return (
    <main className="finance-page">
      <header className="finance-header">
        <div>
          <span>GESTÃO FINANCEIRA ESCOLAR</span>
          <h1>Recursos, despesas e prestação de contas</h1>
          <p>
            {data.municipal
              ? 'Aloque recursos e acompanhe a execução financeira de todas as escolas.'
              : 'Registre a aplicação dos recursos da sua unidade com comprovação fiscal.'}
          </p>
        </div>
        <div className="finance-header-actions">
          <Link to={backPath}>← {backLabel}</Link>
          <strong>{user?.nome}</strong>
          <button type="button" onClick={onLogout}>Sair</button>
        </div>
      </header>

      <section className="finance-summary">
        <article><span>Recursos alocados</span><b>{money(totals.allocated)}</b></article>
        <article><span>Despesas comprovadas</span><b>{money(totals.used)}</b></article>
        <article><span>Manutenções registradas</span><b>{totals.maintenance}</b></article>
        <article className={totals.pending ? 'summary-alert' : ''}><span>Pendências de auditoria</span><b>{totals.pending}</b></article>
      </section>

      <nav className="finance-tabs">
        <button type="button" onClick={() => setTab('recursos')} className={tab === 'recursos' ? 'active' : ''}>Recursos</button>
        <button type="button" onClick={() => setTab('despesas')} className={tab === 'despesas' ? 'active' : ''}>Despesas e manutenção</button>
        <button type="button" onClick={() => setTab('contas')} className={tab === 'contas' ? 'active' : ''}>Prestação de contas</button>
        {data.municipal && <button type="button" onClick={() => setTab('auditoria')} className={tab === 'auditoria' ? 'active' : ''}>Auditoria</button>}
      </nav>

      {error && <p className="finance-feedback error">{error}</p>}
      {message && <p className="finance-feedback success">{message}</p>}

      {tab === 'recursos' && (
        <>
          {data.municipal && (
            <form className="finance-card" onSubmit={submitAllocation}>
              <div className="finance-section-title">
                <div><h2>Alocar recurso para uma escola</h2><p>Somente o Gestor ou Secretário de Educação realiza esta operação.</p></div>
                <span className="immutable-badge">Valor protegido</span>
              </div>
              <div className="finance-fields">
                <Field label="Escola">
                  <select name="escolaId" value={allocation.escolaId} onChange={update(setAllocation)} required>
                    <option value="">Selecione</option>
                    {data.schools.map((school) => <option key={school.id} value={school.id}>{school.nome}</option>)}
                  </select>
                </Field>
                <Field label="Categoria">
                  <select name="categoria" value={allocation.categoria} onChange={update(setAllocation)}>
                    <option>Financeiro</option><option>Merenda Escolar</option>
                  </select>
                </Field>
                <Field label="Origem do recurso"><input name="origem" value={allocation.origem} onChange={update(setAllocation)} required placeholder="PDDE, convênio, recurso municipal..." /></Field>
                <Field label="Valor"><input name="valor" value={allocation.valor} onChange={update(setAllocation)} required type="number" min="0.01" step="0.01" /></Field>
                <Field label="Data de recebimento"><input name="dataRecebimento" value={allocation.dataRecebimento} onChange={update(setAllocation)} required type="date" /></Field>
                <Field label="Competência"><input name="competencia" value={allocation.competencia} onChange={update(setAllocation)} required type="month" /></Field>
                <Field label="Descrição" wide><input name="descricao" value={allocation.descricao} onChange={update(setAllocation)} required /></Field>
                <Field label="Finalidade" wide><textarea name="finalidade" value={allocation.finalidade} onChange={update(setAllocation)} required /></Field>
              </div>
              <button disabled={saving}>Alocar recurso</button>
            </form>
          )}

          <section className="finance-card">
            <h2>Recursos por escola</h2>
            {data.allocations.length === 0 ? <p className="finance-empty">Nenhum recurso alocado.</p> : (
              <div className="finance-table-wrap"><table className="finance-table"><thead><tr><th>Escola/recurso</th><th>Categoria</th><th>Alocado</th><th>Utilizado</th><th>Saldo</th><th>Situação</th></tr></thead><tbody>
                {data.allocations.map((item) => <tr key={item.id} className={item.status === 'Com pendencia' ? 'row-pending' : ''}><td><b>{item.escola}</b><small>{item.origem} · {item.competencia}</small></td><td>{item.categoria}</td><td>{money(item.valor_alocado)}</td><td>{money(item.valor_utilizado)}</td><td><b>{money(item.saldo)}</b></td><td><span className={`finance-status ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>{item.justificativa && <small>{item.justificativa}</small>}</td></tr>)}
              </tbody></table></div>
            )}
          </section>
        </>
      )}

      {tab === 'despesas' && (
        <>
          <form className="finance-card" onSubmit={submitExpense}>
            <div className="finance-section-title"><div><h2>Registrar despesa ou manutenção</h2><p>A nota fiscal é obrigatória. Após salvar, o valor não poderá ser alterado ou excluído.</p></div><span className="immutable-badge">Registro imutável</span></div>
            <div className="finance-fields">
              <Field label="Recurso disponível">
                <select name="alocacaoId" value={expense.alocacaoId} onChange={update(setExpense)} required>
                  <option value="">Selecione</option>
                  {data.allocations.filter((item) => item.saldo > 0).map((item) => <option key={item.id} value={item.id}>{item.escola} · {item.categoria} · saldo {money(item.saldo)}</option>)}
                </select>
              </Field>
              <Field label="Tipo">
                <select name="tipo" value={expense.tipo} onChange={update(setExpense)}><option>Despesa</option><option value="Manutencao">Manutenção</option><option>Merenda Escolar</option></select>
              </Field>
              <Field label="Categoria"><input name="categoria" value={expense.categoria} onChange={update(setExpense)} required placeholder="Material, reparo, alimentação..." /></Field>
              <Field label="Fornecedor"><input name="fornecedor" value={expense.fornecedor} onChange={update(setExpense)} required /></Field>
              <Field label="Valor"><input name="valor" value={expense.valor} onChange={update(setExpense)} required type="number" min="0.01" step="0.01" /></Field>
              <Field label="Data"><input name="dataLancamento" value={expense.dataLancamento} onChange={update(setExpense)} required type="date" /></Field>
              <Field label="Número da nota fiscal"><input name="numeroNotaFiscal" value={expense.numeroNotaFiscal} onChange={update(setExpense)} required /></Field>
              <Field label="Nota fiscal/comprovante"><input type="file" accept="image/*,.pdf" onChange={selectReceipt} required /></Field>
              <Field label="Descrição e justificativa" wide><textarea name="descricao" value={expense.descricao} onChange={update(setExpense)} required /></Field>
            </div>
            <button disabled={saving || data.allocations.length === 0}>Salvar lançamento</button>
          </form>

          <section className="finance-card">
            <h2>Lançamentos registrados</h2>
            {data.expenses.length === 0 ? <p className="finance-empty">Nenhuma despesa ou manutenção registrada.</p> : (
              <div className="finance-table-wrap"><table className="finance-table"><thead><tr><th>Data</th><th>Escola</th><th>Tipo/categoria</th><th>Fornecedor</th><th>Valor</th><th>Nota fiscal</th></tr></thead><tbody>
                {data.expenses.map((item) => <tr key={item.id}><td>{formatDate(item.data_lancamento)}</td><td>{item.escola}</td><td><b>{item.tipo === 'Manutencao' ? 'Manutenção' : item.tipo}</b><small>{item.categoria}</small></td><td>{item.fornecedor}</td><td><b>{money(item.valor)}</b></td><td><a className="receipt-link" href={item.comprovante_arquivo} download={`nota-${item.numero_nota_fiscal}`}>NF {item.numero_nota_fiscal}</a></td></tr>)}
              </tbody></table></div>
            )}
          </section>
        </>
      )}

      {tab === 'contas' && (
        <>
          <form className="finance-card" onSubmit={submitStatement}>
            <h2>Enviar prestação de contas</h2>
            <div className="finance-fields">
              <Field label="Escola"><select name="escolaId" value={statement.escolaId} onChange={update(setStatement)} required><option value="">Selecione</option>{data.schools.map((school) => <option key={school.id} value={school.id}>{school.nome}</option>)}</select></Field>
              <Field label="Categoria"><select name="categoria" value={statement.categoria} onChange={update(setStatement)}><option>Financeiro</option><option>Merenda Escolar</option></select></Field>
              <Field label="Competência"><input name="competencia" value={statement.competencia} onChange={update(setStatement)} required type="month" /></Field>
              <Field label="Observações e resumo" wide><textarea name="observacoes" value={statement.observacoes} onChange={update(setStatement)} required /></Field>
            </div>
            <button disabled={saving || data.schools.length === 0}>Enviar prestação</button>
          </form>

          <section className="finance-card printable-finance">
            <div className="finance-section-title"><h2>Prestações enviadas</h2><button type="button" onClick={() => window.print()}>Imprimir relatório</button></div>
            {data.statements.length === 0 ? <p className="finance-empty">Nenhuma prestação enviada.</p> : (
              <div className="finance-table-wrap"><table className="finance-table"><thead><tr><th>Competência</th><th>Escola</th><th>Categoria</th><th>Responsável</th><th>Situação</th></tr></thead><tbody>
                {data.statements.map((item) => <tr key={item.id}><td>{item.competencia}</td><td>{item.escola}</td><td>{item.categoria}</td><td>{item.enviada_por}</td><td><span className={`finance-status ${statusClass(item.status)}`}>{statusLabel(item.status)}</span></td></tr>)}
              </tbody></table></div>
            )}
          </section>
        </>
      )}

      {tab === 'auditoria' && data.municipal && (
        <>
          <form className="finance-card audit-card" onSubmit={submitAudit}>
            <h2>Avaliar execução financeira</h2>
            <p>Registre aprovação, solicite comprovação ou marque reunião com a gestão escolar.</p>
            <div className="finance-fields">
              <Field label="Recurso/escola"><select name="alocacaoId" value={audit.alocacaoId} onChange={update(setAudit)} required><option value="">Selecione</option>{data.allocations.map((item) => <option key={item.id} value={item.id}>{item.escola} · {item.categoria} · {money(item.valor_alocado)}</option>)}</select></Field>
              <Field label="Situação"><select name="status" value={audit.status} onChange={update(setAudit)}><option value="Aprovado">Aprovado</option><option value="Com pendencia">Com pendência — solicitar comprovação</option><option value="Reuniao solicitada">Reunião solicitada</option></select></Field>
              {audit.status === 'Reuniao solicitada' && <Field label="Data e horário da reunião"><input name="dataReuniao" value={audit.dataReuniao} onChange={update(setAudit)} required type="datetime-local" /></Field>}
              <Field label="Justificativa da avaliação" wide><textarea name="justificativa" value={audit.justificativa} onChange={update(setAudit)} required placeholder="Descreva a análise, inconsistência ou comprovação necessária." /></Field>
            </div>
            <button disabled={saving || data.allocations.length === 0}>Registrar avaliação</button>
          </form>

          <section className="finance-card">
            <h2>Acompanhamento das escolas</h2>
            <div className="audit-school-grid">
              {data.allocations.map((item) => <article key={item.id} className={item.status === 'Com pendencia' ? 'audit-alert' : ''}><div><strong>{item.escola}</strong><small>{item.categoria} · {money(item.valor_alocado)}</small></div><span className={`finance-status ${statusClass(item.status)}`}>{statusLabel(item.status)}</span><p>{item.justificativa || 'Aguardando avaliação do Gestor.'}</p>{item.data_reuniao && <b>Reunião: {new Date(item.data_reuniao).toLocaleString('pt-BR')}</b>}</article>)}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
