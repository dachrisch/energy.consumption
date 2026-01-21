"use client";

import { useState, useEffect } from "react";
import { Loader2, Trash2, Zap, Flame, TableIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { getMeters } from "@/actions/meter";
import { getReadings, deleteReadingAction } from "@/actions/reading";
import { Meter, Reading } from "@/app/types";
import { format } from "date-fns";
import Toast from "@/app/components/Toast";
import { ToastMessage } from "@/app/types";

export default function ReadingsPage() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState<string>("");
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

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

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this reading?")) return;
    
    setActionLoading(id);
    try {
      const result = await deleteReadingAction(id);
      if (result.success) {
        setReadings(readings.filter(r => r._id !== id));
        setToast({ message: "Reading deleted successfully", type: "success" });
      } else {
        setToast({ message: result.error || "Failed to delete reading", type: "error" });
      }
    } catch (err) {
      console.error("Failed to delete reading", err);
      setToast({ message: "An error occurred", type: "error" });
    } finally {
      setActionLoading(null);
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
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Readings</h1>
        <p className="text-muted-foreground">
          View and manage your historical meter readings.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/50 p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Meter:</span>
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
            Number: <span className="font-mono">{selectedMeter.meterNumber}</span> • Unit: <span className="font-medium">{selectedMeter.unit}</span>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
          <TableIcon className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Reading History</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reading Value</TableHead>
              <TableHead>Consumption</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {readings.length > 0 ? (
              readings.map((reading, index) => {
                // Calculate consumption since previous reading (next in list due to sort)
                const prevReading = readings[index + 1];
                const consumption = prevReading ? reading.value - prevReading.value : null;

                return (
                  <TableRow key={reading._id}>
                    <TableCell className="font-medium">
                      {format(new Date(reading.date), "PPP")}
                    </TableCell>
                    <TableCell>
                      {reading.value.toLocaleString()} {selectedMeter?.unit}
                    </TableCell>
                    <TableCell>
                      {consumption !== null ? (
                        <span className="text-primary font-medium">
                          +{consumption.toLocaleString()} {selectedMeter?.unit}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Initial reading</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(reading._id)}
                        disabled={actionLoading === reading._id}
                      >
                        {actionLoading === reading._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No readings found for this meter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}