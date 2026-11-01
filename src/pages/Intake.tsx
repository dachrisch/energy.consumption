import { Component, For, Show, createSignal, onMount } from 'solid-js';
import { A } from '@solidjs/router';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import { useToast } from '../context/ToastContext';
import type { IBillComparison, IIntakeItem, IProvider, IProviderDocument } from '../types/models';

interface SyncEntry {
  messageId: string;
  attachment: string;
  status: string;
  intakeItemIds?: string[];
  error?: string;
}

interface SyncResponse {
  provider: string;
  count: number;
  processed: SyncEntry[];
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function sendJson(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

const statusBadge: Record<string, string> = {
  pending: 'badge-warning',
  agrees: 'badge-success',
  conflict: 'badge-error',
  accepted: 'badge-primary',
  rejected: 'badge-ghost',
  parsed: 'badge-success',
  failed: 'badge-error',
  needs_review: 'badge-warning',
  new: 'badge-ghost',
  imported: 'badge-primary',
};

const StatusBadge: Component<{ status: string }> = (props) => (
  <span class={`badge badge-sm font-black uppercase tracking-widest text-[9px] ${statusBadge[props.status] ?? 'badge-ghost'}`}>
    {props.status.replace('_', ' ')}
  </span>
);

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '—');

const formatAmount = (value: number | null | undefined, currency = 'EUR') =>
  value === null || value === undefined ? '—' : `${value.toFixed(2)} ${currency}`;

const ProviderSettings: Component<{
  provider: IProvider;
  syncing: boolean;
  onSave: (provider: IProvider, settings: { senders: string[]; subjectHints: string[]; gmailQuery: string | null }) => void;
  onSync: (provider: IProvider) => void;
}> = (props) => {
  const [open, setOpen] = createSignal(false);
  const [senders, setSenders] = createSignal(props.provider.senders.join(', '));
  const [subjectHints, setSubjectHints] = createSignal(props.provider.subjectHints.join(', '));
  const [gmailQuery, setGmailQuery] = createSignal(props.provider.gmailQuery ?? '');

  const toList = (value: string) => value.split(/[,\n]/).map((entry) => entry.trim()).filter(Boolean);

  return (
    <div class="flex flex-col gap-3 rounded-2xl border border-base-content/5 bg-base-200 p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="font-black tracking-tight">{props.provider.name}</p>
          <p class="font-mono text-[11px] opacity-50">
            {props.provider.senders.join(', ') || 'no sender addresses yet'}
          </p>
          <p class="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">
            {props.provider.contractCount} contract{props.provider.contractCount === 1 ? '' : 's'}
            <Show when={props.provider.unit}><span> · {props.provider.unit}</span></Show>
          </p>
        </div>
        <button
          class="btn btn-ghost btn-xs rounded-lg font-black text-[10px] uppercase tracking-widest"
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name="settings" class="h-3 w-3 mr-1" /> {open() ? 'Close' : 'Mail settings'}
        </button>
      </div>

      <Show when={open()}>
        <div class="space-y-2 rounded-xl bg-base-100 p-3">
          <input
            class="input input-xs input-bordered w-full rounded-lg font-mono text-[11px]"
            placeholder="Sender addresses, comma separated"
            value={senders()}
            onInput={(event) => setSenders(event.currentTarget.value)}
          />
          <input
            class="input input-xs input-bordered w-full rounded-lg font-mono text-[11px]"
            placeholder="Subject hints (optional)"
            value={subjectHints()}
            onInput={(event) => setSubjectHints(event.currentTarget.value)}
          />
          <input
            class="input input-xs input-bordered w-full rounded-lg font-mono text-[11px]"
            placeholder="Raw Gmail query (optional, wins over senders)"
            value={gmailQuery()}
            onInput={(event) => setGmailQuery(event.currentTarget.value)}
          />
          <p class="text-[10px] font-bold opacity-40 uppercase tracking-widest">
            Stored on every contract of this provider.
          </p>
          <button
            class="btn btn-primary btn-xs rounded-lg font-black text-[10px] uppercase tracking-widest"
            onClick={() => props.onSave(props.provider, {
              senders: toList(senders()),
              subjectHints: toList(subjectHints()),
              gmailQuery: gmailQuery().trim() || null,
            })}
          >
            Save
          </button>
        </div>
      </Show>

      <div class="flex gap-2">
        <button
          class="btn btn-primary btn-xs rounded-lg font-black text-[10px] uppercase tracking-widest"
          disabled={props.syncing || props.provider.senders.length === 0}
          onClick={() => props.onSync(props.provider)}
        >
          <Icon name="refresh" class="h-3 w-3 mr-1" /> {props.syncing ? 'Syncing…' : 'Sync now'}
        </button>
        <Show when={props.provider.senders.length === 0}>
          <span class="self-center text-[10px] font-bold uppercase tracking-widest opacity-40">
            add senders first
          </span>
        </Show>
      </div>
    </div>
  );
};

const ItemRow: Component<{ item: IIntakeItem; onAccept: (item: IIntakeItem) => void; onReject: (item: IIntakeItem) => void }> = (props) => {
  const decidable = () => props.item.status === 'pending' || props.item.status === 'conflict';
  return (
    <div class="rounded-2xl border border-base-content/5 bg-base-200 p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="font-black tracking-tight">
            {props.item.kind === 'reading'
              ? `${props.item.value ?? '—'} ${props.item.unit ?? ''}`
              : formatAmount(props.item.amountGross, props.item.currency)}
            <span class="ml-2 text-[11px] font-bold opacity-40 uppercase tracking-widest">{props.item.kind}</span>
          </p>
          <p class="text-[11px] font-bold opacity-50">
            {props.item.kind === 'reading'
              ? formatDate(props.item.date)
              : `${formatDate(props.item.periodStart)} → ${formatDate(props.item.periodEnd)}`}
            <Show when={props.item.meterNumber}>
              <span class="font-mono"> · meter {props.item.meterNumber}</span>
            </Show>
          </p>
          <Show when={props.item.note}>
            <p class="mt-1 text-[11px] font-bold opacity-60">{props.item.note}</p>
          </Show>
        </div>
        <StatusBadge status={props.item.status} />
      </div>
      <Show when={decidable()}>
        <div class="mt-3 flex gap-2">
          <button
            class="btn btn-success btn-xs rounded-lg font-black text-[10px] uppercase tracking-widest"
            onClick={() => props.onAccept(props.item)}
          >
            Accept
          </button>
          <button
            class="btn btn-ghost btn-xs rounded-lg font-black text-[10px] uppercase tracking-widest"
            onClick={() => props.onReject(props.item)}
          >
            Reject
          </button>
          <Show when={!props.item.meterId}>
            <span class="text-[10px] font-bold uppercase tracking-widest text-warning self-center">
              unknown meter — link it first
            </span>
          </Show>
        </div>
      </Show>
    </div>
  );
};

const Intake: Component = () => {
  const toast = useToast();
  const [providers, setProviders] = createSignal<IProvider[]>([]);
  const [items, setItems] = createSignal<IIntakeItem[]>([]);
  const [documents, setDocuments] = createSignal<IProviderDocument[]>([]);
  const [bills, setBills] = createSignal<IBillComparison[]>([]);
  const [showDecided, setShowDecided] = createSignal(false);
  const [syncing, setSyncing] = createSignal<string | null>(null);
  const [lastSync, setLastSync] = createSignal<SyncResponse | null>(null);
  const [loading, setLoading] = createSignal(true);

  const loadProviders = async () => {
    const data = await api<{ providers: IProvider[] }>('/api/providers');
    setProviders(data.providers);
  };

  const loadItems = async () => {
    const filter = showDecided() ? '' : '?status=pending,conflict';
    const data = await api<{ items: IIntakeItem[] }>(`/api/intake/items${filter}`);
    setItems(data.items);
  };

  const loadDocuments = async () => {
    const data = await api<{ documents: IProviderDocument[] }>('/api/intake/documents?limit=15');
    setDocuments(data.documents);
  };

  const loadBills = async () => {
    const data = await api<{ bills: IBillComparison[] }>('/api/intake/bills');
    setBills(data.bills);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadProviders(), loadItems(), loadDocuments(), loadBills()]);
    } catch (error) {
      toast.showToast(error instanceof Error ? error.message : 'Could not load intake data', 'error');
    } finally {
      setLoading(false);
    }
  };

  onMount(() => { void loadAll(); });

  const saveSettings = async (
    provider: IProvider,
    settings: { senders: string[]; subjectHints: string[]; gmailQuery: string | null },
  ) => {
    try {
      const { provider: saved } = await api<{ provider: IProvider }>('/api/providers', sendJson('PATCH', {
        providerName: provider.name,
        ...settings,
      }));
      setProviders((current) => current.map((entry) => (entry.name === saved.name ? saved : entry)));
      toast.showToast(`${saved.name} mail settings saved`, 'success');
    } catch (error) {
      toast.showToast(error instanceof Error ? error.message : 'Could not save provider settings', 'error');
    }
  };

  const handleSync = async (provider: IProvider) => {
    setSyncing(provider.name);
    try {
      const result = await api<SyncResponse>('/api/intake/sync', sendJson('POST', { providerName: provider.name }));
      setLastSync(result);
      const failed = result.processed.filter((entry) => entry.status === 'failed').length;
      toast.showToast(
        `${provider.name}: ${result.count} document${result.count === 1 ? '' : 's'}${failed ? `, ${failed} failed` : ''}`,
        failed ? 'warning' : 'success',
      );
      await Promise.all([loadItems(), loadDocuments(), loadBills()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      toast.showToast(message, message.includes('expired') ? 'warning' : 'error');
      if (message.includes('expired')) {
        await loadProviders();
      }
    } finally {
      setSyncing(null);
    }
  };

  const decide = async (item: IIntakeItem, action: 'accept' | 'reject') => {
    try {
      await api(`/api/intake/items/${item._id}/${action}`, { method: 'POST' });
      toast.showToast(`Item ${action === 'accept' ? 'accepted' : 'rejected'}`, 'success');
      await Promise.all([loadItems(), loadBills()]);
    } catch (error) {
      toast.showToast(error instanceof Error ? error.message : `Could not ${action} item`, 'error');
    }
  };

  return (
    <div class="p-4 md:p-10 max-w-6xl mx-auto w-full">
      <header class="mb-8">
        <h1 class="text-3xl md:text-4xl font-black tracking-tighter">Provider intake</h1>
        <p class="text-sm font-bold opacity-50 mt-1">
          Bills and meter readings pulled from provider mail, staged for your decision. Nothing here overwrites what you entered.
        </p>
      </header>

      <Show when={loading()}>
        <div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary" /></div>
      </Show>

      <Show when={!loading()}>
        <section class="card bg-base-100 shadow-xl border border-base-content/5 mb-8">
          <div class="card-body p-6 md:p-8">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-lg font-black tracking-tight">Providers</h2>
              <span class="text-[10px] font-black uppercase tracking-widest opacity-40">Gmail · Drive</span>
            </div>
            <Show when={providers().length > 0} fallback={
              <div class="mt-2 text-sm font-bold opacity-50">
                <p>
                  Providers come from your contracts — there is no separate provider to create.
                  <A href="/contracts/add" class="link link-primary ml-1">Add a contract</A> and its
                  provider shows up here with its mail settings.
                </p>
              </div>
            }>
              <div class="mt-4 grid gap-3 md:grid-cols-2">
                <For each={providers()}>
                  {(provider) => (
                    <ProviderSettings
                      provider={provider}
                      syncing={syncing() === provider.name}
                      onSave={saveSettings}
                      onSync={handleSync}
                    />
                  )}
                </For>
              </div>
            </Show>

            <Show when={lastSync()}>
              {(result) => (
                <div class="mt-4 rounded-2xl bg-base-200 p-4">
                  <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
                    Last sync · {result().provider} · {result().count} document{result().count === 1 ? '' : 's'}
                  </p>
                  <Show when={result().processed.length > 0} fallback={<p class="text-xs font-bold opacity-50">No new mail matched.</p>}>
                    <ul class="space-y-1">
                      <For each={result().processed}>
                        {(entry) => (
                          <li class="flex items-center gap-2 text-[11px] font-bold">
                            <StatusBadge status={entry.status} />
                            <span class="font-mono opacity-70">{entry.attachment}</span>
                            <Show when={entry.error}><span class="opacity-50">{entry.error}</span></Show>
                          </li>
                        )}
                      </For>
                    </ul>
                  </Show>
                </div>
              )}
            </Show>
          </div>
        </section>

        <section class="card bg-base-100 shadow-xl border border-base-content/5 mb-8">
          <div class="card-body p-6 md:p-8">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-lg font-black tracking-tight">Staged items</h2>
              <label class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60">
                <input
                  type="checkbox"
                  class="toggle toggle-xs"
                  checked={showDecided()}
                  onChange={(event) => { setShowDecided(event.currentTarget.checked); void loadItems(); }}
                />
                show decided
              </label>
            </div>
            <Show when={items().length > 0} fallback={
              <div class="mt-4">
                <EmptyState
                  title="Nothing staged"
                  description="Run a sync on a provider and anything recognised will show up here for review."
                />
              </div>
            }>
              <div class="mt-4 grid gap-3 md:grid-cols-2">
                <For each={items()}>
                  {(item) => (
                    <ItemRow
                      item={item}
                      onAccept={(entry) => decide(entry, 'accept')}
                      onReject={(entry) => decide(entry, 'reject')}
                    />
                  )}
                </For>
              </div>
            </Show>
          </div>
        </section>

        <section class="card bg-base-100 shadow-xl border border-base-content/5 mb-8">
          <div class="card-body p-6 md:p-8">
            <h2 class="text-lg font-black tracking-tight">Bills vs. contract</h2>
            <Show when={bills().length > 0} fallback={
              <p class="mt-2 text-sm font-bold opacity-50">No billed periods yet.</p>
            }>
              <div class="mt-4 overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr class="text-[10px] uppercase tracking-widest opacity-50">
                      <th>Period</th>
                      <th class="text-right">Consumption</th>
                      <th class="text-right">Billed</th>
                      <th class="text-right">Expected</th>
                      <th class="text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={bills()}>
                      {(bill) => (
                        <tr class="font-bold text-xs">
                          <td>{formatDate(bill.periodStart)} → {formatDate(bill.periodEnd)}</td>
                          <td class="text-right">{bill.consumption ?? '—'} {bill.unit ?? ''}</td>
                          <td class="text-right">{formatAmount(bill.amountGross, bill.currency)}</td>
                          <td class="text-right">{formatAmount(bill.expected, bill.currency)}</td>
                          <td class={`text-right ${(bill.variance?.absolute ?? 0) > 0 ? 'text-error' : 'text-success'}`}>
                            <Show when={bill.variance} fallback="—">
                              {(variance) => (
                                <>
                                  {variance().absolute.toFixed(2)}
                                  <Show when={variance().percent !== null}>
                                    <span class="opacity-50"> ({variance().percent?.toFixed(1)}%)</span>
                                  </Show>
                                </>
                              )}
                            </Show>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
          </div>
        </section>

        <section class="card bg-base-100 shadow-xl border border-base-content/5">
          <div class="card-body p-6 md:p-8">
            <h2 class="text-lg font-black tracking-tight">Recent documents</h2>
            <Show when={documents().length > 0} fallback={
              <p class="mt-2 text-sm font-bold opacity-50">Nothing ingested yet.</p>
            }>
              <ul class="mt-4 space-y-2">
                <For each={documents()}>
                  {(document) => (
                    <li class="rounded-2xl bg-base-200 p-4">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <p class="font-mono text-xs font-bold">{document.fileName}</p>
                          <p class="text-[11px] font-bold opacity-50">
                            {formatDate(document.receivedAt)}
                            <Show when={document.providerName}><span> · {document.providerName}</span></Show>
                            <Show when={document.subject}><span> · {document.subject}</span></Show>
                          </p>
                          <Show when={document.error}>
                            <p class="mt-1 text-[11px] font-bold text-error">{document.error}</p>
                          </Show>
                        </div>
                        <div class="flex items-center gap-2">
                          <Show when={document.driveWebLink}>
                            <a
                              href={document.driveWebLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="btn btn-ghost btn-xs rounded-lg font-black text-[10px] uppercase tracking-widest"
                            >
                              <Icon name="external-link" class="h-3 w-3" />
                            </a>
                          </Show>
                          <StatusBadge status={document.status} />
                        </div>
                      </div>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </div>
        </section>
      </Show>
    </div>
  );
};

export default Intake;
