/* @refresh reload */
import { render } from 'solid-js/web';
import { Router, Route, Navigate } from "@solidjs/router";
import { lazy } from 'solid-js';
import 'solid-devtools';

import './index.css';
import App from './App';
import Landing from './pages/Landing';

import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SupplierRedirect from "./pages/SupplierRedirect";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Meters = lazy(() => import("./pages/Meters"));
const AddMeter = lazy(() => import("./pages/AddMeter"));
const AddReading = lazy(() => import("./pages/AddReading"));
const MeterDetail = lazy(() => import("./pages/MeterDetail"));
const MeterReadings = lazy(() => import("./pages/MeterReadings"));
const Contracts = lazy(() => import("./pages/Contracts"));
const AddContract = lazy(() => import("./pages/AddContract"));
const SupplierDetail = lazy(() => import("./pages/SupplierDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const ImportExport = lazy(() => import("./pages/ImportExport"));

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => (
  <Router root={(props) => (
    <AuthProvider>
      <ToastProvider>
        <App {...props} />
      </ToastProvider>
    </AuthProvider>
  )}>
    <Route path="/" component={Landing} />
    <Route path="/login" component={Login} />
    <Route path="/register" component={Register} />
    
    <Route path="/dashboard" component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/add-reading" component={() => <ProtectedRoute><AddReading /></ProtectedRoute>} />
    <Route path="/meters" component={() => <ProtectedRoute><Meters /></ProtectedRoute>} />
    <Route path="/meters/add" component={() => <ProtectedRoute><AddMeter /></ProtectedRoute>} />
    <Route path="/meters/:id/edit" component={() => <ProtectedRoute><AddMeter /></ProtectedRoute>} />
    <Route path="/meters/:id" component={() => <ProtectedRoute><MeterDetail /></ProtectedRoute>} />
    <Route path="/meters/:id/readings" component={() => <ProtectedRoute><MeterReadings /></ProtectedRoute>} />
    <Route path="/meters/:id/add-reading" component={() => <ProtectedRoute><AddReading /></ProtectedRoute>} />
    <Route path="/contracts" component={() => <ProtectedRoute><Contracts /></ProtectedRoute>} />
    <Route path="/contracts/add" component={() => <ProtectedRoute><AddContract /></ProtectedRoute>} />
     <Route path="/contracts/:id/edit" component={() => <ProtectedRoute><AddContract /></ProtectedRoute>} />
     <Route path="/contracts/:id" component={SupplierRedirect} />
     <Route path="/suppliers/:id" component={() => <ProtectedRoute><SupplierDetail /></ProtectedRoute>} />
     <Route path="/profile" component={() => <ProtectedRoute><Profile /></ProtectedRoute>} />
     <Route path="/intake" component={() => <Navigate href="/contracts" />} />
     <Route path="/import-export" component={() => <ProtectedRoute><ImportExport /></ProtectedRoute>} />
   </Router>
), root!);
