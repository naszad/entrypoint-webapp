"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { VisibilityState, Updater } from "@tanstack/react-table";

export function useColumnVisibility(defaultVisibility: VisibilityState = {}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const columnsParam = searchParams.get("columns");

  const [visibility, setVisibility] = useState<VisibilityState>(() => {
    if (!columnsParam || columnsParam.trim() === "") {
      return defaultVisibility;
    }

    const visibleKeys = columnsParam.split(",").map((k) => k.trim());
    const allKeys = Object.keys(defaultVisibility);
    const merged: VisibilityState = {};

    for (const key of allKeys) {
      merged[key] = visibleKeys.includes(key);
    }

    return merged;
  });

  const updateVisibility = (updaterOrValue: Updater<VisibilityState>) => {
    const newVisibility =
      typeof updaterOrValue === "function"
        ? updaterOrValue(visibility)
        : updaterOrValue;

    setVisibility(newVisibility);

    const visibleColumns = Object.entries(newVisibility)
      .filter(([, isVisible]) => isVisible)
      .map(([key]) => key)
      .join(",");

    // Create a new URLSearchParams object with all existing params
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    // Update or remove the columns parameter
    if (visibleColumns) {
      newSearchParams.set("columns", visibleColumns);
    } else {
      newSearchParams.delete("columns");
    }

    // Construct the new URL with all parameters
    const query = newSearchParams.toString();
    const newUrl = query ? `${pathname}?${query}` : pathname;
    
    router.replace(newUrl);
  };

  return {
    columnVisibility: visibility,
    setColumnVisibility: updateVisibility,
  };
}
