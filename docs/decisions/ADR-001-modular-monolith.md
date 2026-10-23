# ADR-001: Start with a Modular Monolith

**Status:** Proposed  
**Date:** To be confirmed

## Context
The project combines public content, commerce, school management and sensitive assessment workflows. The initial team is expected to be small, and operational complexity should be minimized.

## Decision
Start with one modular application and a relational database. Keep domain modules, service boundaries and authorization policies explicit. Separate highly sensitive screening data through strict schema/table permissions and RLS. Do not introduce microservices until justified by measured needs.

## Consequences
Benefits: easier development, lower deployment complexity, consistent transactions and simpler local testing.  
Costs: module boundaries require discipline; shared infrastructure creates a need for careful access policies.  
Revisit when independent scaling, team ownership or reliability requirements justify separation.

## Security note
A modular monolith does not mean all roles share unrestricted access. Authorization boundaries remain mandatory.
