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

export interface CapTable {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CapTableSelectorProps {
  capTables: CapTable[];
  selectedCapTable: CapTable | null;
  onSelectCapTable: (capTable: CapTable) => void;
  onCreateCapTable: (
    capTable: Omit<CapTable, "id" | "createdAt" | "updatedAt">,
  ) => void;
  onEditCapTable: (capTable: CapTable) => void;
  onDeleteCapTable: (capTableId: string) => void;
}

const CapTableSelector = ({
  capTables = [],
  selectedCapTable,
  onSelectCapTable,
  onCreateCapTable,
  onEditCapTable,
  onDeleteCapTable,
}: CapTableSelectorProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newCapTableName, setNewCapTableName] = useState("");
  const [newCapTableDescription, setNewCapTableDescription] = useState("");
  const [editingCapTable, setEditingCapTable] = useState<CapTable | null>(null);
  const [deletingCapTable, setDeletingCapTable] = useState<CapTable | null>(
    null,
  );

  const handleCreateCapTable = () => {
    if (!newCapTableName.trim()) {
      console.log("Cap table name is empty, not creating");
      return;
    }

    console.log(
      "Creating cap table with name:",
      newCapTableName,
      "and description:",
      newCapTableDescription,
    );

    onCreateCapTable({
      name: newCapTableName,
      description: newCapTableDescription,
    });

    setNewCapTableName("");
    setNewCapTableDescription("");
    setShowCreateDialog(false);
  };

  const handleEditCapTable = () => {
    if (!editingCapTable || !editingCapTable.name.trim()) return;

    onEditCapTable(editingCapTable);
    setEditingCapTable(null);
    setShowEditDialog(false);
  };

  const handleDeleteCapTable = () => {
    if (!deletingCapTable) return;

    onDeleteCapTable(deletingCapTable.id);
    setDeletingCapTable(null);
    setShowDeleteDialog(false);
  };

  const openEditDialog = (capTable: CapTable) => {
    setEditingCapTable(capTable);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (capTable: CapTable) => {
    setDeletingCapTable(capTable);
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
                {selectedCapTable ? selectedCapTable.name : "Select Cap Table"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[250px]">
            {capTables.length > 0 ? (
              capTables && capTables.length > 0 ? (
                capTables.map((capTable) => (
                  <DropdownMenuItem
                    key={capTable.id}
                    onClick={() => onSelectCapTable(capTable)}
                    className="flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate">{capTable.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(capTable);
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
                          openDeleteDialog(capTable);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                []
              )
            ) : (
              <DropdownMenuItem disabled>No cap tables found</DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => setShowCreateDialog(true)}
              className="text-primary hover:text-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Cap Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create Cap Table Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle>Create New Cap Table</DialogTitle>
            <DialogDescription>
              Create a new cap table for your project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newCapTableName}
                onChange={(e) => setNewCapTableName(e.target.value)}
                placeholder="Enter cap table name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={newCapTableDescription}
                onChange={(e) => setNewCapTableDescription(e.target.value)}
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
            <Button onClick={handleCreateCapTable}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Cap Table Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle>Edit Cap Table</DialogTitle>
            <DialogDescription>
              Update the details of your cap table.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editingCapTable?.name || ""}
                onChange={(e) =>
                  setEditingCapTable(
                    editingCapTable
                      ? {
                          ...editingCapTable,
                          name: e.target.value,
                        }
                      : null,
                  )
                }
                placeholder="Enter cap table name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input
                id="edit-description"
                value={editingCapTable?.description || ""}
                onChange={(e) =>
                  setEditingCapTable(
                    editingCapTable
                      ? {
                          ...editingCapTable,
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
            <Button onClick={handleEditCapTable}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Cap Table Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle>Delete Cap Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this cap table? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">{deletingCapTable?.name}</p>
            {deletingCapTable?.description && (
              <p className="text-sm text-gray-500 mt-1">
                {deletingCapTable.description}
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
            <Button variant="destructive" onClick={handleDeleteCapTable}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CapTableSelector;
