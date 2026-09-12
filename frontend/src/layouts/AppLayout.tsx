import { CalendarDays, LogOut, Menu, Settings, Users, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { useCurrentUser, useLogout } from '../features/auth/use-auth';

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const { data } = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();
  const initial = data?.user.name.trim().charAt(0).toUpperCase() ?? 'P';

  const closeMenu = () => setOpen(false);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <Brand />
          <button className="icon-button sidebar__close" onClick={closeMenu} aria-label="Cerrar menú"><X /></button>
        </div>
        <nav className="sidebar__nav" aria-label="Navegación principal">
          <NavLink to="/patients" onClick={closeMenu}><Users size={20} /> Pacientes</NavLink>
          <NavLink to="/appointments" onClick={closeMenu}><CalendarDays size={20} /> Agenda</NavLink>
          <span className="sidebar__section">Cuenta</span>
          <NavLink to="/settings" onClick={closeMenu}><Settings size={20} /> Configuración</NavLink>
        </nav>
        <button className="sidebar__logout" onClick={async () => {
          await logout.mutateAsync();
          navigate('/login', { replace: true });
        }}><LogOut size={19} /> Cerrar sesión</button>
      </aside>
      {open && <button className="sidebar-backdrop" onClick={closeMenu} aria-label="Cerrar menú" />}
      <div className="app-main">
        <header className="topbar">
          <button className="icon-button topbar__menu" onClick={() => setOpen(true)} aria-label="Abrir menú"><Menu /></button>
          <div className="topbar__context"><span>Consultorio</span><strong>PediaChild</strong></div>
          <div className="profile"><span className="profile__avatar">{initial}</span><span><strong>{data?.user.name}</strong><small>Pediatra</small></span></div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
