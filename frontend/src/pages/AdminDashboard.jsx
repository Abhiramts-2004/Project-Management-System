import React, { useEffect, useState } from "react";
import {
  Users,
  FolderKanban,
  AlertCircle,
  CheckCircle,
  Activity,
  Plus,
  ArrowRight,
  Briefcase,
  Layers,
  Clock,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    projects: 0,
    activeProjects: 0,
    completedProjects: 0,
    tasks: 0,
    pendingTasks: 0,
  });
  const [projectStatusData, setProjectStatusData] = useState([]);
  const [taskStatusData, setTaskStatusData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isCompletedProjectsModalOpen, setIsCompletedProjectsModalOpen] =
    useState(false);
  const [isPendingTasksModalOpen, setIsPendingTasksModalOpen] = useState(false);
  const [completedProjectsList, setCompletedProjectsList] = useState([]);
  const [pendingTasksList, setPendingTasksList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, projectsRes, tasksRes, activityRes] =
          await Promise.all([
            api.get("/users"),
            api.get("/projects"),
            api.get("/tasks"), // Admin route to get all tasks
            api.get("/activity"),
          ]);

        const projects = projectsRes.data;
        const tasks = tasksRes.data;
        const users = usersRes.data;
        const activities = activityRes.data;

        // Calculate Stats
        const activeProjects = projects.filter(
          (p) => p.status === "active"
        ).length;
        const completedProjects = projects.filter(
          (p) => p.status === "completed"
        ).length;

        const pendingTasks = tasks.filter((t) => t.status !== "done");

        setStats({
          users: users.length,
          projects: projects.length,
          activeProjects,
          completedProjects,
          tasks: tasks.length,
          pendingTasks: pendingTasks.length,
        });

        setCompletedProjectsList(
          projects.filter((p) => p.status === "completed")
        );
        setPendingTasksList(pendingTasks);

        // Prepare Chart Data
        setProjectStatusData([
          { name: "Active", value: activeProjects, color: "#F59E0B" }, // Yellow-500
          { name: "Completed", value: completedProjects, color: "#10B981" }, // Green-500
        ]);

        const taskCounts = {
          todo: 0,
          "in-progress": 0,
          review: 0,
          done: 0,
        };
        tasks.forEach((t) => {
          if (taskCounts[t.status] !== undefined) {
            taskCounts[t.status]++;
          }
        });

        setTaskStatusData([
          { name: "To Do", count: taskCounts.todo },
          { name: "In Progress", count: taskCounts["in-progress"] },
          { name: "Review", count: taskCounts.review },
          { name: "Done", count: taskCounts.done },
        ]);

        // Recent Activity (Top 5)
        setRecentActivity(activities.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  const COLORS = ["#F59E0B", "#10B981"];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-500 mt-1">
            Overview of system performance and activities
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          onClick={() => navigate("/employees")}
          className="cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <StatCard
            title="Total Developers"
            value={stats.users}
            icon={Users}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
        </div>
        <div
          onClick={() => navigate("/projects")}
          className="cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <StatCard
            title="Total Projects"
            value={stats.projects}
            icon={FolderKanban}
            color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          />
        </div>
        <div
          onClick={() => setIsPendingTasksModalOpen(true)}
          className="cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <StatCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            icon={Layers}
            color="bg-gradient-to-br from-orange-500 to-orange-600"
          />
        </div>
        <div
          onClick={() => setIsCompletedProjectsModalOpen(true)}
          className="cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <StatCard
            title="Completed Projects"
            value={stats.completedProjects}
            icon={CheckCircle}
            color="bg-gradient-to-br from-green-500 to-green-600"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Status Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Project Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Task Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskStatusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "#F3F4F6" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <button
              onClick={() => navigate("/activity")}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mt-1 mr-3 flex-shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      <span className="font-bold">
                        {log.username || "User"}
                      </span>{" "}
                      {log.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                No recent activity.
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions / Info */}
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-6 rounded-xl shadow-lg text-white lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Pro Tip</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Keep your projects organized by regularly reviewing task statuses.
              Archiving completed projects helps maintain a clean workspace.
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={() => navigate("/projects")}
              className="w-full py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors border border-white/10"
            >
              Manage Projects
            </button>
          </div>
        </div>
      </div>

      {/* Completed Projects Modal */}
      {isCompletedProjectsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                Completed Projects
              </h3>
              <button
                onClick={() => setIsCompletedProjectsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto">
              {completedProjectsList.length > 0 ? (
                <div className="space-y-4">
                  {completedProjectsList.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex justify-between items-center hover:bg-white hover:shadow-md transition-all"
                    >
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {project.name}
                        </h4>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {project.description}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        Completed
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <FolderKanban className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>No completed projects yet.</p>
                </div>
              )}
            </div>

            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsCompletedProjectsModalOpen(false)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Tasks Modal */}
      {isPendingTasksModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Layers className="w-6 h-6 text-orange-500 mr-2" />
                Pending Tasks
              </h3>
              <button
                onClick={() => setIsPendingTasksModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto">
              {pendingTasksList.length > 0 ? (
                <div className="space-y-4">
                  {pendingTasksList.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900">
                          {task.title}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                            task.status === "todo"
                              ? "bg-gray-100 text-gray-600"
                              : task.status === "in-progress"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {task.description || "No description provided."}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {task.project_name || "Unknown Project"}
                        </div>
                        {task.due_date && (
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <Layers className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>No pending tasks found.</p>
                </div>
              )}
            </div>

            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsPendingTasksModalOpen(false)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: IconComponent, color, trend }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full relative overflow-hidden group">
    <div className="relative z-10">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color} shadow-lg`}>
          <IconComponent className="w-6 h-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-xs font-medium text-gray-500">
          <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded mr-2">
            Trending
          </span>
          {trend}
        </div>
      )}
    </div>
    {/* Decorative background circle */}
    <div
      className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-5 ${color} group-hover:scale-150 transition-transform duration-500 ease-out`}
    />
  </div>
);

export default AdminDashboard;
