import { addReadingAction } from "../reading";
import Reading from "@/models/Reading";
import Meter from "@/models/Meter";
import mongoose from "mongoose";

describe("addReadingAction (Integration)", () => {
  beforeEach(async () => {
    await Reading.deleteMany({});
    await Meter.deleteMany({});
  });

  it("should create a reading for an existing meter", async () => {
    const meter = new Meter({
      name: "Existing Meter",
      meterNumber: "EM-123",
      type: "power",
      userId: "000000000000000000000001"
    });
    const savedMeter = await meter.save();

    const result = await addReadingAction({
      meterId: savedMeter._id.toString(),
      value: 123.45,
      date: new Date()
    });

    expect(result.success).toBe(true);
    
    const readings = await Reading.find({ meterId: savedMeter._id });
    expect(readings).toHaveLength(1);
    expect(readings[0].value).toBe(123.45);
  });

  it("should create a new meter and reading atomically", async () => {
    const result = await addReadingAction({
      value: 500,
      date: new Date(),
      newMeter: {
        name: "Atomic Meter",
        meterNumber: "AM-777",
        type: "gas"
      }
    });

    expect(result.success).toBe(true);

    const meters = await Meter.find({ meterNumber: "AM-777" });
    expect(meters).toHaveLength(1);
    expect(meters[0].name).toBe("Atomic Meter");
    expect(meters[0].unit).toBe("m³");

    const readings = await Reading.find({ meterId: meters[0]._id });
    expect(readings).toHaveLength(1);
    expect(readings[0].value).toBe(500);
  });
});
