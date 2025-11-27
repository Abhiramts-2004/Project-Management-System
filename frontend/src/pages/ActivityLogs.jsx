import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Clock, User, Activity, FileText } from "lucide-react";

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get("/activity");
        console.log("Activity Logs:", response.data);
        setLogs(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Error fetching activity logs:", err);
        setError("Failed to load activity logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>;
  }

  const getActionColor = (action) => {
    if (!action) return "bg-gray-100 text-gray-800";
    const upperAction = action.toUpperCase();
    if (upperAction.includes("CREATE")) return "bg-green-100 text-green-800";
    if (upperAction.includes("UPDATE")) return "bg-blue-100 text-blue-800";
    if (upperAction.includes("DELETE")) return "bg-red-100 text-red-800";
    if (upperAction.includes("COMPLETE"))
      return "bg-indigo-100 text-indigo-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown Date";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const formatAction = (action) => {
    if (!action) return "Unknown Action";
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDetails = (log) => {
    if (!log.details) return "-";

    let details = log.details;
    if (typeof details === "string") {
      try {
        details = JSON.parse(details);
      } catch (e) {
        return details;
      }
    }

    if (!details) return "-";

    switch (log.action) {
      case "moved_task":
        return (
          <span>
            Moved from{" "}
            <span className="font-medium text-gray-700">
              {details.previous_status?.replace("-", " ") || "..."}
            </span>{" "}
            to{" "}
            <span className="font-medium text-gray-700">
              {details.status?.replace("-", " ") || "..."}
            </span>
          </span>
        );
      case "updated_project":
        const changes = Object.entries(details)
          .map(([key, value]) => `${key.replace("_", " ")}: ${value}`)
          .join(", ");
        return <span className="text-gray-600">{changes}</span>;
      case "created_project":
        return (
          <span className="text-gray-600">
            Project: <span className="font-medium">{details.name}</span>
          </span>
        );
      case "created_task":
        return (
          <span className="text-gray-600">
            Task: <span className="font-medium">{details.title}</span>
          </span>
        );
      case "created_user":
        return (
          <span className="text-gray-600">
            User: <span className="font-medium">{details.username}</span> (
            {details.role})
          </span>
        );
      default:
        return (
          <span className="text-gray-500 italic">
            {JSON.stringify(details)}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
          <p className="text-gray-500 mt-1">
            Track all system events and user actions
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">No activity yet</p>
            <p className="text-sm mt-1">
              Actions taken in the system will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">
                    Details
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs mr-3 shadow-sm">
                          {log.username
                            ? log.username.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">
                            {log.username || "Unknown User"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${getActionColor(
                          log.action
                        )
                          .replace("bg-", "border-")
                          .replace("text-", "bg-opacity-10 bg-")}`}
                      >
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {formatDetails(log)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      <div className="flex items-center justify-end">
                        <span className="group-hover:text-indigo-600 transition-colors">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
