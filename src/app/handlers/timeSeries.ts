import { Event, timeEvent } from "@/lib/pond/event";
import { TimeSeries } from "@/lib/pond/timeseries";
import { Time, time } from "@/lib/pond/time";
import { EnergyData, EnergyTimeSeries, EnergyOptions } from "../types";
import * as Immutable from "immutable";

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

const toDifferenceEvent = (event: Event, difference: number | null) =>
  timeEvent(time(event.timestamp()), Immutable.Map({ amount: difference }));

export const differences = (series: TimeSeries<Time>): TimeSeries<Time> => {
  return series.map((event, index) => {
    if (event == undefined || index == undefined) {
      return timeEvent(time(0), Immutable.Map({ amount: null }));
    }
    if (index === 0 && event) {
      return toDifferenceEvent(event, event.get("amount"));
    }
    const prevAmount = series.at(index - 1).get("amount") as number;
    const currentAmount = event.get("amount");
    const difference =
      prevAmount !== null && currentAmount !== null
        ? currentAmount - prevAmount
        : null;
    return toDifferenceEvent(event, difference);
  });
};
