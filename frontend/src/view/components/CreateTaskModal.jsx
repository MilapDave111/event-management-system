import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../styles/Form.css';

const CreateTaskModal = ({ eventId, isOpen, onClose, onTaskCreated }) => {
  const [staffList, setStaffList] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    due_date: ''
  });

  useEffect(() => {
    if (isOpen) {
      const fetchStaff = async () => {
        try {
          const res = await api.get('/users');
          // Filter users to only show those with the EVENT_STAFF role
          setStaffList(res.data.filter(u => u.role === 'EVENT_STAFF'));
        } catch (err) {
          toast.error("Could not load staff list");
        }
      };
      fetchStaff();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Logic: event_id is required to link the task to the specific event
      await api.post('/events/tasks', { ...formData, event_id: eventId });
      toast.success("Task created and assigned successfully");
      onTaskCreated(); 
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-modal" onClick={onClose}>✕</button>
        <h2 style={{ color: '#47B599', marginBottom: '8px' }}>Create New Task</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
          Assign operational duties to event staff members.
        </p>

        <form onSubmit={handleSubmit} className="event-form">
          <div className="input-group">
            <label>Task Title</label>
            <input 
              className="form-input" 
              placeholder="e.g., Manage VIP Check-in"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required 
            />
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Priority</label>
              <select 
                className="form-select"
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="input-group">
              <label>Due Date</label>
              <input 
                type="date" 
                className="form-input"
                onChange={e => setFormData({...formData, due_date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Assign To Staff</label>
            <select 
              className="form-select"
              value={formData.assigned_to}
              onChange={e => setFormData({...formData, assigned_to: e.target.value})}
              required
            >
              <option value="">Select a staff member</option>
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>{staff.full_name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="submit-btn">Confirm Assignment</button>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;