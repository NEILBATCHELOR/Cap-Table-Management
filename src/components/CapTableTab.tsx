import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import InvestorTable from "./InvestorTable";
import CapTableView from "./CapTableView";
import { Investor } from "@/types/investor";
import { TokenType } from "@/types/token";

interface CapTableTabProps {
  investors: Investor[];
  onSelectAll: (selected: boolean) => void;
  onSelectInvestor: (id: string) => void;
  onViewInvestor: (id: string) => void;
  onAction: (id: string, action: string) => void;
  onCapTableAction: (
    investorId: string,
    tokenType: TokenType,
    action: string,
  ) => void;
  onExport: (data: any[]) => void;
}

const CapTableTab = ({
  investors,
  onSelectAll,
  onSelectInvestor,
  onViewInvestor,
  onAction,
  onCapTableAction,
  onExport,
}: CapTableTabProps) => {
  const [activeTab, setActiveTab] = useState("investors");

  const handleSelectRow = (investorId: string, tokenType?: TokenType) => {
    // If tokenType is provided, it's a cap table row selection
    // Otherwise, it's an investor selection
    if (tokenType) {
      // Handle cap table row selection
      // This might need to be implemented differently based on your data structure
    } else {
      onSelectInvestor(investorId);
    }
  };

  return (
    <Tabs
      defaultValue="investors"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="investors">Investors</TabsTrigger>
        <TabsTrigger value="cap-table">Cap Table</TabsTrigger>
      </TabsList>

      <TabsContent value="investors" className="mt-0">
        <InvestorTable
          investors={investors}
          onSelectAll={onSelectAll}
          onSelectInvestor={onSelectInvestor}
          onViewInvestor={onViewInvestor}
          onAction={onAction}
          onExport={onExport}
        />
      </TabsContent>

      <TabsContent value="cap-table" className="mt-0">
        <CapTableView
          investors={investors}
          onSelectAll={onSelectAll}
          onSelectRow={handleSelectRow}
          onAction={onCapTableAction}
          onExport={onExport}
        />
      </TabsContent>
    </Tabs>
  );
};

export default CapTableTab;
