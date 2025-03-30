import React from 'react';
import { Link } from 'react-router-dom';

const landingContainer = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  minHeight: '100vh',
  backgroundColor: '#f2f2f2',
  padding: '3rem 1rem'
};

const logoStyle = {
  fontSize: '3rem',
  fontWeight: 'bold',
  color: '#27ae60',
  marginBottom: '1rem'
};

const taglineStyle = {
  fontSize: '1.25rem',
  color: '#333',
  marginBottom: '2rem',
  textAlign: 'center'
};

const buttonContainer = {
  display: 'flex',
  gap: '1rem'
};

const buttonStyle = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontSize: '1rem',
  textDecoration: 'none'
};

const Landing = () => {
  return (
    <div style={landingContainer}>
      <div style={logoStyle}>DonationApp</div>
      <div style={taglineStyle}>
        Discover a community where you can donate, recycle, and help those in need.
      </div>
      <div style={buttonContainer}>
        <Link to="/register" style={buttonStyle}>Register</Link>
        <Link to="/login" style={buttonStyle}>Login</Link>
      </div>
    </div>
  );
};

export default Landing;