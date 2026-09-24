import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import { Brand } from '../components/Brand';
import { requestPasswordReset } from '../features/auth/auth.api';

export function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const response = await requestPasswordReset(identifier);
      setMessage(response.message);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No fue posible solicitar la recuperación.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-intro">
        <Brand />
        <div>
          <p className="eyebrow">Recuperación segura</p>
          <h1>Recupera el acceso a tu cuenta.</h1>
          <p>Te enviaremos instrucciones al correo registrado.</p>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card__heading">
            <h2>Olvidé mi contraseña</h2>
            <p>Escribe tu correo o teléfono de 10 dígitos.</p>
          </div>
          {message ? (
            <>
              <div className="alert">{message}</div>
              <Link className="button button--primary" to="/login">
                Volver al inicio
              </Link>
            </>
          ) : (
            <>
              <label className="field">
                <span>Correo o teléfono</span>
                <input
                  required
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  autoComplete="username"
                />
              </label>
              {error && <div className="alert alert--error">{error}</div>}
              <button className="button button--primary button--full" disabled={busy}>
                {busy ? 'Enviando…' : 'Enviar instrucciones'}
              </button>
              <Link className="text-link" to="/login">
                Volver al inicio
              </Link>
            </>
          )}
        </form>
      </section>
    </main>
  );
}
