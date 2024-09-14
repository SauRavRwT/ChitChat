import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../Firebase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignUp = async (event) => {
    event.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('User signed up successfully');
      navigate('/home');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="App d-flex justify-content-center align-items-center min-vh-100">
      <div className="modal modal-sheet position-static d-block p-4 py-md-5" role="dialog" id="modalSignin">
        <div className="modal-dialog" role="document">
          <div className="modal-content rounded-4 shadow">
            <div className="modal-header p-5 pb-4 border-bottom-0">
              <h1 className="fw-bold mb-0 fs-2">Sign up for free</h1>
            </div>
            <div className="modal-body p-5 pt-0">
              <form onSubmit={handleSignUp}>
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control rounded-3"
                    id="floatingInput"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  />
                  <label htmlFor="floatingPassword">Password</label>
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                <button className="w-30 mb-2 btn btn-lg btn-secondary rounded-3" type="submit">
                  Sign up
                </button>
                <p className="mb-0">
                  Already have an account? <a href="/login">Login</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
