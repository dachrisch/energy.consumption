import { EnergyOptions } from "@/app/types";
import { PowerIcon, GasIcon } from "@/app/components/icons";

/**
 * Get the appropriate icon component for an energy type
 * @param type - The energy type (power or gas)
 * @param className - Optional CSS class name for the icon
 * @returns Icon component for the specified type
 */
export const getTypeIcon = (type: EnergyOptions, className?: string): React.ReactNode => {
  return type === "power" ? <PowerIcon className={className} /> : <GasIcon className={className} />;
};
