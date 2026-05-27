import AuditLog from "../models/auditLog.model.js";
import { isEqual } from "lodash-es";

const deepDiff = (oldObj, newObj, basePath = "") => {
  const changes = [];
  // Only iterate over keys that exist in the new object (the update payload)
  for (const key of Object.keys(newObj || {})) {
    const oldVal = oldObj?.[key];
    const newVal = newObj?.[key];
    const fieldPath = basePath ? `${basePath}.${key}` : key;

    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      if (!isEqual(oldVal, newVal)) {
        changes.push({ field: fieldPath, oldValue: oldVal, newValue: newVal });
      }
    } else if (
      typeof oldVal === "object" &&
      oldVal !== null &&
      typeof newVal === "object" &&
      newVal !== null
    ) {
      // Recursively diff nested objects
      changes.push(...deepDiff(oldVal, newVal, fieldPath));
    } else if (!isEqual(oldVal, newVal)) {
      changes.push({ field: fieldPath, oldValue: oldVal, newValue: newVal });
    }
  }
  return changes;
};

export const createAuditLogs = async ({
  oldData,
  newData,
  applicantId,
  updatedBy,
  section,
}) => {
  // No logs on creation (oldData empty)
  if (!oldData || Object.keys(oldData).length === 0) return;

  const changes = deepDiff(oldData, newData);
  if (changes.length === 0) return;

  const logs = changes.map((change) => ({
    applicantId,
    updatedBy: updatedBy || null,
    section,
    field: change.field,
    oldValue: change.oldValue,
    newValue: change.newValue,
    action: "UPDATE",
  }));

  await AuditLog.insertMany(logs);
};
