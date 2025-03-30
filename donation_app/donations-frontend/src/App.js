import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './components/Landing';
import Registration from './components/Registration';
import Login from './components/Login';
import Home from './components/Home';
import Profile from './components/Profile';
import PublicProfile from './components/PublicProfile';
import DonationForm from './components/DonationForm';
import DonorDonations from './components/DonorDonations';
import DonationStatus from './components/DonationStatus';
import VerifyDonations from './components/VerifyDonations';
import PromoteUsers from './components/PromoteUsers';
import UserSearch from './components/UserSearch';
import FriendRequests from './components/FriendRequests';
import Chat from './components/Chat';
import ChatRoom from './components/ChatRoom';
import CreateChatRoom from './components/CreateChatRoom';
import CreateChatTicket from './components/CreateChatTicket';
import ChatTickets from './components/ChatTickets';
import ResolvedTickets from './components/ResolvedTickets';
import Navigation from './components/Navigation';
import { AuthProvider } from './AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Home />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/public-profile/:id" element={<PublicProfile />} />
          <Route path="/donate" element={<DonationForm />} />
          <Route path="/my-donations" element={<DonorDonations />} />
          <Route path="/donation-status" element={<DonationStatus />} />
          <Route path="/verify-donations" element={<VerifyDonations />} />
          <Route path="/promote-users" element={<PromoteUsers />} />
          <Route path="/user-search" element={<UserSearch />} />
          <Route path="/friend-requests" element={<FriendRequests />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:slug" element={<ChatRoom />} />
          <Route path="/create-chat-room" element={<CreateChatRoom />} />
          <Route path="/create-chat-ticket" element={<CreateChatTicket />} />
          <Route path="/chat-tickets" element={<ChatTickets />} />
          <Route path="/resolved-tickets" element={<ResolvedTickets />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;