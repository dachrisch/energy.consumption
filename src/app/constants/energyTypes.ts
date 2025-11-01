import { EnergyOptions } from "@/app/types";

/**
 * Available energy types in the system
 */
export const ENERGY_TYPES: readonly EnergyOptions[] = ["power", "gas"] as const;

/**
 * Configuration for energy type display and styling
 */
export interface EnergyTypeConfig {
  label: string;
  borderColor: string;
  backgroundColor: string;
}

/**
 * Energy type configuration mapping
 */
export const ENERGY_TYPE_CONFIG: Record<EnergyOptions, EnergyTypeConfig> = {
  power: {
    label: "Power",
    borderColor: "rgb(75, 192, 192)",
    backgroundColor: "rgba(75, 192, 192, 0.5)",
  },
  gas: {
    label: "Gas",
    borderColor: "rgb(255, 99, 132)",
    backgroundColor: "rgba(255, 99, 132, 0.5)",
  },
};

/**
 * Get display label for energy type
 */
export const getEnergyTypeLabel = (type: EnergyOptions): string =>
  ENERGY_TYPE_CONFIG[type].label;

/**
 * Get chart styling configuration for energy type
 */
export const getEnergyTypeChartConfig = (type: EnergyOptions): EnergyTypeConfig =>
  ENERGY_TYPE_CONFIG[type];
