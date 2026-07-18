# Read-Only All-Features Architecture Exploration

## Objective

Perform a comprehensive, read-only exploration of the entire 8ball repository to understand its current architecture, implemented features, internal systems, boundaries, workflows, and technical risks.

This is an authorized repository audit under the rules defined in `AGENTS.md`.

## Scope

You are authorized to inspect all repository-controlled files necessary to understand:

- Application architecture
- User-facing features and flows
- Calculation and interpretation engines
- Data models and schemas
- UI components and rendering paths
- CLI and developer tooling
- Tests, fixtures, and validation systems
- Build, deployment, and CI configuration
- Documentation and doctrine files
- Feature flags, experimental code, and parked features
- External integrations and environment-variable interfaces
- Security, privacy, reliability, and maintainability risks
- Dead code, duplicated systems, unclear boundaries, and architectural drift

Follow references across files when needed. Do not restrict the exploration to files named in this brief.

## Permissions

This audit explicitly permits:

- Read-only inspection of the complete repository
- Repository-wide search
- Reading source code, tests, documentation, configuration, scripts, and Git metadata
- Running non-mutating inspection commands
- Running existing tests, linters, type checks, build checks, or verification commands when they do not modify repository-controlled files
- Comparing documentation claims against implemented behavior
- Identifying discrepancies, risks, incomplete work, and undocumented features

## Prohibited Actions

Do not:

- Modify, create, delete, rename, format, or regenerate repository files
- Apply fixes
- Commit or push changes
- Open or modify pull requests
- Install or upgrade dependencies
- Run destructive commands
- Access secrets or print secret values
- Trigger production deployments
- Change external systems, accounts, databases, analytics, or services

If a command might mutate the repository or an external system, do not run it.

## Audit Method

1. Read `AGENTS.md` and all applicable nested instruction files.
2. Establish the repository structure and identify major subsystems.
3. Trace every discoverable user-facing feature from entry point to implementation.
4. Trace major internal workflows, calculation paths, data transformations, and rendering paths.
5. Review tests and documentation to determine intended versus actual behavior.
6. Identify architectural strengths, weaknesses, ambiguities, and risks.
7. Distinguish verified facts from reasonable inferences.
8. Cite concrete file paths and line ranges for every significant finding.
9. Continue until the repository has been explored broadly enough that no major subsystem or implemented feature remains unaccounted for.

## Required Output

Return a single audit report containing:

### 1. Executive Summary

A concise description of what the repository is, how it is structured, and the most important findings.

### 2. Repository Map

Major directories, files, subsystems, and their responsibilities.

### 3. Feature Inventory

Every implemented, partially implemented, experimental, hidden, parked, or deprecated feature you can verify.

For each feature, include:

- Purpose
- Entry point
- Main implementation files
- Supporting data or engine
- Test coverage
- Current status
- Notable risks or inconsistencies

### 4. Architecture and Data Flow

Explain the principal execution paths, including:

- Input acquisition
- Validation
- Calculation or transformation
- State management
- Rendering
- Persistence, if any
- External integrations
- Error handling

Use textual diagrams where useful.

### 5. Engine and Domain-System Inventory

Document each calculation, symbolism, interpretation, classification, or domain engine, including how engines depend on or interact with one another.

### 6. Developer and Operational Tooling

Cover:

- CLI tools
- Scripts
- Verification commands
- CI
- Build system
- Deployment configuration
- Local-development workflow
- Documentation-generation or synchronization systems

### 7. Test and Verification Assessment

Report:

- Test organization
- What is strongly covered
- What is weakly covered
- Gaps between tests and real behavior
- Brittle or misleading verification
- Tests that appear redundant, obsolete, or insufficient

### 8. Documentation Versus Implementation

Identify where doctrine, READMEs, plans, comments, or architecture documents differ from the current code.

### 9. Risk Register

Rank findings by severity:

- Critical
- High
- Medium
- Low
- Informational

For each risk, include evidence, impact, and a non-implemented recommendation.

### 10. Open Questions

List architectural questions that cannot be resolved from repository evidence alone.

### 11. Suggested Follow-Up Audits

Recommend tightly scoped future audit briefs, but do not begin them.

## Evidence Standard

Every material claim must include repository evidence using file paths and line references.

Do not claim that something is absent until you have searched for reasonable alternative names and implementations.

Label conclusions as one of:

- Verified
- Strong inference
- Unresolved

## Completion Condition

The audit is complete only when:

- All major directories have been classified
- Every discoverable user-facing feature has been inventoried
- Major execution and data flows have been traced
- Tests, tooling, CI, deployment, and documentation have been reviewed
- Significant risks and unresolved architectural questions have been documented

Stop after producing the report. Do not make repository changes.
