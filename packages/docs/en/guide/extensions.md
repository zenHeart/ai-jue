# Extending Jue

> [!WARNING]
> This page defines the target contract. The Extension Host is not implemented.
> See [Implementation Status](../developer/implementation-status.md).

Write an Extension only to add Agent support. Users install an ordinary npm
package and reference it in project config.

1. Create an npm package and use `exports` for the entrypoint.
2. Declare compatible Jue versions through `peerDependencies`.
3. Implement Adapter `read`, `write`, and `confirm`.
4. Export `defineExtension({ adapters: [...] })`.
5. Test Capability mapping, round trips, idempotency, field preservation,
   permissions, and native confirmation.
6. Update the Agent support profile.

Agent Plugins and Bundles are Artifact changes returned by the Adapter.
Core authorizes and executes those changes; Extensions do not duplicate write,
transaction, or permission logic.

See the [Adapter standard](../architecture/adapter-standardization.md),
[Extension API](../reference/extension-api.md).
