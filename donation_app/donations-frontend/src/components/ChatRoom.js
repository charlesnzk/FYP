import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../AuthContext';

const subHeadingStyle = {
  color: '#27ae60',
  marginBottom: '0.5rem'
};

const messageContainerStyle = {
  border: '1px solid #ccc',
  borderRadius: '0.25rem',
  height: '300px',
  overflowY: 'scroll',
  padding: '1rem',
  backgroundColor: '#f2f2f2'
};

const messageStyle = {
  marginBottom: '0.75rem',
  borderBottom: '1px solid #eee',
  paddingBottom: '0.5rem'
};

const inputContainerStyle = {
  display: 'flex',
  gap: '0.5rem',
  marginTop: '1rem'
};

const inputStyle = {
  flex: 1,
  padding: '0.75rem',
  fontSize: '1rem',
  border: '1px solid #ccc',
  borderRadius: '0.25rem'
};

const sendButtonStyle = {
  padding: '0.75rem 1.25rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer'
};

const managementContainerStyle = {
  marginTop: '1rem',
  borderTop: '1px solid #ccc',
  paddingTop: '1rem'
};

const participantListStyle = {
  listStyle: 'none',
  padding: 0
};

const participantItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '0.5rem'
};

const smallButtonStyle = {
  padding: '0.25rem 0.5rem',
  backgroundColor: '#e74c3c',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontSize: '0.875rem'
};

const actionButtonStyle = {
  padding: '0.75rem 1rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontSize: '1rem'
};

const ChatRoom = () => {
  const { slug } = useParams();
  const { user, authToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [roomDetails, setRoomDetails] = useState(null);
  const [showManagement, setShowManagement] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState([]);

  const fetchMessages = useCallback(() => {
    if (!slug) return;
    axios
      .get(`http://127.0.0.1:8000/api/chat/messages/?room=${encodeURIComponent(slug)}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then((response) => setMessages(response.data))
      .catch((err) =>
        console.error("Error fetching messages:", err.response ? err.response.data : err)
      );
  }, [slug, authToken]);

  const fetchRoomDetails = useCallback(() => {
    axios
      .get(`http://127.0.0.1:8000/api/chat/rooms/detail/${slug}/`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then((response) => setRoomDetails(response.data))
      .catch((err) =>
        console.error("Error fetching room details:", err.response ? err.response.data : err)
      );
  }, [slug, authToken]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    fetchRoomDetails();
  }, [fetchRoomDetails]);

  useEffect(() => {
    if (!slug) return;
    socketRef.current = new WebSocket(
      `ws://127.0.0.1:8000/ws/chat/${encodeURIComponent(slug)}/?token=${authToken}`
    );
    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'chat_message_update') {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === data.id ? data : msg))
        );
      } else {
        setMessages((prev) => [...prev, data]);
      }
    };
    socketRef.current.onclose = () => console.log("Chat socket closed unexpectedly");
    return () => {
      socketRef.current.close();
    };
  }, [slug, authToken]);

  const sendMessage = () => {
    if (input.trim() && !(roomDetails?.is_resolved)) {
      const messageData = {
        message: input,
        username: user ? user.username : 'Anonymous'
      };
      socketRef.current.send(JSON.stringify(messageData));
      setInput('');
    }
  };

  const startEditing = (msgObj) => {
    setEditingMessageId(msgObj.id);
    setEditingText(msgObj.message);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const saveEditing = async (msgId) => {
    try {
      await axios.patch(
        `http://127.0.0.1:8000/api/chat/messages/${msgId}/`,
        { message: editingText },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      cancelEditing();
    } catch (error) {
      console.error("Error saving edited message:", error.response ? error.response.data : error);
      alert("Error saving message.");
    }
  };

  const deleteMessage = async (msgId) => {
    try {
      await axios.patch(
        `http://127.0.0.1:8000/api/chat/messages/${msgId}/`,
        { delete: true },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
    } catch (error) {
      console.error("Error deleting message:", error.response ? error.response.data : error);
      alert("Error deleting message.");
    }
  };

  const toggleManagement = () => {
    setShowManagement(prev => !prev);
  };

  useEffect(() => {
    if (memberSearchTerm.trim() !== '') {
      axios
        .get(`http://127.0.0.1:8000/api/auth/search/?search=${memberSearchTerm}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        .then(response => setMemberSearchResults(response.data))
        .catch(err =>
          console.error("Error searching users:", err.response ? err.response.data : err)
        );
    } else {
      setMemberSearchResults([]);
    }
  }, [memberSearchTerm, authToken]);

  const addMember = (username) => {
    axios
      .patch(
        `http://127.0.0.1:8000/api/chat/rooms/${roomDetails.id}/add-member/`,
        { username },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      .then(response => {
        setRoomDetails(response.data);
        alert(`Member ${username} added.`);
        setMemberSearchTerm('');
      })
      .catch(err => {
        console.error("Error adding member:", err.response ? err.response.data : err);
        alert("Failed to add member.");
      });
  };

  const removeMember = (username) => {
    if (username === user.username) {
      alert("You cannot remove yourself from the group.");
      return;
    }
    if (username === roomDetails.created_by_username) {
      alert("The owner cannot be removed.");
      return;
    }
    axios
      .patch(
        `http://127.0.0.1:8000/api/chat/rooms/${roomDetails.id}/remove-member/`,
        { username },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      .then(response => {
        setRoomDetails(response.data);
        alert(`Member ${username} removed.`);
      })
      .catch(err => {
        console.error("Error removing member:", err.response ? err.response.data : err);
        alert("Failed to remove member.");
      });
  };

  const isTicketInitiated = roomDetails && roomDetails.description && roomDetails.description.includes("Subject:");

  const deleteOrResolvePrivateChat = useCallback(() => {
    if (!roomDetails) return;
    if (isTicketInitiated && user.role !== 'donor') {
      if (window.confirm("Mark this chat as resolved?")) {
        axios.patch(
          `http://127.0.0.1:8000/api/chat/rooms/${roomDetails.id}/`,
          { is_resolved: true },
          { headers: { Authorization: `Bearer ${authToken}` } }
        )
        .then(() => {
          if (roomDetails.ticket_id) {
            axios.patch(
              `http://127.0.0.1:8000/api/chat/tickets/${roomDetails.ticket_id}/`,
              { status: "resolved" },
              { headers: { Authorization: `Bearer ${authToken}` } }
            )
            .then(() => {
              alert("Chat marked as resolved.");
              navigate('/chat');
            })
            .catch(err => {
              console.error("Error updating ticket:", err.response ? err.response.data : err);
              alert("Chat resolved, but ticket update failed.");
              navigate('/chat');
            });
          } else {
            alert("Chat marked as resolved.");
            navigate('/chat');
          }
        })
        .catch(err => {
          console.error("Error resolving chat:", err.response ? err.response.data : err);
          alert("Failed to resolve chat.");
        });
      }
    } else {
      if (window.confirm("Are you sure you want to delete this chat?")) {
        axios.delete(`http://127.0.0.1:8000/api/chat/rooms/${roomDetails.id}/`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        .then(() => {
          alert("Chat deleted.");
          navigate('/chat');
        })
        .catch(err => {
          console.error("Error deleting chat:", err.response ? err.response.data : err);
          alert("Failed to delete chat.");
        });
      }
    }
  }, [roomDetails, isTicketInitiated, user.role, authToken, navigate]);

  const deleteChat = useCallback(() => {
    if (!roomDetails) return;
    if (window.confirm("Are you sure you want to delete this chat room?")) {
      axios.delete(`http://127.0.0.1:8000/api/chat/rooms/${roomDetails.id}/`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then(() => {
        alert("Chat room deleted.");
        navigate('/chat');
      })
      .catch(err => {
        console.error("Error deleting chat room:", err.response ? err.response.data : err);
        alert("Failed to delete chat room.");
      });
    }
  }, [roomDetails, authToken, navigate]);

  const leaveGroupChat = useCallback(() => {
    if (!roomDetails) return;
    if (window.confirm("Are you sure you want to leave this chat room?")) {
      axios.delete(`http://127.0.0.1:8000/api/chat/rooms/${roomDetails.id}/leave/`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then(() => {
        alert("You have left the chat room.");
        navigate('/chat');
      })
      .catch(err => {
        console.error("Error leaving chat room:", err.response ? err.response.data : err);
        alert("Failed to leave chat room.");
      });
    }
  }, [roomDetails, authToken, navigate]);

  const exitChat = () => {
    navigate('/chat');
  };

  const renderTicketDetails = () => {
    if (roomDetails && roomDetails.description && roomDetails.description.includes("Subject:")) {
      const parts = roomDetails.description.split('\n').map((part) => part.trim());
      return (
        <div style={{ border: '2px solid #2980b9', padding: '1rem', marginBottom: '1rem', backgroundColor: '#ecf0f1' }}>
          {parts.map((part, index) => (
            <p key={index} style={{ margin: 0, fontWeight: 'bold' }}>{part}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '2rem auto', backgroundColor: '#ffffff', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#27ae60', marginBottom: '1rem' }}>Chat Room: {roomDetails ? roomDetails.name : slug}</h2>
      {renderTicketDetails()}
      
      {roomDetails && roomDetails.is_group && roomDetails.description && !roomDetails.description.includes("Subject:") && (
        <p style={{ marginBottom: '1rem' }}><strong>Description:</strong> {roomDetails.description}</p>
      )}
      
      <div style={messageContainerStyle}>
        {messages.map((msg, index) => {
          const originalTime = new Date(msg.timestamp);
          const updatedTime = new Date(msg.updated_at);
          const isEdited = msg.updated_at && msg.updated_at !== msg.timestamp;
          const isDeleted = msg.is_deleted;
          const displayName = msg.username || msg.sender_username || "Anonymous";
          return (
            <div key={index} style={messageStyle}>
              <strong>{displayName}: </strong>
              {editingMessageId === msg.id ? (
                <>
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    style={{ width: '80%', padding: '0.5rem' }}
                  />
                  <button onClick={() => saveEditing(msg.id)} style={smallButtonStyle}>Save</button>
                  <button onClick={cancelEditing} style={smallButtonStyle}>Cancel</button>
                </>
              ) : (
                <span>{msg.message}</span>
              )}
              <div style={{ fontSize: '0.75rem', color: '#555' }}>
                {!isDeleted && (isEdited ? `Edited: ${updatedTime.toLocaleString()}` : originalTime.toLocaleString())}
              </div>
              {!isDeleted && displayName === user.username && editingMessageId !== msg.id && !roomDetails?.is_resolved && (
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => startEditing(msg)} style={smallButtonStyle}>Edit</button>
                  <button onClick={() => deleteMessage(msg.id)} style={smallButtonStyle}>Delete</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {!roomDetails?.is_resolved && (
        <div style={inputContainerStyle}>
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            style={inputStyle}
            placeholder="Type your message..."
          />
          <button onClick={sendMessage} style={sendButtonStyle}>Send</button>
        </div>
      )}
      
      {roomDetails && !roomDetails.is_group && !roomDetails.is_resolved && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          {isTicketInitiated && user.role !== 'donor' ? (
            <button onClick={deleteOrResolvePrivateChat} style={actionButtonStyle}>
              Resolve Chat
            </button>
          ) : (
            <button onClick={deleteOrResolvePrivateChat} style={actionButtonStyle}>
              Delete Chat
            </button>
          )}
        </div>
      )}
      
      {roomDetails && roomDetails.is_group && (
        <div style={managementContainerStyle}>
          <button onClick={toggleManagement} style={actionButtonStyle}>
            {showManagement ? "Hide Participants" : "View Participants"}
          </button>
          {showManagement && (
            <div style={{ border: '1px solid #ddd', padding: '1rem', marginTop: '1rem' }}>
              <h3 style={subHeadingStyle}>{user.role === 'donor' ? "Participants" : "Manage Participants"}</h3>
              <ul style={participantListStyle}>
                {roomDetails.participants && roomDetails.participants.length > 0 ? (
                  roomDetails.participants.map((username, index) => (
                    <li key={index} style={participantItemStyle}>
                      <span>
                        {username}
                        {username === roomDetails.created_by_username && (
                          <span style={{ fontSize: '0.75rem', color: '#2980b9', marginLeft: '0.5rem' }}>(Owner)</span>
                        )}
                      </span>
                      {user.role !== 'donor' &&
                        username !== user.username &&
                        username !== roomDetails.created_by_username && (
                          <button onClick={() => removeMember(username)} style={smallButtonStyle}>Remove</button>
                        )}
                    </li>
                  ))
                ) : (
                  <li>No participants found.</li>
                )}
              </ul>
              {user.role !== 'donor' && (
                <>
                  <input
                    type="text"
                    placeholder="Search username to add..."
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '1rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
                  />
                  {memberSearchResults.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: '0.5rem', border: '1px solid #ddd', maxHeight: '150px', overflowY: 'auto', backgroundColor: '#fff', marginTop: '0.5rem' }}>
                      {memberSearchResults.map(u => (
                        <li key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem' }}>
                          <span>{u.username} ({u.first_name} {u.last_name})</span>
                          <button onClick={() => addMember(u.username)} style={smallButtonStyle}>Add</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                {roomDetails.created_by_username === user.username ? (
                  <button onClick={deleteChat} style={{ ...actionButtonStyle, backgroundColor: 'red' }}>
                    Delete Chat Room
                  </button>
                ) : (
                  <button onClick={leaveGroupChat} style={actionButtonStyle}>
                    Leave Chat Room
                  </button>
                )}
              </div>
              <button onClick={toggleManagement} style={{ marginTop: '1rem', ...smallButtonStyle }}>Close Participants</button>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button onClick={exitChat} style={actionButtonStyle}>Exit Chat</button>
      </div>
    </div>
  );
};

export default ChatRoom;