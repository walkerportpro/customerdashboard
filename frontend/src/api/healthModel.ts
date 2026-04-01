import { apiFetch, apiPost, apiPut } from "./client";
import type { HealthModel, SimulationSummary } from "../types";

export async function fetchPublishedModel(): Promise<HealthModel> {
  return apiFetch<HealthModel>("/health-model");
}

export async function fetchDraftModel(): Promise<HealthModel> {
  return apiFetch<HealthModel>("/health-model/draft");
}

export async function saveDraft(model: HealthModel): Promise<HealthModel> {
  return apiPut<HealthModel>("/health-model/draft", model);
}

export async function publishDraft(
  user: string,
  note: string
): Promise<HealthModel> {
  return apiPost<HealthModel>(
    `/health-model/publish?user=${encodeURIComponent(user)}&note=${encodeURIComponent(note)}`,
    {}
  );
}

export async function runSimulation(): Promise<SimulationSummary> {
  return apiPost<SimulationSummary>("/health-model/simulate", {});
}

export async function fetchVersions(): Promise<
  {
    version: number;
    name: string;
    published_at: string;
    published_by: string;
    component_count: number;
  }[]
> {
  return apiFetch("/health-model/versions");
}

export async function rollbackToVersion(
  version: number
): Promise<HealthModel> {
  return apiPost<HealthModel>(`/health-model/rollback/${version}`, {});
}

export async function fetchPresets(): Promise<
  {
    id: string;
    name: string;
    description: string;
    component_count: number;
    weights: Record<string, number>;
  }[]
> {
  return apiFetch("/health-model/presets");
}

export async function applyPreset(presetId: string): Promise<HealthModel> {
  return apiPost<HealthModel>(
    `/health-model/presets/${presetId}/apply`,
    {}
  );
}
