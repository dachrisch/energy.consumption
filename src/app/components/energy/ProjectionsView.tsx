"use client";

import { useState, useEffect } from "react";
import { getProjectionsAction } from "@/actions/projections";
import { ProjectionResult } from "@/services/projections/ProjectionService";
import { EnergyOptions } from "@/app/types";
import ProjectionCard from "./ProjectionCard";
import ProjectionChart from "./ProjectionChart";
import { ButtonGroupRadio, ButtonOption } from "../shared/ButtonGroup";
import { PowerIcon, GasIcon } from "../icons";

const typeOptions: ButtonOption<EnergyOptions>[] = [
  { value: "power", label: "Power", icon: <PowerIcon className="w-4 h-4" /> },
  { value: "gas", label: "Gas", icon: <GasIcon className="w-4 h-4" /> },
];

const ProjectionsView = () => {
  const [type, setType] = useState<EnergyOptions>("power");
  const [projection, setProjection] = useState<ProjectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjections = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getProjectionsAction(type);
        setProjection(result);
      } catch (err) {
        console.error("Error fetching projections:", err);
        setError("Could not load projection data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjections();
  }, [type]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Projections & Estimations</h2>
        <ButtonGroupRadio
          options={typeOptions}
          value={type}
          onChange={setType}
          name="projectionType"
          variant="secondary"
        />
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-outline">Loading projections...</div>
      ) : error ? (
        <div className="py-12 text-center text-destructive">{error}</div>
      ) : (
        <>
          <ProjectionCard projection={projection} type={type} />
          {projection && <ProjectionChart projection={projection} type={type} />}
        </>
      )}
      
      <div className="bg-surface-variant/10 p-4 rounded-lg border border-outline-variant/20 text-sm text-outline">
        <p className="font-semibold mb-1">How projections work:</p>
        <p>
          Estimates are based on your total average daily consumption across all historical readings. 
          Cost projections include both your contract's base price (pro-rated) and working price per unit.
        </p>
      </div>
    </div>
  );
};

export default ProjectionsView;
