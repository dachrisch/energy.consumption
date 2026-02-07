import { Component, createSignal, createResource, Show, createEffect, batch, untrack } from 'solid-js';

import { useNavigate, useParams, useSearchParams } from '@solidjs/router';
import { useToast } from '../context/ToastContext';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';

interface Meter {
  _id: string;
  name: string;
  meterNumber: string;
  type: string;
}

interface Contract {
  _id: string;
  providerName: string;
  type: string;
  startDate: string;
  endDate?: string;
  basePrice: number;
  workingPrice: number;
  meterId: string | { _id: string };
}

const fetchContract = async (id: string) => {
  const res = await fetch(`/api/contracts?id=${id}`);
  const data = await res.json();
  return Array.isArray(data) ? data.find((c: Contract) => c._id === id) : data;
};



const fetchMeters = async () => {
  const res = await fetch('/api/meters');
  return res.json();
};

const AddContract: Component = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = () => !!params.id;
  const toast = useToast();

  const [providerName, setProviderName] = createSignal('');
  const [type, setType] = createSignal('power');
  const [startDate, setStartDate] = createSignal(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = createSignal('');
  const [basePrice, setBasePrice] = createSignal('');
  const [workingPrice, setWorkingPrice] = createSignal('');
  const [meterId, setMeterId] = createSignal('');
  
  const [meters] = createResource<Meter[]>(fetchMeters);
  const [contract] = createResource<Contract, string>(() => params.id, fetchContract);
  
  const navigate = useNavigate();

  // Sync data when editing
  let lastSyncedId: string | null = null;
  createEffect(() => {
    const c = contract();
    if (isEdit() && c && c._id !== lastSyncedId) {
      lastSyncedId = c._id;
      untrack(() => _syncData(c));
    }
  });




  // Handle pre-fill from search params
  createEffect(() => {
    if (isEdit()) { return; }
    const mId = searchParams.meterId;
    const list = meters();
    if (typeof mId === 'string' && list) { 
      setMeterId(mId); 
    }
    if (typeof searchParams.startDate === 'string') { 
        setStartDate(searchParams.startDate); 
    }
    if (typeof searchParams.endDate === 'string') { 
        setEndDate(searchParams.endDate); 
    }
  });

  // Smart default for startDate based on last contract
  createEffect(async () => {
    const mId = meterId();
    if (isEdit() || !mId || searchParams.startDate) { return; }

    try {
      const res = await fetch(`/api/contracts?meterId=${mId}`);
      const list = await res.json();
      if (!list?.length) { return; }

      const last = list[0];
      if (last.endDate) {
        const nextDay = new Date(last.endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setStartDate(nextDay.toISOString().split('T')[0]);
      }
    } catch (e) {
      console.error('Failed to fetch previous contracts for pre-fill', e);
    }
  });

  // Sync type with selected meter
  createEffect(() => {
    const mId = meterId();
    const list = meters();
    if (mId && list) {
      const meter = list.find((m: Meter) => m._id === mId);
      if (meter) {
        setType(meter.type);
      }
    }
  });

  const _syncData = (data: Contract) => {
    if (data) {
      batch(() => {
        setProviderName(data.providerName);
        setType(data.type);
        setStartDate(new Date(data.startDate).toISOString().split('T')[0]);
        if (data.endDate) {setEndDate(new Date(data.endDate).toISOString().split('T')[0]);}
        setBasePrice(data.basePrice.toString());
        setWorkingPrice(data.workingPrice.toString());
        const mId = typeof data.meterId === 'string' ? data.meterId : (data.meterId as { _id: string })?._id;
        if (mId) { setMeterId(mId); }
      });
    }
  };


  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const url = isEdit() ? `/api/contracts/${params.id}` : '/api/contracts';
    const method = isEdit() ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName: providerName(),
          type: type(),
          startDate: new Date(startDate()),
          endDate: endDate() ? new Date(endDate()) : null,
          basePrice: Number(basePrice()),
          workingPrice: Number(workingPrice()),
          meterId: meterId()
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.showToast(`Contract ${isEdit() ? 'updated' : 'saved'} successfully`, 'success');
        navigate('/contracts');
      } else {
        if (data.error?.includes('Overlap')) {
            await toast.confirm(data.error, { 
                title: 'Contract Overlap Detected',
                confirmLabel: 'I will fix it',
                cancelLabel: 'Close',
                confirmClass: 'btn-primary'
            });
        } else {
            toast.showToast(data.error || 'Failed to save contract', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      toast.showToast('An error occurred while saving the contract', 'error');
    }
  };

  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-2xl mx-auto flex-1 flex flex-col justify-center">
      <Show when={!isEdit() || !contract.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
        <div class="mb-10">
          <h1 class="text-4xl font-black tracking-tighter">{isEdit() ? 'Edit Contract' : 'Add Contract'}</h1>
          <p class="text-base-content/60 font-bold text-lg">{isEdit() ? 'Update your utility pricing details.' : 'Enter your utility pricing details.'}</p>
        </div>

        <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
          <div class="card-body p-8 md:p-12">
            <form onSubmit={handleSubmit} class="space-y-8">
              <FormInput 
                label="Provider Name"
                placeholder="e.g. Vattenfall, E.ON"
                value={providerName()}
                onInput={(e) => setProviderName(e.currentTarget.value)}
                required
              />

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormSelect 
                  label="Utility Type"
                  value={type()}
                  onChange={(e) => setType(e.currentTarget.value)}
                  options={[
                    { value: 'power', label: 'Power (Electricity)' },
                    { value: 'gas', label: 'Natural Gas' },
                    { value: 'water', label: 'Water' }
                  ]}
                  required
                />
                <FormSelect 
                  label="Linked Meter"
                  value={meterId()}
                  onChange={(e) => setMeterId(e.currentTarget.value)}
                  options={[
                    { value: '', label: 'Select a meter' },
                    ...(meters()?.map(m => ({
                      value: m._id,
                      label: `${m.name} (${m.meterNumber})`
                    })) || [])
                  ]}
                  required
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput 
                  label="Start Date"
                  type="date"
                  value={startDate()}
                  onInput={(e) => setStartDate(e.currentTarget.value)}
                  required
                />
                <FormInput 
                  label="End Date (Optional)"
                  type="date"
                  value={endDate()}
                  onInput={(e) => setEndDate(e.currentTarget.value)}
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <FormInput 
                  label="Base Price (€/month)"
                  type="number"
                  step="0.01"
                  placeholder="10.00"
                  value={basePrice()}
                  onInput={(e) => setBasePrice(e.currentTarget.value)}
                  required
                />
                <FormInput 
                  label={`Working Price (€/${type() === 'power' ? 'kWh' : 'm³'})`}
                  type="number"
                  step="0.0001"
                  placeholder="0.3000"
                  value={workingPrice()}
                  onInput={(e) => setWorkingPrice(e.currentTarget.value)}
                  required
                />


              </div>

              <div class="card-actions justify-end pt-6">
                <button type="button" onClick={() => navigate('/contracts')} class="btn btn-ghost btn-lg px-10 font-bold rounded-2xl">Cancel</button>
                <button type="submit" class="btn btn-primary btn-lg px-12 font-black rounded-2xl shadow-xl shadow-primary/20">
                  {isEdit() ? 'Update Contract' : 'Save Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default AddContract;