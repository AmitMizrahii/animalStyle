import React from "react";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./hooks/useAuth";
import "./App.css";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";
import CreatePostPage from "./pages/CreatePostPage";
import Header from "./components/Header";

const App: React.FC = () => {
  const { isAuthenticated, isInitializing } = useAuth();

  return (
    <Router>
      <div className="app-shell">
        {isAuthenticated && <Header />}
        <main className="main-content">
          {isInitializing ? (
            <div className="loading-container">
              <div className="spinner">Loading...</div>
            </div>
          ) : (
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <CreatePostPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Fallback */}
              <Route
                path="*"
                element={
                  <div className="error-page">
                    <h1>404 - Page Not Found</h1>
                    <p>The page you are looking for does not exist.</p>
                  </div>
                }
              />
            </Routes>
          )}
        </main>
      </div>
    </Router>
  );
};

export default App;
