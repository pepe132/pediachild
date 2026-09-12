import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ApiError } from '../api/client';
import { Brand } from '../components/Brand';
import { useCurrentUser, useLogin } from '../features/auth/use-auth';

const schema = z.object({
  identifier: z.string().trim().min(5, 'Escribe tu correo o teléfono.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
});
type LoginValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useCurrentUser();
  const loginMutation = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
  });

  if (currentUser.data?.user) return <Navigate to="/patients" replace />;
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/patients';
  const apiMessage = loginMutation.error instanceof ApiError ? loginMutation.error.message : null;

  return (
    <main className="login-page">
      <section className="login-intro">
        <Brand />
        <div>
          <p className="eyebrow">Consulta pediátrica, organizada</p>
          <h1>Tu práctica clínica en un solo lugar.</h1>
          <p>Pacientes, consultas y agenda con una experiencia clara y sencilla.</p>
        </div>
        <small>Información segura · Acceso privado</small>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit(async (values) => {
          await loginMutation.mutateAsync(values);
          navigate(from, { replace: true });
        })} noValidate>
          <div className="login-card__heading">
            <p className="eyebrow">Bienvenido</p>
            <h2>Inicia sesión</h2>
            <p>Ingresa con la cuenta de tu consultorio.</p>
          </div>
          <label className="field">
            <span>Correo o teléfono</span>
            <input autoComplete="username" placeholder="doctor@consultorio.com o 4491234567" {...register('identifier')} />
            {errors.identifier && <small className="field__error">{errors.identifier.message}</small>}
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input type="password" autoComplete="current-password" placeholder="Tu contraseña" {...register('password')} />
            {errors.password && <small className="field__error">{errors.password.message}</small>}
          </label>
          {apiMessage && <div className="alert alert--error" role="alert">{apiMessage}</div>}
          <button className="button button--primary button--wide" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Ingresando…' : 'Ingresar'}
          </button>
          <p className="auth-switch">¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
        </form>
      </section>
    </main>
  );
}
