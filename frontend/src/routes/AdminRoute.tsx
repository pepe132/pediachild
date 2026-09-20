import { Navigate,Outlet } from 'react-router-dom';
import { PageState } from '../components/PageState';
import { useCurrentUser } from '../features/auth/use-auth';
export function AdminRoute(){const {data,isPending}=useCurrentUser();if(isPending)return <PageState title="Verificando permisos…"/>;return data?.user.role==='ADMIN'?<Outlet/>:<Navigate to="/patients" replace/>;}
