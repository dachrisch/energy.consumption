import { Component, For, Show, createEffect, createSignal, onMount } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { findMeterByNumber } from '../lib/intake/reconcile';
import type { IBillComparison, IMeter, IProviderDocument, IStagedItem, ISupplier } from '../types/models';

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
  linked?: number;
  processed: SyncEntry[];
}

interface SupplierContract {
  _id: string;
  providerName: string;
  startDate: string;
  endDate?: string;
  basePrice: number;
  workingPrice: number;
  meterId?: { _id: string; name: string; type: string } | string;
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

const statusTone: Record<string, string> = {
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
  <span
    class={`badge badge-sm shrink-0 whitespace-nowrap rounded-full font-bold ${statusTone[props.status] ?? 'badge-ghost'}`}
  >
    {props.status.replace('_', ' ')}
  </span>
);

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '—');

const formatAmount = (value: number | null | undefined, currency = 'EUR') =>
  value === null || value === undefined ? '—' : `${value.toFixed(2)} ${currency}`;

/** Drive copy of an ingested document, when it has been archived. */
const driveLink = (document: IProviderDocument): string | undefined =>
  document.driveWebLink
  || (document.driveFileId ? `https://drive.google.com/file/d/${document.driveFileId}/view` : undefined);

/** Only documents we could extract are archived to Drive. */
const ARCHIVABLE_STATUSES = new Set<IProviderDocument['status']>(['parsed', 'needs_review', 'imported']);

const needsArchive = (document: IProviderDocument): boolean =>
  ARCHIVABLE_STATUSES.has(document.status) && !driveLink(document);

/** Meter + reading the staged item belongs to, with the datapoint highlighted. */
const readingLink = (item: IStagedItem): string | undefined => {
  if (item.kind !== 'reading' || !item.meterId) {
    return undefined;
  }
  const target = item.matchedReadingId ?? item.date?.slice(0, 10);
  return `/meters/${item.meterId}/readings${target ? `?highlight=${encodeURIComponent(target)}` : ''}`;
};

const VarianceValue: Component<{ variance: IBillComparison['variance'] }> = (props) => (
  <Show when={props.variance} fallback="—">
    {(variance) => (
      <>
        {variance().absolute.toFixed(2)}
        <Show when={variance().percent !== null}>
          <span class="opacity-50"> ({variance().percent?.toFixed(1)}%)</span>
        </Show>
      </>
    )}
  </Show>
);

const varianceClass = (variance: IBillComparison['variance']) =>
  (variance?.absolute ?? 0) > 0 ? 'text-error' : 'text-success';

const BillMobileRow: Component<{ bill: IBillComparison }> = (props) => (
  <li class="rounded-2xl border border-base-content/5 bg-base-200/50 p-4">
    <p class="text-[11px] font-bold opacity-50">
      {formatDate(props.bill.periodStart)} – {formatDate(props.bill.periodEnd)}
    </p>
    <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
      <div>
        <dt class="text-[10px] font-bold uppercase tracking-wider opacity-40">Consumption</dt>
        <dd class="text-sm font-black">{props.bill.consumption ?? '—'} {props.bill.unit ?? ''}</dd>
      </div>
      <div>
        <dt class="text-[10px] font-bold uppercase tracking-wider opacity-40">Billed</dt>
        <dd class="text-sm font-black">{formatAmount(props.bill.amountGross, props.bill.currency)}</dd>
      </div>
      <div>
        <dt class="text-[10px] font-bold uppercase tracking-wider opacity-40">Expected</dt>
        <dd class="text-sm font-black">{formatAmount(props.bill.expected, props.bill.currency)}</dd>
      </div>
      <div>
        <dt class="text-[10px] font-bold uppercase tracking-wider opacity-40">Variance</dt>
        <dd class={`text-sm font-black ${varianceClass(props.bill.variance)}`}>
          <VarianceValue variance={props.bill.variance} />
        </dd>
      </div>
    </dl>
  </li>
);

const Section = SectionCard;

const MailSettings: Component<{
  supplier: ISupplier;
  saving: boolean;
  onSave: (settings: { senders: string[]; subjectHints: string[]; gmailQuery: string | null }) => void;
}> = (props) => {
  const [senders, setSenders] = createSignal(props.supplier.senders.join(', '));
  const [subjectHints, setSubjectHints] = createSignal(props.supplier.subjectHints.join(', '));
  const [gmailQuery, setGmailQuery] = createSignal(props.supplier.gmailQuery ?? '');

  const toList = (value: string) => value.split(/[,\n]/).map((entry) => entry.trim()).filter(Boolean);

  createEffect(() => {
    setSenders(props.supplier.senders.join(', '));
    setSubjectHints(props.supplier.subjectHints.join(', '));
    setGmailQuery(props.supplier.gmailQuery ?? '');
  });

  return (
    <div class="space-y-2">
      <input
        class="input input-sm input-bordered w-full rounded-xl font-mono text-xs"
        placeholder="Sender addresses, comma separated"
        value={senders()}
        onInput={(event) => setSenders(event.currentTarget.value)}
      />
      <input
        class="input input-sm input-bordered w-full rounded-xl font-mono text-xs"
        placeholder="Subject hints (optional)"
        value={subjectHints()}
        onInput={(event) => setSubjectHints(event.currentTarget.value)}
      />
      <input
        class="input input-sm input-bordered w-full rounded-xl font-mono text-xs"
        placeholder="Raw Gmail query (optional, wins over senders)"
        value={gmailQuery()}
        onInput={(event) => setGmailQuery(event.currentTarget.value)}
      />
      <button
        class="btn btn-primary btn-sm w-full rounded-xl font-bold"
        disabled={props.saving}
        onClick={() => props.onSave({
          senders: toList(senders()),
          subjectHints: toList(subjectHints()),
          gmailQuery: gmailQuery().trim() || null,
        })}
      >
        {props.saving ? 'Saving…' : 'Save mail settings'}
      </button>
    </div>
  );
};

const ItemCard: Component<{
  item: IStagedItem;
  hasMeters: boolean;
  onAccept: (item: IStagedItem) => void;
  onReject: (item: IStagedItem) => void;
  onLinkRequest: (item: IStagedItem) => void;
}> = (props) => {
  const decidable = () => props.item.status === 'pending' || props.item.status === 'conflict';
  return (
    <div class="rounded-2xl border border-base-content/5 bg-base-200/50 p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="flex flex-wrap items-baseline gap-2">
            <span class="text-xl font-black tracking-tight">
              {props.item.kind === 'reading'
                ? `${props.item.value ?? '—'} ${props.item.unit ?? ''}`
                : formatAmount(props.item.amountGross, props.item.currency)}
            </span>
            <span class="text-[10px] font-bold uppercase tracking-wider opacity-40">{props.item.kind}</span>
          </p>
          <p class="mt-0.5 text-[11px] font-bold opacity-50">
            {props.item.kind === 'reading'
              ? formatDate(props.item.date)
              : `${formatDate(props.item.periodStart)} – ${formatDate(props.item.periodEnd)}`}
            <Show when={props.item.meterNumber}>
              <span class="font-mono"> · {props.item.meterNumber}</span>
            </Show>
          </p>
        </div>
        <StatusBadge status={props.item.status} />
      </div>

      <Show when={props.item.note}>
        <p class="mt-2 text-[11px] font-bold opacity-60">{props.item.note}</p>
      </Show>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <Show when={decidable()}>
          <button
            class="btn btn-success btn-sm rounded-xl font-bold"
            onClick={() => props.onAccept(props.item)}
          >
            Accept
          </button>
          <button
            class="btn btn-ghost btn-sm rounded-xl font-bold"
            onClick={() => props.onReject(props.item)}
          >
            Reject
          </button>
          <Show when={!props.item.meterId}>
            <Show
              when={props.hasMeters}
              fallback={
                <A href="/meters/add" class="btn btn-outline btn-warning btn-sm rounded-xl font-bold">
                  Add a meter
                </A>
              }
            >
              <button
                class="btn btn-outline btn-primary btn-sm rounded-xl font-bold"
                onClick={() => props.onLinkRequest(props.item)}
              >
                <Icon name="meter" class="h-3.5 w-3.5" /> Link meter
              </button>
            </Show>
          </Show>
        </Show>
        <Show when={readingLink(props.item)}>
          {(href) => (
            <A href={href()} class="btn btn-ghost btn-sm rounded-xl font-bold text-primary">
              View reading <Icon name="external-link" class="h-3.5 w-3.5" />
            </A>
          )}
        </Show>
      </div>
    </div>
  );
};

const LinkMeterSheet: Component<{
  item: IStagedItem | null;
  meters: IMeter[];
  linking: boolean;
  onClose: () => void;
  onSelect: (meterId: string) => void;
}> = (props) => {
  const suggested = () => {
    const item = props.item;
    return item ? findMeterByNumber(props.meters, item.meterNumber) : undefined;
  };
  const ordered = () => {
    const match = suggested();
    return match ? [match, ...props.meters.filter((meter) => meter._id !== match._id)] : props.meters;
  };

  return (
    <Show when={props.item}>
      <div class="modal modal-open modal-bottom sm:modal-middle" role="dialog" aria-modal="true">
        <div class="modal-box overflow-hidden rounded-t-3xl border border-base-content/5 p-0 sm:rounded-3xl">
          <div class="px-5 pb-2 pt-5">
            <p class="text-[10px] font-black uppercase tracking-[0.18em] opacity-40">Link meter</p>
            <h3 class="mt-1 text-lg font-black tracking-tight">
              {props.item?.kind === 'reading'
                ? `${props.item?.value ?? '—'} ${props.item?.unit ?? ''}`
                : formatAmount(props.item?.amountGross, props.item?.currency)}
              <span class="ml-2 text-sm font-bold opacity-40">{formatDate(props.item?.date ?? props.item?.periodStart)}</span>
            </h3>
            <p class="text-xs font-bold opacity-50">
              Meter number <span class="font-mono">{props.item?.meterNumber ?? '—'}</span>
            </p>
          </div>

          <ul class="max-h-[55vh] space-y-1 overflow-y-auto px-3 pb-3">
            <For each={ordered()}>
              {(meter) => {
                const isMatch = () => meter._id === suggested()?._id;
                return (
                  <li>
                    <button
                      class="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-base-200 disabled:opacity-50"
                      disabled={props.linking}
                      onClick={() => props.onSelect(meter._id)}
                    >
                      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-base-200">
                        <Icon name={meter.type} class="h-4 w-4" />
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate font-bold">{meter.name}</span>
                        <span class="block truncate font-mono text-[11px] opacity-50">
                          {meter.meterNumber} · {meter.unit}
                        </span>
                      </span>
                      <Show when={isMatch()}>
                        <span class="badge badge-success badge-sm rounded-full font-bold">match</span>
                      </Show>
                    </button>
                  </li>
                );
              }}
            </For>
            <Show when={props.meters.length === 0}>
              <li class="px-3 py-8 text-center text-sm font-bold opacity-50">
                No meters yet. <A href="/meters/add" class="link link-primary">Add one</A> first.
              </li>
            </Show>
          </ul>

          <div class="border-t border-base-content/5 p-3">
            <button class="btn btn-ghost w-full rounded-2xl font-bold" onClick={props.onClose}>
              Cancel
            </button>
          </div>
        </div>
        <div class="modal-backdrop bg-base-content/30" onClick={props.onClose} />
      </div>
    </Show>
  );
};

const AssignSupplierSheet: Component<{
  document: IProviderDocument | null;
  suppliers: ISupplier[];
  assigning: boolean;
  onClose: () => void;
  onSelect: (supplierId: string) => void;
}> = (props) => (
  <Show when={props.document}>
    <div class="modal modal-open modal-bottom sm:modal-middle" role="dialog" aria-modal="true">
      <div class="modal-box overflow-hidden rounded-t-3xl border border-base-content/5 p-0 sm:rounded-3xl">
        <div class="px-5 pb-2 pt-5">
          <p class="text-[10px] font-black uppercase tracking-[0.18em] opacity-40">Assign supplier</p>
          <h3 class="mt-1 break-all font-mono text-sm font-black tracking-tight">{props.document?.fileName}</h3>
          <p class="mt-1 text-xs font-bold opacity-50">
            The document and the bills extracted from it move with it.
          </p>
        </div>

        <ul class="max-h-[55vh] space-y-1 overflow-y-auto px-3 pb-3">
          <For each={props.suppliers}>
            {(supplier) => (
              <li>
                <button
                  class="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-base-200 disabled:opacity-50"
                  disabled={props.assigning}
                  onClick={() => props.onSelect(supplier._id)}
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-base-200">
                    <Icon name="contract" class="h-4 w-4" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-bold">{supplier.name}</span>
                    <span class="block truncate text-[11px] opacity-50">
                      {supplier.senders.length > 0 ? supplier.senders.join(', ') : 'No mail senders configured'}
                    </span>
                  </span>
                </button>
              </li>
            )}
          </For>
          <Show when={props.suppliers.length === 0}>
            <li class="px-3 py-8 text-center text-sm font-bold opacity-50">
              No suppliers yet. <A href="/contracts" class="link link-primary">Add one</A> first.
            </li>
          </Show>
        </ul>

        <div class="border-t border-base-content/5 p-3">
          <button class="btn btn-ghost w-full rounded-2xl font-bold" onClick={props.onClose}>
            Cancel
          </button>
        </div>
      </div>
      <div class="modal-backdrop bg-base-content/30" onClick={props.onClose} />
    </div>
  </Show>
);

const GoogleStatus: Component = () => {
  const auth = useAuth();
  const expired = () => auth.user()?.google?.status === 'reconnect_required';
  const connected = () => Boolean(auth.user()?.google) && !expired();

  return (
    <section class="flex flex-wrap items-center gap-3 rounded-2xl border border-base-content/5 bg-base-100 px-4 py-3 shadow-sm">
      <span
        class={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${connected() ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}
      >
        <Icon name="google" class="h-4 w-4" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-bold">
          {connected()
            ? 'Google connected'
            : expired()
              ? 'Google authorization expired'
              : 'Google not connected'}
        </p>
        <p class="truncate text-[11px] font-bold opacity-50">
          {connected()
            ? auth.user()?.google?.email ?? 'Gmail + Drive'
            : 'Connect to pull supplier bills and archive them to Drive.'}
        </p>
      </div>
      <Show when={!auth.user()?.google}>
        <a href="/api/google/connect" rel="external" class="btn btn-primary btn-sm rounded-xl font-bold">
          <Icon name="google" class="h-4 w-4" /> Connect Google
        </a>
      </Show>
      <Show when={expired()}>
        <a href="/api/google/connect" rel="external" class="btn btn-warning btn-sm rounded-xl font-bold">
          <Icon name="refresh" class="h-3.5 w-3.5" /> Reconnect Google
        </a>
      </Show>
      <Show when={connected()}>
        <a href="/api/google/connect" rel="external" class="btn btn-ghost btn-sm rounded-xl font-bold opacity-60">
          <Icon name="refresh" class="h-3.5 w-3.5" /> Reconnect
        </a>
      </Show>
    </section>
  );
};

const SupplierDetail: Component = () => {
  const params = useParams();
  const toast = useToast();
  const auth = useAuth();
  const supplierId = () => params.id;
  const unassigned = () => supplierId() === 'unassigned';
  const scope = () => unassigned() ? 'unassigned=1' : `supplierId=${supplierId()}`;

  const [supplier, setSupplier] = createSignal<ISupplier | null>(null);
  const [contracts, setContracts] = createSignal<SupplierContract[]>([]);
  const [items, setItems] = createSignal<IStagedItem[]>([]);
  const [meters, setMeters] = createSignal<IMeter[]>([]);
  const [documents, setDocuments] = createSignal<IProviderDocument[]>([]);
  const [bills, setBills] = createSignal<IBillComparison[]>([]);
  const [showDecided, setShowDecided] = createSignal(false);
  const [syncing, setSyncing] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [lastSync, setLastSync] = createSignal<SyncResponse | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [archiving, setArchiving] = createSignal<string | null>(null);
  const [retrying, setRetrying] = createSignal<string | null>(null);
  const [linkTarget, setLinkTarget] = createSignal<IStagedItem | null>(null);
  const [linking, setLinking] = createSignal(false);
  const [assignTarget, setAssignTarget] = createSignal<IProviderDocument | null>(null);
  const [assigning, setAssigning] = createSignal(false);
  const [supplierOptions, setSupplierOptions] = createSignal<ISupplier[]>([]);
  const [autoArchiveTried, setAutoArchiveTried] = createSignal(false);

  const loadSupplier = async () => {
    if (unassigned()) { return; }
    const data = await api<{ supplier: ISupplier; contracts: SupplierContract[] }>(`/api/suppliers/${supplierId()}`);
    setSupplier(data.supplier);
    setContracts(data.contracts ?? []);
  };

  const loadItems = async () => {
    const filter = showDecided() ? '' : '&status=pending,conflict';
    const data = await api<{ items: IStagedItem[] }>(`/api/intake/items?${scope()}${filter}`);
    setItems(data.items);
  };

  const loadDocuments = async () => {
    const data = await api<{ documents: IProviderDocument[] }>(`/api/intake/documents?${scope()}&limit=15`);
    setDocuments(data.documents);
  };

  const loadMeters = async () => {
    const data = await api<IMeter[] | { meters: IMeter[] }>('/api/meters');
    setMeters(Array.isArray(data) ? data : data.meters);
  };

  const loadBills = async () => {
    const data = await api<{ bills: IBillComparison[] }>(`/api/intake/bills?${scope()}`);
    setBills(data.bills);
  };

  /** Only the unassigned view can file a document, so only it needs the list. */
  const loadSupplierOptions = async () => {
    if (!unassigned()) { return; }
    const data = await api<{ suppliers: ISupplier[] }>('/api/suppliers');
    setSupplierOptions(data.suppliers ?? []);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadSupplier(), loadItems(), loadDocuments(), loadBills(), loadMeters(), loadSupplierOptions()]);
    } catch (error) {
      toast.showToast(error instanceof Error ? error.message : 'Could not load supplier data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const assignSupplier = async (document: IProviderDocument, targetSupplierId: string) => {
    setAssigning(true);
    try {
      await api(`/api/intake/documents/${document._id}`, sendJson('PATCH', { supplierId: targetSupplierId }));
      const name = supplierOptions().find((option) => option._id === targetSupplierId)?.name ?? 'supplier';
      setAssignTarget(null);
      toast.showToast(`Filed under ${name}`, 'success');
      await Promise.all([loadDocuments(), loadItems(), loadSupplierOptions()]);
    } catch (error) {
      toast.showToast(error instanceof Error ? error.message : 'Could not file the document', 'error');
    } finally {
      setAssigning(false);
    }
  };

  onMount(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('google') === 'connected') {
      toast.showToast('Google connected successfully!', 'success');
      url.searchParams.delete('google');
      window.history.replaceState({}, '', url.toString());
      auth.revalidate();
    }
  });

  onMount(() => { void loadAll(); });

  /**
   * Archive to Drive. Passing no id archives every ingested document of this
   * supplier that has no Drive copy yet; the server skips the ones that do.
   */
  const archiveDocuments = async (documentId?: string, silent = false) => {
    setArchiving(documentId ?? 'all');
    try {
      const result = await api<{
        archived: number;
        failed: number;
        documents?: { fileName?: string; status: string; error?: string }[];
      }>(
        '/api/intake/documents/archive',
        sendJson('POST', {
          ...(documentId ? { documentId } : {}),
          ...(unassigned() ? { unassigned: true } : { supplierId: supplierId() }),
        }),
      );
      if (result.archived > 0) {
        toast.showToast(
          `${result.archived} document${result.archived === 1 ? '' : 's'} archived to Drive`,
          'success',
        );
      }
      if (result.failed > 0 && !silent) {
        const reason = result.documents?.find((entry) => entry.status === 'failed')?.error;
        toast.showToast(
          `${result.failed} document${result.failed === 1 ? '' : 's'} could not be archived${reason ? `: ${reason}` : ''}`,
          'warning',
        );
      }
      await loadDocuments();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not archive to Drive';
      if (!silent) {
        toast.showToast(message, message.includes('expired') || message.includes('connect') ? 'warning' : 'error');
      }
      if (message.includes('expired')) {
        auth.revalidate();
      }
    } finally {
      setArchiving(null);
    }
  };

  /**
   * Re-run the pipeline on a stored document. Sync only sees mail inside its
   * search window, so this is the way to reprocess a document that failed
   * before a fix (mime resolution, extractor) or to retry a flaky run.
   */
  const retryDocument = async (document: IProviderDocument, quiet = false) => {
    setRetrying(document._id);
    try {
      const response = await api<{ document: { status: string; error?: string } }>(
        `/api/intake/documents/${document._id}/retry`,
        { method: 'POST' },
      );
      const updated = response.document;
      if (!quiet) {
        if (updated.status === 'parsed') {
          toast.showToast(`${document.fileName} parsed`, 'success');
        } else {
          toast.showToast(`${document.fileName}: ${updated.error ?? updated.status}`, 'warning');
        }
        await Promise.all([loadItems(), loadDocuments(), loadBills()]);
      }
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not retry the document';
      if (!quiet) {
        toast.showToast(message, message.includes('expired') ? 'warning' : 'error');
      }
      if (message.includes('expired')) {
        auth.revalidate();
      }
      return undefined;
    } finally {
      setRetrying(null);
    }
  };

  const retryFailedDocuments = async () => {
    const failed = documents().filter((document) => document.status === 'failed');
    if (failed.length === 0) {
      return;
    }
    const reasons = new Set<string>();
    let parsed = 0;
    for (const document of failed) {
      const updated = await retryDocument(document, true);
      if (updated?.status === 'parsed') {
        parsed += 1;
      } else if (updated?.error) {
        reasons.add(updated.error);
      }
    }
    await Promise.all([loadItems(), loadDocuments(), loadBills()]);
    if (parsed > 0) {
      toast.showToast(`${parsed} document${parsed === 1 ? '' : 's'} parsed`, 'success');
    }
    if (parsed < failed.length) {
      const reason = [...reasons][0];
      toast.showToast(
        `${failed.length - parsed} still failed${reason ? `: ${reason}` : ''}`,
        'warning',
      );
    }
  };

  // Documents ingested before archiving existed get their Drive copy on first
  // visit; afterwards they carry a link and this stops.
  createEffect(() => {
    if (autoArchiveTried() || loading() || !auth.user() || unassigned()) {
      return;
    }
    if (auth.user()?.google?.status !== 'ok') {
      setAutoArchiveTried(true);
      return;
    }
    if (!documents().some(needsArchive)) {
      setAutoArchiveTried(true);
      return;
    }
    setAutoArchiveTried(true);
    void archiveDocuments(undefined, true);
  });

  const saveSettings = async (settings: { senders: string[]; subjectHints: string[]; gmailQuery: string | null }) => {
    setSaving(true);
    try {
      const { supplier: saved } = await api<{ supplier: ISupplier }>(
        `/api/suppliers/${supplierId()}`,
        sendJson('PATCH', settings),
      );
      setSupplier({ ...(supplier() as ISupplier), ...saved });
      toast.showToast(`${saved.name} mail settings saved`, 'success');
    } catch (error) {
      toast.showToast(error instanceof Error ? error.message : 'Could not save supplier settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await api<SyncResponse>(`/api/suppliers/${supplierId()}/sync`, { method: 'POST' });
      setLastSync(result);
      const failed = result.processed.filter((entry) => entry.status === 'failed').length;
      toast.showToast(
        `${result.provider}: ${result.count} document${result.count === 1 ? '' : 's'}${failed ? `, ${failed} failed` : ''}${result.linked ? `, ${result.linked} linked` : ''}`,
        failed ? 'warning' : 'success',
      );
      await Promise.all([loadItems(), loadDocuments(), loadBills()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      toast.showToast(message, message.includes('expired') ? 'warning' : 'error');
      if (message.includes('expired')) {
        await loadSupplier();
      }
    } finally {
      setSyncing(false);
    }
  };

  const decide = async (item: IStagedItem, action: 'accept' | 'reject') => {
    try {
      await api(`/api/intake/items/${item._id}/${action}`, { method: 'POST' });
      toast.showToast(`Item ${action === 'accept' ? 'accepted' : 'rejected'}`, 'success');
      await Promise.all([loadItems(), loadBills()]);
    } catch (error) {
      toast.showToast(error instanceof Error ? error.message : `Could not ${action} item`, 'error');
    }
  };

  const linkItem = async (item: IStagedItem, meterId: string) => {
    setLinking(true);
    try {
      // Linking can auto-verify the item against that meter's readings.
      const { item: updated } = await api<{ item: IStagedItem }>(
        `/api/intake/items/${item._id}/link`,
        sendJson('POST', { meterId }),
      );
      setLinkTarget(null);
      toast.showToast(
        updated.status === 'pending' ? 'Meter linked' : `Meter linked · ${updated.status}`,
        'success',
      );
      await Promise.all([loadItems(), loadBills()]);
    } catch (error) {
      toast.showToast(error instanceof Error ? error.message : 'Could not link the meter', 'error');
    } finally {
      setLinking(false);
    }
  };

  const title = () => unassigned() ? 'Unassigned documents' : (supplier()?.name ?? 'Supplier');

  return (
    <div class="mx-auto w-full max-w-5xl p-4 md:p-10">
      <PageHeader
        eyebrow={unassigned() ? 'Intake' : 'Supplier'}
        title={title()}
        subtitle={unassigned()
          ? 'Documents whose sender matched no supplier. Assign a supplier to file them.'
          : 'Mail settings, staged readings, bills and documents for this supplier.'}
        actions={
          <Show when={!unassigned()}>
            <A href={`/contracts/add?supplierId=${supplierId()}`} class="btn btn-primary btn-sm rounded-xl font-bold">
              <Icon name="add" class="h-4 w-4" /> Add contract
            </A>
          </Show>
        }
      />

      <Show when={loading()}>
        <div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary" /></div>
      </Show>

      <Show when={!loading()}>
        <div class="space-y-5">
          <Show when={!unassigned()}>
            <GoogleStatus />

            <Section
              title="Mail settings"
              hint="Which emails from this supplier to import. Applies to all its contracts."
              actions={
                <button
                  class="btn btn-primary btn-sm rounded-xl font-bold"
                  disabled={syncing() || (supplier()?.senders.length ?? 0) === 0}
                  onClick={() => void handleSync()}
                >
                  <Icon name="refresh" class={`h-3.5 w-3.5 ${syncing() ? 'animate-spin' : ''}`} />
                  {syncing() ? 'Syncing…' : 'Sync now'}
                </button>
              }
            >
              <div class="mt-4 grid gap-4 md:grid-cols-2">
                <Show when={supplier()}>
                  {(current) => (
                    <MailSettings supplier={current()} saving={saving()} onSave={saveSettings} />
                  )}
                </Show>
                <div class="rounded-2xl bg-base-200/50 p-4">
                  <p class="text-[10px] font-black uppercase tracking-wider opacity-40">Contracts</p>
                  <Show
                    when={contracts().length > 0}
                    fallback={<p class="mt-2 text-xs font-bold opacity-50">No contracts yet.</p>}
                  >
                    <ul class="mt-2 space-y-2">
                      <For each={contracts()}>
                        {(contract) => (
                          <li class="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                            <A href={`/contracts/${contract._id}/edit`} class="link link-primary">
                              {formatDate(contract.startDate)} – {contract.endDate ? formatDate(contract.endDate) : 'Present'}
                            </A>
                            <span class="opacity-50">
                              {typeof contract.meterId === 'string' ? '' : contract.meterId?.name}
                              {' · '}€{contract.basePrice.toFixed(2)}/mo · €{contract.workingPrice.toFixed(4)}
                            </span>
                          </li>
                        )}
                      </For>
                    </ul>
                  </Show>
                </div>
              </div>

              <Show when={lastSync()}>
                {(result) => (
                  <div class="mt-4 rounded-2xl border border-base-content/5 bg-base-200/50 p-4">
                    <p class="text-[10px] font-black uppercase tracking-wider opacity-40">
                      Last sync · {result().provider} · {result().count} document{result().count === 1 ? '' : 's'}
                      <Show when={result().linked}><span> · {result().linked} linked</span></Show>
                    </p>
                    <Show
                      when={result().processed.length > 0}
                      fallback={<p class="mt-2 text-xs font-bold opacity-50">No new mail matched.</p>}
                    >
                      <ul class="mt-2 space-y-1.5">
                        <For each={result().processed}>
                          {(entry) => (
                            <li class="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                              <StatusBadge status={entry.status} />
                              <span class="break-all font-mono opacity-70">{entry.attachment}</span>
                              <Show when={entry.error}><span class="opacity-50">{entry.error}</span></Show>
                            </li>
                          )}
                        </For>
                      </ul>
                    </Show>
                  </div>
                )}
              </Show>
            </Section>
          </Show>

          <Section
            title="Staged items"
            hint="Supplier values never overwrite your readings — they wait here."
            actions={
              <label class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider opacity-60">
                <input
                  type="checkbox"
                  class="toggle toggle-xs"
                  checked={showDecided()}
                  onChange={(event) => { setShowDecided(event.currentTarget.checked); void loadItems(); }}
                />
                Show decided
              </label>
            }
          >
            <Show
              when={items().length > 0}
              fallback={
                <div class="mt-4">
                  <EmptyState
                    title="Nothing staged"
                    description={unassigned() ? 'No unassigned facts to review.' : 'Run a sync and anything recognised will show up here for review.'}
                  />
                </div>
              }
            >
              <div class="mt-4 grid gap-3 md:grid-cols-2">
                <For each={items()}>
                  {(item) => (
                    <ItemCard
                      item={item}
                      hasMeters={meters().length > 0}
                      onAccept={(entry) => void decide(entry, 'accept')}
                      onReject={(entry) => void decide(entry, 'reject')}
                      onLinkRequest={setLinkTarget}
                    />
                  )}
                </For>
              </div>
            </Show>
          </Section>

          <Section title="Bills vs. contract" hint="Billed amount against what your contract rates expect.">
            <Show
              when={bills().length > 0}
              fallback={<p class="mt-3 text-sm font-bold opacity-50">No billed periods yet.</p>}
            >
              <ul class="mt-4 space-y-2 md:hidden" data-testid="bills-stacked">
                <For each={bills()}>{(bill) => <BillMobileRow bill={bill} />}</For>
              </ul>
              <div class="mt-4 hidden overflow-x-auto md:block">
                <table class="table table-sm">
                  <thead>
                    <tr class="text-[10px] uppercase tracking-wider opacity-50">
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
                        <tr class="text-xs font-bold">
                          <td>{formatDate(bill.periodStart)} – {formatDate(bill.periodEnd)}</td>
                          <td class="text-right">{bill.consumption ?? '—'} {bill.unit ?? ''}</td>
                          <td class="text-right">{formatAmount(bill.amountGross, bill.currency)}</td>
                          <td class="text-right">{formatAmount(bill.expected, bill.currency)}</td>
                          <td class={`text-right ${varianceClass(bill.variance)}`}>
                            <VarianceValue variance={bill.variance} />
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
          </Section>

          <Section
            title="Recent documents"
            hint="Parsed files are archived to Drive automatically."
            actions={
              <>
                <Show when={documents().some((document) => document.status === 'failed')}>
                  <button
                    class="btn btn-ghost btn-sm rounded-xl font-bold"
                    disabled={retrying() !== null || archiving() !== null}
                    onClick={() => void retryFailedDocuments()}
                  >
                    <Icon name="refresh" class={`h-3.5 w-3.5 ${retrying() ? 'animate-spin' : ''}`} />
                    {retrying() ? 'Retrying…' : 'Retry failed'}
                  </button>
                </Show>
                <Show when={documents().some(needsArchive)}>
                  <button
                    class="btn btn-ghost btn-sm rounded-xl font-bold"
                    disabled={archiving() !== null || retrying() !== null}
                    onClick={() => void archiveDocuments()}
                  >
                    <Icon name="export" class={`h-3.5 w-3.5 ${archiving() === 'all' ? 'animate-pulse' : ''}`} />
                    {archiving() === 'all' ? 'Archiving…' : 'Archive to Drive'}
                  </button>
                </Show>
              </>
            }
          >
            <Show
              when={documents().length > 0}
              fallback={<p class="mt-3 text-sm font-bold opacity-50">Nothing ingested yet.</p>}
            >
              <ul class="mt-4 space-y-2">
                <For each={documents()}>
                  {(document) => (
                    <li class="rounded-2xl border border-base-content/5 bg-base-200/50 p-4">
                      <div class="flex items-start justify-between gap-3">
                        <p class="min-w-0 flex-1 break-all font-mono text-xs font-bold">{document.fileName}</p>
                        <StatusBadge status={document.status} />
                      </div>
                      <p class="mt-1 break-words text-[11px] font-bold opacity-50">
                        {formatDate(document.receivedAt)}
                        <Show when={document.providerName}><span> · {document.providerName}</span></Show>
                        <Show when={document.subject}><span> · {document.subject}</span></Show>
                      </p>
                      <Show when={document.error}>
                        <p class="mt-1 break-words text-[11px] font-bold text-error">{document.error}</p>
                      </Show>
                      <Show when={document.status === 'failed' || driveLink(document) || needsArchive(document)}>
                        <div class="mt-3 flex flex-wrap items-center gap-2">
                          <Show when={document.status === 'failed'}>
                            <button
                              class="btn btn-ghost btn-sm rounded-xl font-bold"
                              disabled={retrying() !== null || archiving() !== null}
                              onClick={() => void retryDocument(document)}
                            >
                              <Icon name="refresh" class={`h-3.5 w-3.5 ${retrying() === document._id ? 'animate-spin' : ''}`} />
                              {retrying() === document._id ? 'Retrying…' : 'Retry'}
                            </button>
                          </Show>
                          <Show when={driveLink(document)}>
                            {(link) => (
                              <a
                                href={link()}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn btn-ghost btn-sm rounded-xl font-bold text-primary"
                              >
                                <Icon name="external-link" class="h-3.5 w-3.5" /> Drive
                              </a>
                            )}
                          </Show>
                          <Show when={needsArchive(document)}>
                            <button
                              class="btn btn-ghost btn-sm rounded-xl font-bold"
                              disabled={archiving() !== null || retrying() !== null}
                              onClick={() => void archiveDocuments(document._id)}
                            >
                              <Icon name="export" class="h-3.5 w-3.5" />
                              {archiving() === document._id ? 'Saving…' : 'Save to Drive'}
                            </button>
                          </Show>
                        </div>
                      </Show>
                      <Show when={unassigned()}>
                        <div class="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            class="btn btn-outline btn-primary btn-sm rounded-xl font-bold"
                            disabled={assigning()}
                            onClick={() => setAssignTarget(document)}
                          >
                            <Icon name="contract" class="h-3.5 w-3.5" /> Assign supplier
                          </button>
                        </div>
                      </Show>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Section>
        </div>

        <LinkMeterSheet
          item={linkTarget()}
          meters={meters()}
          linking={linking()}
          onClose={() => setLinkTarget(null)}
          onSelect={(meterId) => {
            const item = linkTarget();
            if (item) {
              void linkItem(item, meterId);
            }
          }}
        />

        <AssignSupplierSheet
          document={assignTarget()}
          suppliers={supplierOptions()}
          assigning={assigning()}
          onClose={() => setAssignTarget(null)}
          onSelect={(targetSupplierId) => {
            const document = assignTarget();
            if (document) {
              void assignSupplier(document, targetSupplierId);
            }
          }}
        />
      </Show>
    </div>
  );
};

export default SupplierDetail;
