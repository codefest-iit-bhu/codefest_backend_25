/**
 * CA (Campus Ambassador) Routes Tests
 * Covers: register, getMyRequest, getAllRequests, updateRequest, getCALeaderboard
 */

import request from "supertest";
import { app } from "../app.js";
import { CARequest } from "../models/ca_request.js";
import { User } from "../models/user.js";
import { userToken, adminToken, fakeId } from "./helpers.js";

jest.mock("../models/ca_request.js");
jest.mock("../models/user.js");
jest.mock("../config/database.js", () => jest.fn());
jest.mock("../utils/features.js", () => ({
  generateCAReferral: jest.fn().mockResolvedValue("CA-REFXYZ"),
  updateCAPoints: jest.fn().mockResolvedValue(true),
  generateRefreshToken: jest.fn().mockResolvedValue("ref_tok"),
  sendJwt: jest.fn(),
  loadSwaggerWithDynamicUrl: jest.fn().mockReturnValue({}),
  generateRandomCode: jest.fn().mockResolvedValue("XYZ"),
  generateWinzoUsername: jest.fn().mockResolvedValue("winzo_user"),
  convertToDate: jest.fn((d) => new Date(d)),
}));

const normalUser = { _id: fakeId, role: "user", name: "Normal", email: "u@u.com" };
const adminUser = {
  _id: "64aaaaaaaaaaaaaaaaaaaaa2",
  role: "admin",
  name: "Admin",
  email: "admin@u.com",
};

describe("CA Routes — /api/v1/ca", () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── POST /ca (register) ────────────────────────────────────────────────────
  describe("POST /ca/", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).post("/api/v1/ca/");
      expect(res.statusCode).toBe(401);
    });

    it("should return 400 when CA request already exists", async () => {
      User.findOne.mockResolvedValue(normalUser);
      CARequest.findOne.mockResolvedValue({ user: fakeId });
      const res = await request(app)
        .post("/api/v1/ca/")
        .set("Authorization", userToken())
        .send({
          institute: "MIT",
          branch: "CSE",
          graduation_year: "2026",
          contact_number: "9876543210",
          whatsapp_number: "9876543210",
        });
      expect(res.statusCode).toBe(400);
    });

    it("should return 201 on valid CA registration", async () => {
      User.findOne.mockResolvedValue(normalUser);
      CARequest.findOne.mockResolvedValue(null);
      CARequest.create.mockResolvedValue({
        _id: "ca1",
        user: fakeId,
        referralCode: "CA-REFXYZ",
        status: "pending",
      });
      const res = await request(app)
        .post("/api/v1/ca/")
        .set("Authorization", userToken())
        .send({
          institute: "MIT",
          branch: "CSE",
          graduation_year: "2026",
          contact_number: "9876543210",
          whatsapp_number: "9876543210",
          userDescription: "Passionate about tech",
        });
      expect(res.statusCode).toBe(201);
    });
  });

  // ─── GET /ca/my ─────────────────────────────────────────────────────────────
  describe("GET /ca/my", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).get("/api/v1/ca/my");
      expect(res.statusCode).toBe(401);
    });

    it("should return 200 and empty object when no request found", async () => {
      User.findOne.mockResolvedValue(normalUser);
      CARequest.findOne.mockResolvedValue(null);
      const res = await request(app)
        .get("/api/v1/ca/my")
        .set("Authorization", userToken());
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({});
    });

    it("should return 200 with CA request data", async () => {
      User.findOne.mockResolvedValue(normalUser);
      CARequest.findOne.mockResolvedValue({ status: "pending", user: fakeId });
      const res = await request(app)
        .get("/api/v1/ca/my")
        .set("Authorization", userToken());
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("pending");
    });
  });

  // ─── GET /ca/all ────────────────────────────────────────────────────────────
  describe("GET /ca/all", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).get("/api/v1/ca/all");
      expect(res.statusCode).toBe(401);
    });

    it("should return 403 when normal user accesses admin route", async () => {
      User.findOne.mockResolvedValue(normalUser);
      const res = await request(app)
        .get("/api/v1/ca/all")
        .set("Authorization", userToken());
      expect(res.statusCode).toBe(403);
    });

    it("should return 200 for admin with list of requests", async () => {
      User.findOne.mockResolvedValue(adminUser);
      CARequest.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([{ status: "pending" }]),
      });
      const res = await request(app)
        .get("/api/v1/ca/all")
        .set("Authorization", adminToken());
      expect(res.statusCode).toBe(200);
    });
  });

  // ─── GET /ca/leaderboard ────────────────────────────────────────────────────
  describe("GET /ca/leaderboard", () => {
    it("should return 200 with leaderboard (no auth required)", async () => {
      CARequest.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { user: { name: "Alice" }, institute: "MIT", points: 100 },
          ]),
        }),
      });
      const res = await request(app).get("/api/v1/ca/leaderboard");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── PATCH /ca/:id ──────────────────────────────────────────────────────────
  describe("PATCH /ca/:id", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).patch(`/api/v1/ca/${fakeId}`);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 when CA request not found", async () => {
      User.findOne.mockResolvedValue(normalUser);
      CARequest.findOne.mockResolvedValue(null);
      const res = await request(app)
        .patch(`/api/v1/ca/${fakeId}`)
        .set("Authorization", userToken())
        .send({ status: "pending" });
      expect(res.statusCode).toBe(404);
    });

    it("should return 403 when non-admin tries to change status to approved", async () => {
      User.findOne.mockResolvedValue(normalUser);
      CARequest.findOne.mockResolvedValue({ _id: fakeId, status: "pending" });
      const res = await request(app)
        .patch(`/api/v1/ca/${fakeId}`)
        .set("Authorization", userToken())
        .send({ status: "approved" });
      expect(res.statusCode).toBe(403);
    });
  });
});
