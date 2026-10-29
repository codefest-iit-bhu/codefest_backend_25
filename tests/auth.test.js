/**
 * Auth Routes Tests
 * Covers: signup, verify_email, login, logout, refresh-token, set-password
 */

import request from "supertest";
import { app } from "../app.js";
import { User } from "../models/user.js";
import { Verification } from "../models/verification.js";
import { Session } from "../models/session.js";
import bcrypt from "bcrypt";
import { userToken } from "./helpers.js";

// ─── Model Mocks ─────────────────────────────────────────────────────────────
jest.mock("../models/user.js");
jest.mock("../models/verification.js");
jest.mock("../models/session.js");
jest.mock("../models/ca_request.js", () => ({ CARequest: { findOne: jest.fn() } }));
jest.mock("../utils/sendVerification.js", () => ({
  generateOTP: jest.fn().mockReturnValue("123456"),
  sendVerification: jest.fn((email, otp, name, pwd, ref, res) =>
    res.status(200).json({ success: true, message: "OTP sent" })
  ),
}));
jest.mock("../config/database.js", () => jest.fn());

describe("Auth Routes — /api/v1/auth", () => {
  // ─── POST /signup ───────────────────────────────────────────────────────────
  describe("POST /signup", () => {
    beforeEach(() => User.findOne.mockResolvedValue(null));

    it("should return 200 and send OTP for valid data", async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        name: "Test User",
        email: "test@example.com",
        password: "SecurePass123",
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 400 if user already exists", async () => {
      User.findOne.mockResolvedValue({ email: "exists@example.com" });
      const res = await request(app).post("/api/v1/auth/signup").send({
        name: "Existing User",
        email: "exists@example.com",
        password: "SecurePass123",
      });
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 for invalid email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({ name: "Test", email: "not-an-email", password: "SecurePass123" });
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 for short password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({ name: "Test", email: "test@example.com", password: "short" });
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 for name too short", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({ name: "A", email: "test@example.com", password: "SecurePass123" });
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── POST /verify_email ─────────────────────────────────────────────────────
  describe("POST /verify_email", () => {
    it("should return 201 and create user for valid OTP", async () => {
      Verification.findOne.mockResolvedValue({
        email: "test@example.com",
        code: "123456",
        name: "Test",
        password: "hashed",
        referralCode: null,
      });
      const mockUser = {
        _id: "64aaa",
        name: "Test",
        email: "test@example.com",
        password: "hashed",
        role: "user",
      };
      User.create.mockResolvedValue(mockUser);
      Session.create = jest.fn().mockResolvedValue({});
      Verification.deleteOne = jest.fn().mockResolvedValue({});

      jest.mock("../utils/features.js", () => ({
        generateRefreshToken: jest.fn().mockResolvedValue("refresh_token"),
        sendJwt: jest.fn((user, res) => res.status(201).json({ success: true })),
      }));

      const res = await request(app)
        .post("/api/v1/auth/verify_email")
        .send({ email: "test@example.com", otp: "123456" });

      expect([200, 201]).toContain(res.statusCode);
    });

    it("should return 400 for invalid OTP", async () => {
      Verification.findOne.mockResolvedValue(null);
      const res = await request(app)
        .post("/api/v1/auth/verify_email")
        .send({ email: "test@example.com", otp: "000000" });
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── POST /login ────────────────────────────────────────────────────────────
  describe("POST /login", () => {
    it("should return 400 if user not found", async () => {
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "nope@example.com", password: "password123" });
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 for wrong password", async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({ password: await bcrypt.hash("correctPass", 10) }),
      });
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: "wrongPass" });
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── DELETE /logout ─────────────────────────────────────────────────────────
  describe("DELETE /logout", () => {
    it("should return 401 when no auth token provided", async () => {
      const res = await request(app).delete("/api/v1/auth/logout");
      expect(res.statusCode).toBe(401);
    });

    it("should return 400 when refresh token is missing", async () => {
      User.findOne.mockResolvedValue({ _id: "64aaa", role: "user" });
      const res = await request(app)
        .delete("/api/v1/auth/logout")
        .set("Authorization", userToken());
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── GET /refresh-token ─────────────────────────────────────────────────────
  describe("GET /refresh-token", () => {
    it("should return 401 when no refresh token is provided", async () => {
      const res = await request(app).get("/api/v1/auth/refresh-token");
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── POST /set-password ─────────────────────────────────────────────────────
  describe("POST /set-password", () => {
    it("should return 404 if user not found", async () => {
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      const res = await request(app)
        .post("/api/v1/auth/set-password")
        .send({ email: "ghost@example.com", password: "NewPass123" });
      expect(res.statusCode).toBe(404);
    });

    it("should return 400 if password already set", async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          email: "test@example.com",
          password: "alreadySet",
          save: jest.fn(),
        }),
      });
      const res = await request(app)
        .post("/api/v1/auth/set-password")
        .send({ email: "test@example.com", password: "NewPass123" });
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 for short password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/set-password")
        .send({ email: "test@example.com", password: "short" });
      expect(res.statusCode).toBe(400);
    });
  });
});
