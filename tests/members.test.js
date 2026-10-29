/**
 * Member Routes Tests
 * Covers: join, getMembers, deleteMember
 */

import request from "supertest";
import { app } from "../app.js";
import { Members } from "../models/members.js";
import { Team } from "../models/team.js";
import { Events } from "../models/events.js";
import { User } from "../models/user.js";
import { userToken, fakeId } from "./helpers.js";

jest.mock("../models/members.js");
jest.mock("../models/team.js");
jest.mock("../models/events.js");
jest.mock("../models/user.js");
jest.mock("../config/database.js", () => jest.fn());
jest.mock("../utils/features.js", () => ({
  updateCAPoints: jest.fn().mockResolvedValue(true),
  generateRefreshToken: jest.fn().mockResolvedValue("ref_tok"),
  sendJwt: jest.fn(),
  loadSwaggerWithDynamicUrl: jest.fn().mockReturnValue({}),
  generateRandomCode: jest.fn().mockResolvedValue("XYZ"),
  generateCAReferral: jest.fn().mockResolvedValue("CA-REF"),
  generateWinzoUsername: jest.fn().mockResolvedValue("winzo_user"),
  convertToDate: jest.fn((d) => new Date(d)),
}));

const mockUser = { _id: fakeId, name: "Test User", email: "test@example.com", role: "user" };
const mockEvent = {
  _id: "evt1",
  eventId: "hack25",
  maxMembers: 4,
  registrations_open: true,
  eventDeadline: new Date(Date.now() + 86400000),
};

beforeEach(() => {
  jest.clearAllMocks();
  User.findOne.mockResolvedValue(mockUser);
});

describe("Member Routes — /api/v1/member", () => {
  // ─── POST /join ────────────────────────────────────────────────────────────
  describe("POST /member/join", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).post("/api/v1/member/join").send({ teamCode: "ABC123" });
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 when team not found", async () => {
      Team.findOne.mockResolvedValue(null);
      const res = await request(app)
        .post("/api/v1/member/join")
        .set("Authorization", userToken())
        .send({ teamCode: "INVALID" });
      expect(res.statusCode).toBe(404);
    });

    it("should return 400 when registrations are closed", async () => {
      Team.findOne.mockResolvedValue({ _id: "team1", event: "evt1", teamCode: "ABC" });
      Members.find.mockResolvedValue([]);
      Events.findById.mockResolvedValue({ ...mockEvent, registrations_open: false });
      const res = await request(app)
        .post("/api/v1/member/join")
        .set("Authorization", userToken())
        .send({ teamCode: "ABC" });
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 when team is full", async () => {
      Team.findOne.mockResolvedValue({ _id: "team1", event: "evt1", teamCode: "ABC" });
      Members.find.mockResolvedValue([{}, {}, {}, {}]); // 4 members = full
      Events.findById.mockResolvedValue(mockEvent);
      const res = await request(app)
        .post("/api/v1/member/join")
        .set("Authorization", userToken())
        .send({ teamCode: "ABC" });
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 when user is already registered", async () => {
      Team.findOne.mockResolvedValue({ _id: "team1", event: "evt1", teamCode: "ABC" });
      Members.find.mockResolvedValue([{}]);
      Events.findById.mockResolvedValue(mockEvent);
      Members.findOne.mockResolvedValue({ user: fakeId, event: "evt1" });
      const res = await request(app)
        .post("/api/v1/member/join")
        .set("Authorization", userToken())
        .send({ teamCode: "ABC" });
      expect(res.statusCode).toBe(400);
    });

    it("should return 201 when join is successful", async () => {
      Team.findOne.mockResolvedValue({ _id: "team1", event: "evt1", teamCode: "ABC" });
      Members.find.mockResolvedValue([{}]);
      Events.findById.mockResolvedValue(mockEvent);
      Members.findOne.mockResolvedValue(null);
      Members.create.mockResolvedValue({});
      const res = await request(app)
        .post("/api/v1/member/join")
        .set("Authorization", userToken())
        .send({ teamCode: "ABC" });
      expect(res.statusCode).toBe(201);
    });
  });

  // ─── GET /getMembers/:teamId ────────────────────────────────────────────────
  describe("GET /member/getMembers/:teamId", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).get(`/api/v1/member/getMembers/${fakeId}`);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 when team has no members", async () => {
      Members.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) });
      const res = await request(app)
        .get(`/api/v1/member/getMembers/${fakeId}`)
        .set("Authorization", userToken());
      expect(res.statusCode).toBe(404);
    });

    it("should return 200 with members list", async () => {
      Members.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([{ user: { name: "Alice" } }]),
      });
      const res = await request(app)
        .get(`/api/v1/member/getMembers/${fakeId}`)
        .set("Authorization", userToken());
      expect(res.statusCode).toBe(200);
      expect(res.body.members).toBeDefined();
    });
  });

  // ─── DELETE /member ─────────────────────────────────────────────────────────
  describe("DELETE /member/", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).delete("/api/v1/member/");
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 when user is neither leader nor the member", async () => {
      const someOtherId = "64cccccccccccccccccccc99";
      Members.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          team: { teamLeader: { toString: () => someOtherId } },
          user: fakeId,
        }),
      });
      const res = await request(app)
        .delete("/api/v1/member/")
        .set("Authorization", userToken())
        .send({ userId: "64cccccccccccccccccccc88", teamId: "64cccccccccccccccccccc77" });
      expect(res.statusCode).toBe(401);
    });
  });
});
