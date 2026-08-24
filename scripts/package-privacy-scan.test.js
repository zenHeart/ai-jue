"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { parseReleaseItems, scanText } = require("./package-privacy-scan");

test("parses only explicit release package entries", () => {
  assert.deepEqual(
    parseReleaseItems("# Release\n\n- adapter-a@v1.2.3\n- adapter-b@v2.0.0\n"),
    [
      { name: "adapter-a", version: "1.2.3" },
      { name: "adapter-b", version: "2.0.0" },
    ],
  );
});

test("blocks credentials and private machine identity", () => {
  const findings = scanText(
    [
      "token=ghp_123456789012345678901234567890 # not-a-real",
      "PASSWORD='not-a-real-password'",
      "owner@example.invalid",
      "/Users/private-user/project # not-a-real",
      "http://192.168.1.10/service # not-a-real",
    ].join("\n"),
  );
  assert.deepEqual(
    findings.map((finding) => finding.rule),
    [
      "GitHub token",
      "Literal credential assignment",
      "Email address",
      "macOS home path",
      "Private/internal IPv4 address",
    ],
  );
});

test("allows public project metadata without an email", () => {
  assert.deepEqual(
    scanText('{"name":"ZenHeart","url":"https://github.com/zenHeart"}'),
    [],
  );
});
