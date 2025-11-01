import { useState, useCallback } from "react";
import { SortOrder } from "@/app/types";

/**
 * Generic hook for managing table sorting state
 * Handles sort field and order changes with toggle behavior
 *
 * @template T - The type of object being sorted
 * @param initialField - The default field to sort by
 * @param initialOrder - The default sort order (default: "asc")
 */
export const useTableSort = <T extends string>(
  initialField: T,
  initialOrder: SortOrder = "asc"
) => {
  const [sortField, setSortField] = useState<T>(initialField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialOrder);

  const handleSort = useCallback((field: T) => {
    setSortField((prevField) => {
      if (field === prevField) {
        // Toggle order if clicking same field
        setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
      } else {
        // Reset to ascending for new field
        setSortOrder("asc");
      }
      return field;
    });
  }, []);

  const getSortIcon = useCallback(
    (field: T): string | null => {
      if (field !== sortField) return null;
      return sortOrder === "asc" ? "↑" : "↓";
    },
    [sortField, sortOrder]
  );

  return {
    sortField,
    sortOrder,
    handleSort,
    getSortIcon,
  };
};
