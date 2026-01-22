"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Calculator, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { getSimplifiedProjections } from "@/actions/reading";
import { Meter, SimplifiedProjectionResult } from "@/app/types";
import SimplifiedContractForm from "../contracts/SimplifiedContractForm";

interface SimplifiedProjectionCardProps {
  meter: Meter;
}

export default function SimplifiedProjectionCard({ meter }: SimplifiedProjectionCardProps) {
  const [projections, setProjections] = useState<SimplifiedProjectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);

  const loadProjections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSimplifiedProjections(meter._id);
      setProjections(data);
    } catch (err) {
      console.error("Failed to load projections", err);
    } finally {
      setLoading(false);
    }
  }, [meter._id]);

  useEffect(() => {
    loadProjections();
  }, [loadProjections]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!projections) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Projections</CardTitle>
          <CardDescription>Not enough data yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <Info className="h-4 w-4" />
            <p>Add at least 2 readings to see consumption projections.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Yearly Projection
          </CardTitle>
          <div className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full uppercase">
            {meter.type}
          </div>
        </div>
        <CardDescription>Based on {projections.daysTracked} days of data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Consumption</p>
            <p className="text-2xl font-bold tracking-tight">
              {Math.round(projections.estimatedYearlyConsumption).toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">{meter.unit}</span>
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Daily Average</p>
            <p className="text-lg font-semibold">
              {projections.dailyAverage.toFixed(2)}
              <span className="text-xs font-normal text-muted-foreground ml-1">{meter.unit}/day</span>
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          {projections.hasContract ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Estimated Yearly Cost</p>
              <p className="text-3xl font-extrabold text-primary tracking-tight">
                € {projections.estimatedYearlyCost.toFixed(2)}
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-lg space-y-3">
              <div className="flex gap-2 text-amber-800 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">No contract data</p>
                  <p className="text-xs opacity-90">Enter your pricing to see cost projections.</p>
                </div>
              </div>
              <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full bg-transparent border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40">
                    Add Contract Details
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Contract Details: {meter.name}</DialogTitle>
                    <DialogDescription>
                      Enter your energy pricing to calculate projected costs.
                    </DialogDescription>
                  </DialogHeader>
                  <SimplifiedContractForm 
                    meter={meter} 
                    onSuccess={() => {
                      setIsContractDialogOpen(false);
                      loadProjections();
                    }}
                    onCancel={() => setIsContractDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
