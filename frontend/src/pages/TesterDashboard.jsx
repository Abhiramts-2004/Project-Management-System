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

const TesterDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          api.get("/projects"),
          api.get("/tasks"), // Testers can see all tasks, we'll filter client-side or use a specific endpoint if needed
        ]);

        setProjects(projectsRes.data);
        // Filter for tasks that are relevant to testers (e.g., in review)
        // For now, let's fetch all tasks and filter client-side
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

  const reviewTasks = tasks.filter((t) => t.status === "review");
  const completedTasks = tasks.filter((t) => t.status === "done");

  const stats = [
    {
      title: "Tasks in Review",
      value: reviewTasks.length,
      icon: Clock,
      color: "bg-amber-500",
      bg: "bg-amber-50",
      text: "text-amber-600",
      link: "/tasks?filter=review", // We might need to update MyTasks to handle this or create a new view
    },
    {
      title: "Completed Tasks",
      value: completedTasks.length,
      icon: CheckCircle,
      color: "bg-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      link: "/tasks?filter=done",
    },
    {
      title: "Total Projects",
      value: projects.length,
      icon: Briefcase,
      color: "bg-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-600",
      link: "/projects",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-50 rounded-full -ml-32 -mb-32 opacity-50 blur-3xl"></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Hello,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              {user.username}
            </span>
            ! 👋
          </h1>
          <p className="text-gray-500 text-lg">
            You have{" "}
            <span className="font-bold text-indigo-600">
              {reviewTasks.length} tasks
            </span>{" "}
            waiting for your review today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Link
            to={stat.link}
            key={index}
            className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className={`w-6 h-6 ${stat.text}`} />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </h3>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Tasks (Review Queue) - Takes up 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
          <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Clock className="w-6 h-6 mr-3 text-amber-500" />
                Review Queue
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Tasks requiring your attention
              </p>
            </div>
            <span className="bg-amber-50 text-amber-700 text-sm font-bold px-4 py-1.5 rounded-full border border-amber-100">
              {reviewTasks.length} Pending
            </span>
          </div>

          <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
            {reviewTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-gray-300" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  All caught up!
                </h4>
                <p className="text-gray-500">
                  No tasks currently waiting for review.
                </p>
              </div>
            ) : (
              reviewTasks.map((task) => (
                <div
                  key={task.id}
                  className="group bg-white p-5 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wide">
                          Review
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          •
                        </span>
                        <span className="text-xs text-gray-500 font-medium flex items-center">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {task.project_name || "Unknown Project"}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">
                        {task.title}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                        {task.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end mt-4 pt-4 border-t border-gray-50">
                    <Link
                      to={`/projects/${task.project_id}`}
                      className="inline-flex items-center px-4 py-2 bg-gray-900 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group-hover:translate-x-1"
                    >
                      Review Task <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Completed - Takes up 1 column */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
          <div className="p-8 border-b border-gray-100 bg-white sticky top-0 z-10">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <CheckCircle className="w-6 h-6 mr-3 text-emerald-500" />
              Completed
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Recently approved tasks
            </p>
          </div>

          <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
            {completedTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
                <p>No completed tasks yet.</p>
              </div>
            ) : (
              completedTasks.slice(0, 8).map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-4 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">
                        {task.title}
                      </h4>
                      <div className="flex items-center mt-1.5">
                        <span className="text-xs text-gray-400 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {task.updated_at
                            ? new Date(task.updated_at).toLocaleDateString()
                            : "No date"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TesterDashboard;
