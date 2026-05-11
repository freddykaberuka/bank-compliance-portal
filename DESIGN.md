# Bank Compliance Portal Design Document

## Architecture Overview

This project is structured as a monolithic web application with a clear separation between backend responsibilities, frontend UI, and database persistence.

### Backend
- **Express API** handles all business operations, including authentication, workflow transitions, document upload, and audit logging.
- **Prisma ORM** manages PostgreSQL access and schema migrations.
- **Middleware** layers enforce security, validation, and error handling.
- **Services** encapsulate business rules and coordinate repository actions.
- **Repositories** provide direct Prisma-based data access, keeping SQL logic out of controllers.
- **Swagger/OpenAPI** documents the API surface and standardizes request/response contracts.

### Frontend
- Built with **React + Vite**, the frontend is responsible for the user dashboard, login flow, application forms, and document management.
- It talks to the backend through REST endpoints under `/auth` and `/applications`.
- React state is managed with **Redux Toolkit** and async thunks for API calls.

### Why this structure
- The architecture keeps the backend lightweight and predictable.
- Controllers stay thin, with validation and business logic moved into services and validators.
- Repositories isolate database concerns, making it easier to replace Prisma or adjust the schema later.
- Swagger is added early to make the API self-documenting and reduce implementation drift.

## Data Model

The data model supports the compliance workflow via four core entities: `User`, `Application`, `Document`, and `AuditLog`.

### User
- `id`: UUID
- `name`: string
- `email`: string
- `password`: hashed string
- `role`: enum (`APPLICANT`, `REVIEWER`, `APPROVER`, `ADMIN`)
- `createdAt`, `updatedAt`

Users are the primary actors. Roles are assigned at signup or by an admin and determine system access.

### Application
- `id`: UUID
- `institutionName`: string
- `licenseType`: enum
- `description`: string | null
- `state`: enum (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`)
- `version`: integer
- `userId`: UUID (applicant owner)
- `reviewedById`: UUID | null
- `approvedById`: UUID | null
- `createdAt`, `updatedAt`

The application entity captures all metadata required for licensing. Versioning tracks concurrent edits and enforces safe transitions.

### Document
- `id`: UUID
- `applicationId`: UUID
- `fileName`: string
- `fileType`: string
- `filePath`: string
- `uploadedAt`: datetime

Documents are linked to applications and stored on disk. The schema is intentionally small and metadata-only, because the binary file itself is persisted outside the DB.

### AuditLog
- `id`: UUID
- `userId`: UUID
- `action`: string
- `entityType`: string
- `entityId`: string
- `details`: JSON | null
- `createdAt`: datetime

Audit logs provide a compliance trail for every meaningful change. The design captures who did what and when, without allowing silent deletion.

## State Machine

The application workflow is modelled as a finite state machine.

### States
- `DRAFT`
- `SUBMITTED`
- `UNDER_REVIEW`
- `APPROVED`
- `REJECTED`

### Valid transitions
- `DRAFT` -> `SUBMITTED`
- `SUBMITTED` -> `UNDER_REVIEW`
- `UNDER_REVIEW` -> `APPROVED`
- `UNDER_REVIEW` -> `REJECTED`

### Rules
- Only applicants can create and submit applications.
- A submitted application is the trigger point for review.
- Reviewers can move applications from `SUBMITTED` to `UNDER_REVIEW` and request more info.
- Approvers can finalize the workflow by approving or rejecting applications.
- Terminal states are `APPROVED` and `REJECTED`; no further transitions happen without an explicit redesign.
- The service layer validates state transitions using a workflow helper to prevent invalid moves.

This design keeps review behavior strict and easy to reason about.

## Roles

### APPLICANT
Can:
- create applications
- edit their own draft applications
- submit applications
- upload supporting documents
- view their own applications and attached documents

Cannot:
- review or approve applications
- view or modify other users' applications

### REVIEWER
Can:
- view submitted applications
- move applications into review
- request more information
- access documents required for evaluation

Cannot:
- approve or reject final applications
- change application ownership

### APPROVER
Can:
- approve applications
- reject applications
- finalize workflow state

Cannot:
- create applications on behalf of others
- bypass audit logging

### ADMIN
Can:
- access all endpoints
- inspect audit logs
- manage users and roles

The lines are drawn so that application ownership stays with the applicant, the review process is separated from final approval, and audit authority is reserved for admins.

## Hard Decisions and Trade-offs

### Non-negotiable requirement: audit trail integrity
- Implementation: every workflow and document action writes an `AuditLog` entry.
- Rationale: compliance systems must keep an immutable history of operations.
- If more time: I'd add an append-only audit store and support event sourcing for stronger integrity.

### Non-negotiable requirement: JWT authentication
- Implementation: JWT tokens are required for all protected endpoints and validated in `authMiddleware.ts`.
- Rationale: JWT is simple, stateless, and fits the REST architecture.
- If more time: I would add refresh tokens and token revocation to reduce risk from stolen tokens.

### Non-negotiable requirement: workflow state enforcement
- Implementation: state transitions are validated in business logic and enforced by role middleware.
- Rationale: a bug that allows invalid transitions would break compliance flow.
- If more time: I would add database-level state constraints and optimistic locking around `version` to make concurrency explicit.

### Non-negotiable requirement: secure document upload
- Implementation: files are stored with unique names outside the HTTP root and upload limits are enforced.
- Rationale: document handling is one of the highest risk areas for injection, overwrites, or unauthorized access.
- If more time: I'd move file storage to S3/Azure Blob with signed URLs and virus scanning.

### Hard decision: monolithic service vs microservices
- Implementation: kept one backend service.
- Rationale: this repository is a compliance portal MVP; a single service is easier to reason about, deploy, and maintain for the current scope.
- If more time: I would split the app into a dedicated auth service, workflow service, and document service once the feature set grows.

### Hard decision: filesystem storage for documents
- Implementation: use local `./uploads` storage.
- Rationale: it is easy to set up and works for single-instance deployments.
- If more time: I would replace this with object storage and add lifecycle policies for long-term compliance.

### Hard decision: manual API documentation
- Implementation: added Swagger/OpenAPI spec manually and exposed it via `/api-docs`.
- Rationale: this ensures the API remains discoverable and testable even if the frontend changes independently.
- If more time: I would integrate runtime decorators or a generator to keep docs and code in sync automatically.

## What I would add with more time
- stronger concurrency support via optimistic locking on applications
- richer document metadata and version history
- email notifications and audit-based reporting dashboards
- fine-grained permission checks beyond role-level authorization
- an approval delegation model for large compliance teams
