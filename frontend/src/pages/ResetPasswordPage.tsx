import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { Brand } from '../components/Brand';
import { PasswordInput } from '../components/PasswordInput';
import { resetPassword } from '../features/auth/auth.api';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (password.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres.');
      return;
    }

    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setBusy(true);
    try {
      await resetPassword(token, password);
      setMessage('Contraseña actualizada. Ya puedes iniciar sesión.');
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No fue posible actualizar la contraseña.',
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
          <p className="eyebrow">Nueva contraseña</p>
          <h1>Protege nuevamente tu cuenta.</h1>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card__heading">
            <h2>Crear contraseña nueva</h2>
          </div>
          {message ? (
            <>
              <div className="alert">{message}</div>
              <Link className="button button--primary" to="/login">
                Iniciar sesión
              </Link>
            </>
          ) : (
            <>
              {!token && (
                <div className="alert alert--error">
                  El enlace de recuperación no es válido.
                </div>
              )}
              <label className="field">
                <span>Nueva contraseña</span>
                <PasswordInput
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <label className="field">
                <span>Confirmar contraseña</span>
                <PasswordInput
                  required
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="new-password"
                />
              </label>
              {error && <div className="alert alert--error">{error}</div>}
              <button
                className="button button--primary button--full"
                disabled={busy || !token}
              >
                {busy ? 'Guardando…' : 'Actualizar contraseña'}
              </button>
            </>
          )}
        </form>
      </section>
    </main>
  );
}
