import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Calendar, Users, Trash2, CheckCircle } from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const ProjectList = () => {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });
  const [error, setError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isDestructive: false,
  });

  const fetchProjects = React.useCallback(async () => {
    try {
      const response = await api.get("/projects");
      let fetchedProjects = response.data;

      if (user.role === "tester") {
        // For testers, only show projects that have tasks in 'review'
        const tasksRes = await api.get("/tasks");
        const allTasks = tasksRes.data;
        const projectsWithReviewTasks = new Set(
          allTasks.filter((t) => t.status === "review").map((t) => t.project_id)
        );
        fetchedProjects = fetchedProjects.filter((p) =>
          projectsWithReviewTasks.has(p.id)
        );
      }

      setProjects(fetchedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }, [user.role]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/projects", formData);
      setIsModalOpen(false);
      setFormData({ name: "", description: "", start_date: "", end_date: "" });
      fetchProjects();
      toastSuccess("Project created successfully!");
    } catch (error) {
      setError(error.response?.data?.message || "Error creating project");
      toastError("Failed to create project");
    }
  };

  const handleCompleteProject = async (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Check if all tasks are completed
      const tasksRes = await api.get(`/tasks/project/${projectId}`);
      const tasks = tasksRes.data;

      const allTasksDone = tasks.every((task) => task.status === "done");

      const message = !allTasksDone
        ? "Warning: Not all tasks in this project are completed. Do you still want to mark the project as completed?"
        : "Are you sure you want to mark this project as completed?";

      setConfirmDialog({
        isOpen: true,
        title: "Complete Project",
        message: message,
        onConfirm: async () => {
          try {
            await api.patch(`/projects/${projectId}`, { status: "completed" });
            fetchProjects();
            toastSuccess("Project marked as completed");
          } catch (error) {
            console.error("Error completing project:", error);
            toastError("Failed to complete project");
          }
        },
        isDestructive: false,
      });
    } catch (error) {
      console.error("Error checking tasks:", error);
      toastError("Failed to check project tasks");
    }
  };

  const handleDelete = async (e, projectId) => {
    e.preventDefault(); // Prevent navigation

    setConfirmDialog({
      isOpen: true,
      title: "Delete Project",
      message:
        "Are you sure you want to delete this project? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await api.delete(`/projects/${projectId}`);
          fetchProjects();
          toastSuccess("Project deleted successfully");
        } catch (error) {
          console.error("Error deleting project:", error);
          toastError("Failed to delete project");
        }
      },
      isDestructive: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
        {user.role === "admin" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow block"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {project.name}
              </h3>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    project.status === "active"
                      ? "bg-green-100 text-green-800"
                      : project.status === "completed"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {project.status}
                </span>
                {user.role === "admin" && (
                  <>
                    {project.status !== "completed" && (
                      <button
                        onClick={(e) => handleCompleteProject(e, project.id)}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="Mark as Completed"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {project.description}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(project.start_date).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>View Details</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-100 rounded-xl">
                  <Plus className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Create New Project
                </h3>
              </div>
            </div>

            <div className="p-8">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-indigo-600 transition-colors">
                      Project Name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
                      placeholder="e.g. Website Redesign"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-indigo-600 transition-colors">
                      Description
                    </label>
                    <textarea
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 min-h-[120px] resize-y placeholder:text-gray-400"
                      placeholder="Describe the project goals and scope..."
                      rows="3"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-indigo-600 transition-colors">
                        Start Date
                      </label>
                      <div className="relative">
                        <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          type="date"
                          required
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200"
                          value={formData.start_date}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              start_date: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-indigo-600 transition-colors">
                        End Date
                      </label>
                      <div className="relative">
                        <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          type="date"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200"
                          value={formData.end_date}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              end_date: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl font-medium transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-0.5 text-sm"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.isDestructive}
      />
    </div>
  );
};

export default ProjectList;
