"use client";

import SimplifiedAddReadingForm from "../components/add/SimplifiedAddReadingForm";

export default function AddDataPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Data</h1>
        <p className="text-muted-foreground">
          Record your current meter readings manually.
        </p>
      </div>
      
      <div className="flex justify-center">
        <SimplifiedAddReadingForm />
      </div>
    </div>
  );
}
