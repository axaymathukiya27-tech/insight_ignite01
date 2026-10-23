# UI/UX Design Specification

**Status:** Draft  
**Version:** 0.1

## 1. Design direction
Professional, warm, calm, trustworthy and accessible. Avoid a generic AI-generated template look, excessive gradients, tiny typography, cluttered cards and large empty areas. Use clear hierarchy, strong spacing, restrained color and meaningful content.

Brand colors, fonts, imagery and exact identity must be approved by Dr. Nivedita. Do not invent logos or use a photograph without permission.

## 2. Public sitemap
- Home
- About Dr. Nivedita
- Courses
- Course detail
- Services and workshops
- Resources/articles (optional)
- FAQs
- Contact
- Privacy notice, terms, refund policy and accessibility statement

## 3. Authenticated sitemap
- Account dashboard
- School admin: overview, classes, teachers, students, roster import, questionnaires, observations, reports, billing/settings
- Teacher: assigned classes, student roster, observations, assigned questionnaires, permitted reports
- Parent: linked children, consent/notice centre, assessments, reports, appointments, course purchases
- Student: assigned assessment, progress, permitted feedback
- Professional: assigned cases, approved instruments, sessions, review and follow-up
- Course editor: courses, lessons, assets, orders, enrollments
- Platform/security admin: organizations, memberships, audit, incidents, system configuration

## 4. Shared layout rules
- Responsive from mobile-first dimensions.
- Persistent, understandable navigation; no hidden critical action in hover-only menus.
- Use page titles, breadcrumbs where helpful, clear primary action and descriptive empty states.
- Provide loading, success, validation, empty, error, permission-denied and offline states.
- Avoid toast-only error messages for critical failures; keep errors near relevant fields and provide a summary.
- Use readable font sizes and adequate contrast.
- All controls must have labels, keyboard focus and accessible names.
- Do not show sensitive student names or report content in browser notifications or page titles unnecessarily.

## 5. Public home page
Recommended sections:
1. Header with logo/name, navigation and primary CTA.
2. Clear hero describing verified expertise and target audience.
3. Selected services or learning outcomes.
4. Featured courses with price and audience.
5. Professional profile and verified qualifications.
6. How services work.
7. Testimonials only with documented permission and authenticity.
8. FAQs and contact CTA.
9. Footer with policies and contact details.

## 6. Course detail page
Must show:
- title and concise value proposition;
- intended audience and prerequisites;
- learning outcomes;
- course format, duration and language;
- lesson/module outline;
- instructor credentials relevant to course;
- total price, taxes/fees if applicable, refund terms;
- accessibility/support information;
- clear purchase CTA and secure checkout.

Do not claim guaranteed psychological, educational or clinical outcomes.

## 7. Dashboard rules
- Show only data permitted to the current role.
- Avoid using red/green labels to stigmatize student traits.
- Use neutral language such as “observed in this context” and “possible support strategy”.
- Clearly distinguish observations, questionnaire responses, approved instrument results and professional interpretations.
- Never show clinical screening information in a generic school dashboard.
- Parent reports must identify the relevant child and assessment date without exposing another child.

## 8. Forms and data entry
- Explain why each sensitive field is needed.
- Use server-side validation and field-level errors.
- Warn before abandoning unsaved work.
- For CSV imports, provide a template, preview, row-level errors and confirmation step.
- Do not ask teachers to select diseases or diagnose students.
- Minimize free-text fields and show a reminder not to include unnecessary sensitive details.

## 9. Design system
Define tokens for color, type scale, spacing, border, radius, elevation, focus and motion. Use reusable buttons, inputs, tables, cards, modals, badges, alerts, tabs, pagination and empty states. Avoid inconsistent one-off styling.

## 10. Accessibility and usability
Target WCAG 2.2 AA where practicable. Test keyboard navigation, focus visibility, contrast, screen-reader labels, zoom, responsive reflow, error identification and accessible charts. Provide alternatives to color-only status indicators.

## 11. Required design artifacts
- Sitemap
- Role-specific user flows
- Low-fidelity wireframes for key screens
- High-fidelity desktop and mobile designs
- Component library/design tokens
- Content inventory and approved copy
- Accessibility review checklist
