export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function withApiBase(path: string) {
  return `${API_BASE_URL}${path}`;
}
