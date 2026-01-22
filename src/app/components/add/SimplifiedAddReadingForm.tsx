"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { getMeters } from "@/actions/meter";
import { addReadingAction } from "@/actions/reading";
import { Meter } from "@/app/types";

export default function SimplifiedAddReadingForm() {
  const router = useRouter();
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState<string>("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [fetchingMeters, setFetchingMeters] = useState(true);
  
  // New Meter Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMeterName, setNewMeterName] = useState("");
  const [newMeterNumber, setNewMeterNumber] = useState("");
  const [newMeterType, setNewMeterType] = useState<"power" | "gas">("power");

  useEffect(() => {
    loadMeters();
  }, []);

  async function loadMeters() {
    setFetchingMeters(true);
    try {
      const data = await getMeters();
      setMeters(data);
      if (data.length > 0) {
        setSelectedMeterId(data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load meters", err);
    } finally {
      setFetchingMeters(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMeterId || !value || !date) return;

    setLoading(true);
    try {
      const result = await addReadingAction({
        meterId: selectedMeterId,
        value: parseFloat(value),
        date: date,
      });

      if (result.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        alert(result.error || "Failed to add reading");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateMeterAndReading(e: React.FormEvent) {
    e.preventDefault();
    if (!newMeterName || !newMeterNumber || !value || !date) return;

    setLoading(true);
    try {
      const result = await addReadingAction({
        value: parseFloat(value),
        date: date,
        newMeter: {
          name: newMeterName,
          meterNumber: newMeterNumber,
          type: newMeterType,
        },
      });

      if (result.success) {
        setIsDialogOpen(false);
        router.push("/dashboard");
        router.refresh();
      } else {
        alert(result.error || "Failed to create meter and reading");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (fetchingMeters) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Add Meter Reading</CardTitle>
        <CardDescription>
          Select a meter and enter the current reading.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {meters.length > 0 ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="meter">Select Meter</Label>
              <Select
                value={selectedMeterId}
                onValueChange={setSelectedMeterId}
              >
                <SelectTrigger id="meter">
                  <SelectValue placeholder="Select a meter" />
                </SelectTrigger>
                <SelectContent>
                  {meters.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.name} ({m.meterNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Reading Value</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 flex flex-col">
              <Label htmlFor="date">Reading Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Reading
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Meter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Meter</DialogTitle>
                  <DialogDescription>
                    Enter details for your new meter. Your first reading will be saved automatically.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input
                      id="name"
                      placeholder="Main Power"
                      className="col-span-3"
                      value={newMeterName}
                      onChange={(e) => setNewMeterName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="number" className="text-right">Number</Label>
                    <Input
                      id="number"
                      placeholder="123456"
                      className="col-span-3"
                      value={newMeterNumber}
                      onChange={(e) => setNewMeterNumber(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Type</Label>
                    <Select value={newMeterType} onValueChange={(v: "power" | "gas") => setNewMeterType(v)}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="power">Power</SelectItem>
                        <SelectItem value="gas">Gas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleCreateMeterAndReading} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create & Save Reading
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <p className="text-muted-foreground">No meters found. Create your first meter to start tracking.</p>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Setup First Meter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleCreateMeterAndReading} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>First Meter Setup</DialogTitle>
                    <DialogDescription>
                      Enter your meter details and your current reading to get started.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">Meter Name (e.g. Main Power)</Label>
                      <Input
                        id="first-name"
                        value={newMeterName}
                        onChange={(e) => setNewMeterName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="first-number">Meter Number</Label>
                      <Input
                        id="first-number"
                        value={newMeterNumber}
                        onChange={(e) => setNewMeterNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="first-type">Energy Type</Label>
                      <Select value={newMeterType} onValueChange={(v: "power" | "gas") => setNewMeterType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="power">Power</SelectItem>
                          <SelectItem value="gas">Gas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="first-value">Initial Reading Value</Label>
                      <Input
                        id="first-value"
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Start Tracking
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
