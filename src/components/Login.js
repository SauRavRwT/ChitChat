import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../Firebase.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("User logged in successfully");
      navigate("/home");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App d-flex justify-content-center align-items-center min-vh-100">
      <div
        className="modal modal-sheet position-static d-block p-4 py-md-5"
        role="dialog"
        id="modalLogin"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content rounded-4 shadow">
            <div className="modal-header p-5 pb-4 border-bottom-0">
              <h1 className="fw-bold mb-0 fs-2">Login</h1>
            </div>
            <div className="modal-body p-5 pt-0">
              <form onSubmit={handleLogin} aria-live="polite">
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control rounded-3"
                    id="floatingInput"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-required="true"
                  />
                  <label htmlFor="floatingInput">Email address</label>
                </div>
                <div className="form-floating mb-3">
                  <input
                    type="password"
                    className="form-control rounded-3"
                    id="floatingPassword"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-required="true"
                  />
                  <label htmlFor="floatingPassword">Password</label>
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                <button
                  className="w-30 mb-2 btn btn-lg btn-secondary rounded-3"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
                <p className="mb-0">
                  Don't have an account? <a href="/signup">Sign up</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
