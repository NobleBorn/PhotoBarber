<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# PhotoBarber — Codex Instructions

## Project Overview

PhotoBarber is a free, browser-based image editing website
inspired by iLoveIMG.

Users can resize, compress, crop, convert, rotate, watermark,
and batch-process images.

The website must not require user accounts, registration,
authentication, subscriptions, or artificial usage quotas.

No AI features or AI APIs are allowed in the application.

## Technology Stack

- Next.js with App Router
- React
- TypeScript
- Tailwind CSS
- Lucide React for icons
- Browser Canvas API for image processing
- Web Workers for computationally expensive operations
- Additional libraries only when justified by functionality

## Required Reading

Before making any frontend or styling changes:

1. Read DESIGN.md.
2. Follow its design system and component specifications.
3. Inspect existing components before creating replacements.
4. Keep the design consistent across every page.

If an existing implementation differs from DESIGN.md,
follow DESIGN.md for visual styling unless explicitly
instructed otherwise.

## Architecture

- Use src/app/ for pages and routes.
- Use src/components/layout/ for shared layout components.
- Use src/components/home/ for homepage components.
- Use src/components/tools/ for tool interfaces.
- Use src/lib/image/ for image processing.
- Use src/workers/ for background processing.

Keep image processing independent of React components.

Prefer Server Components for static content and Client
Components only where interactivity is necessary.

## Coding Standards

- Use TypeScript with strict types.
- Prefer reusable functional React components.
- Use Tailwind CSS for styling.
- Avoid unnecessary dependencies.
- Avoid duplicating UI and processing logic.
- Use accessible semantic HTML.
- Support mobile, tablet, and desktop screens.
- Keep components small and maintainable.
- Respect existing project functionality.

## Image Processing Rules

- Process images in the browser whenever possible.
- Do not upload user images to a server by default.
- Do not permanently store user images.
- Revoke temporary object URLs when no longer needed.
- Handle errors and unsupported image formats gracefully.
- Use Web Workers for expensive operations when needed.
- Do not introduce arbitrary file-size or usage quotas.
- Handle browser memory limitations safely.

## UI / UX Rules

- Follow DESIGN.md.
- Use a clean, modern, professional interface.
- Prioritize simple navigation and usability.
- Provide visible hover and keyboard focus states.
- Provide feedback during processing.
- Ensure responsive layouts.
- Do not display fake user counts or testimonials.
- Do not add authentication or pricing buttons.
- Do not advertise functionality that is not implemented.

## Visual References

Use the files in `design_references/` as follows:

- `image99-layout-reference.png` = layout and page structure reference
- `frameflow-reference.png` = color, style, typography mood, and card styling reference

When implementing the homepage:
- follow the uploaded layout reference for structure
- follow the FrameFlow reference for theme and visual styling

Do not copy screenshots directly.
Recreate the layout with React components and Tailwind CSS.

## Working Instructions

When implementing a feature:

1. Inspect relevant existing code.
2. Read DESIGN.md for visual requirements.
3. Reuse existing components where practical.
4. Implement the requested changes.
5. Run npm run lint and npx tsc --noEmit.
6. Run npm run build when appropriate.
7. Report any validation errors and remaining limitations.

Do not rewrite unrelated functionality.
Do not add new dependencies without a clear reason.


## Project Progress Tracking

Use PROGRESS.md as the project's development history.

### Before starting a task

1. Read PROGRESS.md for relevant project context.
2. Check existing implementations before writing new code.
3. Avoid repeating completed work.
4. Consider documented bugs and pending tasks.

### After completing a task

Update PROGRESS.md to record:

1. What was implemented or modified.
2. Important files created or changed.
3. Significant technical decisions.
4. Tests executed and their results.
5. Known bugs or unfinished functionality.
6. Recommended next steps.

### Rules

- Only mark a feature complete after verifying it works.
- Never claim tests passed unless they actually ran.
- Keep existing development history.
- Do not duplicate entries.
- Keep updates concise and informative.
- Do not modify AGENTS.md or DESIGN.md unless project
  instructions or design decisions actually change.
- Do not record secrets, credentials, or personal data.

At the end of your response, summarize the implementation
and confirm whether PROGRESS.md was updated.

