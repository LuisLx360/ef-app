// App.tsx - ✅ IMPORTS COMPLETOS
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react'; 
import Login from './components/Login';
import Evaluation from './components/evaluation/Evaluation';
import MisEvaluaciones from './pages/MisEvaluaciones';
import EvaluacionesAdmin from './pages/EvaluacionesAdmin';
import EvaluacionDetalleAdmin from './pages/EvaluacionDetalleAdmin';
import EvaluacionMisEmpleados from './pages/EvaluacionesMisEmpleados';
import Header from './components/Header';
import DetalleEvaluacion from './pages/EvaluacionDetalle';
import ProtectedRoute from './components/ProtectedRoute';

function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  return (
    <>
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <main className="min-h-screen bg-gray-50">{children}</main>
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* ✅ PROTEGIDO - Todos los usuarios */}
        <Route
          path="/evaluaciones"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Evaluation />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/mis-evaluaciones"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MisEvaluaciones />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ✅ PROTEGIDO - Supervisores y Evaluadores pueden ver a su equipo */}
        <Route
          path="/mi-equipo"
          element={
            <ProtectedRoute allowedRoles={['SUPERVISOR', 'EVALUADOR']}>
              <AppLayout>
                <EvaluacionMisEmpleados /> {/* Componente para ver tu equipo */}
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ✅ PROTEGIDO - Solo SUPERVISOR para administración completa */}
        <Route
          path="/evaluaciones-admin"
          element={
            <ProtectedRoute allowedRoles={['SUPERVISOR', 'EVALUADOR']}>
              <AppLayout>
                <EvaluacionesAdmin />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluaciones-admin/mis-empleados"
          element={
            <ProtectedRoute allowedRoles={['SUPERVISOR', 'EVALUADOR']}>
              <AppLayout>
                <EvaluacionMisEmpleados />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/evaluaciones-admin/detalle/:id"
          element={
            <ProtectedRoute allowedRoles={['SUPERVISOR', 'EVALUADOR']}>
              <AppLayout>
                <EvaluacionDetalleAdmin />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/evaluaciones/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DetalleEvaluacion />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirecciones por defecto */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

