import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

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

const Registration = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    if (password !== password2) {
      alert("Passwords do not match.");
      return;
    }
    axios.post('http://127.0.0.1:8000/api/auth/register/', {
      username,
      email,
      password,
      password2,
    })
    .then(response => {
      alert('Registration successful!');
      navigate('/login');
    })
    .catch(error => {
      console.error('Registration error:', error.response.data);
      alert('Registration failed: ' + JSON.stringify(error.response.data));
    });
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ color: '#27ae60', marginBottom: '1rem' }}>Register</h2>
      <form onSubmit={handleRegister} style={formStyle}>
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
          <label style={labelStyle}>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
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
        <div>
          <label style={labelStyle}>Confirm Password:</label>
          <input 
            type="password" 
            value={password2} 
            onChange={(e) => setPassword2(e.target.value)} 
            required 
            style={inputStyle}
          />
        </div>
        <button type="submit" style={buttonStyle}>Register</button>
        <div style={{ textAlign: 'center' }}>
          <Link to="/login" style={linkStyle}>Already have an account? Login here!</Link>
        </div>
      </form>
    </div>
  );
};

export default Registration;