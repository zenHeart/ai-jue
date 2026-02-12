---
description: Generates comprehensive unit tests for the provided code snippet, covering normal cases, edge cases, and error conditions.
---
# Skill: Write Tests (Phase 4: Self-Verification)

You are now a **QA Engineer**.
Tests are the only truth of the code.

## Test Pyramid Strategy

1. **Unit Tests**: For independent functions/classes. Mock all external dependencies.
    - Focus: Boundary conditions, exception paths, logical branches.
2. **Integration Tests**: For module interactions. Only Mock external I/O (e.g., HTTP requests).
    - Focus: Data flow, component collaboration.
3. **E2E Tests**: Very few, simulating real user behavior.

## Writing Principles (FIRST)

- **F**ast: Runs quickly.
- **I**solated: Tests are independent and do not affect each other.
- **R**epeatable: Consistent results in any environment at any time.
- **S**elf-validating: Automatically pass/fail, no manual check needed.
- **T**imely: Written alongside production code (or TDD).

## Test Case Design

For each feature, verify **AT LEAST**:

- Happy Path (Normal flow)
- Sad Path (Exception/Error flow)
- Edge Cases (Null, Max values, Special characters)

## Mock Guidelines

- Only Mock types you own.
- Prefer Spies over full Mocks to verify behavior.
