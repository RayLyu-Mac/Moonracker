import { create } from "zustand";

type DashboardFilters = {
  siteStatus: string;
  country: string;
  sponsor: string;
  riskLevel: string;
  sortBy: "highest_score" | "lowest_score" | "highest_risk" | "most_open_issues" | "recently_activated";
};

type DashboardStore = {
  filters: DashboardFilters;
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  resetFilters: () => void;
};

const initialFilters: DashboardFilters = {
  siteStatus: "",
  country: "",
  sponsor: "",
  riskLevel: "",
  sortBy: "highest_risk",
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  filters: initialFilters,
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: initialFilters }),
}));
