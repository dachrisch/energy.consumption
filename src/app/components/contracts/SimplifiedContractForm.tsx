"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { addContractAction } from "@/actions/contract";
import { Meter } from "@/app/types";

interface SimplifiedContractFormProps {
  meter: Meter;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SimplifiedContractForm({ meter, onSuccess, onCancel }: SimplifiedContractFormProps) {
  const [basePrice, setBasePrice] = useState("");
  const [workingPrice, setWorkingPrice] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), 0, 1));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!basePrice || !workingPrice || !startDate) return;

    setLoading(true);
    try {
      const result = await addContractAction({
        meterId: meter._id,
        type: meter.type,
        basePrice: parseFloat(basePrice),
        workingPrice: parseFloat(workingPrice),
        startDate: startDate,
      });

      if (result.success) {
        onSuccess();
      } else {
        alert(result.error || "Failed to save contract");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="basePrice">Base Price (Yearly)</Label>
        <Input
          id="basePrice"
          type="number"
          step="0.01"
          placeholder="e.g. 120.00"
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="workingPrice">Working Price (per {meter.unit})</Label>
        <Input
          id="workingPrice"
          type="number"
          step="0.0001"
          placeholder="e.g. 0.35"
          value={workingPrice}
          onChange={(e) => setWorkingPrice(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2 flex flex-col">
        <Label htmlFor="startDate">Contract Start Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(d) => d && setStartDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Contract
        </Button>
      </div>
    </form>
  );
}
