import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { changePassword } from '../features/auth/auth.api';

export function SettingsPage() {
  const navigate=useNavigate(); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
  return <div className="page-stack"><header><p className="eyebrow">Cuenta</p><h1>Configuración y seguridad</h1></header>
    <form className="panel form-section" onSubmit={async event=>{event.preventDefault();setBusy(true);setMessage('');const data=new FormData(event.currentTarget);const next=String(data.get('newPassword'));if(next!==String(data.get('confirmation'))){setMessage('La confirmación no coincide.');setBusy(false);return;}try{await changePassword({currentPassword:String(data.get('currentPassword')),newPassword:next});navigate('/login',{replace:true,state:{passwordChanged:true}});}catch(error){setMessage(error instanceof ApiError?(error.fields?Object.values(error.fields).join(' '):error.message):'No fue posible cambiar la contraseña.');}finally{setBusy(false);}}}>
      <div className="form-section__heading"><div><h2>Cambiar contraseña</h2><p>Al cambiarla se cerrarán todas las sesiones abiertas.</p></div></div>
      <label className="field"><span>Contraseña actual</span><input name="currentPassword" type="password" required autoComplete="current-password" /></label>
      <div className="form-grid"><label className="field"><span>Nueva contraseña</span><input name="newPassword" type="password" required minLength={12} autoComplete="new-password" /></label><label className="field"><span>Confirmar contraseña</span><input name="confirmation" type="password" required minLength={12} autoComplete="new-password" /></label></div>
      {message&&<div className="alert alert--error">{message}</div>}<button className="button button--primary" disabled={busy}>{busy?'Actualizando…':'Cambiar contraseña'}</button>
    </form></div>;
}
