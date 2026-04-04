# Transfer credit evaluation — who’s involved and what happens

## What “transfer credit” means

A **transfer student** brings coursework from another institution (the **sending** school). The **receiving** institution decides whether those courses **equate** to its own catalog courses or **general** credit, and how they apply to degree requirements. That decision is **articulation** — often documented in agreements, but **ad hoc** evaluation still happens for courses not on a pre-approved list.

## Typical stakeholders

| Stakeholder | Role in the process |
|-------------|---------------------|
| **Student** | Submits transcript (and sometimes syllabi), chooses target program, tracks status, meets deadlines. |
| **Registrar / admissions** | Owns policy, turnaround, communication; often tracks volume and SLAs. |
| **Articulation / transfer coordinator** | Operational hub: assigns work, liaises with departments, updates systems, may do first-pass triage. |
| **Department / faculty** | Subject-matter experts who judge **equivalence** (content, level, outcomes) for courses in their discipline. |
| **IT / systems** | SIS, degree audit, portals; in our product, **Supabase** holds identity, stored evaluations, and workflow state. |

## End-to-end flow (what we’re building toward)

1. **Student** completes an **evaluation run** (e.g. transcript PDF through the agent pipeline) → **results are stored** (JSON + metadata).
2. **University** staff see **who is in progress**, **who has submitted**, set **deadlines**, and move cases through internal states (e.g. model complete → coordinator review → faculty review → final).
3. **Professor** (MVP: one pool reviewer) sees submissions that need **approve / not approve** (or request more info), with **student evaluation details** visible after the student run completes.
4. **Future**: route each course line to **discipline-specific** faculty instead of a single reviewer.

This app’s **local matcher + agent pipeline** supports **decision support**; **final authority** remains with the institution (registrar/faculty), consistent with common policy framing ([e.g. articulation and registrar coordination](https://registrar.utah.edu/transferarticulation)).
