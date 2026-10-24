# Test Report

Run on 2026-10-24 with PostgreSQL 16, Python 3.13, Node 22.

## Summary

| Suite | Tests | Result | Coverage |
|---|---|---|---|
| Backend (pytest) | 102 | all pass | 100% of application code (only `manage.py`, `asgi.py`, `wsgi.py` boilerplate is unexecuted: 98% overall incl. those) |
| Frontend (Vitest + RTL) | 72 | all pass | 99.6% lines, 98.9% statements, 94.3% branches |

Coverage is a by-product, not the goal: the tests were written first and assert behaviour.

## Commands

```bash
cd backend  && python -m pytest --cov=. --cov-report=term-missing
cd frontend && npm run coverage
```

## Backend - what is covered

| Area | Examples |
|---|---|
| Users and auth | role default and `is_admin`; register always creates a customer and cannot self-assign admin; duplicate username/email; weak password rejected; login success/failure; JWT required on every vehicle route; `create_admin` command creates/promotes and is idempotent |
| Vehicle model | `price >= 0` DB constraint, `quantity` cannot be negative, `str()` |
| List / create | list, create valid, missing fields, negative price, non-numeric price, anonymous = 401 |
| Search | each filter alone, all combined, case-insensitive partial match, price bounds inclusive, `min > max` = 400, no match = empty list |
| Update / delete | PUT/PATCH, unknown id = 404, delete admin-only (403 for customers) |
| Inventory service | purchase decreases stock, default quantity 1, bulk purchase, exact-stock purchase, insufficient stock rejected and stock unchanged, quantity 0/negative/non-integer/float/null rejected, unknown vehicle, restock admin-only |
| **Concurrency** | many threads buying limited stock at once: successes never exceed stock, stock never negative (mutation-checked: a naive read-modify-write version fails this test) |
| Seed command | creates 10 vehicles, one sold out |

## Frontend - what is covered

| Area | Examples |
|---|---|
| API layer | JSON/bearer headers, 204 handling, field errors and network failures become `ApiError`; auth and vehicle paths pinned to the backend routes |
| Auth | session restore/persist/clear, corrupt storage ignored, login/register flows with server errors, password confirmation, route guards (anonymous / customer / admin) |
| Vehicle card | formatted price, low-stock hint, **Purchase disabled at 0 stock**, admin-only controls |
| Search | submits filters, rejects min > max, reset |
| Form | required fields, negative price, fractional quantity, server error display |
| Dashboard | load / empty / error + retry, search + reset, purchase success and 409 conflict, admin add / edit / delete-with-confirm / restock with validation, customer sees no admin controls |
| Routing | redirects, guest-only pages, 404 |

## End-to-end check (manual, real servers)

Backend + PostgreSQL + Vite dev server running; Playwright drove: register -> auto sign-in -> browse -> search -> reset -> purchase (stock 2 -> 1) -> log out -> admin sign-in -> add dialog -> restock dialog. No browser console errors. Screenshots are in `docs/screenshots/`. This run found the trailing-slash URL bug described in the README; it is fixed and covered by a test.

## Not covered / known limits

- No automated browser (E2E) test in CI; the run above was manual.
- No pagination: the list endpoint returns every vehicle (fine for a demo-sized inventory).
- Refresh-token flow is issued by the API but not used by the UI.
- Not load-tested; concurrency safety is verified with a threaded test on PostgreSQL only.
