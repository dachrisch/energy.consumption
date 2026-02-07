import { Component, createSignal, createResource, Show, createEffect, untrack } from 'solid-js';
import { useNavigate, useParams, useSearchParams } from '@solidjs/router';
import { useToast } from '../context/ToastContext';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';

interface Meter { _id: string; name: string; meterNumber: string; type: string; }
interface Contract { _id: string; providerName: string; type: string; startDate: string; endDate?: string; basePrice: number; workingPrice: number; meterId: string | { _id: string }; }

const fetchContract = async (id: string) => (await fetch(`/api/contracts?id=${id}`)).json().then(d => Array.isArray(d) ? d.find(c => c._id === id) : d);
const fetchMeters = async () => (await fetch('/api/meters')).json();

const ContractFormFields: Component<{
  providerName: string; setProviderName: (v: string) => void;
  type: string; setType: (v: string) => void;
  startDate: string; setStartDate: (v: string) => void;
  endDate: string; setEndDate: (v: string) => void;
  basePrice: string; setBasePrice: (v: string) => void;
  workingPrice: string; setWorkingPrice: (v: string) => void;
  meterId: string; setMeterId: (v: string) => void;
  meters: Meter[];
}> = (props) => (
  <>
    <FormInput label="Provider" placeholder="e.g. E.ON" value={props.providerName} onInput={e => props.setProviderName(e.currentTarget.value)} required />
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6"><FormSelect label="Type" value={props.type} onChange={e => props.setType(e.currentTarget.value)} options={[{ value: 'power', label: 'Power' }, { value: 'gas', label: 'Gas' }, { value: 'water', label: 'Water' }]} required />
      <FormSelect label="Meter" value={props.meterId} onChange={e => props.setMeterId(e.currentTarget.value)} options={[{ value: '', label: 'Select meter' }, ...props.meters.map(m => ({ value: m._id, label: `${m.name} (${m.meterNumber})` }))]} required /></div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6"><FormInput label="Start" type="date" value={props.startDate} onInput={e => props.setStartDate(e.currentTarget.value)} required /><FormInput label="End" type="date" value={props.endDate} onInput={e => props.setEndDate(e.currentTarget.value)} /></div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4"><FormInput label="Base (€/mo)" type="number" step="0.01" value={props.basePrice} onInput={e => props.setBasePrice(e.currentTarget.value)} required /><FormInput label={`Work (€/${props.type === 'power' ? 'kWh' : 'm³'})`} type="number" step="0.0001" value={props.workingPrice} onInput={e => props.setWorkingPrice(e.currentTarget.value)} required /></div>
  </>
);

const handleContractSubmit = async (p: { 
  isEdit: boolean; contractId?: string; data: { providerName: string; type: string; startDate: Date; endDate: Date | null; basePrice: number; workingPrice: number; meterId: string; }; 
  toast: { showToast: (m: string, t: string) => void; confirm: (m: string, o: { title: string; confirmLabel: string; cancelLabel: string; confirmClass: string; }) => Promise<boolean> }; 
  navigate: (p: string) => void; 
}) => {
  const url = p.isEdit ? `/api/contracts/${p.contractId}` : '/api/contracts';
  try {
    const res = await fetch(url, { method: p.isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p.data) });
    const result = await res.json();
    if (res.ok) { p.toast.showToast('Saved!', 'success'); p.navigate('/contracts'); }
    else if (result.error?.includes('Overlap')) { await p.toast.confirm(result.error, { title: 'Overlap', confirmLabel: 'Fix', cancelLabel: 'Close', confirmClass: 'btn-primary' }); }
    else { p.toast.showToast(result.error || 'Failed', 'error'); }
  } catch (_e) { p.toast.showToast('Error', 'error'); }
};

const AddContract: Component = () => {
  const params = useParams(); const [search] = useSearchParams(); const toast = useToast(); const navigate = useNavigate(); const isEdit = () => !!params.id;
  const [providerName, setProviderName] = createSignal(''); const [type, setType] = createSignal('power'); const [startDate, setStartDate] = createSignal(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = createSignal(''); const [basePrice, setBasePrice] = createSignal(''); const [workingPrice, setWorkingPrice] = createSignal(''); const [meterId, setMeterId] = createSignal('');
  const [meters] = createResource<Meter[]>(fetchMeters); const [contract] = createResource<Contract, string>(() => params.id, fetchContract);
  createEffect(() => { const c = contract(); if (isEdit() && c) { untrack(() => { setProviderName(c.providerName); setType(c.type); setStartDate(new Date(c.startDate).toISOString().split('T')[0]); if (c.endDate) { setEndDate(new Date(c.endDate).toISOString().split('T')[0]); } setBasePrice(c.basePrice.toString()); setWorkingPrice(c.workingPrice.toString()); const mId = typeof c.meterId === 'string' ? c.meterId : (c.meterId as { _id: string })?._id; if (mId) { setMeterId(mId); } }); } });
  createEffect(() => { if (isEdit()) { return; } if (search.meterId) { setMeterId(search.meterId as string); } if (search.startDate) { setStartDate(search.startDate as string); } if (search.endDate) { setEndDate(search.endDate as string); } });
  createEffect(async () => { if (isEdit() || !meterId() || search.startDate) { return; } try { const list = await (await fetch(`/api/contracts?meterId=${meterId()}`)).json(); if (list?.[0]?.endDate) { setStartDate(new Date(new Date(list[0].endDate).getTime() + 86400000).toISOString().split('T')[0]); } } catch (_e) { /* ignore */ } });
  createEffect(() => { const m = meters()?.find(met => met._id === meterId()); if (m) { setType(m.type); } });
  const onSubmit = (e: Event) => { e.preventDefault(); handleContractSubmit({ isEdit: isEdit(), contractId: params.id, data: { providerName: providerName(), type: type(), startDate: new Date(startDate()), endDate: endDate() ? new Date(endDate()) : null, basePrice: Number(basePrice()), workingPrice: Number(workingPrice()), meterId: meterId() }, toast, navigate }); };
  return (<div class="p-6 md:p-10 lg:p-12 max-w-2xl mx-auto flex-1 flex flex-col justify-center"><Show when={!isEdit() || !contract.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
    <h1 class="text-4xl font-black tracking-tighter mb-10">{isEdit() ? 'Edit' : 'Add'} Contract</h1>
    <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden"><div class="card-body p-8 md:p-12"><form onSubmit={onSubmit} class="space-y-8">
      <ContractFormFields providerName={providerName()} setProviderName={setProviderName} type={type()} setType={setType} startDate={startDate()} setStartDate={setStartDate} endDate={endDate()} setEndDate={setEndDate} basePrice={basePrice()} setBasePrice={setBasePrice} workingPrice={workingPrice()} setWorkingPrice={setWorkingPrice} meterId={meterId()} setMeterId={setMeterId} meters={meters() || []} />
      <div class="card-actions justify-end pt-6"><button type="button" onClick={() => navigate('/contracts')} class="btn btn-ghost btn-lg px-10 font-bold rounded-2xl">Cancel</button><button type="submit" class="btn btn-primary btn-lg px-12 font-black rounded-2xl shadow-xl shadow-primary/20">{isEdit() ? 'Update' : 'Save'}</button></div>
    </form></div></div></Show></div>);
};

export default AddContract;
