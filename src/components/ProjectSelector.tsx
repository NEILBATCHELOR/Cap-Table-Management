import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ChevronDown, Plus, Edit, Trash2 } from "lucide-react";

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  onCreateProject: (
    project: Omit<Project, "id" | "createdAt" | "updatedAt">,
  ) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectSelector = ({
  projects = [],
  selectedProject,
  onSelectProject,
  onCreateProject,
  onEditProject,
  onDeleteProject,
}: ProjectSelectorProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

    // Create project in the database
    onCreateProject({
      name: newProjectName,
      description: newProjectDescription,
    });

    setNewProjectName("");
    setNewProjectDescription("");
    setShowCreateDialog(false);
  };

  const handleEditProject = () => {
    if (!editingProject || !editingProject.name.trim()) return;

    onEditProject(editingProject);
    setEditingProject(null);
    setShowEditDialog(false);
  };

  const handleDeleteProject = () => {
    if (!deletingProject) return;

    onDeleteProject(deletingProject.id);
    setDeletingProject(null);
    setShowDeleteDialog(false);
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (project: Project) => {
    setDeletingProject(project);
    setShowDeleteDialog(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 w-[250px] justify-between"
            >
              <span className="truncate">
                {selectedProject ? selectedProject.name : "Select Project"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[250px]">
            {projects && projects.length > 0 ? (
              projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className="flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate">{project.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(project);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(project);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No projects found</DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => setShowCreateDialog(true)}
              className="text-primary hover:text-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your cap tables.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the details of your project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editingProject?.name || ""}
                onChange={(e) =>
                  setEditingProject(
                    editingProject
                      ? {
                          ...editingProject,
                          name: e.target.value,
                        }
                      : null,
                  )
                }
                placeholder="Enter project name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input
                id="edit-description"
                value={editingProject?.description || ""}
                onChange={(e) =>
                  setEditingProject(
                    editingProject
                      ? {
                          ...editingProject,
                          description: e.target.value,
                        }
                      : null,
                  )
                }
                placeholder="Enter description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProject}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot
              be undone and will delete all associated cap tables.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">{deletingProject?.name}</p>
            {deletingProject?.description && (
              <p className="text-sm text-gray-500 mt-1">
                {deletingProject.description}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectSelector;
