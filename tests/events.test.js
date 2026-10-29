/**
 * Event Routes Tests
 * Covers: addEvent (admin), getEvent, isMember, getTeams (admin)
 */

import request from "supertest";
import { app } from "../app.js";
import { Events } from "../models/events.js";
import { Members } from "../models/members.js";
import { Team } from "../models/team.js";
import { User } from "../models/user.js";
import { userToken, adminToken, fakeId } from "./helpers.js";

jest.mock("../models/events.js");
jest.mock("../models/members.js");
jest.mock("../models/team.js");
jest.mock("../models/user.js");
jest.mock("../config/database.js", () => jest.fn());
jest.mock("../utils/features.js", () => ({
  convertToDate: jest.fn((d) => new Date()),
  generateRefreshToken: jest.fn().mockResolvedValue("ref_tok"),
  sendJwt: jest.fn(),
  loadSwaggerWithDynamicUrl: jest.fn().mockReturnValue({}),
  generateRandomCode: jest.fn().mockResolvedValue("XYZ"),
  generateCAReferral: jest.fn().mockResolvedValue("CA-REF"),
  generateWinzoUsername: jest.fn().mockResolvedValue("winzo_user"),
  updateCAPoints: jest.fn().mockResolvedValue(true),
}));

const normalUser = { _id: fakeId, role: "user", name: "Normal", email: "u@u.com" };
const adminUser = {
  _id: "64aaaaaaaaaaaaaaaaaaaaa2",
  role: "admin",
  name: "Admin",
  email: "admin@u.com",
};

describe("Event Routes — /api/v1/event", () => {
  // ─── POST / (admin create event) ────────────────────────────────────────────
  describe("POST /event/", () => {
    it("should return 401 when unauthenticated", async () => {
      const res = await request(app).post("/api/v1/event/");
      expect(res.statusCode).toBe(401);
    });

    it("should return 403 when normal user tries to create event", async () => {
      User.findOne.mockResolvedValue(normalUser);
      const res = await request(app)
        .post("/api/v1/event/")
        .set("Authorization", userToken())
        .send({ eventId: "hack25", maxMembers: 4, eventDeadline: "01-12-2025" });
      expect(res.statusCode).toBe(403);
    });

    it("should return 400 for missing eventId", async () => {
      User.findOne.mockResolvedValue(adminUser);
      const res = await request(app)
        .post("/api/v1/event/")
        .set("Authorization", adminToken())
        .send({ maxMembers: 4, eventDeadline: "01-12-2025" });
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 when event already exists", async () => {
      User.findOne.mockResolvedValue(adminUser);
      Events.findOne.mockResolvedValue({ eventId: "hack25" });
      const res = await request(app)
        .post("/api/v1/event/")
        .set("Authorization", adminToken())
        .send({ eventId: "hack25", maxMembers: 4, eventDeadline: "01-12-2025" });
      expect(res.statusCode).toBe(400);
    });

    it("should return 201 when admin creates a valid event", async () => {
      User.findOne.mockResolvedValue(adminUser);
      Events.findOne.mockResolvedValue(null);
      Events.create.mockResolvedValue({
        _id: "evt1",
        eventId: "hack25",
        maxMembers: 4,
      });
      const res = await request(app)
        .post("/api/v1/event/")
        .set("Authorization", adminToken())
        .send({ eventId: "hack25", maxMembers: 4, eventDeadline: "01-12-2025" });
      expect(res.statusCode).toBe(201);
    });
  });

  // ─── GET /:eventId ──────────────────────────────────────────────────────────
  describe("GET /event/:eventId", () => {
    it("should return 404 when event not found", async () => {
      Events.findOne.mockResolvedValue(null);
      const res = await request(app).get("/api/v1/event/nonexistent");
      expect(res.statusCode).toBe(404);
    });

    it("should return 200 for valid event (no auth required)", async () => {
      Events.findOne.mockResolvedValue({ eventId: "hack25", maxMembers: 4 });
      const res = await request(app).get("/api/v1/event/hack25");
      expect(res.statusCode).toBe(200);
      expect(res.body.eventId).toBe("hack25");
    });
  });

  // ─── GET /is_member/:eventId ────────────────────────────────────────────────
  describe("GET /event/is_member/:eventId", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).get("/api/v1/event/is_member/hack25");
      expect(res.statusCode).toBe(401);
    });

    it("should return isMember: false when user is not in the event", async () => {
      User.findOne.mockResolvedValue(normalUser);
      Events.findOne.mockResolvedValue({ _id: "evt1", eventId: "hack25" });
      Members.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      const res = await request(app)
        .get("/api/v1/event/is_member/hack25")
        .set("Authorization", userToken());
      expect(res.statusCode).toBe(200);
      expect(res.body.isMember).toBe(false);
    });

    it("should return isMember: true when user is in the event", async () => {
      User.findOne.mockResolvedValue(normalUser);
      Events.findOne.mockResolvedValue({ _id: "evt1", eventId: "hack25" });
      Members.findOne.mockReturnValue({
        populate: jest
          .fn()
          .mockResolvedValue({ team: { teamName: "Coders" }, user: fakeId }),
      });
      const res = await request(app)
        .get("/api/v1/event/is_member/hack25")
        .set("Authorization", userToken());
      expect(res.statusCode).toBe(200);
      expect(res.body.isMember).toBe(true);
    });
  });

  // ─── GET /teams/:eventId (admin) ────────────────────────────────────────────
  describe("GET /event/teams/:eventId", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).get("/api/v1/event/teams/hack25");
      expect(res.statusCode).toBe(401);
    });

    it("should return 403 when normal user accesses admin route", async () => {
      User.findOne.mockResolvedValue(normalUser);
      const res = await request(app)
        .get("/api/v1/event/teams/hack25")
        .set("Authorization", userToken());
      expect(res.statusCode).toBe(403);
    });

    it("should return 200 for admin", async () => {
      User.findOne.mockResolvedValue(adminUser);
      Events.findOne.mockResolvedValue({ _id: "evt1", eventId: "hack25" });
      Team.aggregate.mockResolvedValue([]);
      const res = await request(app)
        .get("/api/v1/event/teams/hack25")
        .set("Authorization", adminToken());
      expect(res.statusCode).toBe(200);
    });
  });
});
