import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import CreatePostPage from "./pages/CreatePostPage";
import FeedPage from "./pages/FeedPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

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
                path="/"
                element={
                  <ProtectedRoute>
                    <FeedPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <CreatePostPage />
                  </ProtectedRoute>
                }
              />
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
