// App.tsx - ✅ IMPORTS COMPLETOS
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react'; // ✅ ESTE IMPORT FALTABA
import Login from './components/Login';
import Evaluation from './components/evaluation/Evaluation';
import MisEvaluaciones from './pages/MisEvaluaciones';
import EvaluacionesAdmin from './pages/EvaluacionesAdmin';
import EvaluacionDetalleAdmin from './pages/EvaluacionDetalleAdmin';
import Header from './components/Header';
import DetalleEvaluacion from './pages/EvaluacionDetalle';
import ProtectedRoute from './components/ProtectedRoute';

function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // ✅ Ahora funciona
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
        
        {/* ✅ PROTEGIDO - Solo SUPERVISOR */}
        <Route
          path="/evaluaciones-admin"
          element={
            <ProtectedRoute requiredNivel="SUPERVISOR">
              <AppLayout>
                <EvaluacionesAdmin />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/evaluaciones-admin/detalle/:id"
          element={
            <ProtectedRoute requiredNivel="SUPERVISOR">
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

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
