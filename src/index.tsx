/* @refresh reload */
import { render } from 'solid-js/web';
import { Router, Route, A } from "@solidjs/router";
import { lazy } from 'solid-js';
import 'solid-devtools';

import './index.css';
import App from './App';

const Landing = () => (
  <div class="flex flex-col items-center justify-center p-6 md:p-10 flex-1 max-w-2xl mx-auto text-center">
    <div class="mb-12">
      <div class="bg-primary w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30 animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h1 class="text-6xl font-black tracking-tighter mb-4">EnergyMonitor</h1>
      <p class="text-xl text-base-content/60 font-bold max-w-md mx-auto leading-relaxed">
        The high-performance cockpit for your household energy infrastructure.
      </p>
    </div>

    <div class="card bg-base-100 shadow-2xl border border-base-content/5 w-full">
      <div class="card-body p-10 md:p-12">
        <h2 class="text-2xl font-black uppercase tracking-widest opacity-40 mb-6">Account Access</h2>
        <div class="grid grid-cols-1 gap-4">
          <A href="/login" class="btn btn-primary btn-lg rounded-2xl font-black text-lg h-16 shadow-xl shadow-primary/20">
            Sign In
          </A>
          <A href="/register" class="btn btn-ghost btn-lg rounded-2xl font-bold opacity-60">
            Create Account
          </A>
        </div>
      </div>
    </div>
    
    <div class="mt-12 opacity-20 font-black tracking-widest text-[10px] uppercase">
      Powered by SolidJS & MongoDB
    </div>
  </div>
);

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

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
const Profile = lazy(() => import("./pages/Profile"));

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => (
  <Router root={(props) => <AuthProvider><App {...props} /></AuthProvider>}>
    <Route path="/" component={Landing} />
    <Route path="/login" component={Login} />
    <Route path="/register" component={Register} />
    
    <Route path="/dashboard" component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/meters" component={() => <ProtectedRoute><Meters /></ProtectedRoute>} />
    <Route path="/meters/add" component={() => <ProtectedRoute><AddMeter /></ProtectedRoute>} />
    <Route path="/meters/:id/edit" component={() => <ProtectedRoute><AddMeter /></ProtectedRoute>} />
    <Route path="/meters/:id" component={() => <ProtectedRoute><MeterDetail /></ProtectedRoute>} />
    <Route path="/meters/:id/readings" component={() => <ProtectedRoute><MeterReadings /></ProtectedRoute>} />
    <Route path="/meters/:id/add-reading" component={() => <ProtectedRoute><AddReading /></ProtectedRoute>} />
    <Route path="/contracts" component={() => <ProtectedRoute><Contracts /></ProtectedRoute>} />
    <Route path="/contracts/add" component={() => <ProtectedRoute><AddContract /></ProtectedRoute>} />
    <Route path="/contracts/:id/edit" component={() => <ProtectedRoute><AddContract /></ProtectedRoute>} />
    <Route path="/profile" component={() => <ProtectedRoute><Profile /></ProtectedRoute>} />
  </Router>
), root!);
