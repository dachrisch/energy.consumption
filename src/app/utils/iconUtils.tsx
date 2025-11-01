import { EnergyOptions } from "@/app/types";
import { PowerIcon, GasIcon } from "@/app/components/icons";

/**
 * Get the appropriate icon component for an energy type
 * @param type - The energy type (power or gas)
 * @returns Icon component for the specified type
 */
export const getTypeIcon = (type: EnergyOptions): React.ReactNode => {
  return type === "power" ? <PowerIcon /> : <GasIcon />;
};
