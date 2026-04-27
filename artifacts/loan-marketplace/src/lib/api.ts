import { customFetch } from "@workspace/api-client-react";

const BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

export async function api<T = unknown>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const opts: RequestInit & { responseType?: "json" } = {
    method: init?.method ?? "GET",
    headers: { ...(init?.headers ?? {}) },
    responseType: "json",
  };
  if (init?.json !== undefined) {
    opts.body = JSON.stringify(init.json);
    (opts.headers as Record<string, string>)["content-type"] = "application/json";
  } else if (init?.body !== undefined) {
    opts.body = init.body;
  }
  return customFetch<T>(`${BASE}${path}`, opts);
}

export type Role = "customer" | "admin" | "sales_partner" | "collection_partner";

export function roleLabel(r?: string): string {
  switch (r) {
    case "admin": return "Admin";
    case "sales_partner": return "Channel Partner";
    case "collection_partner": return "Collection Partner";
    default: return "Customer";
  }
}

export function roleHomePath(r?: string): string {
  switch (r) {
    case "admin": return "/admin";
    case "sales_partner": return "/partner";
    case "collection_partner": return "/collection";
    default: return "/dashboard";
  }
}
