# Phase 2a — explicit status rules

Scope: decision/status logic only. Supplier ranking/eligibility and Jobs/Job Core relationship are intentionally not changed here.

## Shared states

| State | Meaning | Can make a release view Ready? |
|---|---|---|
| `NO_DATA` | No usable evidence is saved, including QA with `total=0`. | No |
| `INVALID` | Required fields for that source are missing, malformed or internally inconsistent. | No |
| `REVIEW` | The source explicitly reports a warning/review condition. | No |
| `BLOCK` | The source explicitly reports a real blocking condition. | No; blocker has precedence |
| `PASS` | The requirements actually checked by that source are satisfied. | Only when every required source in that view is `PASS` |
| `UNRESOLVED` | Data exists but the current product definition does not provide a decisive rule, or a legacy decision record cannot be trusted under the current explicit-field model. | No |

Aggregation precedence: `BLOCK` → `INVALID` → `REVIEW` → `UNRESOLVED`/`NO_DATA` → `PASS`. A passing source never cancels a blocker from another source.

## Source rules used in Phase 2a

| Source | No data | Invalid | Review | Block | Pass |
|---|---|---|---|---|---|
| QA summary/history | Missing or `total=0` / empty history | Counts missing, negative, non-integer, or inconsistent | `review>0` | `blocker>0` | `total>0`, `review=0`, `blocker=0`, and every checkpoint is pass |
| Preflight | Missing | State/count fields unusable | `state=review` or warnings > 0 | `state=blocked` or blockers > 0 | `state=ready` with no recorded blocker/warning |
| Approvals | Missing/empty raw matrix | Required/status fields or summary counts invalid | — | Any required gate not approved / `blocking>0` | Every required gate approved; explicitly zero required gates is also a valid source result |
| Job Core | Missing | Name/revision unreadable or quantity not positive | — | — | Readable saved record; this means the record exists, not that the job is release-ready |
| Risk | Missing/zero records | Counts or raw risk fields invalid | Open medium-band risk | Open high-band risk | No open high/medium risk in recorded evidence |
| Stock | Missing | Unknown state | `REORDER` | `SHORT` | `COVERED` |
| Supplier Intelligence | Missing/no providers | Invalid provider container | Existing supplier data is `UNRESOLVED` until the separate Supplier phase defines eligibility | — | — |
| Capacity | Missing | `feasible` missing/non-boolean | — | `feasible=false` | `feasible=true` |
| Timeline | Missing | `feasible` missing/non-boolean | — | `feasible=false` | `feasible=true` |
| Queue | Missing/zero jobs | Counts invalid | — | `late>0` | Queue exists and `late=0` |
| Calibration | Missing | Counts invalid | `review>0` | `overdue>0` | No overdue/review condition |
| CAPA | Missing | Counts invalid | Open non-critical records | `critical>0` | No open CAPA record |
| Procurement | Missing | Unknown state | `ORDER SOON` | `ORDER NOW` | `COVERED` |
| Waste/yield | Missing | Unknown state | `REVIEW` | `LOW YIELD` | `GOOD` |
| Change impact | Missing | Counts invalid | Changed inputs without invalidation | `invalidatedCount>0` | No supported baseline change |
| Compliance | Missing | Unknown state | `REVIEW` | `HOLD` | `READY` |
| Schedule optimizer | Missing | Late count invalid | — | `late>0` | `late=0` |
| Material intelligence | Missing | Unknown state | `REORDER` | — | `COVERED` |
| Saved readiness audit | Missing | Explicit v2 fields/status contradict each other or are malformed | Explicit v2 has unresolved evidence / `REVIEW` | Explicit v2 has recorded blockers / `HOLD` | Only `version>=2` + `decisionModel=explicit-fields-v2` + at least one selected check + no unresolved/blockers + `READY` |

QA history status values are normalized to lowercase before validation and counting, so case differences cannot hide a real blocker. Free-text notes, field names and JSON serialization are never scanned for status words.

Legacy readiness records (including old `READY` records without `decisionModel=explicit-fields-v2`) are preserved but classified `UNRESOLVED`; the user must run Readiness Audit again before they can be trusted. Phase 2a readiness writes keep the existing storage key and add `decisionModel`, separate `unresolved`, and separate `blockers` fields without deleting the old record automatically.

## Five consumers

- **Digital Twin:** summarizes recognized stored decision sources. It can show `CLEAR` when all recognized stored sources pass, but `CLEAR` is explicitly not release approval. Empty-only evidence remains `NO DATA`.
- **Release Center:** Job Core + Preflight + Approvals + QA + Supplier. Any real blocker makes `HOLD`; any missing/invalid/review/unresolved source makes `REVIEW`; only all-pass gates make `READY`.
- **Enterprise Dashboard:** counts only explicit blockers from recognized source rules and explains non-pass evidence without dumping JSON.
- **Readiness Audit:** applies the source-specific rule for each selected checkbox. `READY` requires every selected check to pass; QA alone does not override other selected requirements. New audit records are explicitly stamped with the Phase 2a decision model and keep blockers separate from other unresolved evidence.
- **Command Center:** respects only a current explicit-field readiness audit as pass, and also checks recognized stored sources so a blocker outside a previously green audit cannot be erased by that audit.

Existing localStorage records are read in place. Phase 2a does not delete, clear or auto-migrate user data.
