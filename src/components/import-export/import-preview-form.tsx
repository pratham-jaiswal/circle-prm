"use client";

import { useState } from "react";

type ReferenceIssue = {
  issueId: string;
  entity: "notes" | "interactions" | "events" | "reminders";
  item: string;
  reference: string;
  type: "unresolved" | "ambiguous";
  matches?: Array<{ publicId: string; fullName: string }>;
};

type ReferenceSummary = {
  unresolved: number;
  ambiguous: number;
  issues: ReferenceIssue[];
};

type PersonResolution = {
  issueId: string;
  action: "map" | "skip" | "create";
  publicId?: string;
  fullName?: string;
};

type PreviewResponse = {
  ok: boolean;
  schemaVersion?: number;
  preview?: Record<string, number>;
  referenceSummary?: ReferenceSummary;
  warnings?: ReferenceSummary;
  warning?: string;
  errors?: Array<{ path: string; message: string }>;
  created?: number;
  updated?: number;
  skipped?: number;
  byEntity?: Record<string, { created: number; updated: number; skipped: number }>;
  conflictPolicy?: "overwrite" | "skip" | "duplicate";
};

function buildSamplePayload(scope: "full" | "people" | "notes") {
  if (scope === "people") {
    return {
      manifest: {
        app: "Personal Relationship Manager",
        schemaVersion: 1,
        exportedAt: "2026-01-01T00:00:00.000Z",
        scope: "people",
      },
      data: [
        {
          fullName: "Alex Morgan",
          aliases: ["Alex"],
          circles: ["Friends"],
          interests: ["Running"],
          tags: ["close"],
          status: "ACTIVE",
        },
      ],
    };
  }

  if (scope === "notes") {
    return {
      manifest: {
        app: "Personal Relationship Manager",
        schemaVersion: 1,
        exportedAt: "2026-01-01T00:00:00.000Z",
        scope: "notes",
      },
      data: [
        {
          title: "Quarterly catch-up",
          content: "Discussed role change and travel plans.",
          tags: ["career", "followup"],
          people: ["Alex Morgan"],
        },
      ],
      people: [
        {
          fullName: "Alex Morgan",
        },
      ],
    };
  }

  return {
    schemaVersion: 1,
    people: [
      {
        fullName: "Alex Morgan",
        aliases: ["Alex"],
        circles: ["Friends"],
        interests: ["Running"],
        tags: ["close"],
        status: "ACTIVE",
      },
    ],
    notes: [
      {
        title: "Quarterly catch-up",
        content: "Discussed role change and travel plans.",
        tags: ["career", "followup"],
        people: ["Alex Morgan"],
      },
    ],
    interactions: [],
    reminders: [],
    relationships: [],
    events: [],
    savedViews: [],
  };
}

function getScopeGuidance(scope: "full" | "people" | "notes") {
  if (scope === "people") {
    return "People scope accepts export-style { manifest, data } or simple { people: [] }.";
  }

  if (scope === "notes") {
    return "Notes scope accepts export-style { manifest, data } or simple { notes: [] }. Include optional people for reference matching.";
  }

  return "Full scope accepts the full backup payload with schemaVersion and entity arrays.";
}

export function ImportPreviewForm() {
  const [jsonInput, setJsonInput] = useState("{\n  \"schemaVersion\": 1,\n  \"people\": [],\n  \"notes\": []\n}");
  const [result, setResult] = useState<PreviewResponse | null>(null);
  const [resolutionChoice, setResolutionChoice] = useState<Record<string, string>>({});
  const [manualPublicIds, setManualPublicIds] = useState<Record<string, string>>({});
  const [createNames, setCreateNames] = useState<Record<string, string>>({});
  const [importScope, setImportScope] = useState<"full" | "people" | "notes">("full");
  const [pendingPreview, setPendingPreview] = useState(false);
  const [pendingCommit, setPendingCommit] = useState(false);
  const [conflictPolicy, setConflictPolicy] = useState<"overwrite" | "skip" | "duplicate">("overwrite");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function buildPersonResolutions(): PersonResolution[] {
    const items = Object.entries(resolutionChoice);
    const output: PersonResolution[] = [];

    for (const [issueId, value] of items) {
      if (!value) {
        continue;
      }

      if (value === "skip") {
        output.push({ issueId, action: "skip" });
        continue;
      }

      if (value === "manual") {
        const typedPublicId = (manualPublicIds[issueId] ?? "").trim();
        if (typedPublicId) {
          output.push({
            issueId,
            action: "map",
            publicId: typedPublicId,
          });
        }
        continue;
      }

      if (value === "create") {
        const fullName = (createNames[issueId] ?? "").trim();
        if (fullName) {
          output.push({
            issueId,
            action: "create",
            fullName,
          });
        }
        continue;
      }

      output.push({
        issueId,
        action: "map",
        publicId: value,
      });
    }

    return output;
  }

  async function runImport(mode: "preview" | "commit") {
    const setPending = mode === "preview" ? setPendingPreview : setPendingCommit;
    const endpointMap = {
      full: {
        preview: "/api/import/preview",
        commit: "/api/import/commit",
      },
      people: {
        preview: "/api/import/people/preview",
        commit: "/api/import/people/commit",
      },
      notes: {
        preview: "/api/import/notes/preview",
        commit: "/api/import/notes/commit",
      },
    } as const;
    const endpoint = endpointMap[importScope][mode];

    setPending(true);
    setResult(null);

    try {
      const parsedBody = JSON.parse(jsonInput);
      const requestBody =
        mode === "preview"
          ? parsedBody
          : {
              payload: parsedBody,
              conflictPolicy,
              personResolutions: buildPersonResolutions(),
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json()) as PreviewResponse;
      setResult(data);
      if (mode === "preview") {
        setResolutionChoice({});
        setManualPublicIds({});
        setCreateNames({});
      }
      if (data.ok) {
        setToast({
          type: "success",
          message:
            mode === "preview"
              ? `${importScope} import preview generated.`
              : `${importScope} import committed (${data.created ?? 0} created, ${data.updated ?? 0} updated, ${data.skipped ?? 0} skipped).`,
        });
      } else {
        setToast({ type: "error", message: "Import request failed." });
      }
    } catch (error) {
      setResult({
        ok: false,
        errors: [
          {
            path: "json",
            message: error instanceof Error ? error.message : "Invalid JSON input.",
          },
        ],
      });
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Invalid JSON input.",
      });
    } finally {
      setPending(false);
    }
  }

  function loadSamplePayload() {
    const payload = buildSamplePayload(importScope);
    setJsonInput(JSON.stringify(payload, null, 2));
    setResult(null);
    setResolutionChoice({});
    setManualPublicIds({});
    setCreateNames({});
    setToast({ type: "success", message: `Loaded ${importScope} sample payload.` });
  }

  function downloadSamplePayload() {
    const payload = buildSamplePayload(importScope);
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `circle-prm-${importScope}-sample.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({ type: "success", message: `Downloaded ${importScope} sample payload.` });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="import-json" className="text-sm font-medium text-slate-800">
          Paste import JSON
        </label>
        <input
          type="file"
          accept="application/json"
          className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            try {
              const text = await file.text();
              setJsonInput(text);
            } catch {
              setResult({
                ok: false,
                errors: [{ path: "file", message: "Unable to read selected file." }],
              });
            }
          }}
        />
        <textarea
          id="import-json"
          value={jsonInput}
          onChange={(event) => setJsonInput(event.target.value)}
          rows={14}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm leading-6 text-slate-900 outline-none ring-slate-300 transition focus:ring"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={importScope}
          onChange={(event) =>
            setImportScope(event.target.value as "full" | "people" | "notes")
          }
          className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700"
          aria-label="Import scope"
        >
          <option value="full">Scope: Full backup</option>
          <option value="people">Scope: People only</option>
          <option value="notes">Scope: Notes only</option>
        </select>
        <select
          value={conflictPolicy}
          onChange={(event) =>
            setConflictPolicy(event.target.value as "overwrite" | "skip" | "duplicate")
          }
          className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700"
          aria-label="Conflict policy"
        >
          <option value="overwrite">On conflict: Overwrite existing</option>
          <option value="skip">On conflict: Skip incoming</option>
          <option value="duplicate">On conflict: Create duplicate</option>
        </select>
        <button
          type="button"
          onClick={loadSamplePayload}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-65"
          disabled={pendingPreview || pendingCommit}
        >
          Load sample JSON
        </button>
        <button
          type="button"
          onClick={downloadSamplePayload}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-65"
          disabled={pendingPreview || pendingCommit}
        >
          Download sample JSON
        </button>
        <button
          type="button"
          onClick={() => runImport("preview")}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-65"
          disabled={pendingPreview || pendingCommit}
        >
          {pendingPreview ? "Validating..." : "Preview import"}
        </button>
        <button
          type="button"
          onClick={() => runImport("commit")}
          className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-65"
          disabled={pendingPreview || pendingCommit}
        >
          {pendingCommit ? "Importing..." : "Commit import"}
        </button>
      </div>

      <p className="text-xs leading-5 text-slate-600">{getScopeGuidance(importScope)}</p>

      {result ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          {result.ok ? (
            <div className="space-y-2 text-slate-700">
              <p className="font-semibold text-slate-900">Success (schema v{result.schemaVersion})</p>
              <ul className="space-y-1">
                {Object.entries(result.preview ?? {}).map(([key, value]) => (
                  <li key={key}>
                    {key}: {value}
                  </li>
                ))}
                {typeof result.created === "number" ? <li>created: {result.created}</li> : null}
                {typeof result.updated === "number" ? <li>updated: {result.updated}</li> : null}
                {typeof result.skipped === "number" ? <li>skipped: {result.skipped}</li> : null}
                {result.conflictPolicy ? <li>conflict policy: {result.conflictPolicy}</li> : null}
                {result.referenceSummary ? (
                  <>
                    <li>unresolved references: {result.referenceSummary.unresolved}</li>
                    <li>ambiguous references: {result.referenceSummary.ambiguous}</li>
                  </>
                ) : null}
                {result.warnings ? (
                  <>
                    <li>commit unresolved references: {result.warnings.unresolved}</li>
                    <li>commit ambiguous references: {result.warnings.ambiguous}</li>
                  </>
                ) : null}
              </ul>
              {result.byEntity ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Result by entity
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {Object.entries(result.byEntity).map(([entity, counts]) => (
                      <li key={entity}>
                        {entity}: created {counts.created}, updated {counts.updated}, skipped {counts.skipped}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {result.warning ? <p className="text-slate-500">{result.warning}</p> : null}
            </div>
          ) : (
            <div className="space-y-2 text-rose-700">
              <p className="font-semibold text-rose-900">Preview failed</p>
              <ul className="space-y-1">
                {(result.errors ?? []).map((issue, index) => (
                  <li key={`${issue.path}-${index}`}>
                    {issue.path || "body"}: {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : null}

      {result?.ok && result.referenceSummary && result.referenceSummary.issues.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Reference resolution required before commit (recommended)</p>
          <p className="mt-1 text-amber-800">
            Choose how to handle each ambiguous or unresolved person reference.
          </p>
          <div className="mt-4 space-y-3">
            {result.referenceSummary.issues.map((issue) => (
              <div key={issue.issueId} className="rounded-xl border border-amber-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                  {issue.entity} • {issue.type}
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {issue.item}: {issue.reference}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <select
                    value={resolutionChoice[issue.issueId] ?? ""}
                    onChange={(event) =>
                      setResolutionChoice((previous) => ({
                        ...previous,
                        [issue.issueId]: event.target.value,
                      }))
                    }
                    className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800"
                  >
                    <option value="">Leave unresolved</option>
                    <option value="skip">Skip this reference</option>
                    {issue.matches?.map((match) => (
                      <option key={match.publicId} value={match.publicId}>
                        Map to {match.fullName} ({match.publicId})
                      </option>
                    ))}
                    <option value="manual">Map using typed public ID</option>
                    <option value="create">Create a new person</option>
                  </select>
                  {(resolutionChoice[issue.issueId] ?? "") === "manual" ? (
                    <input
                      value={manualPublicIds[issue.issueId] ?? ""}
                      onChange={(event) =>
                        setManualPublicIds((previous) => ({
                          ...previous,
                          [issue.issueId]: event.target.value,
                        }))
                      }
                      placeholder="PER_A7K29X"
                      className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800"
                    />
                  ) : null}
                  {(resolutionChoice[issue.issueId] ?? "") === "create" ? (
                    <input
                      value={createNames[issue.issueId] ?? issue.reference}
                      onChange={(event) =>
                        setCreateNames((previous) => ({
                          ...previous,
                          [issue.issueId]: event.target.value,
                        }))
                      }
                      placeholder="Full name"
                      className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800"
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {toast ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
