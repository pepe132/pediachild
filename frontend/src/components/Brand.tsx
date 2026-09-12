import { HeartPulse } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="PediaChild">
      <span className="brand__mark"><HeartPulse size={22} strokeWidth={2.4} /></span>
      {!compact && <span>Pedia<span>Child</span></span>}
    </div>
  );
}
