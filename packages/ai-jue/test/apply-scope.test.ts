import path from "path";
import { describe, expect, it } from "vitest";
import {
  assertAdapterSupportsScope,
  resolveApplyScope,
  resolveArtifactRoot,
} from "../src/apply-scope";

describe("apply scope resolution", () => {
  it("uses CLI scope before target config and project default", () => {
    expect(resolveApplyScope("user", "project")).toBe("user");
    expect(resolveApplyScope(undefined, "user")).toBe("user");
    expect(resolveApplyScope(undefined, undefined)).toBe("project");
  });

  it("resolves user scope independently from the config project", () => {
    expect(resolveArtifactRoot("project", "/workspace/project", "/users/tester")).toBe(
      path.resolve("/workspace/project"),
    );
    expect(resolveArtifactRoot("user", "/workspace/project", "/users/tester")).toBe(
      path.resolve("/users/tester"),
    );
  });

  it("keeps an Adapter without scope metadata project-only", () => {
    expect(() => assertAdapterSupportsScope("legacy", undefined, "project")).not.toThrow();
    expect(() => assertAdapterSupportsScope("legacy", undefined, "user")).toThrow(
      'Adapter "legacy" does not support apply scope "user"',
    );
  });
});
