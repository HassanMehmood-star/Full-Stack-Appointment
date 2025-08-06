"use client";

import { useEffect, useState } from "react";
import { getUser, apiCall } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import AppointmentList from "@/components/AppointmentList";

// --- Type Definitions ---
type UserType = { name: string; role: string };
type AppointmentType = {
  id: number;
  date: string;
  description: string;
  status: string;
  patient?: { name: string };
  doctor?: { id: number; name: string };
};

export default function DashboardPage() {
  const [user, setUser] = useState<UserType>({ name: "", role: "" });
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0 });
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
   const fetchData = async () => {
  try {
    const fetchedUser = await getUser();
    if (!fetchedUser) {
      setError("User not authenticated.");
      return;
    }

    setUser(fetchedUser);

 const response = await apiCall("/api/appointments/stats");

    setStats(response);

    const appointmentsResponse = await apiCall("/api/appointments");
    setAppointments(appointmentsResponse.appointments);
  } catch (err) {
    setError("Failed to load data.");
  } finally {
    setIsLoading(false);
  }
};


    fetchData();
  }, []);

  const getUserInitials = (name: string) => name.split(" ").map((n) => n[0]).join("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "#f59e0b";
      case "CONFIRMED": return "#3b82f6";
      case "COMPLETED": return "#10b981";
      case "CANCELLED": return "#ef4444";
      case "REJECTED": return "#b91c1c";
      default: return "#6b7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return "⏳";
      case "CONFIRMED": return "✅";
      case "COMPLETED": return "✔️";
      case "CANCELLED": return "❌";
      case "REJECTED": return "🛑";
      default: return "📅";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-600";
      case "DOCTOR": return "bg-blue-600";
      case "PATIENT": return "bg-green-600";
      default: return "bg-gray-500";
    }
  };

const handleStatusUpdate = async (id: number, status: string) => {
  try {
    await apiCall(`/api/appointments/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ status }),
    });

    // Update appointments state locally
    const updatedAppointments = appointments.map((appt) =>
      appt.id === id ? { ...appt, status } : appt
    );
    setAppointments(updatedAppointments);

    // ✅ Fetch updated stats from server
    const updatedStats = await apiCall("/api/appointments/stats");
    setStats(updatedStats);

  } catch (err) {
    alert("Failed to update status.");
  }
};


  const handleDeleteAppointment = async (id: number) => {
    try {
     await apiCall(`/api/appointments/${id}`, {
  method: "DELETE",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

      setAppointments(appointments.filter((appt) => appt.id !== id));
    } catch (err) {
      alert("Failed to delete appointment.");
    }
  };

  const roleContent = {
    title: user.role === "DOCTOR" ? "Doctor Dashboard" : user.role === "ADMIN" ? "Admin Dashboard" : "Welcome",
    subtitle: user.role === "DOCTOR"
      ? "Manage your appointments and patient records"
      : user.role === "ADMIN"
      ? "Manage users and system activities"
      : "View and manage your healthcare appointments",
    welcomeMessage: user.role === "DOCTOR"
      ? "Stay updated with patient appointments and history."
      : user.role === "ADMIN"
      ? "Oversee platform insights and control settings."
      : "Book, view, and track your healthcare visits easily.",
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        user={user}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        getUserInitials={getUserInitials}
        getRoleColor={getRoleColor}
      />

      {/* Main Dashboard Content */}
      <div className={`transition-all duration-300 flex-1 min-h-screen p-5 ${sidebarCollapsed ? "ml-[70px]" : "ml-[280px]"}`}>
        <div className="max-w-screen-xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-8 rounded-2xl mb-8 shadow-lg">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">{roleContent.title}</h1>
                <p className="opacity-90 mb-1">{roleContent.subtitle}</p>
                <p className="opacity-80 text-sm">{roleContent.welcomeMessage}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">Welcome back,</p>
                <p className="text-xl font-semibold">{user.name}</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded mb-6 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Appointments" value={stats.total} icon="📅" color="border-blue-500" />
            <StatCard title="Pending" value={stats.pending} icon="⏳" color="border-yellow-500" />
            <StatCard title="Confirmed" value={stats.confirmed} icon="✅" color="border-blue-500" />
            <StatCard title="Completed" value={stats.completed} icon="✅" color="border-green-500" />
          </div>

          {/* Recent Appointments */}
          <AppointmentList
            appointments={appointments}
            isLoading={isLoading}
            user={user}
            handleStatusUpdate={handleStatusUpdate}
            handleDeleteAppointment={handleDeleteAppointment}
            getStatusIcon={getStatusIcon}
            getStatusColor={getStatusColor}
          />
        </div>
      </div>
    </div>
  );
}
