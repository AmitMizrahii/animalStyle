/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./LoginPage.css";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
            },
          ) => void;
        };
      };
    };
  }
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as
    | string
    | undefined;
  const showGoogleBtn =
    !!googleClientId && googleClientId !== "your-google-client-id";

  // Initialise Google Identity Services after the GSI script loads
  useEffect(() => {
    if (!showGoogleBtn) return;

    const initGSI = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId!,
        callback: async ({ credential }) => {
          setError(null);
          try {
            await loginWithGoogle(credential);
            navigate("/");
          } catch {
            setError("Google sign-in failed. Please try again.");
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: 340,
        text: "continue_with",
      });
    };

    if (window.google) {
      initGSI();
      return;
    }

    const script = document.querySelector<HTMLScriptElement>(
      'script[src*="accounts.google.com/gsi/client"]',
    );
    if (script) {
      script.addEventListener("load", initGSI);
      return () => script.removeEventListener("load", initGSI);
    }
    return;
  }, [showGoogleBtn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
    }
  };

  return (
    <div className="login-page">
      <div className="login-deco login-deco--paw" aria-hidden>
        🐾
      </div>
      <div className="login-deco login-deco--heart" aria-hidden>
        🫶
      </div>

      <div className="login-brand">
        <span className="login-brand-icon">🐾</span>
        <span className="login-brand-name">Animal Adoption</span>
      </div>

      <div className="login-card">
        <div className="login-card-icon">
          <svg
            width="58"
            height="58"
            viewBox="0 0 58 58"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="58" height="58" rx="15" fill="#4caf50" />
            <rect x="27" y="3" width="4" height="11" rx="2" fill="#2e7d32" />
            <circle cx="29" cy="3" r="4" fill="#a5d6a7" />
            <rect x="12" y="21" width="13" height="11" rx="3" fill="white" />
            <rect x="33" y="21" width="13" height="11" rx="3" fill="white" />
            <rect
              x="15"
              y="38"
              width="28"
              height="5"
              rx="2.5"
              fill="white"
              opacity="0.75"
            />
          </svg>
        </div>
        <p className="login-powered">POWERED BY SMARTMATCH AI</p>
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Find your perfect furry friend today</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="password">Password</label>
            </div>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.74-1.55 1.85-2.95 3.19-4.06" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.89 11 7a18.05 18.05 0 0 1-2.16 3.48" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // eye
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-divider">OR</div>

        {showGoogleBtn ? (
          <div ref={googleBtnRef} className="google-btn-wrapper" />
        ) : (
          <button type="button" className="google-btn" disabled>
            <svg className="google-icon" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        )}

        <div className="login-footer">
          <p>
            Don&apos;t have an account?{" "}
            <Link to="/register" className="register-link">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
