import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const History = lazy(() => import("./pages/History"));
const Login = lazy(() => import("./pages/Login"));
const ModelInfo = lazy(() => import("./pages/ModelInfo"));
const Predict = lazy(() => import("./pages/Predict"));
const Users = lazy(() => import("./pages/Users"));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<div className="panel empty-state">Đang tải trang...</div>}>
            <Routes>
              <Route path="/" element={import.meta.env.VITE_APP_ENV === "staging" ? <ProtectedRoute><Predict /></ProtectedRoute> : <Predict />} />
              <Route path="/login" element={<Login />} />

              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/model-info"
                element={
                  <ProtectedRoute>
                    <ModelInfo />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Users />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
