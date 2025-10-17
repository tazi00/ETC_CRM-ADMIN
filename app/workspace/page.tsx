// app/workspace/page.tsx
import Link from "next/link";
import BracketsIcon from "@/components/icons/brackets";
import DashboardPageLayout from "@/components/dashboard/layout";

type Props = {
  searchParams?: { page?: string; limit?: string };
};

export type Property = {
  _id: string;
  name: string;
  description: string;
  usage_limits: number;
  usage_count: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  // add what you actually render; keep the rest optional to avoid over-coupling
};

type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type ApiSuccess = {
  message: string;
  status: "SUCCESS";
  data: {
    properties: Property[];
    pagination: Pagination;
  };
};

const API_URL = "https://crm-server-tsnj.onrender.com/api/property/all";

export async function fetchProperties(page = 1, limit = 10) {
  // Revalidate every 60s. If you want absolutely fresh, use cache: "no-store"
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Important: backend expects pagination in body, not in query
    body: JSON.stringify({ page, limit }),
    // Choose one strategy:
    // cache: "no-store",
    next: { revalidate: 60, tags: ["properties"] },
    signal: controller.signal,
  }).catch((e) => {
    throw new Error(`Network error: ${e?.message || "unknown"}`);
  });

  clearTimeout(timeout);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `API ${res.status}: ${text || "failed to load properties"}`
    );
  }

  const json = (await res.json()) as ApiSuccess;

  if (json.status !== "SUCCESS" || !json.data) {
    throw new Error("Unexpected API shape.");
  }

  return json.data;
}

export default async function WorkspacePage({ searchParams }: Props) {
  const page = Number(searchParams?.page || 1);
  const limit = Number(searchParams?.limit || 10);

  // Guardrails
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit =
    Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 10;

  const { properties, pagination } = await fetchProperties(safePage, safeLimit);

  return (
    <DashboardPageLayout
      header={{
        title: "Workspace",
        description: "Last updated 12:05",
        icon: BracketsIcon,
      }}
    >
      {/* Stats / header grid if you want */}
      <div className="grid grid-cols-1 gap-6 mb-1">
        {/* Replace with your cards later */}
        <div className="border-b pb-5 ">
          <h3 className="text-3xl">Properties Listing</h3>
        </div>
      </div>

      {/* List */}
      <section className="space-y-3">
        {properties.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No properties found.
          </div>
        ) : (
          <ul className="divide-y rounded-2xl border">
            {properties.map((p) => (
              <li key={p._id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold leading-none">{p.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {p.description || "No description"}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Usage {p.usage_count}/{p.usage_limits} • Status {p.status}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        limit={pagination.limit}
      />
    </DashboardPageLayout>
  );
}

// Server component: no "use client"
function Pagination({
  currentPage,
  totalPages,
  limit,
}: {
  currentPage: number;
  totalPages: number;
  limit: number;
}) {
  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  const PageLink = ({
    page,
    disabled,
    label,
  }: {
    page: number;
    disabled?: boolean;
    label: string;
  }) => (
    <Link
      prefetch={false}
      href={`?page=${page}&limit=${limit}`}
      aria-disabled={disabled}
      className={[
        "px-3 py-2 rounded-xl border",
        disabled
          ? "pointer-events-none opacity-50"
          : "hover:bg-accent hover:text-accent-foreground",
      ].join(" ")}
    >
      {label}
    </Link>
  );

  // Optional: page number window
  const windowSize = 5;
  const start = Math.max(1, currentPage - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav className="mt-6 flex items-center gap-2">
      <PageLink page={prevPage} disabled={currentPage === 1} label="Prev" />

      {pages.map((p) => (
        <Link
          prefetch={false}
          key={p}
          href={`?page=${p}&limit=${limit}`}
          className={[
            "px-3 py-2 rounded-xl border",
            p === currentPage
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent hover:text-accent-foreground",
          ].join(" ")}
          aria-current={p === currentPage ? "page" : undefined}
        >
          {p}
        </Link>
      ))}

      <PageLink
        page={nextPage}
        disabled={currentPage === totalPages}
        label="Next"
      />
    </nav>
  );
}
