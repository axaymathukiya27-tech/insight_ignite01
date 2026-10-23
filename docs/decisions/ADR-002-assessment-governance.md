# ADR-002: No Invented Psychometric or Clinical Scoring

**Status:** Proposed; sponsor and assessment professional approval required  
**Date:** To be confirmed

## Context
The platform may host school-created questionnaires, strengths assessments, classroom observations and professional emotional-wellbeing screening. Incorrect scoring or labels can harm children.

## Decision
The software will not invent tests, norms, thresholds, diagnoses or treatment recommendations. Scoring is implemented only when the exact instrument, version, licensing, intended use and scoring method are supplied and approved by the designated qualified professional. Locally developed school questionnaires are labelled as such and are not presented as validated psychometric instruments.

## Consequences
The assessment engine must support instrument registration, approval status, immutable versions and review workflows. Some features remain disabled until professional approval. This is intentional.

## Revisit
Review when an instrument is selected, its license and validity are checked, and the assessment governance owner approves implementation.
