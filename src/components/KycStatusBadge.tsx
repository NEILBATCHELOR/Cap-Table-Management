import React from "react";

interface KycStatusBadgeProps {
  status: string;
  expiryDate?: Date;
}

const KycStatusBadge = ({ status, expiryDate }: KycStatusBadgeProps) => {
  // Check if verification is about to expire (within 30 days)
  const isNearExpiry =
    expiryDate &&
    status === "Verified" &&
    expiryDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

  // Determine styles based on status
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";
  let borderColor = "border-gray-200";

  if (status === "Verified" || status === "Approved") {
    if (isNearExpiry) {
      bgColor = "bg-orange-100";
      textColor = "text-orange-800";
      borderColor = "border-orange-200";
    } else {
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      borderColor = "border-green-200";
    }
  } else if (status === "Pending") {
    bgColor = "bg-yellow-100";
    textColor = "text-yellow-800";
    borderColor = "border-yellow-200";
  } else if (status === "Expired" || status === "Failed") {
    bgColor = "bg-red-100";
    textColor = "text-red-800";
    borderColor = "border-red-200";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${bgColor} ${textColor} ${borderColor}`}
    >
      {status}
      {isNearExpiry && " (Expiring Soon)"}
    </span>
  );
};

export default KycStatusBadge;
