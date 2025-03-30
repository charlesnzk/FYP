import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';

const containerStyle = {
  backgroundColor: '#f2f2f2',
  padding: '1.5rem',
  borderRadius: '0.5rem',
  maxWidth: '800px',
  margin: '2rem auto',
};

const headingStyle = {
  color: '#27ae60',
  textAlign: 'center',
  marginBottom: '1rem',
};

const cardStyle = {
  border: '1px solid #ccc',
  borderRadius: '0.5rem',
  padding: '1rem',
  marginBottom: '1rem',
  backgroundColor: '#fff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  marginRight: '0.5rem',
};

const DonorDonations = () => {
  const { authToken } = useContext(AuthContext);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    axios
      .get('http://127.0.0.1:8000/api/donations/mine/', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then(response => {
        setDonations(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching your donations:", error.response ? error.response.data : error);
        setLoading(false);
      });
  }, [authToken]);

  const mapTicketStatus = (donation) => {
    if (donation.verification_status === 'pending') {
      return "Pending Verification";
    }
    if (donation.verification_status === 'verified') {
      return donation.donation_method === 'delivery'
        ? "Pending Delivery"
        : donation.donation_method === 'dropoff'
        ? "Pending Dropoff"
        : "Verified";
    }
    if (donation.verification_status === 'pending_cancellation') {
      return "Cancellation Requested";
    }
    return donation.verification_status.charAt(0).toUpperCase() + donation.verification_status.slice(1);
  };

  const handleCancel = (donationId) => {
    if (window.confirm("Are you sure you want to request cancellation for this donation?")) {
      axios.patch(
        `http://127.0.0.1:8000/api/donations/cancel/${donationId}/`,
        { verification_status: "pending_cancellation" },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      .then(() => {
        alert("Cancellation request sent successfully.");
        axios.get('http://127.0.0.1:8000/api/donations/mine/', {
          headers: { Authorization: `Bearer ${authToken}` },
        }).then(res => setDonations(res.data));
      })
      .catch(error => {
        console.error("Error requesting cancellation:", error.response ? error.response.data : error);
        alert("Cancellation request failed.");
      });
    }
  };

  if (loading) return <div style={containerStyle}><h2 style={headingStyle}>Loading your donations...</h2></div>;

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>My Donation History</h2>
      {donations.length === 0 ? (
        <p style={{ textAlign: 'center' }}>You have not submitted any donations yet.</p>
      ) : (
        donations.map((donation) => (
          <div key={donation.id} style={cardStyle}>
            <h3>{donation.item_name}</h3>
            <p><strong>Date/Time:</strong> {donation.donation_date} {donation.donation_time}</p>
            <p><strong>Ticket Status:</strong> {mapTicketStatus(donation)}</p>
            <p>
            <strong>Admin Verification:</strong>{" "}
              {donation.verification_status === 'pending'
                ? "Not completed"
                : donation.verification_status}
            </p>
            {(donation.verification_status === 'pending' || donation.verification_status === 'verified') && (
              <button onClick={() => handleCancel(donation.id)} style={buttonStyle}>
                Request Cancellation
              </button>
            )}
            <button onClick={() => setExpandedId(expandedId === donation.id ? null : donation.id)} style={buttonStyle}>
              {expandedId === donation.id ? "Hide Details" : "View Details"}
            </button>
            {expandedId === donation.id && (
              <div style={{ marginTop: '1rem' }}>
                <p><strong>Method:</strong> {donation.donation_method}</p>
                {donation.donation_method === 'delivery' && (
                  <>
                    <p><strong>Delivery postal Code:</strong> {donation.postal_code}</p>
                    <p><strong>Weight Range:</strong> {donation.weight_range}</p>
                  </>
                )}
                {donation.donation_method === 'dropoff' && (
                  <p><strong>Dropoff Location:</strong> {donation.dropoff_location}</p>
                )}
                <p><strong>Category:</strong> {donation.category}</p>
                <p><strong>Description:</strong> {donation.description}</p>
                <p><strong>Intended Action:</strong> {donation.intended_action}</p>
                {donation.verification_comment && (
                  <p><strong>Admin Comment:</strong> {donation.verification_comment}</p>
                )}
                <div style={{ marginTop: '0.75rem' }}>
                  <strong>Images:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {donation.images && donation.images.length > 0 ? donation.images.map(img => (
                      <img
                        key={img.id}
                        src={img.image}
                        alt={donation.item_name}
                        style={{ width: '80px', height: '80px', objectFit: 'cover', margin: '0.25rem', cursor: 'pointer' }}
                        onClick={() => window.open(img.image, '_blank')}
                      />
                    )) : 'No images'}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default DonorDonations;