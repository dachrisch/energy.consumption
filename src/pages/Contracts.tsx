import { Component, createResource, createSignal, For, Show } from 'solid-js';
import { A, useNavigate, useSearchParams } from '@solidjs/router';
import { useToast } from '../context/ToastContext';
import { findContractGaps, Gap } from '../lib/gapDetection';
import ContractTemplateCard from '../components/ContractTemplateCard';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import FormInput from '../components/FormInput';

interface Meter {
  _id: string;
  name: string;
  type: 'power' | 'gas';
}

interface SupplierRef {
  _id: string;
  name: string;
  senders?: string[];
  subjectHints?: string[];
  gmailQuery?: string | null;
}

interface Contract {
  _id: string;
  providerName: string;
  supplierId?: string | SupplierRef;
  startDate: string | Date;
  endDate?: string | Date;
  basePrice: number;
  workingPrice: number;
  meterId: Meter;
}

interface SupplierView extends SupplierRef {
  senders: string[];
  subjectHints: string[];
  gmailQuery: string | null;
  contractCount: number;
  stagedCount: number;
  meterIds: string[];
}

interface SupplierOverview {
  suppliers: SupplierView[];
  unassigned: { documents: number; staged: number };
}

interface DashboardData {
  meters: Meter[];
  readings: { meterId: string }[];
  contracts: Contract[];
}

const fetchDashboardData = async () => {
  const res = await fetch('/api/dashboard');
  if (!res.ok) { throw new Error('Failed to fetch dashboard data'); }
  return res.json();
};

const fetchSuppliers = async (): Promise<SupplierOverview> => {
  const res = await fetch('/api/suppliers');
  if (!res.ok) { throw new Error('Failed to fetch suppliers'); }
  return res.json();
};

const supplierOf = (contract: Contract): SupplierRef | undefined =>
  typeof contract.supplierId === 'string' ? undefined : contract.supplierId;

const supplierKey = (contract: Contract): string => {
  const supplier = supplierOf(contract);
  return supplier?._id ?? `legacy:${contract.providerName}`;
};

const supplierName = (contract: Contract): string =>
  supplierOf(contract)?.name ?? contract.providerName;

const ContractHeader: Component<{
  meterId?: string;
  meters: Meter[];
  onMeterChange: (id: string) => void;
  onAddSupplier: () => void;
}> = (props) => (
  <PageHeader
    eyebrow="Contracts"
    title="Suppliers & contracts"
    subtitle="One supplier owns the mail settings and the inbox; contracts carry the pricing and validity."
    actions={
      <>
        <Show when={props.meters.length > 0}>
          <select
            class="select select-bordered select-sm h-10 rounded-xl border border-base-content/10 bg-base-100 font-bold"
            value={props.meterId || ''}
            onChange={(e) => props.onMeterChange(e.currentTarget.value)}
          >
            <option value="">All meters</option>
            <For each={props.meters}>
              {(m: Meter) => <option value={m._id}>{m.name}</option>}
            </For>
          </select>
        </Show>
        <button class="btn btn-ghost btn-sm rounded-xl font-bold" onClick={props.onAddSupplier}>
          <Icon name="add" class="h-4 w-4" /> Supplier
        </button>
        <A href="/contracts/add" class="btn btn-primary btn-sm rounded-xl font-bold">
          <Icon name="add" class="h-4 w-4" /> Add contract
        </A>
      </>
    }
  />
);

const ContractCard: Component<{
  contract: Contract;
  onDelete: (id: string) => void;
}> = (props) => {
  const contractColor = () => props.contract.meterId.type === 'power' ? 'var(--color-meter-power)' : 'var(--color-meter-gas)';
  
  return (
    <div class="card bg-base-100 border border-base-content/5 shadow-sm overflow-hidden hover:border-primary/30 transition-all hover:shadow-md">
      <div class="card-body p-6 md:p-7">
        <div class="flex justify-between items-start mb-5">
          <div class="p-2.5 rounded-xl bg-primary/10 text-primary">
             <Icon name="contract" class="h-5 w-5" />
          </div>
          <div class="text-right">
            <p class="text-[10px] font-bold uppercase tracking-wider opacity-40">Validity period</p>
            <p class="font-bold text-sm">
              {new Date(props.contract.startDate).toLocaleDateString()} – 
              {props.contract.endDate ? new Date(props.contract.endDate).toLocaleDateString() : 'Present'}
            </p>
          </div>
        </div>

        <div class="mb-5 flex flex-col gap-2">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-1">Linked to meter</p>
            <div class="flex items-center gap-2">
                <A 
                  href={`/meters/${props.contract.meterId?._id}`} 
                  class="btn btn-ghost btn-xs rounded-xl font-bold bg-base-200/50 hover:bg-primary/10 hover:text-primary px-3 h-8"
                >
                  {props.contract.meterId?.name || 'Unknown Meter'}
                </A>
                <div 
                  class="p-1.5 rounded-lg"
                  style={{ "background-color": `color-mix(in srgb, ${contractColor()}, transparent 90%)`, "color": contractColor() }}
                >
                  <Icon name={props.contract.meterId.type} class="h-4 w-4" />
                </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-6 border-t border-base-content/5">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-1">Base Price</p>
            <p class="text-xl font-black">€{props.contract.basePrice.toFixed(2)}<span class="text-xs font-bold opacity-40 ml-1">/mo</span></p>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-1">Working Price</p>
            <p class="text-xl font-black">€{props.contract.workingPrice.toFixed(4)}<span class="text-xs font-bold opacity-40 ml-1">/{props.contract.meterId.type === 'power' ? 'kWh' : 'm³'}</span></p>
          </div>
        </div>

        <div class="flex justify-end gap-1 mt-6 pt-4 border-t border-base-content/5">
          <A 
            href={`/contracts/${props.contract._id}/edit`} 
            class="btn btn-ghost btn-xs rounded-xl font-bold opacity-40 hover:opacity-100 hover:bg-base-200" 
            title="Edit Contract"
          >
            <Icon name="edit" class="h-4 w-4" />
            <span class="text-[10px] font-bold uppercase tracking-wider">Edit</span>
          </A>
          <button 
            onClick={() => props.onDelete(props.contract._id)} 
            class="btn btn-ghost btn-xs rounded-xl font-bold opacity-40 hover:opacity-100 hover:bg-error/10 hover:text-error" 
            title="Delete Contract"
          >
            <Icon name="delete" class="h-4 w-4" />
            <span class="text-[10px] font-bold uppercase tracking-wider">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const SupplierGroup: Component<{
  name: string;
  supplierId?: string;
  stagedCount: number;
  senders: string[];
  contracts: Contract[];
  syncing: boolean;
  onSync?: () => void;
  onDeleteContract: (id: string) => void;
}> = (props) => (
  <section class="space-y-4 rounded-3xl border border-base-content/5 bg-base-200/30 p-4 md:p-5">
    <header class="flex flex-wrap items-center gap-3">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon name="contract" class="h-5 w-5" />
      </div>
      <div class="min-w-0 flex-1">
        <h2 class="truncate text-lg font-black tracking-tight">{props.name}</h2>
        <p class="truncate text-[11px] font-bold opacity-50">
          {props.senders.length > 0 ? props.senders.join(', ') : 'No mail senders configured'}
        </p>
      </div>
      <Show when={props.stagedCount > 0}>
        <span class="badge badge-warning badge-sm rounded-full font-bold">
          {props.stagedCount} staged
        </span>
      </Show>
      <Show when={props.supplierId}>
        <Show when={props.onSync}>
          <button
            class="btn btn-ghost btn-sm rounded-xl font-bold"
            disabled={props.syncing || props.senders.length === 0}
            onClick={() => props.onSync?.()}
          >
            <Icon name="refresh" class={`h-3.5 w-3.5 ${props.syncing ? 'animate-spin' : ''}`} />
            {props.syncing ? 'Syncing…' : 'Sync'}
          </button>
        </Show>
        <A href={`/contracts/${props.supplierId}`} class="btn btn-primary btn-sm rounded-xl font-bold">
          Open <Icon name="external-link" class="h-3.5 w-3.5" />
        </A>
      </Show>
    </header>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <For each={props.contracts}>
        {(contract) => <ContractCard contract={contract} onDelete={props.onDeleteContract} />}
      </For>
    </div>
    <Show when={props.contracts.length === 0}>
      <p class="rounded-2xl border border-dashed border-base-content/10 p-4 text-sm font-bold opacity-50">
        No contract for this supplier yet.
      </p>
    </Show>
  </section>
);

const AddSupplierModal: Component<{
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}> = (props) => {
  const toast = useToast();
  const [name, setName] = createSignal('');
  const [senders, setSenders] = createSignal('');
  const [saving, setSaving] = createSignal(false);

  const toList = (value: string) => value.split(/[,\n]/).map((entry) => entry.trim()).filter(Boolean);

  const submit = async (event: Event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name(), senders: toList(senders()) }),
      });
      const body = await res.json();
      if (!res.ok) { throw new Error(body.error ?? 'Could not create the supplier'); }
      toast.showToast(`${body.supplier?.name ?? name()} created`, 'success');
      setName(''); setSenders('');
      props.onCreated();
      props.onClose();
    } catch (error) {
      toast.showToast(error instanceof Error ? error.message : 'Could not create the supplier', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Show when={props.open}>
      <div class="modal modal-open modal-bottom sm:modal-middle" role="dialog" aria-modal="true">
        <form class="modal-box rounded-t-3xl border border-base-content/5 sm:rounded-3xl" onSubmit={submit}>
          <h3 class="text-lg font-black tracking-tight">Add supplier</h3>
          <p class="mt-1 text-xs font-bold opacity-50">
            Mail settings live here once; contracts of this supplier share them.
          </p>
          <div class="mt-5 space-y-4">
            <FormInput label="Name" placeholder="e.g. E.ON" value={name()} onInput={(e) => setName(e.currentTarget.value)} required />
            <FormInput
              label="Sender addresses"
              placeholder="billing@eon.com, service@eon.com"
              value={senders()}
              onInput={(e) => setSenders(e.currentTarget.value)}
            />
          </div>
          <div class="modal-action">
            <button type="button" class="btn btn-ghost rounded-xl font-bold" onClick={props.onClose}>Cancel</button>
            <button type="submit" class="btn btn-primary rounded-xl font-bold" disabled={saving() || !name().trim()}>
              {saving() ? 'Saving…' : 'Save supplier'}
            </button>
          </div>
        </form>
        <div class="modal-backdrop bg-base-content/30" onClick={props.onClose} />
      </div>
    </Show>
  );
};

const calculateGaps = (data: DashboardData | undefined, searchMeterId?: string) => {
  if (!data || !data.meters.length) { return []; }
  
  const filteredMeters = searchMeterId 
    ? data.meters.filter((m: Meter) => m._id === searchMeterId)
    : data.meters;

  return filteredMeters.flatMap((meter: Meter) => {
    const meterReadings = data.readings.filter((r: { meterId: string }) => r.meterId === meter._id);
    const meterContracts = data.contracts.filter((c: Contract) => {
      const cMeterId = typeof c.meterId === 'string' ? c.meterId : (c.meterId as unknown as { _id: string })?._id;
      return cMeterId === meter._id;
    });
    return findContractGaps(
      meterReadings as unknown as Parameters<typeof findContractGaps>[0],
      meterContracts as unknown as Parameters<typeof findContractGaps>[1],
    ).map(gap => ({ gap, meter }));
  });
};

const filterContracts = (data: DashboardData | undefined, searchMeterId?: string): Contract[] => {
  if (!data) { return []; }
  return (data.contracts || []).filter((contract) => {
    if (!searchMeterId) { return true; }
    const cMeterId = typeof contract.meterId === 'string' ? contract.meterId : contract.meterId?._id;
    return cMeterId === searchMeterId;
  });
};

interface SupplierGroupData {
  key: string;
  name: string;
  supplierId?: string;
  senders: string[];
  stagedCount: number;
  contracts: Contract[];
}

const groupContracts = (
  contracts: Contract[],
  suppliers: SupplierView[],
  meterFilter?: string,
): SupplierGroupData[] => {
  const byKey = new Map<string, SupplierGroupData>();
  const supplierById = new Map(suppliers.map((supplier) => [supplier._id, supplier]));

  // Suppliers without contracts still need a home for their mail settings.
  if (!meterFilter) {
    for (const supplier of suppliers) {
      byKey.set(supplier._id, {
        key: supplier._id,
        name: supplier.name,
        supplierId: supplier._id,
        senders: supplier.senders,
        stagedCount: supplier.stagedCount,
        contracts: [],
      });
    }
  }

  for (const contract of contracts) {
    const key = supplierKey(contract);
    const supplier = supplierById.get(key);
    const existing = byKey.get(key) ?? {
      key,
      name: supplier?.name ?? supplierName(contract),
      supplierId: supplier?._id,
      senders: supplier?.senders ?? supplierOf(contract)?.senders ?? [],
      stagedCount: supplier?.stagedCount ?? 0,
      contracts: [],
    };
    existing.contracts.push(contract);
    byKey.set(key, existing);
  }

  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
};

const Contracts: Component = () => {
  const [data, { refetch }] = createResource(fetchDashboardData);
  const [suppliers, { refetch: refetchSuppliers }] = createResource(fetchSuppliers);
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [addSupplierOpen, setAddSupplierOpen] = createSignal(false);
  const [syncing, setSyncing] = createSignal<string | null>(null);
  const meterFilter = () => {
    const value = searchParams.meterId;
    return Array.isArray(value) ? value[0] : value;
  };

  const gaps = () => calculateGaps(data(), meterFilter());
  const contracts = () => filterContracts(data(), meterFilter());
  const groups = () => groupContracts(contracts(), suppliers()?.suppliers ?? [], meterFilter());
  const unassigned = () => suppliers()?.unassigned;

  const handleDeleteContract = async (id: string) => {
    const confirmed = await toast.confirm('Are you sure you want to delete this contract?');
    if (!confirmed) { return; }
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.showToast('Contract deleted successfully', 'success');
        refetch();
        refetchSuppliers();
      } else {
        toast.showToast('Failed to delete contract', 'error');
      }
    } catch (err) {
      console.error(err);
      toast.showToast('An error occurred while deleting the contract', 'error');
    }
  };

  const syncSupplier = async (supplierId: string, name: string) => {
    setSyncing(supplierId);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/sync`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok) { throw new Error(body.error ?? 'Sync failed'); }
      toast.showToast(`${name}: ${body.count} document${body.count === 1 ? '' : 's'}`, 'success');
      refetchSuppliers();
    } catch (error) {
      toast.showToast(error instanceof Error ? error.message : 'Sync failed', 'error');
    } finally {
      setSyncing(null);
    }
  };

  const refreshAll = () => {
    refetch();
    refetchSuppliers();
  };

  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-6xl mx-auto space-y-8">
      <ContractHeader
        meterId={meterFilter()}
        meters={data()?.meters || []}
        onMeterChange={(val) => navigate(val ? `/contracts?meterId=${val}` : '/contracts')}
        onAddSupplier={() => setAddSupplierOpen(true)}
      />

      <Show when={unassigned()?.documents}>
        <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4">
          <Icon name="warning" class="h-5 w-5 text-warning" />
          <p class="min-w-0 flex-1 text-sm font-bold">
            {unassigned()?.documents} document{unassigned()?.documents === 1 ? '' : 's'} could not be matched to a supplier
            <Show when={unassigned()?.staged}><span> · {unassigned()?.staged} staged</span></Show>
          </p>
          <A href="/contracts/unassigned" class="btn btn-ghost btn-sm rounded-xl font-bold">Review</A>
        </div>
      </Show>

      <Show when={!data.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
        <Show when={data()?.meters?.length} fallback={
          <EmptyState
            title="No meters exist"
            description="Create a meter first to add contracts and track utility consumption."
            actionLabel="Add Meter"
            actionLink="/meters/add"
            colorScheme="neutral"
            icon={<Icon name="contract" class="h-12 w-12" />}
          />
        }>
          <div class="space-y-5">
            <For each={groups()} fallback={
              <EmptyState
                title="No contracts defined"
                description="Enter your contract details to enable precise cost projections and historical analysis."
                actionLabel="Register First Contract"
                actionLink="/contracts/add"
                icon={<Icon name="contract" class="h-12 w-12" />}
              />
            }>
              {(group) => (
                <SupplierGroup
                  name={group.name}
                  supplierId={group.supplierId}
                  stagedCount={group.stagedCount}
                  senders={group.senders}
                  contracts={group.contracts}
                  syncing={syncing() === group.supplierId}
                  onSync={group.supplierId ? () => void syncSupplier(group.supplierId as string, group.name) : undefined}
                  onDeleteContract={handleDeleteContract}
                />
              )}
            </For>

            <Show when={gaps().length > 0}>
              <SectionCard title="Coverage gaps" hint="Periods without a contract for a meter.">
                <div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <For each={gaps()}>
                    {(item: { gap: Gap; meter: Meter }) => (
                      <ContractTemplateCard gap={item.gap} meter={item.meter} />
                    )}
                  </For>
                </div>
              </SectionCard>
            </Show>
          </div>
        </Show>
      </Show>

      <AddSupplierModal
        open={addSupplierOpen()}
        onClose={() => setAddSupplierOpen(false)}
        onCreated={refreshAll}
      />
    </div>
  );
};

export default Contracts;
