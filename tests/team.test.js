/**
 * Team Routes Tests
 * Covers: create, delete, changeLeader, myTeams, name_available
 */

import request from "supertest";
import { app } from "../app.js";
import { Team } from "../models/team.js";
import { Members } from "../models/members.js";
import { Events } from "../models/events.js";
import { adminToken, userToken, fakeId } from "./helpers.js";
import { User } from "../models/user.js";

jest.mock("../models/team.js");
jest.mock("../models/members.js");
jest.mock("../models/events.js");
jest.mock("../models/user.js");
jest.mock("../models/session.js");
jest.mock("../config/database.js", () => jest.fn());
jest.mock("../utils/features.js", () => ({
  generateRandomCode: jest.fn().mockResolvedValue("ABC123"),
  updateCAPoints: jest.fn().mockResolvedValue(true),
  generateRefreshToken: jest.fn().mockResolvedValue("ref_tok"),
  sendJwt: jest.fn(),
  loadSwaggerWithDynamicUrl: jest.fn().mockReturnValue({}),
  generateCAReferral: jest.fn().mockResolvedValue("CA-REF"),
  generateWinzoUsername: jest.fn().mockResolvedValue("winzo_user"),
  convertToDate: jest.fn((d) => new Date(d)),
}));

const mockUser = {
  _id: fakeId,
  name: "Test User",
  email: "test@example.com",
  role: "user",
  referredBy: null,
};

const mockEvent = {
  _id: "event123",
  eventId: "hackathon2025",
  maxMembers: 4,
  registrations_open: true,
  eventDeadline: new Date(Date.now() + 86400000), // tomorrow
};

beforeEach(() => {
  jest.clearAllMocks();
  User.findOne.mockResolvedValue(mockUser);
});

describe("Team Routes — /api/v1/team", () => {
  // ─── POST /create ───────────────────────────────────────────────────────────
  describe("POST /team/create", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app)
        .post("/api/v1/team/create")
        .send({ teamName: "Coders", eventId: "hackathon2025" });
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 when event not found", async () => {
      Events.findOne.mockResolvedValue(null);
      const res = await request(app)
        .post("/api/v1/team/create")
        .set("Authorization", userToken())
        .send({ teamName: "Coders", eventId: "nonexistent" });
      expect(res.statusCode).toBe(404);
    });

    it("should return 400 when registrations are closed", async () => {
      Events.findOne.mockResolvedValue({ ...mockEvent, registrations_open: false });
      const res = await request(app)
        .post("/api/v1/team/create")
        .set("Authorization", userToken())
        .send({ teamName: "Coders", eventId: "hackathon2025" });
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 when team name already exists", async () => {
      Events.findOne.mockResolvedValue(mockEvent);
      Team.findOne.mockResolvedValue({ teamName: "Coders" });
      const res = await request(app)
        .post("/api/v1/team/create")
        .set("Authorization", userToken())
        .send({ teamName: "Coders", eventId: "hackathon2025" });
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 when user is already registered in the event", async () => {
      Events.findOne.mockResolvedValue(mockEvent);
      Team.findOne.mockResolvedValue(null);
      Members.findOne.mockResolvedValue({ user: fakeId, event: "event123" });
      const res = await request(app)
        .post("/api/v1/team/create")
        .set("Authorization", userToken())
        .send({ teamName: "Coders", eventId: "hackathon2025" });
      expect(res.statusCode).toBe(400);
    });

    it("should return 201 and create a team for valid data", async () => {
      Events.findOne.mockResolvedValue(mockEvent);
      Team.findOne.mockResolvedValue(null);
      Members.findOne.mockResolvedValue(null);
      Team.create.mockResolvedValue({ _id: "team1", teamName: "Coders", teamCode: "ABC123" });
      Members.create.mockResolvedValue({});

      const res = await request(app)
        .post("/api/v1/team/create")
        .set("Authorization", userToken())
        .send({ teamName: "Coders", eventId: "hackathon2025" });
      expect(res.statusCode).toBe(201);
      expect(res.body.teamCode).toBe("ABC123");
    });
  });

  // ─── DELETE /team ───────────────────────────────────────────────────────────
  describe("DELETE /team/", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).delete("/api/v1/team/").send({ teamCode: "ABC123" });
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 when team not found", async () => {
      Team.findOne.mockResolvedValue(null);
      const res = await request(app)
        .delete("/api/v1/team/")
        .set("Authorization", userToken())
        .send({ teamCode: "NOTREAL" });
      expect(res.statusCode).toBe(404);
    });

    it("should return 403 when user is not the leader", async () => {
      Team.findOne.mockResolvedValue({
        teamCode: "ABC123",
        teamLeader: "otherUserId",
      });
      const res = await request(app)
        .delete("/api/v1/team/")
        .set("Authorization", userToken())
        .send({ teamCode: "ABC123" });
      expect(res.statusCode).toBe(403);
    });

    it("should return 200 when leader deletes team", async () => {
      Team.findOne.mockResolvedValue({
        _id: "team1",
        teamCode: "ABC123",
        teamLeader: fakeId,
        toString: () => fakeId,
      });
      Members.find.mockResolvedValue([]);
      Team.deleteOne.mockResolvedValue({});
      Members.deleteMany.mockResolvedValue({});

      const res = await request(app)
        .delete("/api/v1/team/")
        .set("Authorization", userToken())
        .send({ teamCode: "ABC123" });
      expect(res.statusCode).toBe(200);
    });
  });

  // ─── PATCH /changeLeader ────────────────────────────────────────────────────
  describe("PATCH /team/changeLeader", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).patch("/api/v1/team/changeLeader");
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 when team not found", async () => {
      Team.findOne.mockResolvedValue(null);
      const res = await request(app)
        .patch("/api/v1/team/changeLeader")
        .set("Authorization", userToken())
        .send({ teamCode: "NOTREAL", newLeader: "user2" });
      expect(res.statusCode).toBe(404);
    });
  });

  // ─── GET /myTeams ────────────────────────────────────────────────────────────
  describe("GET /team/myTeams", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).get("/api/v1/team/myTeams");
      expect(res.statusCode).toBe(401);
    });

    it("should return 200 with team list", async () => {
      Team.aggregate.mockResolvedValue([]);
      const res = await request(app)
        .get("/api/v1/team/myTeams")
        .set("Authorization", userToken());
      expect(res.statusCode).toBe(200);
    });
  });

  // ─── POST /name_available ────────────────────────────────────────────────────
  describe("POST /team/name_available", () => {
    it("should return success if name is available", async () => {
      Events.findOne.mockResolvedValue(mockEvent);
      Team.findOne.mockResolvedValue(null);
      const res = await request(app)
        .post("/api/v1/team/name_available")
        .send({ name: "UniqueTeam", eventId: "hackathon2025" });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
    });

    it("should return failure if name is taken", async () => {
      Events.findOne.mockResolvedValue(mockEvent);
      Team.findOne.mockResolvedValue({ teamName: "TakenName" });
      const res = await request(app)
        .post("/api/v1/team/name_available")
        .send({ name: "TakenName", eventId: "hackathon2025" });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("failure");
    });

    it("should return 404 when event not found", async () => {
      Events.findOne.mockResolvedValue(null);
      const res = await request(app)
        .post("/api/v1/team/name_available")
        .send({ name: "AnyName", eventId: "badEvent" });
      expect(res.statusCode).toBe(404);
    });
  });
});
