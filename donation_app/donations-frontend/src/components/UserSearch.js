import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import { Link } from 'react-router-dom';

const containerStyle = {
  padding: '2rem',
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#f2f2f2',
  borderRadius: '0.5rem'
};

const headingStyle = {
  textAlign: 'center',
  color: '#27ae60'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  marginBottom: '1rem',
  borderRadius: '0.25rem',
  border: '1px solid #ccc'
};

const listStyle = {
  listStyle: 'none',
  padding: 0
};

const itemStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '1rem'
};

const imageStyle = {
  width: '50px',
  height: '50px',
  objectFit: 'cover',
  borderRadius: '50%',
  marginRight: '1rem'
};

const linkStyle = {
  textDecoration: 'none',
  color: '#27ae60'
};

const UserSearch = () => {
  const { authToken } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    if (searchTerm) {
      axios.get(`http://127.0.0.1:8000/api/auth/search/?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then(response => setUsers(response.data))
      .catch(error => console.error("Error searching users:", error.response ? error.response.data : error));
    } else {
      setUsers([]);
    }
  }, [searchTerm, authToken]);
  
  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>User Search</h2>
      <input 
        type="text" 
        placeholder="Search by username, first name, or last name"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={inputStyle}
      />
      <ul style={listStyle}>
        {users.map(user => (
          <li key={user.id} style={itemStyle}>
            <img
              src={user.profile_picture ? user.profile_picture : "http://127.0.0.1:8000/media/profile_pictures/Profile.jpg"}
              alt={user.username}
              style={imageStyle}
            />
            <Link to={`/public-profile/${user.id}`} style={linkStyle}>
              {user.username} - {user.first_name} {user.last_name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserSearch;