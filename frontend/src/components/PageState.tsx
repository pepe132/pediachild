import type { ReactNode } from 'react';

export function PageState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="page-state" role="status">
      <div className="page-state__icon" aria-hidden="true">+</div>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
