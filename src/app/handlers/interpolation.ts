import { TimeSeries } from "@/lib/pond/timeseries";
import { EnergyBase } from "../types";
import { timeEvent } from "@/lib/pond/event";
import { Time, time } from "@/lib/pond/time";
import Immutable from "immutable";
import { FillMethod } from "@/lib/pond/types";
import { endOfMonth, addDays } from "date-fns";

export const interpolateMonthly = (
  energyData: EnergyBase[]
): TimeSeries<Time> => {
  // Create events using timeEvent and Immutable.Map
  const events = energyData.map((d) =>
    timeEvent(time(d.date), Immutable.Map({ amount: d.amount }))
  );

  const timerangeSeries = new TimeSeries({
    name: "energy",
    events: Immutable.List(events),
  }).timerange();

  let currentDateInSeries = endOfMonth(timerangeSeries.begin());
  const endOfSeries = timerangeSeries.end();
  // iterate from begin to end and add empty amount to events
  while (currentDateInSeries < endOfSeries) {
    events.push(
      timeEvent(time(currentDateInSeries), Immutable.Map({ amount: null }))
    );
    currentDateInSeries = endOfMonth(addDays(currentDateInSeries, 1));
  }
  const series = new TimeSeries({
    name: "energy",
    events: Immutable.List(events),
  });

  const filledSeries = series.fill({
    fieldSpec: ["amount"],
    method: FillMethod.Linear,
  });

  return filledSeries;
};
