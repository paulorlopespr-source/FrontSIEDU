import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from './services/api';
import { passwordValidation } from './validation';
import './seguranca.css';

export default function RecuperarSenha() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [identificador, setIdentificador] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestCode(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await api.requestPasswordRecovery(identificador);
      setMessage(result.message);
      if (result.codigoDesenvolvimento) {
        setCodigo(result.codigoDesenvolvimento);
        setMessage(`${result.message} Código para teste local: ${result.codigoDesenvolvimento}`);
      }
      setStep('reset');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    const passwordError = passwordValidation(novaSenha);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (novaSenha !== confirmacao) {
      setError('A confirmação da senha está diferente.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await api.resetPassword({ identificador, codigo, novaSenha });
      setMessage(result.message);
      window.setTimeout(() => navigate('/login'), 1200);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="security-page">
      <section className="security-card">
        <div className="security-logo"><img src="/images/siedu-logo-transparent.svg" alt="SIEDU" /></div>
        <span>SEGURANÇA DA CONTA</span>
        <h1>Recuperar senha</h1>
        <p>Use seu usuário ou e-mail cadastrado na Secretaria de Educação.</p>

        {step === 'request' ? (
          <form onSubmit={requestCode}>
            <label>Usuário ou e-mail<input value={identificador} onChange={(event) => setIdentificador(event.target.value)} required autoComplete="username" /></label>
            <button disabled={loading}>{loading ? 'Solicitando...' : 'Solicitar código'}</button>
          </form>
        ) : (
          <form onSubmit={resetPassword}>
            <label>Código de seis números<input value={codigo} onChange={(event) => setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6))} required inputMode="numeric" pattern="[0-9]{6}" /></label>
            <label>Nova senha<input type="password" value={novaSenha} onChange={(event) => setNovaSenha(event.target.value)} required autoComplete="new-password" /></label>
            <small>Mínimo de 8 caracteres, com maiúscula, minúscula e número.</small>
            <label>Confirmar nova senha<input type="password" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} required autoComplete="new-password" /></label>
            <button disabled={loading}>{loading ? 'Redefinindo...' : 'Redefinir senha'}</button>
            <button className="security-secondary" type="button" onClick={() => setStep('request')}>Solicitar outro código</button>
          </form>
        )}

        {error && <p className="security-error">{error}</p>}
        {message && <p className="security-success">{message}</p>}
        <Link to="/login">← Voltar para o login</Link>
      </section>
    </main>
  );
}
