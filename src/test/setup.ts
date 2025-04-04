import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, beforeEach } from 'vitest';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

vi.mock('@tauri-apps/api/fs', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
}));

// Add any custom matchers or global test setup here
beforeAll(() => {
  // Add any setup that needs to run once before all tests
});

afterAll(() => {
  // Add any cleanup that needs to run once after all tests
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
}); 
