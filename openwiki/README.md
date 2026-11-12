---
type: Documentation
title: OpenWiki Documentation
description: Entry point for the OpenWiki code wiki of Ulabase Starter — Angular. Summarizes the AGENTS.md just-in-time retrieval policy and maps the documentation set (quickstart plus the seven topic pages).
tags: [documentation, openwiki, quickstart, architecture, workflows]
sources:
  - id: openwiki-source-6d4b4e707b8d60b6ccfa3425
    resource: repo://.github/workflows/openwiki-update.yml
  - id: openwiki-source-8037e2358a2c4f9b2c722a11
    resource: repo://AGENTS.md
  - id: openwiki-source-4e7cd7f381c92e8c5d89f5c1
    resource: repo://NOTES.md
generated: { by: "openwiki/0.9.0", at: "2026-11-12T16:00:22.284Z" }
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T16:00:22.284Z
---

# OpenWiki Documentation

This directory contains the OpenWiki code wiki for the Ulabase Starter — Angular project. It is a flat page set maintained by the repository's OpenWiki maintenance workflow ([`.github/workflows/openwiki-update.yml`](../.github/workflows/openwiki-update.yml)); the pages below are the documentation map.

## How this wiki is used

Per [AGENTS.md](../AGENTS.md), `openwiki/` is **optional just-in-time context**, not required startup reading. Agents do not enumerate, preload, or search wikis at task start. Retrieval happens when the user asks for it, when unfamiliar architecture or dependency behavior materially affects the task, or when source inspection leaves an important uncertainty — and stops once the question is grounded.

When OpenWiki retrieval tools are available, use `openwiki_search` for just-in-time context and `openwiki_read` for the relevant complete sections. If search returns `workspace_required`, ask which listed workspace to use and retry with its ID. Use `openwiki_list_workspaces` or `openwiki_list_wikis` when workspace membership itself needs to be discovered. If the retrieval tools are unavailable, read [quickstart.md](quickstart.md) and follow its links to the relevant pages.

Source code and tests are authoritative — a brief's unknowns and review items are verification gaps, not automatic requirements. Prefer the narrowest quiet validation that proves the changed behavior and preserve complete failure output. Do not hand-edit generated OpenWiki pages unless explicitly asked; prefer updating source code or docs and letting OpenWiki regenerate.

## Getting Started

For a concise entry point that routes you through the wiki hierarchy based on your task, start with the **[quickstart guide](quickstart.md)**.

## Documentation Map

The wiki is a flat set of pages in this directory. The quickstart guide links to all major topic pages:

- [Architecture](architecture.md) — system structure and component relationships
- [Domain Concepts](domain-concepts.md) — core business entities and their relationships
- [Workflows](workflows.md) — key user and system flows
- [Operations](operations.md) — deployment, configuration, and maintenance
- [Integrations](integrations.md) — external service connections and APIs
- [Testing](testing.md) — test strategies and coverage
- [Source Map](source-map.md) — file-by-file guide to the codebase

## Additional Resources

- [Root README](../README.md) — project overview and setup instructions
- [NOTES.md](../NOTES.md) — detailed customization and implementation notes, including the OpenWiki documentation map

The wiki's own instructions ([INSTRUCTIONS.md](INSTRUCTIONS.md)) ask wiki maintenance to finish by updating the root `README.md` to point to these openwiki docs.

## Generated Index

- [OpenWiki Index](index.md) — auto-generated index of all OpenWiki content
