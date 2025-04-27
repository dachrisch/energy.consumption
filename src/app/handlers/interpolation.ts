import { TimeSeries } from "@/lib/pond/timeseries";
import { EnergyData, EnergyTimeSeries } from "../types";
import { timeEvent } from "@/lib/pond/event";
import { Time, time } from "@/lib/pond/time";
import * as Immutable from 'immutable';
import { FillMethod } from "@/lib/pond/types";
import { endOfMonth, addDays } from "date-fns";
import { Key } from "@/lib/pond/key";
import { createTimeSeriesByType } from "./timeSeries";

export const interpolateMonthly = (energyData: EnergyData): EnergyTimeSeries =>
  Object.fromEntries(
    Object.entries(createTimeSeriesByType(energyData)).map(([type, series]) => {
      const events = [];
      const timerange = series.timerange();
      let currentDateInSeries = endOfMonth(timerange.begin());
      const endOfSeries = timerange.end();

      while (currentDateInSeries < endOfSeries) {
        events.push(
          timeEvent(time(currentDateInSeries), Immutable.Map({ amount: null }))
        );
        currentDateInSeries = endOfMonth(addDays(currentDateInSeries, 1));
      }

      const endOfMonthSeries = new TimeSeries({
        name: type,
        events: Immutable.List(events),
      });

      const extendedSeries = TimeSeries.timeSeriesListMerge<Time>({
        name: type,
        seriesList: [
          series as unknown as TimeSeries<Key>,
          endOfMonthSeries as unknown as TimeSeries<Key>,
        ],
      });

      const filledSeries = extendedSeries.fill({
        fieldSpec: ["amount"],
        method: FillMethod.Linear,
      });

      return [type, filledSeries];
    })
  ) as EnergyTimeSeries;
