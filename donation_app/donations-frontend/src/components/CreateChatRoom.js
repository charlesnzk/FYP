import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

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

const listStyle = {
  listStyle: 'none',
  padding: '0.5rem',
  border: '1px solid #ddd',
  maxHeight: '150px',
  overflowY: 'auto',
  backgroundColor: '#fff',
  marginTop: '0.5rem',
};

const listItemStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.5rem 0.75rem',
  cursor: 'pointer',
};

const removeButtonStyle = {
  padding: '0.3rem 0.75rem',
  backgroundColor: 'red',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
};

const selectedMembersContainerStyle = {
  marginTop: '1rem',
};

const CreateChatRoom = () => {
  const { authToken, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [error, setError] = useState('');

  const isAuthorized = user && ['volunteer', 'moderator', 'superuser'].includes(user.role);

  useEffect(() => {
    if (searchTerm.trim() !== '') {
      axios.get(`http://127.0.0.1:8000/api/auth/search/?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then(response => {
          const results = response.data.filter(
            (u) => u.id !== user.id && !selectedMembers.some((m) => m.id === u.id)
          );
          setSearchResults(results);
        })
        .catch(err => {
          console.error("Error searching users:", err.response ? err.response.data : err);
        });
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, authToken, user, selectedMembers]);

  if (!isAuthorized) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Create Chat Room</h2>
        <p style={{ textAlign: 'center', color: 'red' }}>You are not authorized to create chat rooms.</p>
      </div>
    );
  }

  const handleAddMember = (member) => {
    setSelectedMembers(prev => [...prev, member]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleRemoveMember = (memberId) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError("Please fill in the chat room name and description.");
      return;
    }
    const membersStr = selectedMembers.map(m => m.username).join(',');
    axios.post('http://127.0.0.1:8000/api/chat/rooms/create/', 
      { name, description, members: membersStr }, 
      { headers: { Authorization: `Bearer ${authToken}` } }
    )
      .then(response => {
        alert("Chat room created successfully!");
        navigate(`/chat/${response.data.slug}`);
      })
      .catch(error => {
        console.error("Error creating chat room:", error.response ? error.response.data : error);
        alert("Failed to create chat room.");
      });
  };

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Create Chat Room</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Chat Room Name:</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            style={inputStyle}
          />
        </div>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Description:</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required 
            style={textareaStyle}
          ></textarea>
        </div>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Add Members:</label>
          <input 
            type="text" 
            placeholder="Search by username..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
          {searchResults.length > 0 && (
            <ul style={listStyle}>
              {searchResults.map(u => (
                <li key={u.id} style={listItemStyle}>
                  <span>{u.username} ({u.first_name} {u.last_name})</span>
                  <button onClick={() => handleAddMember(u)} style={buttonStyle}>
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selectedMembers.length > 0 && (
            <div style={selectedMembersContainerStyle}>
              <strong>Add Members:</strong>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {selectedMembers.map(member => (
                  <li key={member.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>{member.username}</span>
                    <button onClick={() => handleRemoveMember(member.id)} style={removeButtonStyle}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button type="submit" style={buttonStyle}>Create Chat Room</button>
      </form>
    </div>
  );
};

export default CreateChatRoom;