import React from "react";
import { CapTableProvider } from "./CapTableContext";
import CapTableHeader from "./CapTableHeader";
import CapTableManager from "./CapTableManager";

const HomePage = () => {
  return (
    <CapTableProvider>
      <div className="w-full min-h-screen bg-background p-4 space-y-4">
        <CapTableHeader
          onUploadCSV={() => {}}
          onUploadSubscriptions={() => {}}
          onDownloadTemplate={() => {}}
          onBulkAction={() => {}}
          onSearch={() => {}}
          onFilter={() => {}}
          projects={[]}
          selectedProject={null}
          onSelectProject={() => {}}
          onCreateProject={() => {}}
          onEditProject={() => {}}
          onDeleteProject={() => {}}
          capTables={[]}
          selectedCapTable={null}
          onSelectCapTable={() => {}}
          onCreateCapTable={() => {}}
          onEditCapTable={() => {}}
          onDeleteCapTable={() => {}}
        />
        <CapTableManager />
      </div>
    </CapTableProvider>
  );
};

export default HomePage;
