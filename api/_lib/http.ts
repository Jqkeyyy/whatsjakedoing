import type { IncomingHttpHeaders } from 'node:http';

// The small subset of Vercel's Node request/response API used by this project.
// Keeping these structural types local avoids a large build dependency for types only.
export interface VercelRequest {
  method?: string;
  headers?: IncomingHttpHeaders;
  cookies?: Record<string, string>;
  body?: Record<string, unknown> | null;
}

export interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
  send(body: unknown): VercelResponse;
  end(): VercelResponse;
  setHeader(name: string, value: string | readonly string[]): VercelResponse;
}
