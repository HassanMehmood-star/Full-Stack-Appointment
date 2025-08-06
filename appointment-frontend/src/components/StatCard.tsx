import React from "react";

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string; // Tailwind class like 'border-blue-500'
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className={`bg-white p-4 rounded-lg shadow border-l-4 ${color}`}>
      <div className="text-gray-500 text-sm">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div>{icon}</div>
    </div>
  );
};

export default StatCard;
