import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Filter,
  Search,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

const MyTasks = () => {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get("filter") || "all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMyTasks = async () => {
      try {
        const response = await api.get("/tasks/my-tasks");
        setTasks(response.data);
      } catch (error) {
        console.error("Error fetching my tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = filter === "all" || task.status === filter;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "in-progress":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "review":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "done":
        return "bg-green-50 text-green-700 border-green-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-100";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-100";
      case "low":
        return "text-green-600 bg-green-50 border-green-100";
      default:
        return "text-gray-600 bg-gray-50 border-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Tasks</h2>
          <p className="text-gray-500 mt-1">
            Manage and track your assigned work
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          {["all", "todo", "in-progress", "done"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                filter === f
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No tasks found
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {searchQuery
              ? "No tasks match your search query. Try different keywords."
              : "You don't have any tasks in this category yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-100 transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize border ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {task.title}
              </h3>
              <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                {task.description || "No description provided."}
              </p>

              <div className="pt-4 border-t border-gray-100 mt-auto space-y-4">
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : "No date"}
                  </div>
                  <div className="flex items-center text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                    {task.project_name}
                  </div>
                </div>

                <Link
                  to={`/projects/${task.project_id}`}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-gray-50 hover:bg-indigo-600 text-gray-700 hover:text-white rounded-xl transition-all duration-200 font-medium text-sm group-hover:shadow-md"
                >
                  Go to Board
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;
