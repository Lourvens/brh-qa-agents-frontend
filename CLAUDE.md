# CLAUDE.md

## Commands

```bash
bun x tsgo
```

Run `bun x tsgo` for TypeScript type checking after frontend code changes.

## Maintainability

Split project-owned application files over 200 lines by responsibility using DRY and separation-of-concerns principles. Exclude `components/ui/**`, `components/ai-elements/**`, generated files, and vendor-derived primitives unless the task explicitly targets them.
