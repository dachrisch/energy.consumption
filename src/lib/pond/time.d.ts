import { Duration } from "./duration";
import { Key } from "./key";
import { TimeRange } from "./timerange";
import { TimeAlignment } from "./types";
/**
 * Constructs a new `Time` object that can be used as a key for `Event`'s.
 *
 * A `Time` object represents a timestamp, and is stored as a Javascript `Date`
 * object. The difference with just a `Date` is that is conforms to the interface
 * required to be an `Event` key.
 */
export declare class Time extends Key {
    static isTime(t: Time): boolean;
    private _d;
    constructor(d?: number | string | Date);
    type(): string;
    toJSON(): {};
    toString(): string;
    /**
     * Returns the native Date object for this `Time`
     */
    toDate(): Date;
    /**
     * The timestamp of this data, in UTC time, as a string.
     */
    toUTCString(): string;
    /**
     * The timestamp of this data, in Local time, as a string.
     */
    toLocalString(): string;
    /**
     * The timestamp of this data
     */
    timestamp(): Date;
    valueOf(): number;
    /**
     * The begin time of this `Event`, which will be just the timestamp
     */
    begin(): Date;
    /**
     * The end time of this `Event`, which will be just the timestamp
     */
    end(): Date;
    /**
     * Takes this Time and returns a TimeRange of given duration
     * which is either centrally located around the Time, or aligned
     * to either the Begin or End time.
     *
     * For example remapping keys, each one of the keys is a Time, but
     * we want to convert the timeseries to use TimeRanges instead:
     * ```
     * const remapped = series.mapKeys(t => t.toTimeRange(duration("5m"), TimeAlignment.Middle));
     * ```
     *
     * The alignment is either:
     *  * TimeAlignment.Begin
     *  * TimeAlignment.Middle
     *  * TimeAlignment.End
     *
     */
    toTimeRange(duration: Duration, align: TimeAlignment): TimeRange;
}
/**
 * Constructs a new `Time` object. A `Time` object represents a timestamp,
 * and is stored as a Javascript `Date` object. The difference with just a Date is that
 * this conforms to the interface required to be an `Event` key.
 */
declare function timeFactory(d?: number | string | Date): Time;
/**
 * Returns the the current time as a `Time` object
 */
declare function now(): Time;
export { now, timeFactory as time };
