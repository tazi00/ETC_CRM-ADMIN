// app/addons/edit/page.tsx
"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/apiClient";
import Link from "next/link";

export default function EditAddonPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm opacity-70">Loading edit form…</div>
      }
    >
      <EditAddonForm />
    </Suspense>
  );
}

export function EditAddonForm() {
  const router = useRouter();
  const sp = useSearchParams(); // now safely inside Suspense

  const id = sp.get("id") || "";
  const initialTitle = sp.get("title") || "";
  const initialDescription = sp.get("description") || "";
  const initialValue = sp.get("value") || "";
  const initialStatus = sp.get("status") || "ACTIVE";

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!id) return setError("INVALID_ADDON_ID");

    const valueNum = Number(value);
    if (!Number.isFinite(valueNum) || valueNum < 0) {
      return setError("VALUE_MUST_BE_NON_NEGATIVE_NUMBER");
    }

    try {
      setSaving(true);
      await apiClient.patch(`/api/addons/edit`, {
        addOnId: id,
        title,
        description,
        value: valueNum,
        status,
      });
      setSaved(true);
      setTimeout(() => {
        router.replace("/addons");
      }, 800);
    } catch (err: any) {
      setError(err.message || "UPDATE_FAILED");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges =
    title !== initialTitle ||
    description !== initialDescription ||
    value !== initialValue ||
    status !== initialStatus;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl text-foreground">
              EDIT_ADDON
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              UPDATE_ADDON_DETAILS_AND_SETTINGS
            </p>
          </div>

          <Link
            href="/addons"
            className="px-4 py-2.5 bg-pop text-foreground font-mono text-sm rounded-lg border border-border hover:bg-pop/50 transition-all duration-200"
          >
            BACK_TO_ADDONS
          </Link>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="mb-6 p-3 bg-input rounded-lg border border-border">
            <div className="text-xs font-mono text-muted-foreground mb-1">
              ADDON_ID
            </div>
            <div className="text-sm font-mono text-foreground font-medium truncate">
              {id || "NO_ID_PROVIDED"}
            </div>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-foreground font-mono text-sm font-medium">
                ADDON_TITLE
              </label>
              <input
                className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground font-mono placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ENTER_ADDON_TITLE"
                disabled={saving}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-foreground font-mono text-sm font-medium">
                ADDON_DESCRIPTION
              </label>
              <textarea
                className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground font-mono placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 min-h-[120px] resize-vertical"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="DESCRIBE_THE_ADDON_SERVICE"
                disabled={saving}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-foreground font-mono text-sm font-medium">
                ADDON_VALUE
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-muted-foreground font-mono">$</span>
                </div>
                <input
                  type="number"
                  className="w-full bg-input border border-border rounded-lg pl-8 pr-4 py-3 text-foreground font-mono placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-foreground font-mono text-sm font-medium">
                STATUS
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={saving}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
              >
                <option value="ACTIVE" className="font-mono">
                  ACTIVE
                </option>
                <option value="INACTIVE" className="font-mono">
                  INACTIVE
                </option>
                <option value="PENDING" className="font-mono">
                  PENDING
                </option>
                <option value="DRAFT" className="font-mono">
                  DRAFT
                </option>
              </select>
            </div>

            <div className="flex items-center gap-4 py-4 border-y border-border">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    saving
                      ? "bg-warning animate-pulse"
                      : hasChanges
                      ? "bg-success"
                      : "bg-muted-foreground"
                  }`}
                />
                <span className="text-xs font-mono text-muted-foreground">
                  {saving
                    ? "SAVING_CHANGES..."
                    : hasChanges
                    ? "UNSAVED_CHANGES"
                    : "NO_CHANGES"}
                </span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-ring rounded-full" />
                <span className="text-xs font-mono text-muted-foreground">
                  ENCRYPTED_CONNECTION
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive font-mono text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
                  <span>UPDATE_ERROR</span>
                </div>
                {error}
              </div>
            )}

            {saved && !error && (
              <div className="rounded-lg border border-success bg-success/10 p-4 text-success font-mono text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                  <span>UPDATE_SUCCESSFUL</span>
                </div>
                REDIRECTING_TO_ADDONS...
              </div>
            )}

            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={saving || !hasChanges}
                className="px-6 py-3 bg-primary text-primary-foreground font-mono text-sm rounded-lg border border-border hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "UPDATING..." : "UPDATE_ADDON"}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                disabled={saving}
                className="px-6 py-3 bg-pop text-foreground font-mono text-sm rounded-lg border border-border hover:bg-pop/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card transition-all duration-200 disabled:opacity-50"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="ORIGINAL_TITLE" value={initialTitle || "N/A"} />
          <StatCard label="ORIGINAL_VALUE" value={`$${initialValue || "0"}`} />
          <StatCard label="CURRENT_STATUS" value={initialStatus || "N/A"} />
          <StatCard label="PENDING_CHANGES" value={hasChanges ? "YES" : "NO"} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-pop border border-border rounded-lg p-4 text-center">
      <div className="text-2xl font-mono text-foreground font-semibold truncate">
        {value}
      </div>
      <div className="text-xs text-muted-foreground font-mono mt-1">
        {label}
      </div>
    </div>
  );
}
