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

const listItemStyle = {
  border: '1px solid #ccc',
  borderRadius: '0.25rem',
  padding: '1rem',
  marginBottom: '1rem',
};

const infoStyle = {
  marginBottom: '0.5rem',
  fontSize: '1rem',
};

const buttonContainerStyle = {
  marginTop: '0.75rem',
  display: 'flex',
  gap: '1rem',
  flexWrap: 'wrap',
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontSize: '1rem',
};

const smallButtonStyle = {
  ...buttonStyle,
  padding: '0.4rem 0.75rem',
  fontSize: '0.9rem',
};

const ChatTickets = () => {
  const { authToken } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const navigate = useNavigate();

  const fetchTickets = useCallback(() => {
    axios.get('http://127.0.0.1:8000/api/chat/tickets/', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(response => setTickets(response.data))
      .catch(err => console.error("Error fetching chat tickets:", err.response ? err.response.data : err));
  }, [authToken]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateTicketStatus = (ticketId, status) => {
    axios.patch(`http://127.0.0.1:8000/api/chat/tickets/${ticketId}/`, { status }, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(response => {
        alert(`Ticket updated to ${status}`);
        fetchTickets();
      })
      .catch(err => {
        console.error("Error updating ticket:", err.response ? err.response.data : err);
        alert("Failed to update ticket.");
      });
  };

  const openChatFromTicket = (ticket) => {
    if (ticket.chat_room) {
      navigate(`/chat/${ticket.chat_room.slug}`);
    } else {
      alert("Chat room not created yet.");
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Chat Ticket Requests</h2>
      {tickets.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '1rem', color: '#555' }}>No chat ticket requests found.</p>
      ) : (
        <ul style={listStyle}>
          {tickets.map(ticket => (
            <li key={ticket.id} style={listItemStyle}>
              <h3 style={{ marginBottom: '0.5rem', color: '#27ae60' }}>{ticket.subject}</h3>
              <p style={infoStyle}><strong>Reason:</strong> {ticket.reason}</p>
              <p style={infoStyle}><strong>Sender:</strong> {ticket.sender_username}</p>
              {ticket.status === 'pending' && (
                <div style={buttonContainerStyle}>
                  <button onClick={() => updateTicketStatus(ticket.id, 'accepted')} style={smallButtonStyle}>
                    Accept
                  </button>
                  <button onClick={() => updateTicketStatus(ticket.id, 'rejected')} style={smallButtonStyle}>
                    Reject
                  </button>
                </div>
              )}
              {ticket.status === 'accepted' && (
                <div style={buttonContainerStyle}>
                  <button onClick={() => openChatFromTicket(ticket)} style={smallButtonStyle}>
                    Open Chat
                  </button>
                  <button onClick={() => updateTicketStatus(ticket.id, 'resolved')} style={smallButtonStyle}>
                    Resolve Ticket
                  </button>
                </div>
              )}
              {['rejected', 'resolved'].includes(ticket.status) && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#555' }}>
                  <em>This request has been {ticket.status}.</em>
                  {ticket.chat_room && (
                    <button onClick={() => openChatFromTicket(ticket)} style={{ ...smallButtonStyle, marginLeft: '0.5rem' }}>
                      View Chat
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatTickets;