import { Investor } from "./investor";

export interface CapTable {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  investors?: Investor[];
  projectId?: string;
}
