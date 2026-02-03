Faru MNRT NBS Mediator
======================

Service that pulls MNRT NBS data sources into MongoDB, exposes a small HTTP API,
and optionally registers with OpenHIM.

Features
--------

- Scheduled sync + manual sync
- Snapshot storage in MongoDB
- Optional seeding into normalized collections
- OpenHIM registration (falls back to local config on failure)

Requirements
------------

- Node.js 20+
- MongoDB

Configuration
-------------

Local configuration is in `src/config/mediator.json`:

- `config.storage.mongoUrl` for MongoDB connection
- `config.seeding.enabled` to enable seeding
- `config.seeding.collections.*` to map target collection names
- `config.seeding.staticData.*` for static seed lists

OpenHIM registration settings are in `src/config/config.json`.

Run locally
-----------

```bash
npm install
npm run build
npm run start
```

The server listens on `http://localhost:8095`.

Endpoints
---------

Manual sync:

```bash
curl -X POST http://localhost:8095/nbs/sync \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2025-01-01","endDate":"2026-01-31"}'
```

Manual sync by source (for troubleshooting):

```bash
curl -X POST http://localhost:8095/nbs/sync \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2025-01-01","endDate":"2026-01-31","source":"NCAA"}'
```

You can also pass source via query params:

```bash
curl -X POST "http://localhost:8095/nbs/sync?source=TANAPA&startDate=2025-01-01&endDate=2026-01-31"
```

Snapshots (all sources):

```bash
curl "http://localhost:8095/nbs/snapshots?startDate=2025-01-01&endDate=2026-01-31&limit=10"
```

Snapshots by source (test each source independently):

```bash
curl "http://localhost:8095/nbs/snapshots?source=NCAA&startDate=2025-01-01&endDate=2026-01-31&limit=5"
curl "http://localhost:8095/nbs/snapshots?source=TANAPA&startDate=2025-01-01&endDate=2026-01-31&limit=5"
curl "http://localhost:8095/nbs/snapshots?source=TFS&startDate=2025-01-01&endDate=2026-01-31&limit=5"
curl "http://localhost:8095/nbs/snapshots?source=TAWIRI&startDate=2025-01-01&endDate=2026-01-31&limit=5"
```

Aggregate NBS data (sum across sources):

Yearly:

```bash
curl "http://localhost:8095/nbs-data?period=Yearly&requestTime=2025&indicatorId=MNRT-026"
```

Quarterly:

```bash
curl "http://localhost:8095/nbs-data?period=Quarterly&requestTime=2025Q2&indicatorId=MNRT-026"
```

Seeded collections API:

```text
GET    /api/v1/:collection
GET    /api/v1/:collection/:id
POST   /api/v1/:collection
PATCH  /api/v1/:collection/:id
DELETE /api/v1/:collection/:id
```

Known collections:

- indicator-groups
- disaggregations
- mnrt-indicators
- indicator-admin-areas
- institutions
- indicator-values

Add admin areas (example):

```bash
curl -X POST "http://localhost:8095/api/v1/indicator-admin-areas" \
  -H "Content-Type: application/json" \
  -d '{"id": 43, "name": "New Area", "code": "NEW"}'
```

Update admin areas (example):

```bash
curl -X PATCH "http://localhost:8095/api/v1/indicator-admin-areas/43" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Area Updated", "code": "NEW"}'
```

Quick troubleshooting checks:

```bash
# Verify latest stored snapshots
curl "http://localhost:8095/nbs/snapshots?source=NCAA&limit=1"
curl "http://localhost:8095/nbs/snapshots?source=TANAPA&limit=1"
curl "http://localhost:8095/nbs/snapshots?source=TFS&limit=1"
curl "http://localhost:8095/nbs/snapshots?source=TAWIRI&limit=1"

# Verify seeded admin areas and indicator values
curl "http://localhost:8095/api/v1/indicator-admin-areas?limit=5"
curl "http://localhost:8095/api/v1/indicator-values?limit=5"
```
