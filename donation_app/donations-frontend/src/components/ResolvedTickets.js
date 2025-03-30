import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const containerStyle = {
  padding: '1.5rem',
  maxWidth: '800px',
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

const listStyle = {
  listStyle: 'none',
  padding: 0,
};

const itemStyle = {
  border: '1px solid #ccc',
  padding: '1rem',
  marginBottom: '1rem',
  borderRadius: '0.25rem',
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontSize: '1rem',
  marginTop: '0.5rem',
};

const ResolvedTickets = () => {
  const { authToken } = useContext(AuthContext);
  const [resolvedTickets, setResolvedTickets] = useState([]);
  const navigate = useNavigate();

  const fetchResolvedTickets = useCallback(() => {
    axios.get('http://127.0.0.1:8000/api/chat/tickets/resolved/', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(response => setResolvedTickets(response.data))
      .catch(err => console.error("Error fetching resolved tickets:", err.response ? err.response.data : err));
  }, [authToken]);

  useEffect(() => {
    fetchResolvedTickets();
  }, [fetchResolvedTickets]);

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Resolved Chat Requests</h2>
      {resolvedTickets.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#555' }}>No resolved chat requests.</p>
      ) : (
        <ul style={listStyle}>
          {resolvedTickets.map(ticket => (
            <li key={ticket.id} style={itemStyle}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#27ae60' }}>{ticket.subject}</h3>
              <p style={{ margin: '0.25rem 0' }}><strong>Reason:</strong> {ticket.reason}</p>
              <p style={{ margin: '0.25rem 0' }}><strong>Sender:</strong> {ticket.sender_username}</p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#555' }}>
                <strong>Resolved At:</strong> {new Date(ticket.resolved_at).toLocaleString()}
              </p>
              {ticket.chat_room && (
                <button 
                  style={buttonStyle}
                  onClick={() => navigate(`/chat/${ticket.chat_room.slug}`)}
                >
                  View Chat
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ResolvedTickets;