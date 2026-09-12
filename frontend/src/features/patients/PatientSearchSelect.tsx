import { useEffect, useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Search, UserRound, X } from 'lucide-react';
import { formatPatientAge } from '../../components/PatientAge';
import type { Patient } from '../../types/patient';
import { listPatients } from './patients.api';

interface Props {
  value: string;
  initialPatient?: Patient;
  invalid?: boolean;
  onChange: (patientId: string) => void;
}

export function PatientSearchSelect({ value, initialPatient, invalid, onChange }: Props) {
  const listId = useId();
  const [text, setText] = useState(initialPatient ? fullName(initialPatient) : '');
  const [selected, setSelected] = useState<Patient | undefined>(initialPatient);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [debounced, setDebounced] = useState('');

  useEffect(() => { const timer = window.setTimeout(() => setDebounced(text.trim()), 250); return () => window.clearTimeout(timer); }, [text]);
  useEffect(() => { if (initialPatient && value === initialPatient.id) { setSelected(initialPatient); setText(fullName(initialPatient)); } }, [initialPatient, value]);
  const patients = useQuery({
    queryKey: ['patients', 'appointment-search', debounced],
    queryFn: () => listPatients({ search: debounced || undefined, page: 1, limit: 15, sort: 'name', order: 'asc' }),
    enabled: open && !selected,
    staleTime: 30_000,
  });
  const results = patients.data?.data ?? [];
  const choose = (patient: Patient) => { setSelected(patient); setText(fullName(patient)); setOpen(false); onChange(patient.id); };
  const clear = () => { setSelected(undefined); setText(''); setOpen(true); onChange(''); };

  return <div className={`patient-combobox ${invalid ? 'patient-combobox--invalid' : ''}`}>
    <div className="patient-combobox__input"><Search size={18} /><input role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" value={text} placeholder="Escribe nombre o apellido…" onFocus={() => !selected && setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 120)} onChange={(event) => { setText(event.target.value); setSelected(undefined); setOpen(true); setActiveIndex(0); onChange(''); }} onKeyDown={(event) => {
      if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, Math.max(0, results.length - 1))); }
      if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(0, index - 1)); }
      if (event.key === 'Enter' && open && results[activeIndex]) { event.preventDefault(); choose(results[activeIndex]); }
      if (event.key === 'Escape') setOpen(false);
    }} />{selected ? <button type="button" onClick={clear} aria-label="Cambiar paciente"><X size={17} /></button> : null}</div>
    {open && !selected && <div className="patient-combobox__menu" id={listId} role="listbox">
      {patients.isPending && <p>Buscando pacientes…</p>}
      {patients.isError && <p>No fue posible buscar pacientes.</p>}
      {!patients.isPending && !patients.isError && results.length === 0 && <p>No encontramos pacientes.</p>}
      {results.map((patient, index) => <button type="button" role="option" aria-selected={patient.id === value} className={index === activeIndex ? 'active' : ''} key={patient.id} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(patient)}><span><UserRound size={17} /></span><span><strong>{fullName(patient)}</strong><small>{formatPatientAge(patient.ageValue, patient.ageUnit)}</small></span>{patient.id === value && <Check size={17} />}</button>)}
    </div>}
  </div>;
}

function fullName(patient: Patient) { return `${patient.firstName} ${patient.lastName}`; }
