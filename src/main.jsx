import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AccountGate from './components/AccountGate.jsx';
import EmailAction from './components/EmailAction.jsx';
const isEmailAction = window.location.pathname === '/auth/action' || new URLSearchParams(window.location.search).has('oobCode');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isEmailAction ? <EmailAction /> : <AccountGate />}
  </StrictMode>
);
