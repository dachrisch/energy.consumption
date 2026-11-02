import { Component, createSignal, createResource, Show, createEffect, untrack } from 'solid-js';
import { useNavigate, useParams, useSearchParams } from '@solidjs/router';
import { useToast, ToastType } from '../context/ToastContext';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import PageHeader from '../components/PageHeader';

interface Meter { _id: string; name: string; meterNumber: string; type: string; }
interface Supplier { _id: string; name: string; }
interface Contract {
  _id: string;
  providerName: string;
  supplierId?: string | { _id: string; name: string };
  startDate: string;
  endDate?: string;
  basePrice: number;
  workingPrice: number;
  meterId: string | { _id: string };
}

interface ContractPayload {
  supplierId?: string;
  supplierName?: string;
  startDate: Date;
  endDate: Date | null;
  basePrice: number;
  workingPrice: number;
  meterId: string;
}

const fetchContract = async (id: string) => (await fetch(`/api/contracts?id=${id}`)).json().then(d => Array.isArray(d) ? d.find(c => c._id === id) : d);
const fetchMeters = async (): Promise<Meter[]> => (await fetch('/api/meters')).json();
const fetchSuppliers = async (): Promise<Supplier[]> => {
  const data = await (await fetch('/api/suppliers')).json();
  return data.suppliers ?? [];
};

const supplierIdOf = (contract: Contract): string => {
  if (!contract.supplierId) { return ''; }
  return typeof contract.supplierId === 'string' ? contract.supplierId : contract.supplierId._id;
};

const ContractFormFields: Component<{
  supplierId: string; setSupplierId: (v: string) => void;
  newSupplierName: string; setNewSupplierName: (v: string) => void;
  suppliers: Supplier[];
  startDate: string; setStartDate: (v: string) => void;
  endDate: string; setEndDate: (v: string) => void;
  basePrice: string; setBasePrice: (v: string) => void;
  workingPrice: string; setWorkingPrice: (v: string) => void;
  meterId: string; setMeterId: (v: string) => void;
  meters: Meter[];
  type: string;
}> = (props) => {
  const isNewSupplier = () => props.supplierId === '__new__';
  const supplierOptions = () => [
    { value: '', label: 'Select supplier' },
    ...props.suppliers.map(s => ({ value: s._id, label: s.name })),
    { value: '__new__', label: 'New supplier…' },
  ];

  return (
    <>
      <FormSelect
        label="Supplier"
        value={props.supplierId}
        onChange={e => props.setSupplierId(e.currentTarget.value)}
        options={supplierOptions()}
        required
      />
      <Show when={isNewSupplier()}>
        <FormInput
          label="New supplier name"
          placeholder="e.g. E.ON"
          value={props.newSupplierName}
          onInput={e => props.setNewSupplierName(e.currentTarget.value)}
          required
        />
      </Show>
      <div class="grid grid-cols-1 md:grid-cols-1 gap-6">
        <FormSelect label="Meter" value={props.meterId} onChange={e => props.setMeterId(e.currentTarget.value)} options={[{ value: '', label: 'Select meter' }, ...props.meters.map(m => ({ value: m._id, label: `${m.name} (${m.meterNumber})` }))]} required /></div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6"><FormInput label="Start" type="date" value={props.startDate} onInput={e => props.setStartDate(e.currentTarget.value)} required /><FormInput label="End" type="date" value={props.endDate} onInput={e => props.setEndDate(e.currentTarget.value)} /></div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4"><FormInput label="Base (€/mo)" type="number" step="0.01" value={props.basePrice} onInput={e => props.setBasePrice(e.currentTarget.value)} required /><FormInput label={`Work (€/${props.type === 'power' ? 'kWh' : 'm³'})`} type="number" step="0.0001" value={props.workingPrice} onInput={e => props.setWorkingPrice(e.currentTarget.value)} required /></div>
    </>
  );
};

const handleContractSubmit = async (p: { 
  isEdit: boolean; contractId?: string; data: ContractPayload;
  toast: { showToast: (m: string, t?: ToastType) => void; confirm: (m: string, o: { title: string; confirmLabel: string; cancelLabel: string; confirmClass: string; }) => Promise<boolean> }; 
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
  const [supplierId, setSupplierId] = createSignal(''); const [newSupplierName, setNewSupplierName] = createSignal('');
  const [type, setType] = createSignal('power'); const [startDate, setStartDate] = createSignal(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = createSignal(''); const [basePrice, setBasePrice] = createSignal(''); const [workingPrice, setWorkingPrice] = createSignal(''); const [meterId, setMeterId] = createSignal('');
  const [meters] = createResource<Meter[]>(fetchMeters);
  const [suppliers] = createResource<Supplier[]>(fetchSuppliers);
  const [contract] = createResource<Contract, string>(() => params.id, fetchContract);
  createEffect(() => { const c = contract(); if (isEdit() && c) { untrack(() => { const supplierIdValue = supplierIdOf(c); setSupplierId(supplierIdValue || '__new__'); if (!supplierIdValue) { setNewSupplierName(c.providerName); } setStartDate(new Date(c.startDate).toISOString().split('T')[0]); if (c.endDate) { setEndDate(new Date(c.endDate).toISOString().split('T')[0]); } setBasePrice(c.basePrice.toString()); setWorkingPrice(c.workingPrice.toString()); const mId = typeof c.meterId === 'string' ? c.meterId : (c.meterId as { _id: string })?._id; if (mId) { setMeterId(mId); } }); } });
  createEffect(() => { if (isEdit()) { return; } const list = meters(); if (list && search.meterId) { setMeterId(search.meterId as string); } if (search.startDate) { setStartDate(search.startDate as string); } if (search.endDate) { setEndDate(search.endDate as string); } if (search.supplierId) { setSupplierId(search.supplierId as string); } });
  createEffect(async () => { if (isEdit() || !meterId() || search.startDate) { return; } try { const list = await (await fetch(`/api/contracts?meterId=${meterId()}`)).json(); if (list?.[0]?.endDate) { setStartDate(new Date(new Date(list[0].endDate).getTime() + 86400000).toISOString().split('T')[0]); } } catch (_e) { /* ignore */ } });
  createEffect(() => { const m = meters()?.find(met => met._id === meterId()); if (m) { setType(m.type); } });
  const onSubmit = (e: Event) => {
    e.preventDefault();
    const supplier = supplierId() === '__new__'
      ? { supplierName: newSupplierName().trim() }
      : { supplierId: supplierId() };
    handleContractSubmit({
      isEdit: isEdit(),
      contractId: params.id,
      data: { ...supplier, startDate: new Date(startDate()), endDate: endDate() ? new Date(endDate()) : null, basePrice: Number(basePrice()), workingPrice: Number(workingPrice()), meterId: meterId() },
      toast,
      navigate,
    });
  };
  return (<div class="p-6 md:p-10 lg:p-12 max-w-2xl mx-auto flex-1 flex flex-col justify-center"><Show when={!isEdit() || !contract.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
    <PageHeader
      eyebrow="Contracts"
      title={`${isEdit() ? 'Edit' : 'Add'} contract`}
      subtitle="Supplier, validity period and pricing for one meter."
    />
    <div class="card bg-base-100 shadow-sm border border-base-content/5 overflow-hidden"><div class="card-body p-8 md:p-12"><form onSubmit={onSubmit} class="space-y-8">
      <ContractFormFields
        supplierId={supplierId()} setSupplierId={setSupplierId}
        newSupplierName={newSupplierName()} setNewSupplierName={setNewSupplierName}
        suppliers={suppliers() || []}
        startDate={startDate()} setStartDate={setStartDate} endDate={endDate()} setEndDate={setEndDate}
        basePrice={basePrice()} setBasePrice={setBasePrice} workingPrice={workingPrice()} setWorkingPrice={setWorkingPrice}
        meterId={meterId()} setMeterId={setMeterId} meters={meters() || []} type={type()}
      />
      <div class="card-actions justify-end pt-6"><button type="button" onClick={() => navigate('/contracts')} class="btn btn-ghost btn-lg px-10 font-bold rounded-xl">Cancel</button><button type="submit" class="btn btn-primary btn-lg px-12 font-black rounded-xl shadow-sm shadow-primary/20">{isEdit() ? 'Update' : 'Save'}</button></div>
    </form></div></div></Show></div>);
};

export default AddContract;
