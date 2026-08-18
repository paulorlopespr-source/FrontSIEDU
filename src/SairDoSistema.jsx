import React, { useState } from 'react';
import { ConfirmDialog } from './SieduUI';

export default function SairDoSistema() {
  const [confirming, setConfirming] = useState(false);

  function sair() {
    localStorage.removeItem('sigepin_session');
    sessionStorage.removeItem('sigepin_session');
    window.location.assign('/login');
  }

  return <><button className="logout-screen-button" type="button" onClick={() => setConfirming(true)}>Sair do sistema</button><ConfirmDialog open={confirming} title="Sair do SIEDU?" description="Sua sessão será encerrada e você voltará para a tela de login." confirmLabel="Sair do sistema" danger onConfirm={sair} onCancel={() => setConfirming(false)}/></>;
}
