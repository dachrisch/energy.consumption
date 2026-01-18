"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { getMeters } from "@/actions/meter";
import { getReadings, deleteReadingAction } from "@/actions/reading";
import { Meter, Reading } from "@/app/types";

export default function HistoryPage() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState<string>("");
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingReadings, setFetchingReadings] = useState(false);

  useEffect(() => {
    loadMeters();
  }, []);

  useEffect(() => {
    if (selectedMeterId) {
      loadReadings(selectedMeterId);
    } else {
      setReadings([]);
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
    setFetchingReadings(true);
    try {
      const data = await getReadings(meterId);
      setReadings(data);
    } catch (err) {
      console.error("Failed to load readings", err);
    } finally {
      setFetchingReadings(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const result = await deleteReadingAction(id);
      if (result.success) {
        loadReadings(selectedMeterId);
      } else {
        alert(result.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <p className="text-muted-foreground">
            View and manage your meter readings.
          </p>
        </div>

        <div className="w-full md:w-[250px]">
          <Select
            value={selectedMeterId}
            onValueChange={setSelectedMeterId}
          >
            <SelectTrigger>
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetchingReadings ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading readings...
                  </div>
                </TableCell>
              </TableRow>
            ) : readings.length > 0 ? (
              readings.map((reading) => (
                <TableRow key={reading._id}>
                  <TableCell>
                    {format(new Date(reading.date), "PPP")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {reading.value.toLocaleString()} {meters.find(m => m._id === selectedMeterId)?.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Reading
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this meter reading.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(reading._id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  {selectedMeterId ? "No readings found for this meter." : "Please select a meter to view history."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}