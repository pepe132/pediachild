import { PageState } from '../components/PageState';

export function ComingSoonPage({ title }: { title: string }) {
  return <div className="panel"><PageState title={title}>Esta sección se conectará en la siguiente etapa.</PageState></div>;
}
