import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeContracts = {
  "routes/auth.js": ["post(\"/signup\"", "post(\"/verify_email\"", "post(\"/login\"", "delete(\"/logout\"", "get(\"/refresh-token\"", "post(\"/set-password\""],
  "routes/team.js": ["post(\"/create\"", "delete(\"/\"", "patch(\"/changeLeader\"", "get(\"/myTeams\"", "post(\"/name_available\""],
  "routes/members.js": ["post(\"/join\"", "get(\"/getMembers/:teamId\"", "delete(\"/\""],
  "routes/ca.js": ["post(\"/\"", "get(\"/my\"", "patch(\"/:id\"", "get(\"/all\"", "get(\"/leaderboard\""],
  "routes/user.js": ["get(\"/all\"", "route(\"/:id\")", "get(\"/me\""],
  "routes/events.js": ["post(\"/\"", "get(\"/is_member/:eventId\"", "get(\"/teams/:eventId\"", "get(\"/:eventId\""],
  "routes/winzo.js": ["route(\"/referrals\")", "patch(\"/referral/:id\"", "patch(\"/points\"", "get(\"/leaderboard\""],
  "routes/stockGame.js": ["post(\"/config\"", "post(\"/start/:gameId\"", "post(\"/end-round/:gameId\"", "post(\"/start-next-round/:gameId\"", "post(\"/advance/:gameId\"", "get(\"/all\"", "get(\"/active\"", "get(\"/my-games\"", "get(\"/details/:gameId\"", "post(\"/join/:gameId\"", "get(\"/state/:gameId\"", "post(\"/buy/:gameId\"", "post(\"/sell/:gameId\"", "get(\"/leaderboard/:gameId\""],
};

test("application mounts every versioned route group", async () => {
  const app = await readFile("app.js", "utf8");
  for (const prefix of ["auth", "team", "member", "ca", "user", "event", "winzo", "stockGame"]) {
    assert.match(app, new RegExp(`/api/v1/${prefix}`));
  }
});

for (const [file, signatures] of Object.entries(routeContracts)) {
  test(`${file} exposes its documented route contract`, async () => {
    const source = await readFile(file, "utf8");
    for (const signature of signatures) assert.ok(source.includes(signature), `Missing ${signature} in ${file}`);
  });
}