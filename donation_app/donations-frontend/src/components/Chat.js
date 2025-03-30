import React, { useState } from 'react';
import ChatDashboard from './ChatDashboard';
import ChatSearch from './ChatSearch';

const Chat = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabStyle = (tabName) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    borderBottom: activeTab === tabName ? '2px solid #27ae60' : '2px solid transparent',
    color: activeTab === tabName ? '#27ae60' : '#555',
    fontWeight: activeTab === tabName ? 'bold' : 'normal',
    transition: 'color 0.3s ease, border-bottom 0.3s ease'
  });

  const containerStyle = {
    padding: '20px',
    maxWidth: '800px',
    margin: '2rem auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#27ae60'
  };

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>Chat</h2>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
        <div style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </div>
        <div style={tabStyle('search')} onClick={() => setActiveTab('search')}>
          Search
        </div>
      </div>
      <div>
        {activeTab === 'dashboard' ? <ChatDashboard /> : <ChatSearch />}
      </div>
    </div>
  );
};

export default Chat;