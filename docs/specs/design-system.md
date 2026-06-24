# Design System

Byteflow uses a dark, developer-focused interface with high contrast, dense tool layouts, and predictable controls. The design goal is not decoration; it is fast repeated use across many small utilities.

## Principles

- Keep tool inputs, outputs, actions, examples, and errors visible without unnecessary navigation.
- Preserve the same interaction model across tools: input, output or preview, action bar, copy/download affordances, examples, and inline validation.
- Prefer browser-native expectations for keyboard focus, form controls, file handling, copy actions, and downloads.
- Use visual density carefully: compact controls are acceptable, but text must remain readable and touch targets usable.
- Treat privacy as part of the interface. Tools that process local data should not imply a server workflow.

## Foundations

The UI is built with React, Tailwind CSS 4, Radix UI primitives, lucide icons, Monaco editor surfaces, and feature-local tool components.

Core styling comes from CSS variables consumed through Tailwind utility classes. Existing tokens should be reused rather than hard-coding one-off colors.

| Role | Token | Usage |
| --- | --- | --- |
| Background | `--background` | Application base. |
| Foreground | `--foreground` | Primary text. |
| Card / popover | `--card`, `--popover` | Tool surfaces, menus, dialogs, and elevated panels. |
| Primary | `--primary` | Primary actions, active states, and key highlights. |
| Secondary / muted | `--secondary`, `--muted` | Secondary surfaces, low-emphasis controls, and subdued states. |
| Muted text | `--muted-foreground` | Descriptions, placeholders, hints, and secondary metadata. |
| Destructive | `--destructive` | Errors and destructive actions. |
| Border / input | `--border`, `--input` | Dividers, fields, and low-emphasis outlines. |
| Ring | `--ring` | Keyboard and focus indication. |

## Typography

- Use the project sans font for navigation, labels, headings, descriptions, and buttons.
- Use the monospace font for code, raw data, generated output, and inline technical literals.
- Keep headings proportional to their container. Tool panels, sidebars, and cards should not use hero-scale text.
- Keep button and control labels short enough to survive localization.

## Tool Layout

Tool pages should generally provide:

- A clear page title and concise description.
- Input controls with examples or placeholders that demonstrate expected shape.
- Output, preview, diagnostics, or transformed data in a stable area.
- An action bar with common commands such as copy, download, clear, format, validate, or reset.
- Inline error states that explain what failed and how to recover.
- Mobile layout that stacks inputs and outputs without hiding primary actions.

Large tools should split orchestration, pure logic, browser effects, samples, types, constants, and subcomponents into feature-local modules under `src/features/tools/{tool}/`.

## Interaction States

- Every interactive element needs a visible focus state.
- Disabled states must communicate why an action is unavailable when that is not obvious.
- Copy, download, import, export, and destructive actions should provide immediate feedback.
- Errors should be specific and local to the affected input or output area.
- Toasts are useful for command confirmation, but validation errors should not rely on toast-only feedback.

## Tool Action Semantics

Shared tool actions should appear in this order: Sample, Import or Upload, Clear, Reset, Preview, Run or task-specific primary actions, Copy, Download or Export, Share, then Send to.

- Sample loads safe example input and expected example settings without persisting user data.
- Clear removes current input, output, transient errors, selected files, and sensitive fields; it should not unexpectedly change durable settings unless the tool documents that behavior.
- Reset restores documented defaults and may also clear current input/output when returning the tool to its initial state.
- Run, Format, Minify, Validate, Convert, Generate, Decode, Encode, and Hash create or refresh output and should be disabled with a reason when required input is missing.
- Copy, Download, and Export operate only on current valid output, provide visible feedback, and remain disabled with an accessible reason when output is empty, stale, or invalid.
- Share and Send to must not include sensitive payloads unless the flow explicitly uses the approved sensitive handoff or share preview.
- Destructive Clear and Reset actions use destructive styling in the shared action bar.

## Accessibility

- Preserve semantic HTML before adding custom roles.
- Keep focus order aligned with visual order.
- Use icons with accessible names when the icon is the only visible content.
- Maintain readable contrast for text, borders, and focus rings.
- Test keyboard access for any new modal, menu, command palette, tab, or custom control.

## Visual Assets

Product images, icons, social preview assets, and PWA icons live under `public/`. Generated assets should be produced through the existing generator scripts and checked by the matching gates. Do not add ad hoc screenshots, temporary review images, or local report assets to the repository.
