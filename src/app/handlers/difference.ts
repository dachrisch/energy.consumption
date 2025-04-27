import { timeEvent, Event } from "@/lib/pond/event";
import { time, Time } from "@/lib/pond/time";
import { TimeSeries } from "@/lib/pond/timeseries";
import Immutable from "immutable";

const toDifferenceEvent = (event: Event, difference: number | null) =>
  timeEvent(time(event.timestamp()), Immutable.Map({ difference }));

export const differences = (series: TimeSeries<Time>): TimeSeries<Time> => {
  return series.map((event, index) => {
    if (event == undefined || index == undefined) {
      return timeEvent(time(0), Immutable.Map({ difference:null }));
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
