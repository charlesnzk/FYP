import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../AuthContext';

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  minHeight: '100vh',
  padding: '3rem 1rem',
  backgroundColor: '#f2f2f2'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  backgroundColor: '#ffffff',
  padding: '2rem',
  borderRadius: '0.5rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  width: '100%',
  maxWidth: '400px'
};

const labelStyle = {
  fontWeight: 'bold',
  color: '#27ae60'
};

const inputStyle = {
  padding: '0.5rem',
  border: '1px solid #ccc',
  borderRadius: '0.25rem',
  fontSize: '1rem',
  width: '100%'
};

const buttonStyle = {
  padding: '0.75rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontSize: '1rem'
};

const linkStyle = {
  textDecoration: 'none',
  color: '#27ae60',
  fontSize: '0.9rem',
  marginTop: '0.5rem'
};

const Login = () => {
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    axios.post('http://127.0.0.1:8000/api/auth/login/', { username, password })
      .then(response => {
        console.log("Login response:", response.data);
        if (response.data.access && response.data.user) {
          loginUser(response.data.access, response.data.user);
          navigate('/profile');
        } else {
          loginUser(response.data.access, {}); 
          axios.get('http://127.0.0.1:8000/api/auth/profile/', {
            headers: { Authorization: `Bearer ${response.data.access}` },
          })
          .then(profileRes => {
            console.log("Profile response:", profileRes.data);
            loginUser(response.data.access, profileRes.data);
            navigate('/profile');
          })
          .catch(err => {
            console.error("Error fetching profile after login:", err.response ? err.response.data : err);
          });
        }
        alert('Login successful!');
      })
      .catch(error => {
        console.error('Login error:', error.response ? error.response.data : error);
        alert('Login failed.');
      });
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ color: '#27ae60', marginBottom: '1rem' }}>Login</h2>
      <form onSubmit={handleLogin} style={formStyle}>
        <div>
          <label style={labelStyle}>Username:</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={inputStyle}
          />
        </div>
        <button type="submit" style={buttonStyle}>Login</button>
        <div style={{ textAlign: 'center' }}>
          <Link to="/register" style={linkStyle}>Don't have an account? Register here!</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;