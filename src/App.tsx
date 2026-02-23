import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthPage } from './routes/AuthPage';
import { ItemsListPage } from './routes/ItemsListPage';
import { ItemFormPage } from './routes/ItemFormPage';
import { ItemDetailPage } from './routes/ItemDetailPage';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth } from './routes/RequireAuth';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />

          <Route
            path="/items"
            element={
              <RequireAuth>
                <ItemsListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/items/new"
            element={
              <RequireAuth>
                <ItemFormPage mode="create" />
              </RequireAuth>
            }
          />
          <Route
            path="/items/:id"
            element={
              <RequireAuth>
                <ItemDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/items/:id/edit"
            element={
              <RequireAuth>
                <ItemFormPage mode="edit" />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/items" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;

