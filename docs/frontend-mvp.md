# Epistemia Frontend MVP Specification

## Goal

Build a functional frontend for Epistemia that supports the validated user flow.

The frontend should prioritize functionality over polish.

The objective is to demonstrate that researchers can manually organize and compare evidence across multiple papers.

No AI functionality is included in this version.

---

# Tech Stack

Frontend Framework:

* React

Language:

* TypeScript

Styling:

* Tailwind CSS

State Management:

* React state (useState, useEffect)

Optional:

* React Context if necessary

Routing:

* React Router

HTTP Client:

* fetch API or Axios

---

# Product Goal

A researcher should be able to:

1. Create a research project.
2. Add papers manually.
3. Add claims to papers.
4. Create evidence clusters.
5. Assign claims to clusters.
6. Compare evidence clusters.

---

# Validated User Flow

Landing Page
→ Project Dashboard
→ Create Project
→ Add Papers
→ Add Claims
→ Create Clusters
→ Assign Claims to Clusters
→ View Comparison

Success Moment:

The user can understand how findings from multiple papers relate to one another.

---

# Backend API Assumptions

Projects

GET /projects

POST /projects

GET /projects/:id

DELETE /projects/:id

---

Papers

GET /papers

POST /papers

PUT /papers/:id

DELETE /papers/:id

---

Claims

GET /claims

POST /claims

PUT /claims/:id

DELETE /claims/:id

---

Clusters

GET /clusters

POST /clusters

PUT /clusters/:id

DELETE /clusters/:id

---

Comparison

GET /clusters/:id/comparison

Returns:

{
cluster,
claims,
papers
}

---

# Frontend Screens

## 1. Landing Page

Purpose:

Introduce Evidentia.

Elements:

* Application title
* Short description
* Button:
  "View Projects"

Navigation:

Landing
→ Dashboard

---

## 2. Project Dashboard

Purpose:

Display projects.

Elements:

* List of projects
* Create Project button

Create Project Form:

Fields:

* Project Name
* Description

Actions:

* Create Project
* Open Project

---

## 3. Project Detail View

Purpose:

Manage papers within a project.

Elements:

* Project title
* List of papers
* Add Paper button

Paper Card:

Display:

* Title
* Authors
* Year
* Summary

Actions:

* View Claims
* Delete Paper

---

## 4. Add Paper Form

Purpose:

Create papers manually.

Fields:

* Title
* Authors
* Year
* Summary

Validation:

Required:

* Title
* Summary

---

## 5. Claims View

Purpose:

Manage claims belonging to a paper.

Display:

Claim list.

Each claim contains:

* Claim text
* Optional notes

Actions:

* Add Claim
* Edit Claim
* Delete Claim

---

## 6. Cluster Management View

Purpose:

Manage evidence clusters.

Display:

Cluster list.

Each cluster contains:

* Name
* Description

Actions:

* Create Cluster
* Delete Cluster

---

## 7. Claim Assignment View

Purpose:

Assign claims to clusters.

Display:

Claims list.

Each claim should provide:

* Claim text
* Associated paper

Interaction:

Select Cluster.

Assign Claim.

Remove Claim from Cluster.

---

## 8. Comparison View

Purpose:

Display evidence relationships.

Display:

Cluster Information

Supporting Claims

Supporting Papers

Example:

Cluster:
Sleep Improves Memory

Claims:

* Sleep improves declarative memory.
* Sleep strengthens long-term retention.

Papers:

* Rasch & Born (2013)
* Inostroza & Born (2012)

---

# State Requirements

The application should support:

* Loading projects
* Creating projects
* Loading papers
* Creating papers
* Loading claims
* Creating claims
* Loading clusters
* Creating clusters
* Assigning claims to clusters
* Viewing comparison results

---

# Error Handling

Required:

Loading State:

"Loading..."

API Errors:

Display user-friendly messages.

Example:

"Failed to load projects."

Validation Errors:

Display inline form errors.

---

# Design Principles

Prioritize:

* Clarity
* Simplicity
* Readability

Avoid:

* Complex animations
* Fancy dashboards
* Over-engineered UI patterns

Think:

Academic productivity tool.

Notion × Semantic Scholar.

---

# Implementation Priorities

Phase 1

* Landing Page
* Dashboard
* Projects CRUD

Phase 2

* Papers CRUD

Phase 3

* Claims CRUD

Phase 4

* Clusters CRUD

Phase 5

* Claim Assignment

Phase 6

* Comparison View

---

# Definition of Done

The frontend is considered complete when:

A user can:

1. Create a project.

2. Add at least three papers manually.

3. Add claims to those papers.

4. Create evidence clusters.

5. Assign claims to evidence clusters.

6. Open the comparison page.

7. Observe how multiple papers support different evidence clusters.

This end-to-end workflow should function using the backend APIs without requiring any AI functionality.
