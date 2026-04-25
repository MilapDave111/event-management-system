import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import toast from 'react-hot-toast';

const StaffAttendeesTab = ({ events }) => {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedEventId) {
      fetchAttendees(selectedEventId);
    } else {
      setAttendees([]);
    }
  }, [selectedEventId]);

// Inside your fetchAttendees function in StaffAttendeesTab.jsx
const fetchAttendees = async (eventId) => {
  setLoading(true);
  try {
    const res = await api.get(`/events/staff/${eventId}/attendees`);
    // Ensure you are accessing the nested 'data' array from the backend response
    if (res.data && res.data.success) {
      setAttendees(res.data.data); 
    }
  } catch (err) {
    toast.error("Failed to fetch attendees");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="attendees-container p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">View Attendees</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
        <select 
          className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
        >
          <option value="">-- Choose an Event --</option>
          {events && events.map(evt => (
            <option key={evt.id} value={evt.id}>{evt.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading attendees...</p>
      ) : attendees.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b text-left font-medium text-gray-600">Sr No.</th>
                <th className="py-2 px-4 border-b text-left font-medium text-gray-600">Name</th>
                <th className="py-2 px-4 border-b text-left font-medium text-gray-600">Email</th>
    <th className="py-2 px-4 border-b text-left font-medium text-gray-600">Scanned At</th>

              </tr>
            </thead>
            <tbody>
              {attendees.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b text-gray-800">{index + 1}</td>
                  <td className="py-2 px-4 border-b text-gray-800">{user.full_name}</td>
                  <td className="py-2 px-4 border-b text-gray-800">{user.email}</td>
                 
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        selectedEventId && <p className="text-gray-500">No attendees have checked in yet.</p>
      )}
    </div>
  );
};

export default StaffAttendeesTab;