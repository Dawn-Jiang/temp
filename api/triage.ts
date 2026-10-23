import { request } from '@/utils/request';
import type { TriageParams, TriageResponse } from '@/types';

export const triageApi = {
  start: (data: { symptom: string }) =>
    request.post<TriageResponse>('/triage/start', data),
  answer: (data: TriageParams) =>
    request.post<TriageResponse>('/triage/answer', data),
  status: (sessionId: string) =>
    request.get<TriageResponse>(`/triage/status/${sessionId}`),
  end: (sessionId: string) =>
    request.delete<void>(`/triage/${sessionId}`)
};