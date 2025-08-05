"use client";
import { useEffect, useState } from "react";

interface Appointment {
  id: number;
  date: string;
  description: string;
  status: string;
  patient: { id: number; name: string; email: string };
}

export default function NotificationsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnseenAppointments = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:4000/api/appointments/doctor/unseen", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        } else {
          throw new Error("Failed to fetch unseen appointments");
        }
      } catch (error) {
        setError("Something went wrong while loading notifications");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnseenAppointments();
  }, []);

  if (loading) return <p className="p-4">Loading unseen appointments...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Unseen Patient Appointments</h1>
      {appointments.length === 0 ? (
        <p>No unseen appointments.</p>
      ) : (
        <ul className="space-y-4">
          {appointments.map((apt) => (
            <li key={apt.id} className="p-4 border rounded shadow-sm bg-white">
              <p><strong>Patient:</strong> {apt.patient.name} ({apt.patient.email})</p>
              <p><strong>Date:</strong> {new Date(apt.date).toLocaleString()}</p>
              <p><strong>Description:</strong> {apt.description}</p>
              <p><strong>Status:</strong> {apt.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
