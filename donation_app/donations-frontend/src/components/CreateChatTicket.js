import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const containerStyle = {
  padding: '1.5rem',
  maxWidth: '600px',
  margin: '2rem auto',
  backgroundColor: '#ffffff',
  borderRadius: '0.5rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const headingStyle = {
  textAlign: 'center',
  color: '#27ae60',
  marginBottom: '1rem',
  fontSize: '1.75rem',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
};

const labelStyle = {
  fontWeight: 'bold',
  color: '#27ae60',
  marginBottom: '0.5rem',
};

const inputStyle = {
  padding: '0.5rem',
  border: '1px solid #ccc',
  borderRadius: '0.25rem',
  fontSize: '1rem',
  width: '100%',
};

const textareaStyle = {
  ...inputStyle,
  height: '100px',
  resize: 'vertical',
};

const buttonStyle = {
  padding: '0.75rem',
  backgroundColor: '#2ecc71',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontSize: '1rem',
};

const CreateChatTicket = () => {
  const { authToken } = useContext(AuthContext);
  const [subject, setSubject] = useState('');
  const [reason, setReason] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://127.0.0.1:8000/api/chat/tickets/create/', { subject, reason }, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    .then(response => {
      alert("Chat ticket submitted successfully.");
      navigate('/chat');
    })
    .catch(error => {
      console.error("Failed to submit chat ticket:", error.response ? error.response.data : error);
      alert("Failed to submit chat ticket.");
    });
  };

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Create Chat Ticket</h2>
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Subject:</label>
          <input 
            type="text" 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)} 
            required 
            style={inputStyle}
          />
        </div>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Reason:</label>
          <textarea 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            required 
            style={textareaStyle}
          ></textarea>
        </div>
        <button type="submit" style={buttonStyle}>Submit Ticket</button>
      </form>
    </div>
  );
};

export default CreateChatTicket;