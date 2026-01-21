# Implementation Plan: Unified Simplified Energy Monitor (Restart)

This plan outlines the steps to rebuild the Energy Consumption Monitor with a simplified architecture, focusing on Shadcn/UI and streamlined user workflows.

## Phase 1: Foundation & Authentication
- [x] Task: Initialize Shadcn/UI and base theme
    - [x] Install Shadcn/UI CLI and initialize configuration
    - [x] Set up global Tailwind styles and Radix primitives
- [x] Task: Implement NextAuth.js Credentials Flow
    - [x] Create user schema with MongoDB/Mongoose
    - [x] Set up NextAuth configuration with Credentials Provider
    - [x] Implement Register and Login pages using Shadcn/UI components
- [x] Task: Establish User Isolation Middleware
    - [x] Implement Mongoose middleware or service-layer wrapper to enforce `userId` filtering on all queries
- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Authentication' (Protocol in workflow.md)

## Phase 2: Meters & Data Entry
- [x] Task: Implement Meter & Reading Data Models
    - [x] Define Meter schema (type, meterNumber, userId)
    - [x] Define Reading schema (meterId, value, timestamp, userId)
- [x] Task: Create Transparent Data Entry Flow
    - [x] Build "Add Reading" form using Shadcn/UI
    - [x] Implement logic to detect missing meters and prompt for details during first entry
    - [x] Write TDD tests for the reading creation service (ensuring meter creation is atomic)
- [x] Task: Basic Reading History List
    - [x] Implement a simple table view of readings with delete/edit capability
- [x] Task: Conductor - User Manual Verification 'Phase 2: Meters & Data Entry' (Protocol in workflow.md)

## Phase 3: Contracts & Cost Projections
- [x] Task: Contract Management Service
    - [x] Define Contract schema (basePrice, unitPrice, startDate, meterId)
    - [x] Implement "On-Demand" contract entry dialog triggered by insight views
- [x] Task: Cost Calculation Logic
    - [x] Implement service to calculate costs based on reading delta and active contract
    - [x] Add TDD tests for cost projection mathematics
- [x] Task: Projection UI Component
    - [x] Build a "Cost Insights" dashboard card showing current period projections
- [x] Task: Conductor - User Manual Verification 'Phase 3: Contracts & Cost Projections' (Protocol in workflow.md)

## Phase 4: Visualization & Polishing
- [x] Task: Integrate Chart.js Trends
    - [x] Implement line charts for consumption over time
    - [x] Add filters for Daily/Weekly/Monthly aggregation
- [x] Task: Final UI Polish & Responsive Check
    - [x] Audit all touch targets and mobile layouts using DevTools
    - [x] Ensure consistent use of Shadcn/UI themes
- [x] Task: Conductor - User Manual Verification 'Phase 4: Visualization & Polishing' (Protocol in workflow.md)