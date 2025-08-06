import React from "react";

interface UserType {
  name: string;
  role: string;
  id?: number;
}

interface AppointmentType {
  id: number;
  date: string;
  description: string;
  status: string;
  patient?: { name: string };
  doctor?: { id: number; name: string };
}

interface AppointmentListProps {
  appointments: AppointmentType[];
  isLoading: boolean;
  user: UserType;
  handleStatusUpdate: (id: number, status: string) => void;
  handleDeleteAppointment: (id: number) => void;
  getStatusIcon: (status: string) => string;
  getStatusColor: (status: string) => string;
}

const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  isLoading,
  user,
  handleStatusUpdate,
  handleDeleteAppointment,
  getStatusIcon,
  getStatusColor,
}) => {
  if (isLoading) {
    return <div className="p-4 bg-white rounded-xl shadow">Loading...</div>;
  }

  if (appointments.length === 0) {
    return (
      <div className="p-4 bg-white rounded-xl shadow text-center">
        <p className="text-gray-500">No appointments found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Recent Appointments</h2>
      <ul className="space-y-4">
        {appointments.slice(0, 5).map((appointment) => (
          <li key={appointment.id} className="border p-4 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{appointment.description}</p>
                <p className="text-sm text-gray-600">
                  {new Date(appointment.date).toLocaleString()}
                </p>
                <p className="text-sm mt-1">
                  {user.role === "DOCTOR" && appointment.patient && (
                    <>Patient: {appointment.patient.name}</>
                  )}
                  {user.role === "PATIENT" && appointment.doctor && (
                    <>Doctor: {appointment.doctor.name}</>
                  )}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className="text-sm px-2 py-1 rounded-full border"
                  style={{
                    backgroundColor: `${getStatusColor(appointment.status)}20`,
                    color: getStatusColor(appointment.status),
                    borderColor: `${getStatusColor(appointment.status)}40`,
                  }}
                >
                  {appointment.status}
                </span>

                {user.role === "DOCTOR" && appointment.doctor?.id === user.id && (
                  <select
                    value={appointment.status}
                    onChange={(e) => handleStatusUpdate(appointment.id, e.target.value)}
                    className="px-2 py-1 text-sm border rounded"
                  >
                    {["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}

                {user.role === "ADMIN" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => alert("Edit functionality coming soon!")}
                      className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AppointmentList;
