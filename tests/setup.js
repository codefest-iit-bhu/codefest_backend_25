/**
 * Global test setup for Jest
 * Mocks DB connections and common modules so tests run without a real MongoDB instance.
 */

// Mock mongoose so no real DB connection is attempted
jest.mock("mongoose", () => {
  const actual = jest.requireActual("mongoose");
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue({}),
  };
});

// Silence console.error during tests (keeps output clean)
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
  console.log.mockRestore();
});
