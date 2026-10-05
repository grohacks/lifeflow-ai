# LifeFlow AI — Security Architecture & Compliance

LifeFlow AI is engineered in strict adherence to healthcare data governance principles (HIPAA technical safeguards and GDPR data minimization).

---

## 1. Authentication & Authorization

### 1.1 Stateless JWT Authentication
- All client sessions authenticate via `POST /api/auth/login`.
- Upon successful credential verification, the server issues an HMAC-SHA256 signed JSON Web Token (JWT) containing:
  - Subject: `username`
  - Claims: `roles` (`ROLE_PARAMEDIC`, `ROLE_ADMIN`, etc.)
  - Issuer: `LifeFlow-AI`
  - Expiration: Configurable (default 24 hours).
- Passwords are cryptographically salted and hashed using **BCrypt** with a work factor of 10.

### 1.2 Role-Based Access Control (RBAC) Matrix

| Operational Capability | Admin | Paramedic | Control Operator | Hospital Coordinator | Clinician |
|---|:---:|:---:|:---:|:---:|:---:|
| Ingest sensor telemetry | ✓ | ✓ | ✓ | - | - |
| Register patient cases | ✓ | ✓ | - | - | - |
| Enter clinical interventions | ✓ | ✓ | - | - | ✓ |
| Trigger destination re-evaluation | ✓ | ✓ | ✓ | - | - |
| Confirm destination & pre-alert | ✓ | ✓ | ✓ | - | - |
| Acknowledge hospital pre-alert | ✓ | - | - | ✓ | ✓ |
| Update hospital bed capacity | ✓ | - | - | ✓ | - |
| View regulatory audit log | ✓ | - | ✓ | - | - |
| Manage users & system config | ✓ | - | - | - | - |

---

## 2. Distributed Tracing & End-to-End Auditing

### 2.1 Correlation ID Tracing
- Every inbound request is assigned or inspected for an `X-Correlation-Id` HTTP header.
- The `CorrelationIdFilter` binds this ID to the logging Mapped Diagnostic Context (MDC).
- Outbound responses and downstream microservice requests inherit this ID, providing unified cross-tier trace logs.

### 2.2 Immutable Audit Trail
- Clinical decisions, destination selections, manual overrides, and system parameter updates trigger synchronous writes to the `audit_events` table.
- Audit records store actor username, role, client IP address, correlation ID, and an exhaustive JSON snapshot of the action.
- Update and delete operations on the audit repository are architecturally prohibited.
