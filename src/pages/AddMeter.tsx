import { Component, createSignal, createResource, createEffect, Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { useToast } from '../context/ToastContext';
import MeterForm from '../components/MeterForm';

const fetchMeter = async (id: string) => {
  const res = await fetch(`/api/meters?id=${id}`);
  const data = await res.json();
  return Array.isArray(data) ? data.find(m => m._id === id) : data;
};

const AddMeter: Component = () => {
  const params = useParams();
  const isEdit = () => !!params.id;
  const toast = useToast();
  
  const [name, setName] = createSignal('');
  const [meterNumber, setMeterNumber] = createSignal('');
  const [type, setType] = createSignal('power');
  const [unit, setUnit] = createSignal('kWh');
  const [meter] = createResource(() => params.id, fetchMeter);
  
  const navigate = useNavigate();

  // Sync resource data to signals
  createEffect(() => {
    if (isEdit() && meter()) {
      const data = meter();
      setName(data.name);
      setMeterNumber(data.meterNumber);
      setType(data.type);
      setUnit(data.unit);
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const url = isEdit() ? `/api/meters/${params.id}` : '/api/meters';
    const method = isEdit() ? 'PATCH' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name(), meterNumber: meterNumber(), type: type(), unit: unit() }),
      });
      if (res.ok) {
        toast.showToast(`Meter ${isEdit() ? 'updated' : 'saved'} successfully`, 'success');
        navigate('/meters');
      } else {
        toast.showToast('Failed to save meter', 'error');
      }
    } catch (err) {
      console.error(err);
      toast.showToast('An error occurred while saving the meter', 'error');
    }
  };

  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-2xl mx-auto flex-1 flex flex-col justify-center">
      <Show when={!isEdit() || !meter.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
        <div class="mb-10">
          <h1 class="text-4xl font-black tracking-tighter">{isEdit() ? 'Edit Meter' : 'Add Meter'}</h1>
          <p class="text-base-content/60 font-bold text-lg">{isEdit() ? 'Update your utility meter details.' : 'Add a new utility meter to track.'}</p>
        </div>

         <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
           <div class="card-body p-8 md:p-12">
             <form onSubmit={handleSubmit} class="space-y-8">
               <MeterForm 
                 name={name()} 
                 setName={setName}
                 meterNumber={meterNumber()} 
                 setMeterNumber={setMeterNumber}
                 type={type()} 
                 setType={setType}
                 unit={unit()} 
                 setUnit={setUnit}
               />

               <div class="card-actions justify-end pt-6">
                 <button type="button" onClick={() => navigate('/meters')} class="btn btn-ghost btn-lg px-10 font-bold rounded-2xl">Cancel</button>
                 <button type="submit" class="btn btn-primary btn-lg px-12 font-black rounded-2xl shadow-xl shadow-primary/20">
                   {isEdit() ? 'Update Meter' : 'Save Meter'}
                 </button>
               </div>
             </form>
           </div>
         </div>
      </Show>
    </div>
  );
};

export default AddMeter;