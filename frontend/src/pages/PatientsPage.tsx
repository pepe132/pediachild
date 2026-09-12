import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowDownUp, ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { formatPatientAge } from '../components/PatientAge';
import { PageState } from '../components/PageState';
import { listPatients, type PatientFilters } from '../features/patients/patients.api';
import type { Patient } from '../types/patient';

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

function patientAge(patient: Patient) {
  return formatPatientAge(patient.ageValue, patient.ageUnit);
}

export function PatientsPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        if (search.trim()) next.set('search', search.trim());
        else next.delete('search');
        next.delete('page');
        return next;
      }, { replace: true });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, setParams]);

  const filters: PatientFilters = {
    search: params.get('search') ?? undefined,
    registeredFrom: params.get('registeredFrom') ?? undefined,
    registeredTo: params.get('registeredTo') ?? undefined,
    page: Math.max(1, Number(params.get('page') ?? 1)),
    limit: 10,
    sort: params.get('sort') === 'name' ? 'name' : 'createdAt',
    order: params.get('order') === 'asc' ? 'asc' : 'desc',
  };
  const patients = useQuery({
    queryKey: ['patients', filters],
    queryFn: () => listPatients(filters),
    placeholderData: keepPreviousData,
  });

  const setFilter = (key: string, value?: string) => setParams((current) => {
    const next = new URLSearchParams(current);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    return next;
  });
  const clearFilters = () => { setSearch(''); setParams({}); };
  const hasFilters = Boolean(filters.search || filters.registeredFrom || filters.registeredTo);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div><p className="eyebrow">Expedientes clínicos</p><h1>Pacientes</h1><p>Consulta y administra la información de tus pacientes.</p></div>
        <Link className="button button--primary" to="/patients/new"><Plus size={19} /> Nuevo paciente</Link>
      </header>

      <section className="panel filters-panel" aria-label="Filtros de pacientes">
        <label className="search-field"><Search size={19} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre…" aria-label="Buscar por nombre" /></label>
        <div className="date-filters">
          <label><span>Desde</span><input type="date" value={filters.registeredFrom ?? ''} onChange={(e) => setFilter('registeredFrom', e.target.value)} /></label>
          <label><span>Hasta</span><input type="date" value={filters.registeredTo ?? ''} onChange={(e) => setFilter('registeredTo', e.target.value)} /></label>
        </div>
        {hasFilters && <button className="button button--ghost" onClick={clearFilters}><SlidersHorizontal size={17} /> Limpiar</button>}
      </section>

      <section className="panel patients-panel">
        <div className="panel__heading">
          <div><h2>Todos los pacientes</h2><p>{patients.data ? `${patients.data.pagination.total} registrados` : 'Consultando registros…'}</p></div>
          <button className="button button--ghost" onClick={() => {
            setFilter('sort', filters.sort === 'createdAt' ? 'name' : 'createdAt');
            setFilter('order', filters.order === 'asc' ? 'desc' : 'asc');
          }}><ArrowDownUp size={17} /> Ordenar</button>
        </div>

        {patients.isPending && <PageState title="Cargando pacientes…" />}
        {patients.isError && <PageState title="No pudimos cargar los pacientes">{patients.error instanceof ApiError ? patients.error.message : 'Intenta nuevamente.'}</PageState>}
        {patients.data?.data.length === 0 && <PageState title={hasFilters ? 'No encontramos coincidencias' : 'Aún no hay pacientes'}>{hasFilters ? 'Prueba con otros filtros.' : 'Registra al primer paciente para comenzar.'}</PageState>}
        {patients.data && patients.data.data.length > 0 && <>
          <div className="table-wrap">
            <table className="patients-table">
              <thead><tr><th>Paciente</th><th>Edad registrada</th><th>Fecha de nacimiento</th><th>Registro</th><th><span className="sr-only">Acciones</span></th></tr></thead>
              <tbody>{patients.data.data.map((patient) => <tr key={patient.id}>
                <td><Link className="patient-name" to={`/patients/${patient.id}`}><span className="patient-avatar">{patient.firstName.charAt(0)}{patient.lastName.charAt(0)}</span><span><strong>{patient.firstName} {patient.lastName}</strong><small>Expediente activo</small></span></Link></td>
                <td data-label="Edad">{patientAge(patient)}</td>
                <td data-label="Nacimiento">{patient.dateOfBirth ? dateFormatter.format(new Date(`${patient.dateOfBirth}T12:00:00`)) : 'No registrada'}</td>
                <td data-label="Registro">{dateFormatter.format(new Date(patient.createdAt))}</td>
                <td><Link className="table-action" to={`/patients/${patient.id}`}>Ver expediente <ChevronRight size={17} /></Link></td>
              </tr>)}</tbody>
            </table>
          </div>
          <footer className="pagination">
            <span>Página {patients.data.pagination.page} de {Math.max(1, patients.data.pagination.totalPages)}</span>
            <div><button className="icon-button" disabled={filters.page <= 1} onClick={() => setFilter('page', String(filters.page - 1))} aria-label="Página anterior"><ChevronLeft /></button><button className="icon-button" disabled={filters.page >= patients.data.pagination.totalPages} onClick={() => setFilter('page', String(filters.page + 1))} aria-label="Página siguiente"><ChevronRight /></button></div>
          </footer>
        </>}
      </section>
    </div>
  );
}
