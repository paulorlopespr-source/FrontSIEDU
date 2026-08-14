import React from 'react';

export default function SairDoSistema() {
  function sair() {
    if (!window.confirm('Tem certeza que quer sair do sistema?')) {
      return;
    }
    localStorage.removeItem('sigepin_session');
    sessionStorage.removeItem('sigepin_session');
    window.location.assign('/login');
  }

  return <button className="logout-screen-button" type="button" onClick={sair}>Sair do sistema</button>;
}
