// frontend/src/components/UserProfile.js
import React, { useState } from 'react';
import './UserProfile.css';

const UserProfile = ({ user, onUpdateProfile, onDeleteAccount, onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email
  });
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await onUpdateProfile(formData);
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setMessage('Please type "DELETE" to confirm account deletion');
      return;
    }

    if (!window.confirm('Are you absolutely sure? This will permanently delete your account and cannot be undone!')) {
      return;
    }

    setLoading(true);
    try {
      await onDeleteAccount();
    } catch (error) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="profile-modal">
      <div className="profile-content">
        <div className="profile-header">
          <h2>👤 Account Settings</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="profile-tabs">
          <button 
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            📝 Edit Profile
          </button>
          <button 
            className={activeTab === 'danger' ? 'active' : ''}
            onClick={() => setActiveTab('danger')}
          >
            ⚠️ Account Deletion
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-tab">
            <form onSubmit={handleUpdateSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="save-btn">
                {loading ? 'Updating...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="danger-tab">
            <div className="danger-warning">
              <h3>⚠️ Delete Account</h3>
              <p>
                This will permanently delete your account, remove all your data, 
                and cannot be undone. Please be certain.
              </p>
            </div>

            <div className="delete-form">
              <label>
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE here"
                className="delete-input"
              />
              
              <button 
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirm !== 'DELETE'}
                className="delete-btn"
              >
                {loading ? 'Deleting...' : 'Permanently Delete My Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;