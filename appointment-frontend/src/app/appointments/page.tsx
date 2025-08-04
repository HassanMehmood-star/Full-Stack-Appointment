"use client";

import { useEffect, useState } from 'react';
import { getUser, apiCall } from '@/lib/auth';

interface Appointment {
  id: number;
  date: string;
  description: string;
  status: string;
  patient?: { id: number; name: string; email: string };
  doctor?: { id: number; name: string; email: string };
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    date: '',
    time: '',
    description: '',
    doctorId: '',
  });

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setMounted(true);
    const currentUser = getUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        setIsLoading(true);

        const appointmentsEndpoint = user?.role === 'ADMIN' ? '/api/appointments/all' : '/api/appointments';

        const [appointmentsResponse, doctorsResponse] = await Promise.all([
          apiCall(appointmentsEndpoint),
          user?.role === 'PATIENT' ? apiCall('/api/users?role=DOCTOR') : Promise.resolve({ users: [] }),
        ]);

        const appointmentsData = appointmentsResponse.appointments || appointmentsResponse || [];
        const doctorsData = doctorsResponse.users || doctorsResponse || [];

        setAppointments(appointmentsData);
        setDoctors(doctorsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load appointments or doctors. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const dateTime = new Date(`${createForm.date}T${createForm.time}`);
      const appointmentData = {
        date: dateTime.toISOString(),
        description: createForm.description,
        doctorId: parseInt(createForm.doctorId),
      };

      await apiCall('/api/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentData),
      });

      const appointmentsResponse = await apiCall('/api/appointments');
      const updatedAppointments = appointmentsResponse.appointments || appointmentsResponse || [];
      setAppointments(updatedAppointments);

      setCreateForm({ date: '', time: '', description: '', doctorId: '' });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create appointment:', error);
      setError('Failed to create appointment. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await apiCall(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
      const appointmentsEndpoint = user?.role === 'ADMIN' ? '/api/appointments/all' : '/api/appointments';
      const appointmentsResponse = await apiCall(appointmentsEndpoint);
      const updatedAppointments = appointmentsResponse.appointments || appointmentsResponse || [];
      setAppointments(updatedAppointments);
    } catch (error) {
      console.error('Failed to update status:', error);
      setError('Failed to update appointment status. Please try again.');
    }
  };

  const canUpdateStatus = (appointment: Appointment) => {
    return user?.role === 'ADMIN';
  };

  const handleDeleteAppointment = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await apiCall(`/appointments/${id}`, { method: 'DELETE' });
      // Refresh appointments
      const appointmentsEndpoint = user?.role === 'ADMIN' ? '/api/appointments/all' : '/api/appointments';
      const appointmentsResponse = await apiCall(appointmentsEndpoint);
      const updatedAppointments = appointmentsResponse.appointments || appointmentsResponse || [];
      setAppointments(updatedAppointments);
    } catch (error) {
      setError('Failed to delete appointment. Please try again.');
    }
  };

  if (!mounted || !user) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">Appointments</h1>
        <p className="text-gray-600">Welcome, {user.name}! Here are your appointments:</p>
        {user.role === 'PATIENT' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Appointment
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-md text-sm text-center">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No appointments found.
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-800">{appointment.description}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                      <span>Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                      <input
                        type="checkbox"
                        checked={appointment.status === "COMPLETED"}
                        disabled
                        style={{ marginLeft: "8px" }}
                        title={appointment.status === "COMPLETED" ? "Completed" : "Not completed"}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Date: {new Date(appointment.date).toLocaleDateString()} at {new Date(appointment.date).toLocaleTimeString()}
                  </div>
                  {user.role !== 'PATIENT' && appointment.patient && (
                    <div className="text-sm text-gray-600">Patient: {appointment.patient.name}</div>
                  )}
                  {user.role !== 'DOCTOR' && appointment.doctor && (
                    <div className="text-sm text-gray-600">Doctor: Dr. {appointment.doctor.name}</div>
                  )}
                </div>
                {/* Status Update Actions for Doctor */}
                {(user?.role === 'DOCTOR' && appointment.doctor?.id === user.id) && (
                  <>
                    {appointment.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'CONFIRMED')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'REJECTED')}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {appointment.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'COMPLETED')}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Mark Complete
                      </button>
                    )}
                  </>
                )}
                {/* Admin Edit/Delete */}
                {user?.role === 'ADMIN' && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => alert('Edit functionality coming soon!')}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Appointment</h2>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <select
                  required
                  value={createForm.doctorId}
                  onChange={(e) => setCreateForm({ ...createForm, doctorId: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>Dr. {doc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={createForm.date}
                  onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={createForm.time}
                  onChange={(e) => setCreateForm({ ...createForm, time: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
