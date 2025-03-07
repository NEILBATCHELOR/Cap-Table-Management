// src/lib/investorGroupUtils.ts
import { supabase } from "@/lib/supabase";

export async function getOrCreateInvestorGroup(
  projectId: string,
): Promise<string> {
  // Check if an investor group exists for the project
  const { data, error } = await supabase
    .from("investor_groups")
    .select("id")
    .eq("project_id", projectId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116: no rows found
    throw new Error(`Error checking investor group: ${error.message}`);
  }

  if (data) {
    return data.id;
  }

  // Create a new investor group
  const { data: newGroup, error: insertError } = await supabase
    .from("investor_groups")
    .insert({
      name: `Investors for Project ${projectId}`,
      project_id: projectId,
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`Error creating investor group: ${insertError.message}`);
  }

  return newGroup.id;
}

export async function associateInvestorWithGroup(
  investorId: string,
  groupId: string,
): Promise<void> {
  console.log(
    `Associating investor with group - investorId: ${investorId}, groupId: ${groupId}`,
  );

  // First get the investor_id from the investors table
  const { data: investorData, error: fetchError } = await supabase
    .from("investors")
    .select("investor_id")
    .eq("id", investorId)
    .single();

  if (fetchError) {
    console.error("Error fetching investor_id:", fetchError);
    throw new Error(`Error fetching investor_id: ${fetchError.message}`);
  }

  if (!investorData || !investorData.investor_id) {
    console.error("No investor_id found for id:", investorId);
    throw new Error(`No investor_id found for id: ${investorId}`);
  }

  console.log(
    `Found investor_id: ${investorData.investor_id} for id: ${investorId}`,
  );

  // Now insert using the investor_id
  const { error } = await supabase
    .from("investor_groups_investors")
    .insert({ investor_id: investorData.investor_id, group_id: groupId });

  if (error) {
    console.error("Error inserting into investor_groups_investors:", error);
    throw new Error(`Error associating investor with group: ${error.message}`);
  }
}

export async function associateInvestorWithCapTable(
  investorId: string,
  capTableId: string,
): Promise<void> {
  console.log(
    `Associating investor with cap table - investorId: ${investorId}, capTableId: ${capTableId}`,
  );

  // First get the investor_id from the investors table
  const { data: investorData, error: fetchError } = await supabase
    .from("investors")
    .select("investor_id")
    .eq("id", investorId)
    .single();

  if (fetchError) {
    console.error("Error fetching investor_id for cap table:", fetchError);
    throw new Error(
      `Error fetching investor_id for cap table: ${fetchError.message}`,
    );
  }

  if (!investorData || !investorData.investor_id) {
    console.error(
      "No investor_id found for cap table association, id:",
      investorId,
    );
    throw new Error(
      `No investor_id found for cap table association, id: ${investorId}`,
    );
  }

  console.log(
    `Found investor_id: ${investorData.investor_id} for cap table association, id: ${investorId}`,
  );

  // Now insert using the investor_id
  const { error } = await supabase
    .from("cap_table_investors")
    .insert({
      cap_table_id: capTableId,
      investor_id: investorData.investor_id,
    });

  if (error) {
    console.error("Error inserting into cap_table_investors:", error);
    throw new Error(
      `Error associating investor with cap table: ${error.message}`,
    );
  }
}
