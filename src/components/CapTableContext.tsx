import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CapTable } from "./CapTableSelector";
import { Project } from "./ProjectSelector";
import { toast } from "./ui/use-toast";

interface CapTableContextType {
  projects: Project[];
  selectedProject: Project | null;
  capTables: CapTable[];
  selectedCapTable: CapTable | null;
  setSelectedProject: (project: Project) => void;
  setSelectedCapTable: (capTable: CapTable) => void;
  createProject: (
    project: Omit<Project, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  createCapTable: (
    capTable: Omit<CapTable, "id" | "createdAt" | "updatedAt" | "projectId">,
  ) => Promise<CapTable>;
  updateCapTable: (capTable: CapTable) => Promise<void>;
  deleteCapTable: (capTableId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const CapTableContext = createContext<CapTableContextType | undefined>(
  undefined,
);

export const useCapTable = () => {
  const context = useContext(CapTableContext);
  if (context === undefined) {
    throw new Error("useCapTable must be used within a CapTableProvider");
  }
  return context;
};

export const CapTableProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [capTables, setCapTables] = useState<CapTable[]>([]);
  const [selectedCapTable, setSelectedCapTable] = useState<CapTable | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch cap tables when selected project changes
  useEffect(() => {
    if (selectedProject) {
      fetchCapTables(selectedProject.id);
    }
  }, [selectedProject]);

  // Set up realtime subscriptions
  useEffect(() => {
    const projectsSubscription = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          console.log("Projects changed, refreshing...");
          fetchProjects();
        },
      )
      .subscribe();

    const capTablesSubscription = supabase
      .channel("cap-tables-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cap_tables" },
        () => {
          console.log("Cap tables changed, refreshing...");
          if (selectedProject) {
            fetchCapTables(selectedProject.id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectsSubscription);
      supabase.removeChannel(capTablesSubscription);
    };
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log("Fetching projects...");

      // Query the projects table
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      console.log("Projects fetched:", data);

      const fetchedProjects: Project[] =
        data?.map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: new Date(project.created_at),
          updatedAt: new Date(project.updated_at),
        })) || [];

      setProjects(fetchedProjects);

      // If we have projects but none selected, select the first one
      if (fetchedProjects.length > 0 && !selectedProject) {
        setSelectedProject(fetchedProjects[0]);
      } else if (selectedProject) {
        // If we have a selected project, make sure it still exists
        const projectStillExists = fetchedProjects.some(
          (p) => p.id === selectedProject.id,
        );
        if (!projectStillExists && fetchedProjects.length > 0) {
          setSelectedProject(fetchedProjects[0]);
        }
      }

      // If no projects exist, create a default one
      if (fetchedProjects.length === 0) {
        createDefaultProject();
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchCapTables = async (projectId: string) => {
    try {
      setLoading(true);
      console.log(`Fetching cap tables for project ${projectId}...`);

      // Query the cap_tables table
      const { data, error } = await supabase
        .from("cap_tables")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      console.log("Cap tables fetched:", data);

      const fetchedCapTables: CapTable[] =
        data?.map((table) => ({
          id: table.id,
          name: table.name,
          description: table.description,
          projectId: table.project_id,
          createdAt: new Date(table.created_at),
          updatedAt: new Date(table.updated_at),
        })) || [];

      setCapTables(fetchedCapTables);

      // If we have cap tables but none selected, select the first one
      if (fetchedCapTables.length > 0) {
        if (!selectedCapTable || selectedCapTable.projectId !== projectId) {
          setSelectedCapTable(fetchedCapTables[0]);
        } else {
          // If we have a selected cap table, make sure it still exists
          const capTableStillExists = fetchedCapTables.some(
            (ct) => ct.id === selectedCapTable.id,
          );
          if (!capTableStillExists) {
            setSelectedCapTable(fetchedCapTables[0]);
          }
        }
      } else {
        // If no cap tables exist for this project, create a default one
        createDefaultCapTable(projectId);
      }
    } catch (err) {
      console.error(`Error fetching cap tables for project ${projectId}:`, err);
      setError("Failed to load cap tables");
    } finally {
      setLoading(false);
    }
  };

  const createDefaultProject = async () => {
    try {
      console.log("Creating default project...");
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: "Main Project",
          description: "Default project",
        })
        .select()
        .single();

      if (error) throw error;

      const newProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setProjects([newProject]);
      setSelectedProject(newProject);

      // Create a default cap table for this project
      await createDefaultCapTable(newProject.id);

      return newProject;
    } catch (err) {
      console.error("Error creating default project:", err);
      setError("Failed to create default project");
      throw err;
    }
  };

  const createDefaultCapTable = async (projectId: string) => {
    try {
      console.log(`Creating default cap table for project ${projectId}...`);
      const { data, error } = await supabase
        .from("cap_tables")
        .insert({
          name: "Main Cap Table",
          description: "Default cap table for the project",
          project_id: projectId,
        })
        .select()
        .single();

      if (error) throw error;

      const newCapTable: CapTable = {
        id: data.id,
        name: data.name,
        description: data.description,
        projectId: data.project_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setCapTables([newCapTable]);
      setSelectedCapTable(newCapTable);

      return newCapTable;
    } catch (err) {
      console.error(
        `Error creating default cap table for project ${projectId}:`,
        err,
      );
      setError("Failed to create default cap table");
      throw err;
    }
  };

  const createProject = async (
    project: Omit<Project, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      console.log("Creating new project:", project);
      // Insert into projects table in the database
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: project.name,
          description: project.description,
        })
        .select()
        .single();

      if (error) {
        console.error("Database error creating project:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from project creation");
      }

      const newProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      // Update local state immediately for better UX
      setProjects((prev) => [...prev, newProject]);
      setSelectedProject(newProject);

      toast({
        title: "Project Created",
        description: `Created new project: ${newProject.name}`,
      });

      return newProject;
    } catch (err) {
      console.error("Error creating project:", err);
      setError("Failed to create project");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create project",
      });
      throw err;
    }
  };

  const updateProject = async (project: Project) => {
    try {
      console.log("Updating project in database:", project);
      const { error, data } = await supabase
        .from("projects")
        .update({
          name: project.name,
          description: project.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id)
        .select()
        .single();

      if (error) {
        console.error("Database error updating project:", error);
        throw error;
      }

      // Update local state immediately for better UX
      const updatedProject = {
        ...project,
        updatedAt: new Date(),
        name: data?.name || project.name,
        description: data?.description || project.description,
      };

      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? updatedProject : p)),
      );

      if (selectedProject?.id === project.id) {
        setSelectedProject(updatedProject);
      }

      toast({
        title: "Project Updated",
        description: `Updated project: ${project.name}`,
      });
    } catch (err) {
      console.error("Error updating project:", err);
      setError("Failed to update project");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update project",
      });
      throw err;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      // Don't allow deleting the last project
      if (projects.length <= 1) {
        toast({
          variant: "destructive",
          title: "Cannot Delete",
          description: "You must have at least one project",
        });
        return;
      }

      console.log("Deleting project from database:", projectId);

      // First, delete all cap tables associated with this project
      const { error: capTableDeleteError } = await supabase
        .from("cap_tables")
        .delete()
        .eq("project_id", projectId);

      if (capTableDeleteError) {
        console.error(
          "Error deleting associated cap tables:",
          capTableDeleteError,
        );
        throw capTableDeleteError;
      }

      // Then delete the project itself
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) {
        console.error("Database error deleting project:", error);
        throw error;
      }

      // Update local state immediately for better UX
      const updatedProjects = projects.filter((p) => p.id !== projectId);
      setProjects(updatedProjects);

      // Also update cap tables state to remove any associated with this project
      setCapTables(capTables.filter((ct) => ct.projectId !== projectId));

      // If the deleted project was selected, select another one
      if (selectedProject?.id === projectId && updatedProjects.length > 0) {
        setSelectedProject(updatedProjects[0]);
      }

      toast({
        title: "Project Deleted",
        description: "Project and associated cap tables deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting project:", err);
      setError("Failed to delete project");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete project",
      });
      throw err;
    }
  };

  const createCapTable = async (
    capTable: Omit<CapTable, "id" | "createdAt" | "updatedAt" | "projectId">,
  ) => {
    if (!selectedProject) {
      toast({
        variant: "destructive",
        title: "No Project Selected",
        description: "Please select a project first",
      });
      throw new Error("No project selected");
    }

    try {
      console.log(
        "Creating new cap table in database:",
        capTable,
        "for project:",
        selectedProject.id,
      );
      // Insert into cap_tables table in the database
      const { data, error } = await supabase
        .from("cap_tables")
        .insert({
          name: capTable.name,
          description: capTable.description,
          project_id: selectedProject.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Database error creating cap table:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from cap table creation");
      }

      const newCapTable: CapTable = {
        id: data.id,
        name: data.name,
        description: data.description,
        projectId: data.project_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      // Update local state immediately for better UX
      setCapTables((prev) => [...prev, newCapTable]);
      setSelectedCapTable(newCapTable);

      toast({
        title: "Cap Table Created",
        description: `Created new cap table: ${newCapTable.name}`,
      });

      return newCapTable;
    } catch (err) {
      console.error("Error creating cap table:", err);
      setError("Failed to create cap table");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create cap table",
      });
      throw err;
    }
  };

  const updateCapTable = async (capTable: CapTable) => {
    try {
      console.log("Updating cap table in database:", capTable);
      const { error, data } = await supabase
        .from("cap_tables")
        .update({
          name: capTable.name,
          description: capTable.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", capTable.id)
        .select()
        .single();

      if (error) {
        console.error("Database error updating cap table:", error);
        throw error;
      }

      // Update local state immediately for better UX
      const updatedCapTable = {
        ...capTable,
        updatedAt: new Date(),
        name: data?.name || capTable.name,
        description: data?.description || capTable.description,
      };

      setCapTables((prev) =>
        prev.map((ct) => (ct.id === capTable.id ? updatedCapTable : ct)),
      );

      if (selectedCapTable?.id === capTable.id) {
        setSelectedCapTable(updatedCapTable);
      }

      toast({
        title: "Cap Table Updated",
        description: `Updated cap table: ${capTable.name}`,
      });
    } catch (err) {
      console.error("Error updating cap table:", err);
      setError("Failed to update cap table");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update cap table",
      });
      throw err;
    }
  };

  const deleteCapTable = async (capTableId: string) => {
    try {
      // Get current project's cap tables
      const projectCapTables = capTables.filter(
        (ct) => ct.projectId === selectedProject?.id,
      );

      // Don't allow deleting the last cap table in a project
      if (projectCapTables.length <= 1) {
        toast({
          variant: "destructive",
          title: "Cannot Delete",
          description: "You must have at least one cap table per project",
        });
        return;
      }

      console.log("Deleting cap table from database:", capTableId);

      // First, delete all investor associations with this cap table
      const { error: investorAssocError } = await supabase
        .from("cap_table_investors")
        .delete()
        .eq("cap_table_id", capTableId);

      if (investorAssocError) {
        console.error(
          "Error deleting cap table investor associations:",
          investorAssocError,
        );
        throw investorAssocError;
      }

      // Then delete the cap table itself
      const { error } = await supabase
        .from("cap_tables")
        .delete()
        .eq("id", capTableId);

      if (error) {
        console.error("Database error deleting cap table:", error);
        throw error;
      }

      // Update local state immediately for better UX
      const updatedCapTables = capTables.filter((ct) => ct.id !== capTableId);
      setCapTables(updatedCapTables);

      // If the deleted cap table was selected, select another one
      if (selectedCapTable?.id === capTableId) {
        const remainingProjectCapTables = updatedCapTables.filter(
          (ct) => ct.projectId === selectedProject?.id,
        );
        if (remainingProjectCapTables.length > 0) {
          setSelectedCapTable(remainingProjectCapTables[0]);
        }
      }

      toast({
        title: "Cap Table Deleted",
        description: "Cap table deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting cap table:", err);
      setError("Failed to delete cap table");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete cap table",
      });
      throw err;
    }
  };

  const value = {
    projects,
    selectedProject,
    capTables,
    selectedCapTable,
    setSelectedProject,
    setSelectedCapTable,
    createProject,
    updateProject,
    deleteProject,
    createCapTable,
    updateCapTable,
    deleteCapTable,
    loading,
    error,
  };

  return (
    <CapTableContext.Provider value={value}>
      {children}
    </CapTableContext.Provider>
  );
};
