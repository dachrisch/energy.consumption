import { timeEvent } from "@/lib/pond/event";
import { TimeSeries } from "@/lib/pond/timeseries";
import { time } from "@/lib/pond/time";
import { EnergyData, EnergyTimeSeries, EnergyOptions } from "../types";
import * as Immutable from 'immutable';

export const createTimeSeriesByType = (
    energyData: EnergyData
  ): EnergyTimeSeries => {
    const groupedData = energyData.reduce((acc, d) => {
      if (!acc[d.type]) {
        acc[d.type] = [];
      }
      acc[d.type].push(d);
      return acc;
    }, {} as Record<EnergyOptions, EnergyData>);
  
    const result: EnergyTimeSeries = Object.fromEntries(
      Object.entries(groupedData).map(([type, data]) => {
        const events = data.map((d) =>
          timeEvent(time(d.date), Immutable.Map({ amount: d.amount }))
        );
  
        return [
          type,
          new TimeSeries({
            name: type,
            events: Immutable.List(events),
          }),
        ];
      })
    ) as EnergyTimeSeries;
  
    return result;
  };
  