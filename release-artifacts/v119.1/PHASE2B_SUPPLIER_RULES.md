# Phase 2b — Supplier eligibility and ranking rules

## Scope

Phase 2b changes only Supplier Intelligence and the supplier status consumed by existing release/readiness boards. It does not change Jobs/Job Core, prices, inventory, payment, shipping, production data, or Production deployment.

## Existing behavior found before implementation

- Ranking weights were already hard-coded as capability 35%, quality 25%, lead time 15%, price 15%, and risk 10%.
- The page incorrectly described those weights as user-controlled/editable even though there was no weight editor.
- `cap < 70` only changed the row styling to `bad`; it did **not** prevent that supplier from becoming the automatic `best` supplier.
- Therefore there was no explicit approved numeric eligibility threshold to reuse.

Phase 2b does not promote the old visual `70` boundary into a business rule and does not invent a new numeric threshold.

## Eligibility contract

Eligibility is an explicit user decision tied to evidence the user controls:

| Saved eligibility | Ranking behavior | Supplier status when no Eligible supplier exists |
|---|---|---|
| `eligible` | Included in ranking | Supplier can PASS if an eligible `best` is saved |
| `ineligible` | Never ranked and never selected as `best` | BLOCK when all saved suppliers are explicitly Ineligible |
| `unassessed` | Never ranked and never selected as `best` | UNRESOLVED while at least one supplier remains Not assessed |
| missing on a legacy record | Treated as `unassessed` in the derived summary | UNRESOLVED; the original legacy record is preserved |
| any other explicit value | Not trusted | INVALID |

If there are no saved suppliers, supplier status is `NO_DATA`.

If at least one supplier is explicitly Eligible, `best` must itself be one of the explicitly Eligible saved providers. Otherwise the supplier summary is INVALID rather than silently choosing an ineligible or unrelated provider.

Provider score fields are validated as finite values from 0–100. This is input validation, not an eligibility threshold.

## Ranking contract

Ranking is calculated only among providers explicitly marked Eligible. The Phase 2 weights remain fixed:

- Capability: 35%
- Quality: 25%
- Lead time: 15%
- Price: 15%
- Risk: 10% using `(100 - risk)` in the weighted score

Weight editing is deferred. The UI must not claim the weights are editable or user-controlled.

## Persistence / migration

`enterprise-suppliers-v1` remains the source list. Existing records are not rewritten merely by opening the page. A legacy record with no eligibility field remains intact in that source list and is interpreted as Not assessed in the derived supplier summary.

`supplier-intelligence-last-v1` is retained for compatibility, with summary `version: 2` and `decisionModel: explicit-eligibility-v1`. `best` is `null` when there is no explicitly Eligible provider.
