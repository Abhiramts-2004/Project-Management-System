import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import KanbanBoard from "./KanbanBoard";

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await api.get(`/projects/${id}`);
        setProject(response.data);
      } catch (error) {
        console.error("Error fetching project:", error);
      }
    };

    fetchProject();
  }, [id]);

  if (!project) return <div>Loading...</div>;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={id} />
      </div>
    </div>
  );
};

export default ProjectDetails;
