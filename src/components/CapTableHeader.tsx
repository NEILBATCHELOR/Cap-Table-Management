import React from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import {
  Coins,
  Download,
  Filter,
  MoreVertical,
  Plus,
  RefreshCw,
  Upload,
  SendHorizonal,
  FileSpreadsheet,
  Check,
  X,
  Search,
} from "lucide-react";
import CapTableSelector, { CapTable } from "./CapTableSelector";
import ProjectSelector, { Project } from "./ProjectSelector";

interface CapTableHeaderProps {
  onUploadCSV?: () => void;
  onUploadSubscriptions?: () => void;
  onDownloadTemplate?: () => void;
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  onBulkAction?: (action: string) => void;
  projects?: Project[];
  selectedProject?: Project | null;
  onSelectProject?: (project: Project) => void;
  onCreateProject?: (
    project: Omit<Project, "id" | "createdAt" | "updatedAt">,
  ) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  capTables?: CapTable[];
  selectedCapTable?: CapTable | null;
  onSelectCapTable?: (capTable: CapTable) => void;
  onCreateCapTable?: (
    capTable: Omit<CapTable, "id" | "createdAt" | "updatedAt">,
  ) => void;
  onEditCapTable?: (capTable: CapTable) => void;
  onDeleteCapTable?: (capTableId: string) => void;
}

const CapTableHeader = ({
  onUploadCSV = () => {},
  onUploadSubscriptions = () => {},
  onDownloadTemplate = () => {},
  onSearch = () => {},
  onFilter = () => {},
  onBulkAction = () => {},
  projects = [],
  selectedProject = null,
  onSelectProject = () => {},
  onCreateProject = () => {},
  onEditProject = () => {},
  onDeleteProject = () => {},
  capTables = [],
  selectedCapTable = null,
  onSelectCapTable = () => {},
  onCreateCapTable = () => {},
  onEditCapTable = () => {},
  onDeleteCapTable = () => {},
}: CapTableHeaderProps) => {
  return (
    <div className="w-full bg-background border-b border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Cap Table Management</h1>
          <div className="flex items-center gap-2">
            <ProjectSelector
              projects={projects || []}
              selectedProject={selectedProject}
              onSelectProject={onSelectProject}
              onCreateProject={onCreateProject}
              onEditProject={onEditProject}
              onDeleteProject={onDeleteProject}
            />
            <CapTableSelector
              capTables={capTables || []}
              selectedCapTable={selectedCapTable}
              onSelectCapTable={onSelectCapTable}
              onCreateCapTable={onCreateCapTable}
              onEditCapTable={onEditCapTable}
              onDeleteCapTable={onDeleteCapTable}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onDownloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onUploadCSV}>
                Upload Investors
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onUploadSubscriptions}>
                Upload Subscriptions
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            className="pl-10"
            placeholder="Search investors..."
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => onFilter()}
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 w-[160px]"
              >
                <MoreVertical className="h-4 w-4" />
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => onBulkAction("manage_subscriptions")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Manage Subscriptions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction("screen")}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Screen KYC/AML
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onBulkAction("check_expirations")}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Check KYC Expirations
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onBulkAction("multi_token_allocate")}
              >
                <Coins className="mr-2 h-4 w-4" />
                Multi-Token Allocation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction("distribute")}>
                <SendHorizonal className="mr-2 h-4 w-4" />
                Distribute Tokens
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction("export")}>
                <Download className="mr-2 h-4 w-4" />
                Export Selected
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onBulkAction("generate_cap_table")}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Generate Cap Table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default CapTableHeader;
