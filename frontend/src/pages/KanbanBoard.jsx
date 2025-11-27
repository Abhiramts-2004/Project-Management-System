import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import {
  Plus,
  MoreHorizontal,
  Calendar,
  User as UserIcon,
  X,
  Check,
  Clock,
  AlignLeft,
  Trash2,
} from "lucide-react";

// ... inside component ...

import api from "../services/api";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const KanbanBoard = ({ projectId }) => {
  const { user } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [tasks, setTasks] = useState({
    todo: [],
    "in-progress": [],
    review: [],
    done: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState("todo");
  const [users, setUsers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isDestructive: false,
  });

  // Form data for creating/editing
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assigned_to: [], // Array of user IDs
  });
  const [error, setError] = useState("");

  const [project, setProject] = useState(null);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get(`/tasks/project/${projectId}`);
      const groupedTasks = {
        todo: [],
        "in-progress": [],
        review: [],
        done: [],
      };

      response.data.forEach((task) => {
        const status = task.status || "todo";
        if (groupedTasks[status]) {
          groupedTasks[status].push(task);
        } else {
          console.warn(`Unknown task status: ${status}`);
          groupedTasks["todo"].push(task);
        }
      });

      setTasks(groupedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("Failed to load tasks.");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchUsers();
      fetchProject();
    }
  }, [projectId, user]);

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading user profile...
      </div>
    );
  }

  const handleCompleteProject = async () => {
    const allTasksDone =
      tasks.todo.length === 0 &&
      tasks["in-progress"].length === 0 &&
      tasks.review.length === 0;

    const message = !allTasksDone
      ? "Not all tasks are completed. Are you sure you want to mark this project as completed?"
      : "Are you sure you want to mark this project as completed?";

    setConfirmDialog({
      isOpen: true,
      title: "Complete Project",
      message: message,
      onConfirm: async () => {
        try {
          await api.patch(`/projects/${projectId}`, { status: "completed" });
          fetchProject();
          toastSuccess("Project marked as completed!");
        } catch (error) {
          console.error("Error completing project:", error);
          toastError("Failed to complete project");
        }
      },
      isDestructive: false,
    });
  };

  const handleIncompleteProject = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Mark as Incomplete",
      message: "Are you sure you want to mark this project as active again?",
      onConfirm: async () => {
        try {
          await api.patch(`/projects/${projectId}`, { status: "active" });
          fetchProject();
          toastSuccess("Project marked as active!");
        } catch (error) {
          console.error("Error marking project incomplete:", error);
          toastError("Failed to update project status");
        }
      },
      isDestructive: false,
    });
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Enforce Workflow Rules on Frontend
    const sourceStatus = source.droppableId;
    console.log("onDragEnd - User:", user);
    console.log("onDragEnd - Role:", user?.role);

    const task = tasks[sourceStatus].find((t) => t.id === draggableId);

    // Check if user is assigned to the task (for employees)
    if (user.role === "employee") {
      const isAssigned =
        task.assignees && task.assignees.some((u) => u.id === user.id);
      if (!isAssigned) {
        toastError("You can only move tasks assigned to you.");
        return;
      }

      // Employee Rules:
      // 1. Cannot move backwards (e.g., in-progress -> todo)
      // 2. Cannot move from 'review' -> 'done'
      // 3. Cannot move from 'done' -> anything
      const validTransitions = {
        todo: ["in-progress"],
        "in-progress": ["review"],
        review: [],
        done: [],
      };

      if (source.droppableId !== destination.droppableId) {
        if (
          !validTransitions[source.droppableId] ||
          !validTransitions[source.droppableId].includes(
            destination.droppableId
          )
        ) {
          toastError(
            `Employees cannot move tasks from '${source.droppableId}' to '${destination.droppableId}'.`
          );
          return;
        }
      }
    } else if (user.role === "tester") {
      // Tester Rules:
      // 1. Can move 'review' -> 'done' (Approve)
      // 2. Can move 'review' -> 'in-progress' (Reject)
      // 3. Cannot move anything else

      if (source.droppableId !== "review") {
        toastError("Testers can only move tasks that are in 'Review'.");
        return;
      }

      const validTesterTransitions = ["done", "in-progress"];
      if (!validTesterTransitions.includes(destination.droppableId)) {
        toastError(
          "Testers can only move tasks to 'Done' (Approve) or 'In Progress' (Reject)."
        );
        return;
      }
    } else {
      // Admin Rules
      // Admin has full control
    }

    // Create a copy of the current state
    const newTasks = { ...tasks };
    const sourceList = newTasks[source.droppableId];
    const destList = newTasks[destination.droppableId];
    const [movedTask] = sourceList.splice(source.index, 1);

    // Update task status locally
    movedTask.status = destination.droppableId;
    destList.splice(destination.index, 0, movedTask);

    setTasks(newTasks);

    // Update in backend
    try {
      await api.patch(`/tasks/${draggableId}/status`, {
        status: destination.droppableId,
        position: destination.index,
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      // Revert on error (optional but good practice)
      fetchTasks();
      toastError(error.response?.data?.message || "Error updating task status");
    }
  };

  const openNewTaskModal = (status) => {
    setNewTaskStatus(status);
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      due_date: "",
      assigned_to: [],
    });
    setError("");
    setIsModalOpen(true);
  };

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split("T")[0] : "",
      assigned_to: task.assignees ? task.assignees.map((u) => u.id) : [],
    });
    setError("");
    setIsDetailsModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (user.role !== "admin") {
      toastError("Only admins can create tasks.");
      return;
    }

    try {
      await api.post("/tasks", {
        ...formData,
        project_id: projectId,
        status: newTaskStatus,
      });
      setIsModalOpen(false);
      fetchTasks();
    } catch (error) {
      setError(error.response?.data?.message || "Error creating task");
      toastError("Failed to create task");
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (user.role !== "admin") {
      toastError("Only admins can edit tasks.");
      return;
    }

    try {
      await api.put(`/tasks/${selectedTask.id}`, formData);
      setIsDetailsModalOpen(false);
      fetchTasks();
    } catch (error) {
      setError(error.response?.data?.message || "Error updating task");
    }
  };

  const handleDeleteTask = async () => {
    if (user.role !== "admin") {
      toastError("Only admins can delete tasks.");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Delete Task",
      message:
        "Are you sure you want to delete this task? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await api.delete(`/tasks/${selectedTask.id}`);
          setIsDetailsModalOpen(false);
          fetchTasks();
          toastSuccess("Task deleted successfully");
        } catch (error) {
          console.error("Error deleting task:", error);
          toastError("Failed to delete task");
        }
      },
      isDestructive: true,
    });
  };

  const toggleAssignee = (userId) => {
    setFormData((prev) => {
      const current = prev.assigned_to || [];
      if (current.includes(userId)) {
        return { ...prev, assigned_to: current.filter((id) => id !== userId) };
      } else {
        return { ...prev, assigned_to: [...current, userId] };
      }
    });
  };

  const columns = [
    { id: "todo", title: "To Do", color: "bg-gray-100" },
    { id: "in-progress", title: "In Progress", color: "bg-blue-50" },
    { id: "review", title: "Review", color: "bg-yellow-50" },
    { id: "done", title: "Done", color: "bg-green-50" },
  ];

  const PriorityBadge = ({ priority }) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        priority === "high"
          ? "bg-red-100 text-red-700"
          : priority === "medium"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-green-100 text-green-700"
      }`}
    >
      {priority}
    </span>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Board Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center sticky top-0 z-10">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {project ? project.name : "Loading..."}
            </h1>
            {project && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  project.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {project.status}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {project ? project.description : "Manage tasks and track progress"}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {user.role === "admin" && project && (
            <>
              {project.status !== "completed" ? (
                <button
                  onClick={handleCompleteProject}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium text-sm"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Complete Project
                </button>
              ) : (
                <button
                  onClick={handleIncompleteProject}
                  className="flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium text-sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Mark as Incomplete
                </button>
              )}
            </>
          )}
          <div className="flex -space-x-2 overflow-hidden pl-2 border-l border-gray-200 ml-2">
            {users.slice(0, 5).map((u) => (
              <div
                key={u.id}
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center overflow-hidden"
                title={u.username}
              >
                {u.avatar_url ? (
                  <img
                    src={u.avatar_url}
                    alt={u.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-gray-600">
                    {u.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-4 gap-4 p-6 h-full w-full">
            {columns.map((column) => (
              <div
                key={column.id}
                className={`rounded-2xl p-4 flex flex-col h-full ${column.color} border border-gray-100/50 shadow-sm overflow-hidden`}
              >
                <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        column.id === "todo"
                          ? "bg-gray-400"
                          : column.id === "in-progress"
                          ? "bg-blue-500"
                          : column.id === "review"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                    />
                    <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                      {column.title}
                    </h3>
                  </div>
                  <span className="bg-white/60 px-2.5 py-0.5 rounded-full text-xs font-bold text-gray-600">
                    {tasks[column.id]?.length || 0}
                  </span>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 overflow-y-auto space-y-3 min-h-0 custom-scrollbar pr-1"
                    >
                      {tasks[column.id]?.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => openTaskDetails(task)}
                              className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <PriorityBadge priority={task.priority} />
                                <button className="text-gray-400 hover:text-gray-600">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>

                              <h4 className="font-medium text-gray-900 mb-2">
                                {task.title}
                              </h4>

                              <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                                <div className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {task.due_date
                                    ? new Date(
                                        task.due_date
                                      ).toLocaleDateString()
                                    : "No date"}
                                </div>

                                <div className="flex -space-x-2 overflow-hidden">
                                  {task.assignees &&
                                  task.assignees.length > 0 ? (
                                    task.assignees.map((assignee) => (
                                      <div
                                        key={assignee.id}
                                        className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center overflow-hidden"
                                        title={assignee.username}
                                      >
                                        {assignee.avatar_url ? (
                                          <img
                                            src={assignee.avatar_url}
                                            alt={assignee.username}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-[10px] font-medium text-gray-600">
                                            {assignee.username
                                              .charAt(0)
                                              .toUpperCase()}
                                          </span>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-white">
                                      <UserIcon className="w-3 h-3 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {column.id === "todo" && user.role === "admin" && (
                  <button
                    onClick={() => openNewTaskModal(column.id)}
                    className="mt-3 w-full py-2 flex items-center justify-center text-gray-500 hover:bg-white/50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </button>
                )}
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add New Task</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Task title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Task details..."
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded cursor-pointer"
                      onClick={() => toggleAssignee(user.id)}
                    >
                      <div
                        className={`w-4 h-4 border rounded flex items-center justify-center ${
                          formData.assigned_to.includes(user.id)
                            ? "bg-indigo-600 border-indigo-600"
                            : "border-gray-300"
                        }`}
                      >
                        {formData.assigned_to.includes(user.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2 overflow-hidden">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs">
                              {user.username.charAt(0)}
                            </span>
                          )}
                        </div>
                        {user.username}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details / Edit Modal */}
      {isDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <AlignLeft className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    {selectedTask.title}
                  </h2>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-sm text-gray-500">in list</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 capitalize">
                      {selectedTask.status.replace("-", " ")}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content */}
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  <form id="edit-task-form" onSubmit={handleUpdateSubmit}>
                    <div className="space-y-6">
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-indigo-600 transition-colors">
                          Task Title
                        </label>
                        <input
                          type="text"
                          required
                          disabled={user.role !== "admin"}
                          className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-lg font-medium transition-all duration-200 placeholder:text-gray-400 ${
                            user.role === "admin"
                              ? "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white"
                              : "cursor-not-allowed opacity-70"
                          }`}
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          placeholder="Enter task title"
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-indigo-600 transition-colors">
                          Description
                        </label>
                        <textarea
                          disabled={user.role !== "admin"}
                          className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 transition-all duration-200 min-h-[200px] resize-y placeholder:text-gray-400 leading-relaxed ${
                            user.role === "admin"
                              ? "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white"
                              : "cursor-not-allowed opacity-70"
                          }`}
                          placeholder="Add a more detailed description..."
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>

                      {user.role === "admin" && (
                        <div className="flex justify-end pt-4">
                          <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                          >
                            Save Changes
                          </button>
                        </div>
                      )}
                    </div>
                  </form>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                  {/* Assignees Section */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <label className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Assignees
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {users.map((u) => {
                        const isAssigned = formData.assigned_to.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            onClick={() =>
                              user.role === "admin" && toggleAssignee(u.id)
                            }
                            className={`flex items-center p-2 rounded-lg transition-all duration-200 border ${
                              isAssigned
                                ? "bg-indigo-50 border-indigo-200 shadow-sm"
                                : "border-transparent"
                            } ${
                              user.role === "admin"
                                ? "cursor-pointer hover:bg-white hover:border-gray-200"
                                : "cursor-default"
                            }`}
                          >
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                                {u.avatar_url ? (
                                  <img
                                    src={u.avatar_url}
                                    className="w-full h-full object-cover"
                                    alt={u.username}
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-gray-600">
                                    {u.username.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              {isAssigned && (
                                <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-0.5 border-2 border-white">
                                  <Check className="w-2 h-2 text-white" />
                                </div>
                              )}
                            </div>
                            <span
                              className={`ml-3 text-sm font-medium ${
                                isAssigned ? "text-indigo-900" : "text-gray-600"
                              }`}
                            >
                              {u.username}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metadata Section */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Priority
                      </label>
                      <div className="relative">
                        <select
                          className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-all cursor-pointer hover:border-gray-300"
                          value={formData.priority}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              priority: e.target.value,
                            })
                          }
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Due Date
                      </label>
                      <div className="relative group">
                        <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          type="date"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:border-gray-300"
                          value={formData.due_date}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              due_date: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              {user.role === "admin" ? (
                <button
                  type="button"
                  onClick={handleDeleteTask}
                  className="flex items-center px-4 py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all font-medium text-sm group"
                >
                  <Trash2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Delete Task
                </button>
              ) : (
                <div></div>
              )}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-6 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl font-medium transition-all text-sm"
                >
                  Cancel
                </button>
                {user.role !== "tester" && (
                  <button
                    type="submit"
                    form="edit-task-form"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-0.5 text-sm"
                  >
                    Save Changes
                  </button>
                )}
              </div>
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

export default KanbanBoard;
