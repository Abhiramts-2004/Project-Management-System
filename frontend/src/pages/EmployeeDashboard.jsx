import React, { useEffect, useState } from "react";
import {
  ListTodo,
  Clock,
  CheckCircle,
  Briefcase,
  ArrowRight,
  Calendar,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          api.get("/projects"),
          api.get("/tasks/my-tasks"),
        ]);

        setProjects(projectsRes.data);
        setTasks(tasksRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const stats = [
    {
      title: "My Tasks",
      value: tasks.length,
      icon: ListTodo,
      color: "bg-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-600",
      link: "/tasks?filter=all",
    },
    {
      title: "Pending",
      value: tasks.filter((t) => t.status !== "done").length,
      icon: Clock,
      color: "bg-amber-500",
      bg: "bg-amber-50",
      text: "text-amber-600",
      link: "/tasks?filter=todo",
    },
    {
      title: "Completed",
      value: tasks.filter((t) => t.status === "done").length,
      icon: CheckCircle,
      color: "bg-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      link: "/tasks?filter=done",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user.username}! 👋
        </h1>
        <p className="text-indigo-100 text-lg opacity-90">
          You have {tasks.filter((t) => t.status !== "done").length} pending
          tasks to complete today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Link
            to={stat.link}
            key={index}
            className="block bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {stat.title}
                </p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </h3>
              </div>
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.text}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Projects */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-indigo-600" />
              My Projects
            </h3>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {projects.length} Active
            </span>
          </div>
          <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
            {projects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No projects assigned yet.
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="group p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {project.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {project.description}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                        project.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100/50">
                    <div className="flex items-center text-xs text-gray-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      {new Date(project.start_date).toLocaleDateString()}
                    </div>
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center group-hover:translate-x-1 transition-transform"
                    >
                      View Board <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <ListTodo className="w-5 h-5 mr-2 text-indigo-600" />
              Recent Tasks
            </h3>
            <Link
              to="/tasks"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View All
            </Link>
          </div>
          <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tasks assigned yet.
              </div>
            ) : (
              tasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center p-4 rounded-xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm transition-all duration-200"
                >
                  <div
                    className={`w-2 h-12 rounded-full mr-4 ${
                      task.priority === "high"
                        ? "bg-red-500"
                        : task.priority === "medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">
                      {task.title}
                    </h4>
                    <div className="flex items-center mt-1 space-x-3">
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString()
                          : "No date"}
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        •
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        {task.project_name || "Unknown Project"}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`ml-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      task.status === "done"
                        ? "bg-green-100 text-green-700"
                        : task.status === "review"
                        ? "bg-purple-100 text-purple-700"
                        : task.status === "in-progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
