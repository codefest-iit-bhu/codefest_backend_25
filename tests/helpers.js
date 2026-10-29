/**
 * Shared test helpers / factories
 */
import jwt from "jsonwebtoken";

/**
 * Generate a signed JWT for a test user.
 * @param {object} overrides - Fields to merge onto the default user payload.
 */
export function generateToken(overrides = {}) {
  const payload = { _id: "64aaaaaaaaaaaaaaaaaaaaa1", role: "user", ...overrides };
  return jwt.sign(payload, process.env.JWT_SECRET || "test_secret", {
    expiresIn: "1h",
  });
}

/** Token for a regular user */
export const userToken = () => `Bearer ${generateToken()}`;

/** Token for an admin user */
export const adminToken = () =>
  `Bearer ${generateToken({ _id: "64aaaaaaaaaaaaaaaaaaaaa2", role: "admin" })}`;

/** Fake MongoDB ObjectId strings */
export const fakeId = "64aaaaaaaaaaaaaaaaaaaaa9";
export const fakeGameId = "64bbbbbbbbbbbbbbbbbbbb01";
