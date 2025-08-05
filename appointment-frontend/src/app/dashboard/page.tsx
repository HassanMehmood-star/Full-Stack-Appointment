"use client"
import { Bell } from "lucide-react";
import { useEffect, useState } from "react"
// import NotificationIcon from "../../components/Notificationicon";

import Link from "next/link";
interface Appointment {
  id: number;
  date: string;
  description: string;
  status: string;
   seenByDoctor: boolean; // ✅ Add this line
  patient?: { id: number; name: string; email: string };
  doctor?: { id: number; name: string; email: string };
}

interface User {
  id: number;
  name: string;
  email: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    unseen: 0,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/auth/login";
        return;
      }

      try {
        const response = await fetch("http://localhost:4000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/auth/login";
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/auth/login";
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
   const fetchUnseenAppointments = async () => {
  if (!user || user.role !== "DOCTOR") return;

  const token = localStorage.getItem("token");

  try {
    const res = await fetch("http://localhost:4000/api/appointments", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      const allAppointments = data.appointments || [];

      const unseenByDoctor = allAppointments.filter(
        (apt: Appointment) => apt.seenByDoctor === false
      );

      setStats((prev) => ({
        ...prev,
        unseen: unseenByDoctor.length,
      }));
    } else {
      console.error("Failed to fetch appointments for unseen check");
    }
  } catch (err) {
    console.error("Error fetching appointments for unseen check", err);
  }
};


    fetchUnseenAppointments();
  }, [user]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;

      try {
        setError(null);
        setIsLoading(true);

        const token = localStorage.getItem("token");
        const endpoint =
          user.role === "ADMIN"
            ? "http://localhost:4000/api/appointments/all"
            : "http://localhost:4000/api/appointments";

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const appointments = data.appointments || [];

          if (appointments.length === 0) {
            console.log("There is no appointment yet.");
          }

          setAppointments(appointments);

         const calculatedStats = {
  total: appointments.length,
  pending: appointments.filter((apt: Appointment) => apt.status === "PENDING").length,
  confirmed: appointments.filter((apt: Appointment) => apt.status === "CONFIRMED").length,
  completed: appointments.filter((apt: Appointment) => apt.status === "COMPLETED").length,
  unseen: appointments.filter((apt: Appointment) => apt.seenByDoctor === false).length,
};

          setStats(calculatedStats);
        } else {
          throw new Error("Failed to fetch appointments");
        }
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
        setError("Failed to load appointments. Please try again.");
        setAppointments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  // ...rest of your code unchanged...

  

  const handleDeleteAppointment = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:4000/api/appointments/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      // Refresh appointments
      const endpoint = user?.role === "ADMIN"
        ? "http://localhost:4000/api/appointments/all"
        : "http://localhost:4000/api/appointments";
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      setError('Failed to delete appointment. Please try again.');
    }
  };

const handleStatusUpdate = async (appointmentId: number, newStatus: string) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`http://localhost:4000/api/appointments/${appointmentId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      const updated = await response.json();

      // ✅ Update appointment in local state
      setAppointments((prev) => {
        const updatedAppointments = prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        );

        // ✅ Update stats from modified appointment list
        const newStats = {
          total: updatedAppointments.length,
          pending: updatedAppointments.filter((apt) => apt.status === "PENDING").length,
          confirmed: updatedAppointments.filter((apt) => apt.status === "CONFIRMED").length,
          completed: updatedAppointments.filter((apt) => apt.status === "COMPLETED").length,
          unseen: stats.unseen, 
          
        };

        setStats(newStats);
        return updatedAppointments;
      });
    } else {
      console.error("Status update failed");
    }
  } catch (error) {
    console.error("Error updating status:", error);
  }
};






  const getNavigationItems = () => {
    const baseItems = [
      {
        id: "dashboard",
        title: "Dashboard",
        icon: "🏠",
        path: "/dashboard",
        count: null,
      },
    ]

    switch (user?.role) {
      case "PATIENT":
        return [
          ...baseItems,
          {
            id: "appointments",
            title: "My Appointments",
            icon: "📅",
            path: "/appointments",
            count: stats.total > 0 ? stats.total.toString() : null,
          },
         
        ]
     case "DOCTOR":
  return [
    ...baseItems,
    {
      id: "appointments",
      title: "Patient Appointments",
      icon: "📅",
      path: "/appointments",
      count: stats.total > 0 ? stats.total.toString() : null,
    },
  {
  id: "notifications",
  title: "Notifications",
  icon: "🔔",
  path: "/notifications", // ✅ This is the path it will navigate to
 count: stats.unseen > 0 ? stats.unseen.toString() : null,
},

  ];
      case "ADMIN":
        return [
          ...baseItems,
          {
            id: "appointments",
            title: "All Appointments",
            icon: "📅",
            path: "/appointments",
            count: stats.total > 0 ? stats.total.toString() : null,
          },
         
        ]
      default:
        return baseItems
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "#f59e0b"
      case "CONFIRMED":
        return "#3b82f6"
      case "COMPLETED":
        return "#10b981"
      case "CANCELLED":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return "⏳"
      case "CONFIRMED":
        return "✅"
      case "COMPLETED":
        return "✅"
      case "CANCELLED":
        return "❌"
      default:
        return "📅"
    }
  }

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case "PATIENT":
        return {
          title: "My Health Dashboard",
          subtitle: "Track your appointments and health records",
          welcomeMessage: "Stay on top of your health journey",
        }
      case "DOCTOR":
        return {
          title: "Doctor Dashboard",
          subtitle: "Manage your patients and appointments",
          welcomeMessage: "Ready to help your patients today",
        }
      case "ADMIN":
        return {
          title: "Admin Dashboard",
          subtitle: "System overview and management",
          welcomeMessage: "Monitor the healthcare system",
        }
      default:
        return {
          title: "Healthcare Dashboard",
          subtitle: "Welcome to your healthcare platform",
          welcomeMessage: "Get started with your healthcare journey",
        }
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "PATIENT":
        return "bg-blue-500"
      case "DOCTOR":
        return "bg-green-500"
      case "ADMIN":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getUserInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U"
    )
  }

  if (!user) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            border: "4px solid #e5e7eb",
            borderTop: "4px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
        <p style={{ color: "#6b7280", fontSize: "16px" }}>Loading your dashboard...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  const roleContent = getRoleSpecificContent()
  const navigationItems = getNavigationItems()

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <style jsx>{`
        /* Sidebar Styles */
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          width: ${sidebarCollapsed ? "70px" : "280px"};
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          transition: all 0.3s ease;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .brand-text {
          font-size: 20px;
          font-weight: bold;
          opacity: ${sidebarCollapsed ? "0" : "1"};
          transition: opacity 0.3s ease;
        }

        .toggle-btn {
          position: absolute;
          right: -15px;
          top: 20px;
          width: 30px;
          height: 30px;
          background: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          color: #667eea;
          font-size: 14px;
          transition: transform 0.3s ease;
        }

        .toggle-btn:hover {
          transform: scale(1.1);
        }

        .nav-section {
          flex: 1;
          padding: 20px 0;
          overflow-y: auto;
        }

        .nav-group {
          margin-bottom: 30px;
        }

        .nav-group-title {
          padding: 0 20px 10px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.7;
          display: ${sidebarCollapsed ? "none" : "block"};
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          text-decoration: none;
          color: inherit;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          padding-left: 25px;
        }

        .nav-item.active {
          background: rgba(255, 255, 255, 0.15);
          border-right: 3px solid white;
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: white;
        }

        .nav-icon {
          font-size: 20px;
          margin-right: 15px;
          flex-shrink: 0;
          width: 24px;
          text-align: center;
        }

        .nav-text {
          font-size: 14px;
          font-weight: 500;
          opacity: ${sidebarCollapsed ? "0" : "1"};
          transition: opacity 0.3s ease;
          flex: 1;
        }

        .nav-count {
          background: rgba(255, 255, 255, 0.3);
          color: white;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: bold;
          min-width: 20px;
          text-align: center;
          opacity: ${sidebarCollapsed ? "0" : "1"};
          transition: opacity 0.3s ease;
        }

        .quick-actions {
          padding: 0 20px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin-top: auto;
        }

        .quick-action-btn {
          width: 100%;
          padding: 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-size: 14px;
          margin-bottom: 10px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .quick-action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .user-section {
          padding: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          flex-shrink: 0;
        }

        .user-info {
          flex: 1;
          opacity: ${sidebarCollapsed ? "0" : "1"};
          transition: opacity 0.3s ease;
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .user-role {
          font-size: 11px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .role-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .logout-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          opacity: 0.7;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .logout-btn:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
        }

        /* Dashboard Styles */
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .welcome-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 15px;
          margin-bottom: 30px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .welcome-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .welcome-title {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .welcome-subtitle {
          opacity: 0.9;
          margin-bottom: 5px;
        }

        .welcome-message {
          opacity: 0.8;
          font-size: 14px;
        }

        .user-welcome {
          text-align: right;
        }

        .user-welcome-text {
          opacity: 0.8;
          font-size: 14px;
          margin-bottom: 5px;
        }

        .user-name-display {
          font-size: 20px;
          font-weight: 600;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          border-left: 4px solid;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .stat-card.total {
          border-left-color: #3b82f6;
        }

        .stat-card.pending {
          border-left-color: #f59e0b;
        }

        .stat-card.confirmed {
          border-left-color: #3b82f6;
        }

        .stat-card.completed {
          border-left-color: #10b981;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .stat-title {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .stat-icon {
          font-size: 24px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 5px;
        }

        .stat-description {
          font-size: 12px;
          color: #9ca3af;
        }

        .appointments-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .appointments-header {
          padding: 25px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .appointments-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 5px;
        }

        .appointments-subtitle {
          color: #6b7280;
          font-size: 14px;
        }

        .appointments-content {
          padding: 25px;
        }

        .loading-state {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .empty-description {
          color: #6b7280;
          margin-bottom: 20px;
        }

        .new-appointment-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .new-appointment-btn:hover {
          transform: translateY(-1px);
        }

        .appointments-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .appointment-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .appointment-item:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          transform: translateY(-1px);
        }

        .appointment-left {
          display: flex;
          align-items: center;
          gap: 15px;
          flex: 1;
        }

        .appointment-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
          flex-shrink: 0;
        }

        .appointment-details {
          flex: 1;
        }

        .appointment-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 5px;
        }

        .appointment-datetime {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 3px;
        }

        .appointment-person {
          color: #9ca3af;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .appointment-status {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(${sidebarCollapsed ? "-100%" : "0"});
            width: 280px;
          }

          .welcome-header {
            flex-direction: column;
            text-align: center;
            gap: 20px;
          }

          .user-welcome {
            text-align: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .appointment-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }

          .appointment-left {
            width: 100%;
          }
        }
      `}</style>

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">🏥</div>
          <div className="brand-text">HealthCare</div>
          <button className="toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-group">
            <div className="nav-group-title">Navigation</div>
<ul className="list-none">
  {navigationItems.map((item) => {
    // Debugging logs
    console.log("Sidebar item:", item);
    console.log(`Item ID: ${item.id}, Count: ${item.count}`);

    return (
      <li key={item.id}>
        <Link
          href={item.path}
          className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 rounded-md"
        >
          <div className="flex items-center gap-2">
            <span>{item.icon}</span>
            <span>{item.title}</span>
          </div>

          {/* ✅ Show count only if it's a number > 0 */}
          {item.count && parseInt(item.count) > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2">
              {item.count}
            </span>
          )}
        </Link>
      </li>
    );
  })}
</ul>



          </div>
        </div>


        <div className="user-section">
          <div className="user-avatar">{getUserInitials(user.name)}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
           
            <div className="user-role">
              <span className={`role-badge ${getRoleColor(user.role)}`}>{user.role}</span>
            </div>
          </div>
          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("token")
              localStorage.removeItem("user")
              window.location.href = "/auth/login"
            }}
          >
            🚪
          </button>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div
        style={{
          marginLeft: sidebarCollapsed ? "70px" : "280px",
          flex: 1,
          transition: "margin-left 0.3s ease",
          padding: "20px",
          minHeight: "100vh",
        }}
      >
        <div className="dashboard-container">
          {/* Welcome Section */}
          <div className="welcome-section">
            <div className="welcome-header">
              <div>
                <h1 className="welcome-title">{roleContent.title}</h1>
                <p className="welcome-subtitle">{roleContent.subtitle}</p>
                <p className="welcome-message">{roleContent.welcomeMessage}</p>
              </div>
              <div className="user-welcome">
                <p className="user-welcome-text">Welcome back,</p>
                <p className="user-name-display">{user.name}</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-header">
                <span className="stat-title">Total Appointments</span>
                <span className="stat-icon">📅</span>
              </div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-description">All appointments</div>
            </div>

            <div className="stat-card pending">
              <div className="stat-header">
                <span className="stat-title">Pending</span>
                <span className="stat-icon">⏳</span>
              </div>
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-description">Awaiting confirmation</div>
            </div>

            <div className="stat-card confirmed">
              <div className="stat-header">
                <span className="stat-title">Confirmed</span>
                <span className="stat-icon">✅</span>
              </div>
              <div className="stat-value">{stats.confirmed}</div>
              <div className="stat-description">Ready for appointments</div>
            </div>

            <div className="stat-card completed">
              <div className="stat-header">
                <span className="stat-title">Completed</span>
                <span className="stat-icon">✅</span>
              </div>
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-description">Successfully finished</div>
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="appointments-section">
            <div className="appointments-header">
              <div>
                <h2 className="appointments-title">Recent Appointments</h2>
                <p className="appointments-subtitle">Your latest appointment activities</p>
              </div>
              {user?.role === 'PATIENT' && (
  <button
    onClick={() => window.location.href = '/appointments'}
    className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
  >
    ➕ New Appointment
  </button>
)}
            </div>

            <div className="appointments-content">
              {isLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                </div>
              ) : appointments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3 className="empty-title">No appointments found</h3>
                  <p className="empty-description">Schedule your first appointment to get started.</p>
                  <button 
  className="new-appointment-btn"
  onClick={() => window.location.href = '/appointments'}
>
  ➕ Schedule Appointment
</button>
                </div>
              ) : (
                <div className="appointments-list">
                  {appointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="appointment-item">
                      <div className="appointment-left">
                        <div className="appointment-icon">{getStatusIcon(appointment.status)}</div>
                        <div className="appointment-details">
                          <div className="appointment-title">{appointment.description}</div>
                          <div className="appointment-datetime">
                            {new Date(appointment.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })} at {new Date(appointment.date).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          {user?.role === "DOCTOR" && appointment.patient && (
                            <div className="appointment-person">👤 Patient: {appointment.patient.name}</div>
                          )}
                          {user?.role === "PATIENT" && appointment.doctor && (
                            <div className="appointment-person">👨‍⚕️ Dr. {appointment.doctor.name}</div>
                          )}
                         <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
  <span>Status:</span>
  <span
    className="appointment-status"
    style={{
      backgroundColor: `${getStatusColor(appointment.status)}20`,
      color: getStatusColor(appointment.status),
      border: `1px solid ${getStatusColor(appointment.status)}40`,
    }}
  >
    {appointment.status}
  </span>

 {user?.role === 'DOCTOR' && appointment.doctor?.id === user.id && (
  <select
    value={appointment.status}
    onChange={(e) => handleStatusUpdate(appointment.id, e.target.value)}
    className="ml-2 px-2 py-1 rounded border text-sm bg-white text-gray-800"
  >
    {["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"].map((status) => (
      <option key={status} value={status}>
        {status}
      </option>
    ))}
  </select>
)}

</div>

                        </div>
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}
