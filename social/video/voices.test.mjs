// @req REQ-186
// The roster of ElevenLabs voices the series video may use (voices.json): who
// each is, what it is for, and which one is the house voice voice.mjs defaults
// to. A cloned voice is a person's: the roster says so, so nobody picks it
// by accident.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HOUSE_VOICE } from "./voice.mjs";

const roster = JSON.parse(
  readFileSync(new URL("./voices.json", import.meta.url), "utf8")
);

test("every voice has an id, a name, a kind and a use", () => {
  assert.ok(roster.voices.length >= 7);
  for (const voice of roster.voices) {
    assert.match(voice.id, /^[A-Za-z0-9]{20}$/, voice.name);
    assert.ok(voice.name?.trim(), voice.id);
    assert.ok(["professional", "cloned"].includes(voice.kind), voice.name);
    assert.ok(voice.use?.trim(), `${voice.name} has no use`);
  }
  const ids = roster.voices.map((v) => v.id);
  assert.equal(new Set(ids).size, ids.length, "a voice is listed twice");
});

test("the house voice of voice.mjs is the roster's house voice", () => {
  const house = roster.voices.filter((v) => v.role === "house");
  assert.equal(house.length, 1);
  assert.equal(house[0].id, HOUSE_VOICE);
});

test("a cloned voice carries its warning", () => {
  for (const voice of roster.voices.filter((v) => v.kind === "cloned"))
    assert.match(voice.note, /accord/, voice.name);
});

test("a voice is cast by the kind of passage, never twice in one role", () => {
  const roles = roster.voices.map((v) => v.role);
  assert.equal(new Set(roles).size, roles.length);
  for (const role of ["house", "geography", "meaning", "history", "position"])
    assert.ok(roles.includes(role), `no voice for ${role}`);
});
