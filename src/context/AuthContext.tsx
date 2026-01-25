import { createContext, useContext, createResource, JSX, createSignal, onMount } from 'solid-js';
import { useNavigate, useLocation } from '@solidjs/router';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: () => User | null | undefined;
  loading: () => boolean;
  revalidate: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>();

export function AuthProvider(props: { children: JSX.Element }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, { mutate, refetch }] = createResource(async () => {
    const res = await fetch('/api/session');
    if (!res.ok) {return null;}
    return res.json();
  });

  const logout = () => {
    document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    mutate(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ 
      user: () => user(), 
      loading: () => user.loading,
      revalidate: refetch,
      logout 
    }}>
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {throw new Error('useAuth must be used within an AuthProvider');}
  return context;
}
