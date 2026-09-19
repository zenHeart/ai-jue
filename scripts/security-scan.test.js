"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { scanFile } = require("./security-scan");

test("flags camelCase credential fields without echoing their values", () => {
  const findings = scanFile(
    "fixture.json",
    JSON.stringify({
      appSecret: ["neutral", "sensitive", "value"].join("-"),
      gateway: { auth: { token: ["another", "sensitive", "value"].join("-") } },
    }, null, 2),
    [],
  );

  assert.equal(findings.length, 2);
  assert.deepEqual(
    findings.map(({ rule }) => rule),
    [
      "Literal token/secret/password assignment",
      "Literal token/secret/password assignment",
    ],
  );
  assert.ok(findings.every((finding) => !Object.hasOwn(finding, "snippet")));
});

test("accepts environment references and explicit redaction placeholders", () => {
  const findings = scanFile(
    "fixture.json",
    JSON.stringify({
      appSecret: "${APP_SECRET}",
      token: "<REDACTED>",
      password: "placeholder",
    }, null, 2),
    [],
  );

  assert.deepEqual(findings, []);
});
