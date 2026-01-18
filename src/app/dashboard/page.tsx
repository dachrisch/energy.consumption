"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Zap, Flame } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { getMeters } from "@/actions/meter";
import { getReadings } from "@/actions/reading";
import { Meter, Reading } from "@/app/types";
import SimplifiedProjectionCard from "../components/energy/SimplifiedProjectionCard";
import SimplifiedConsumptionChart from "../components/energy/SimplifiedConsumptionChart";

export default function DashboardPage() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState<string>("");
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeters();
  }, []);

  useEffect(() => {
    if (selectedMeterId) {
      loadReadings(selectedMeterId);
    }
  }, [selectedMeterId]);

  async function loadMeters() {
    setLoading(true);
    try {
      const data = await getMeters();
      setMeters(data);
      if (data.length > 0) {
        setSelectedMeterId(data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load meters", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadReadings(meterId: string) {
    try {
      const data = await getReadings(meterId);
      setReadings(data);
    } catch (err) {
      console.error("Failed to load readings", err);
    }
  }

  const selectedMeter = meters.find(m => m._id === selectedMeterId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your energy consumption and projections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/add">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Reading
            </Button>
          </Link>
        </div>
      </div>

      {meters.length > 0 ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/50 p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Active Meter:</span>
              <Select
                value={selectedMeterId}
                onValueChange={setSelectedMeterId}
              >
                <SelectTrigger className="w-[200px] bg-background">
                  <SelectValue placeholder="Select a meter" />
                </SelectTrigger>
                <SelectContent>
                  {meters.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      <div className="flex items-center gap-2">
                        {m.type === "power" ? <Zap className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
                        {m.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedMeter && (
              <div className="text-xs text-muted-foreground">
                Number: <span className="font-mono">{selectedMeter.meterNumber}</span> • Type: <span className="capitalize">{selectedMeter.type}</span>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {selectedMeter && <SimplifiedProjectionCard meter={selectedMeter} />}
            {selectedMeter && <SimplifiedConsumptionChart readings={readings} meter={selectedMeter} />}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl bg-muted/10 text-center">
          <div className="bg-background p-4 rounded-full mb-4 shadow-md border">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">No meters found</h2>
          <p className="text-muted-foreground max-w-sm mt-2 mb-6">
            Get started by adding your first meter reading. We&apos;ll set up the meter automatically.
          </p>
          <Link href="/add">
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Start Tracking
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}