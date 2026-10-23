/**
 * Test helper utilities for mock API requests and validation.
 */

export function createMockRequest(url: string, method = "GET", body?: unknown) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}
