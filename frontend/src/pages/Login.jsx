import { useAuth } from "../context/AuthContext.jsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const API_URL = "http://127.0.0.1:8000";

function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [signupMessage, setSignupMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleLogin(e) {
    e.preventDefault();
    setLoginMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginMessage(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to sign in. Please try again."
        );
        return;
      }

      login(data.access_token);
      navigate("/");
    } catch {
      setLoginMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setSignupMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: signupEmail,
          password: signupPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSignupMessage(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to create account. Please try again."
        );
        return;
      }

      setSignupMessage("Account created successfully! Please sign in.");
      setLoginEmail(signupEmail);
      setLoginPassword("");
      setSignupPassword("");
      setIsSignUp(false);
    } catch {
      setSignupMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(signUp) {
    setIsSignUp(signUp);
    setLoginMessage("");
    setSignupMessage("");
  }

  return (
    <div className={`auth-container ${isSignUp ? "sign-up-mode" : ""}`}>
      <div className="auth-forms-container">
        <div className="auth-signin-signup">
          <form className="auth-form auth-sign-in-form" onSubmit={handleLogin}>
            <h2 className="auth-title">Sign In</h2>

            <div className="auth-input-field">
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-input-field">
              <input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Sign In"}
            </button>

            {loginMessage && (
              <p className="auth-message" role="status">
                {loginMessage}
              </p>
            )}

            <p className="auth-mobile-switch">
              Don't have an account?{" "}
              <button type="button" onClick={() => switchMode(true)}>
                Sign Up
              </button>
            </p>
          </form>

          <form className="auth-form auth-sign-up-form" onSubmit={handleSignup}>
            <h2 className="auth-title">Create Account</h2>

            <div className="auth-input-field">
              <input
                type="text"
                placeholder="Name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="auth-input-field">
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-input-field">
              <input
                type="password"
                placeholder="Password"
                autoComplete="new-password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
              />
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Sign Up"}
            </button>

            {signupMessage && (
              <p className="auth-message" role="status">
                {signupMessage}
              </p>
            )}

            <p className="auth-mobile-switch">
              Already have an account?{" "}
              <button type="button" onClick={() => switchMode(false)}>
                Sign In
              </button>
            </p>
          </form>
        </div>
      </div>

      <div className="auth-panels-container">
        <section className="auth-panel auth-left-panel">
          <div className="auth-panel-content">
            <h3>New to IntelligenceView?</h3>
            <p>
              Create your account and start preparing for your next interview
              with AI-powered practice.
            </p>
            <button
              type="button"
              className="auth-btn auth-transparent-btn"
              onClick={() => switchMode(true)}
            >
              Sign Up
            </button>
          </div>
        </section>

        <section className="auth-panel auth-right-panel">
          <div className="auth-panel-content">
            <h3>Welcome Back!</h3>
            <p>
              Sign in to continue your interview preparation and track your
              progress with IntelligenceView.
            </p>
            <button
              type="button"
              className="auth-btn auth-transparent-btn"
              onClick={() => switchMode(false)}
            >
              Sign In
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;

