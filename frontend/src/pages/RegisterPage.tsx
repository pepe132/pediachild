import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { Brand } from '../components/Brand';
import { registerSpecialist } from '../features/auth/auth.api';

const specialties = [
  'Pediatría',
  'Medicina general',
  'Medicina familiar',
  'Medicina interna',
  'Ginecología y obstetricia',
  'Cardiología',
  'Dermatología',
  'Endocrinología',
  'Gastroenterología',
  'Neurología',
  'Oftalmología',
  'Otorrinolaringología',
  'Psiquiatría',
  'Traumatología y ortopedia',
  'Urología',
  'Otra',
] as const;

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  return <main className="login-page">
    <section className="login-intro">
      <Brand />
      <div>
        <p className="eyebrow">Nueva cuenta profesional</p>
        <h1>Organiza tu práctica clínica.</h1>
        <p>Cada especialista administra exclusivamente sus pacientes, citas y consultas.</p>
      </div>
      <small>Acceso privado · Datos separados</small>
    </section>

    <section className="login-panel">
      <form className="login-card register-card" onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        const data = new FormData(event.currentTarget);

        try {
          await registerSpecialist({
            name: String(data.get('name')),
            email: String(data.get('email')),
            phone: String(data.get('phone')),
            specialty: String(data.get('specialty')),
            professionalLicense: String(data.get('professionalLicense')),
            specialtyLicense: String(data.get('specialtyLicense')) || null,
            clinicName: String(data.get('clinicName')) || null,
            clinicPhone: null,
            clinicAddress: null,
            password: String(data.get('password')),
          });
          navigate('/login', { replace: true, state: { registered: true } });
        } catch (cause) {
          if (cause instanceof ApiError) {
            const details = cause.fields ? Object.values(cause.fields).join(' ') : '';
            setError(details || cause.message);
          } else {
            setError('No fue posible crear la cuenta.');
          }
        } finally {
          setBusy(false);
        }
      }}>
        <div className="login-card__heading">
          <p className="eyebrow">Registro</p>
          <h2>Cuenta de especialista</h2>
          <p>Podrás completar más datos del consultorio después.</p>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Nombre completo</span>
            <input name="name" required minLength={2} />
          </label>
          <label className="field">
            <span>Especialidad</span>
            <select name="specialty" required defaultValue="">
              <option value="" disabled>Selecciona una especialidad</option>
              {specialties.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
            </select>
          </label>
        </div>

        <div className="form-grid">
          <label className="field"><span>Correo</span><input name="email" type="email" required /></label>
          <label className="field"><span>Teléfono</span><input name="phone" type="tel" required inputMode="numeric" pattern="[0-9]{10}" minLength={10} maxLength={10} placeholder="4491234567" /></label>
        </div>
        <div className="form-grid">
          <label className="field"><span>Cédula profesional</span><input name="professionalLicense" required /></label>
          <label className="field"><span>Cédula de especialidad</span><input name="specialtyLicense" /></label>
        </div>
        <label className="field"><span>Consultorio</span><input name="clinicName" /></label>
        <label className="field"><span>Contraseña</span><input name="password" type="password" minLength={12} required autoComplete="new-password" /><small>Mínimo 12 caracteres.</small></label>
        {error && <div className="alert alert--error">{error}</div>}
        <button className="button button--primary button--wide" disabled={busy}>{busy ? 'Creando cuenta…' : 'Crear cuenta'}</button>
        <p className="auth-switch">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </form>
    </section>
  </main>;
}
