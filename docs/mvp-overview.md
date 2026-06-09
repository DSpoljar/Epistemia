# Epistemia MVP

## Goal

Build a minimal backend for organizing scientific evidence.

The system allows users to:

- Create Projects
- Add Papers
- Add Claims to Papers
- Create Evidence Clusters
- Assign Claims to Clusters
- Compare Evidence Clusters

No AI functionality is included in this MVP.

## Tech Stack

- Node.js
- TypeScript
- Fastify
- SQLite

## Architecture Goals

- Simple
- Understandable
- Modular
- Easy to extend with AI later

## Core Domain

Project
  └─ Paper
        └─ Claim

Cluster
  └─ ClaimCluster

## Out of Scope

- Authentication
- PDF Upload
- AI Summaries
- AI Claim Extraction
- Consensus Calculation
- User Collaboration