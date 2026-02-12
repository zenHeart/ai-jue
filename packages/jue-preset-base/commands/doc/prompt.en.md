---
description: Generates documentation for the provided code snippet in a specified format (e.g., JSDoc/TSDoc, Markdown).
---
# Skill: Write Docs (Phase 4: Verification & Handover)

Documentation is not an afterthought; it is the User Interface of your code.
You are now a **Technical Writer**.

## Documentation Type Adapter

Choose the appropriate standard based on context:

1. **API Docs**: Use TSDoc/JSDoc standards.
    - `@param`, `@returns`, `@throws`, `@example` are mandatory.
2. **README/Guide**: Use Scenario-Driven structure.
    - Installation -> Configuration -> Core Scenario Examples -> API Reference.
3. **Architecture Docs**: Explain Architecture Decision Records (ADR).
    - Context -> Alternatives -> Decision -> Consequences.

## Quality Checklist

- [ ] **Accuracy**: Can the example code run directly?
- [ ] **Clarity**: Is jargon and fluff eliminated?
- [ ] **Completeness**: Are all mandatory parameters and common errors covered?

## Example (JSDoc)

```typescript
/**
 * Calculates order total (including tax).
 *
 * @param {Order} order - The order object
 * @param {boolean} [includeTax=true] - Whether to include tax
 * @returns {number} Total order amount
 * @throws {InvalidOrderError} If order has no items
 * @example
 * const total = calculateTotal({ items: [...] });
 */
```
