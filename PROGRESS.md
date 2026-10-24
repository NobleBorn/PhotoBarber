
# PhotoBarber — Project Progress

## Project Overview

PhotoBarber is a free, browser-based image editing website
built with Next.js, TypeScript, React and Tailwind CSS.

The project follows the design specified in DESIGN.md.

## Current Status

Development in progress.

Last updated: 2026-10-24

## Completed Features

- [ ] FrameFlow-inspired homepage redesign
- [ ] Shared navigation bar
- [ ] Shared footer
- [ ] Responsive homepage layout
- [x] Convert Image tool (browser-verified; production build blocked by environment)
- [x] Compress Image tool (browser-verified; production build blocked by environment)
- [x] Watermark Image tool (browser-verified; production build blocked by environment)
- [x] Rotate Image tool (browser-verified; production build blocked by environment)
- [ ] Resize Image tool
- [ ] Shared image upload component
- [ ] Shared image processing architecture

Note: Verify existing functionality before marking tasks complete.

## In Progress

- Homepage directory redesign implemented; production build and browser verification remain blocked/pending.

## Planned Features

- Crop Image — implemented; browser verification pending
- Batch image processing
- Web Worker integration
- ZIP download support

## Architecture Decisions

- Next.js App Router
- TypeScript
- Tailwind CSS
- Browser-based image processing
- No authentication
- No AI functionality
- No arbitrary usage quotas
- No database for the initial version

## Known Issues

- Turbopack production builds fail in this execution environment when the CSS worker binds an internal port (`Operation not permitted`).
- The homepage HeroSection currently has an unused `Scissors` import warning. The former ResizeTool blob-preview image warning was resolved with an unoptimized Next.js Image.
- Browser checks for the redesigned homepage and resize upload/download have not run.

## Recent Changes

Add a short entry after each completed task.

### 2026-10-21 — Homepage tool directory redesign

**Implemented:**
- Replaced the split hero and photographic bento layout with a centered hero, prominent live search, horizontally scrollable category pills, and grouped compact card grids.
- Used `image99-layout-reference.png` for structure and the available `frameflow-reference.png` for the forest-green/off-white style. The requested `frameflow-style-reference.png` was not present.
- Search matches titles, descriptions, and format keywords; it combines with category filtering. Added clear/reset actions, an empty state, announced result counts, visible focus states, and responsive one/two/four-column grids.
- Added grouped desktop/mobile navigation with category URLs, preserving shared branding and footer. Only Resize Image links to a functional tool; seven planned tools are explicitly labeled coming soon.
- Kept the existing ResizeTool, image-processing modules, workers, and placeholder routes unchanged.

**Files changed and cleanup:**
- Refactored `HeroSection.tsx`, `ToolsGrid.tsx`, `ToolCard.tsx`, `Navbar.tsx`, `Footer.tsx`, and `src/app/page.tsx`.
- Added `ToolDirectory.tsx` and `src/lib/tools/catalog.ts` as the shared category/tool definitions.
- Removed unused `EditorPreview.tsx`, `FeatureHighlights.tsx`, their two local photographs and asset README, and five unreferenced Next.js starter SVGs.
- Removed mockup/crop-overlay/format-tile CSS, unused secondary-button styles, and the unused Geist Mono font import/configuration/token. Kept shared tokens, focus/reduced-motion styles, and primary-button styling.
- No dependencies added or removed: all installed packages remain required by the application or its build/lint/type-check tooling.
- Left `AGENTS.md` and `DESIGN.md` unchanged.

**Validation:**
- `npm run lint`: passed with zero errors and one pre-existing ResizeTool `no-img-element` warning.
- `npx tsc --noEmit`: passed.
- `npm run build`: attempted; first blocked by Google Fonts network access, then retried with permission and blocked by Turbopack CSS-worker port binding (`Operation not permitted`).
- Webpack fallback build requested; execution approval was declined, so it did not run.
- Browser visual/interactivity and resize regression checks remain unverified. No feature checkboxes were marked complete without that verification.
- Reference audit found no remaining imports or asset paths for removed homepage code. `git diff --check` reports only a pre-existing trailing blank line in `AGENTS.md`, which was left unchanged.

**Remaining work:**
- Run the production build and browser checks in an environment that permits Next.js CSS workers. Verify mobile/tablet/desktop overflow, search, combined filters, navigation, empty-state reset, keyboard focus, and resize upload/download.
- Planned tool cards are placeholders; no additional image processing was implemented.

### 2026-10-21 — Unified All Tools grid

- Updated `ToolDirectory.tsx` to render one grid of matching cards when All Tools is selected, without category headings or separate sections. Category selections retain their heading and filtered cards; search and empty states are preserved.
- Reused `ToolsGrid.tsx` with an optional category header rather than duplicating grid markup.
- Validation: `npm run lint` passed with the existing ResizeTool image warning; `npx tsc --noEmit` passed. Production build was not repeated for this small rendering change; the environment restriction documented above remains unresolved. Browser verification remains pending.
- Next step: verify switching between All Tools and category filters in the browser once preview/build access is available.

### 2026-10-21 — Resize modes and aspect-ratio controls

**Implemented:**
- Added Pixels (px) and Percentage (%) modes with 25%, 50%, and 75% smaller presets, calculated from the original image rather than compounded.
- Added a default-on Keep aspect ratio checkbox. Either pixel field can drive proportional resizing; re-enabling the lock preserves the last-edited dimension and recalculates the other.
- Switching modes does not silently select a different output size. Matching presets are recognized; custom pixel settings remain intact until the user explicitly picks a percentage. Download is disabled in percentage mode until a preset is selected. Percentage selection restores the ratio lock.
- Added positive safe-integer validation, inline input errors, output-size feedback, loading/disabled states, and download feedback. Presets round to whole pixels with a 1 px minimum.
- Restyled upload, preview, and settings in the shared green/off-white theme. Preserved local upload and PNG download through the existing `resizeImage` function; no changes to processing, dependencies, or usage limits.
- Upload failures preserve the last valid image; stale upload completions are ignored and object URLs are cleaned up. Removed the old width-only proportional handler and redundant separate dimension/preview state.

**Files:**
- Refactored `src/components/tools/ResizeTool.tsx`.
- Added `ResizeSettings.tsx`, `src/lib/image/resize-dimensions.ts`, and `tests/resize-dimensions.test.mjs`.
- Updated the Resize page description to describe both modes accurately.

**Validation:**
- `node --test tests/resize-dimensions.test.mjs`: 6/6 passed (presets, both ratio directions, re-locking, preset matching, invalid inputs, odd/tiny image rounding). Node printed a module-type detection warning; tests require a Node version supporting native TypeScript stripping (ran on Node 24).
- `npm run lint`: zero errors; one existing unused Scissors import warning in the homepage HeroSection. No warnings in the changed resize components.
- `npx tsc --noEmit`: passed.
- `npm run build`: attempted; blocked by the existing Turbopack CSS-worker internal port restriction (`Operation not permitted`). Escalated retry was declined and did not run.
- Browser upload/download and interactive UI checks remain unverified. No completed-feature checkboxes changed.

**Next steps:**
- In an unrestricted preview environment, test new uploads, all presets, mode round trips with custom dimensions, both ratio-lock directions, re-locking, invalid dimensions, unsupported files, mobile layout, and downloaded PNG dimensions; then rerun the production build.

### 2026-10-21 — Resize settings sidebar

- Moved the resize settings into a 360 px right-hand panel beside the image preview at desktop widths. Widened the tool/page container and kept preview and settings stacked on smaller screens.
- Stacked width/height inputs and percentage options vertically within the panel. Upload, processing, and download logic are unchanged.
- Files: `ResizeTool.tsx`, `ResizeSettings.tsx`, and `src/app/resize_img/page.tsx`.
- Validation: lint passed with the existing homepage unused-import warning; TypeScript passed. Build was not repeated for this layout-only change; the documented environment restriction remains. Browser layout verification is pending.
- Next step: check desktop/sidebar and mobile stacked layouts in the browser.

### 2026-10-21 — Preserve resize format and filename

- Updated `src/lib/image/resize.ts` to encode with the input File MIME type for PNG, JPEG, and WebP. Rejects unsupported/missing MIME types before decoding, null encoder output, and any output MIME mismatch (including browser PNG fallback). Bitmap cleanup still runs on encoding failure.
- Updated `ResizeTool.tsx` to validate upload formats, pass the exact original filename/extension to the download attribute, and replace obsolete PNG-only feedback. Pixels, percentage, ratio controls, and sidebar layout are unchanged; no dependencies added.
- Added `tests/resize-format.test.mjs` with mocked browser canvas/decode APIs covering all three requested encodings, unsupported/unknown MIME types, silent format fallback, encoder failure, and bitmap cleanup.
- Validation: `node --test tests/*.test.mjs` passed 12/12 tests (six format tests plus six dimension tests; Node prints the existing module-type warning). Lint passed with the existing homepage unused Scissors warning. TypeScript passed.
- `npm run build` failed at the existing Turbopack CSS-worker port restriction (`Operation not permitted`); an approved escalated retry failed identically. Production build and real-browser encoding/download checks remain unverified.
- Next step: verify actual PNG/JPEG/WebP downloads retain the original mixed-case filename/extension and encoded format in supported browsers, then rerun the build in an environment that permits the CSS worker.

### 2026-10-22 — Shared navbar on every page

- Moved Navbar into `src/app/layout.tsx` so the homepage, Resize Image, existing coming-soon pages, and future routes inherit it automatically.
- Removed page-level navbar rendering/imports from `src/app/page.tsx` and `ComingSoonTool.tsx` to prevent duplicate navigation. Tool behavior and existing footers are unchanged.
- Validation: lint passed with the existing HeroSection unused Scissors warning; TypeScript passed. Production build was not repeated for this composition-only change; the documented Turbopack environment restriction remains. Browser verification is pending.
- Next step: visually check navigation on each tool route when browser preview is available.

### 2026-10-22 — Crop Image editor

**Implemented:**
- Replaced the Crop coming-soon page with a client-side editor and a settings sidebar that stacks under the preview on smaller screens. Shared navbar remains inherited from the root layout.
- Added centered initial selection, draggable/repositionable crop, resize handles, rule-of-thirds grid, and a dark outside-selection mask through `react-image-crop` 11.1.2 (one lightweight dependency, justified by pointer/touch/keyboard crop controls).
- Added original-pixel Width, Height, Position X, and Position Y controls synchronized with the selection. Invalid/empty input drafts show errors and disable export; valid edits are constrained to positive, in-bounds integer regions.
- Added Freeform, 1:1, 4:3, 16:9, and 4:5 presets, proportional numeric edits, and a Center selection action. Whole-pixel rounding can approximate a selected ratio on odd/tiny images.
- Stored canonical crop coordinates in original-image pixels and converted them to percentages for the crop preview, independent of display scaling. Added keyboard guidance, labeled fields, visible focus treatment, busy/error feedback, stale-upload protection, and object-URL cleanup.
- Canvas exports only the selected source rectangle at its selected dimensions, preserving the original filename/extension and PNG/JPEG/WebP MIME type. Unsupported MIME types, failed encoding, and browser format fallback are rejected.
- Linked Crop Image from its homepage card and footer; updated root metadata to mention cropping.
- No crop-selection screenshot was available in the message/workspace; implemented the described selection treatment within the existing theme.

**Files and cleanup:**
- Added `CropTool.tsx`, `CropPreview.tsx`, and `CropSettings.tsx`; implemented the previously empty `src/lib/image/crop.ts` and added `crop-geometry.ts`.
- Extracted shared MIME validation/Canvas encoding into `format.ts` and download lifecycle into `download.ts`; Resize uses these same helpers, retaining its existing validation export for compatibility. Removed duplicate resize encoding/download blocks.
- Changed `src/app/crop_img/page.tsx`, `globals.css`, `src/lib/tools/catalog.ts`, `Footer.tsx`, and root metadata. Existing other tool pages remain untouched.
- Enabled `allowImportingTsExtensions` in the no-emit TypeScript configuration so shared source helpers can also be loaded directly by the existing Node tests without a new test runner.
- Added `tests/crop.test.mjs`; package manifest/lock now include the crop UI library. No additional image-processing library or server upload was added.

**Validation:**
- `node --test tests/*.test.mjs`: 22/22 passed. Covers centered/bounded geometry, all presets, original-pixel mapping from differently scaled previews, selected-region Canvas draw arguments and output dimensions for all three formats, invalid crops, MIME fallback, bitmap cleanup, exact download naming, and all previous resize tests. Canvas/decode tests use mocks; they do not establish real-browser encoder behavior. Node prints the existing module-type warning.
- `npm run lint`: zero errors, one pre-existing unused Scissors import warning in homepage HeroSection.
- `npx tsc --noEmit`: passed.
- `npm run build`: attempted and retried with elevated permission; both failed at the existing Turbopack CSS-worker port-binding restriction (`Operation not permitted`).
- Local preview startup was blocked in the sandbox; approved retry identified an already-running user development server on port 3000. Reused that server; `/crop_img` returned HTTP 200. No user server was stopped.
- Chromium interaction/visual/download verification was requested, but approval was declined; the browser test did not run. Drag/handle/touch behavior and rendered mobile geometry remain unverified.

**Next steps:**
- Run browser checks for dragging, all handles, keyboard adjustments, numeric synchronization, aspect changes, viewport resizing/mobile overflow, rotated JPEGs, unsupported files, upload replacement, and actual PNG/JPEG/WebP download pixels/formats/names. Rerun production build in an environment that allows the CSS worker.
- Compare against the crop-selection screenshot if it is supplied later. Keep feature verification checkboxes pending until browser validation succeeds.

### 2026-10-23 — Rotate Image tool

**Implemented:**
- Added `/rotate_img` with an interactive Canvas preview, Rotate Left 90°, Rotate Right 90°, Rotate 180°, synchronized numeric angle/range controls (−180° to 180°), horizontal/vertical flip toggles, Reset, output dimensions, and download feedback.
- Expanded arbitrary-angle bounds to enclose the entire image; quarter turns retain exact integer dimensions without trigonometric extra pixels. Flips apply in original-image axes before rotation, as explained in the UI.
- PNG/WebP uncovered areas stay transparent; JPEG uses a selectable background color (default white). Shared MIME validation and encoding reject unsupported input types and browser format fallback. Downloads retain the exact original filename/extension.
- Decode each upload once using `createImageBitmap(file, { imageOrientation: "from-image" })`. The same EXIF-oriented bitmap is used for preview/export, with no repeated orientation application or re-encoding while adjusting settings. Source bitmap is never modified.
- Preview uses requestAnimationFrame and ResizeObserver with a display-sized buffer; full-resolution export uses a separate temporary Canvas. Bitmap cleanup runs on replacement/unmount, stale uploads are closed, and temporary export buffers are released even after failures.
- Added responsive preview/sidebar layout, labeled keyboard-operable controls, invalid-angle validation, loading/disabled/error states, and a transparency checkerboard within the existing green/off-white theme.
- Activated the existing homepage Rotate card and added a footer link. Reused shared format, encoding, download, and navbar utilities; no new dependencies. No obsolete Rotate implementation existed to remove.

**Files:**
- Added `src/lib/image/rotate.ts`, `RotateTool.tsx`, `RotateSettings.tsx`, `RotatePreview.tsx`, `src/app/rotate_img/page.tsx`, and `tests/rotate.test.mjs`.
- Updated `globals.css`, `src/lib/tools/catalog.ts`, and `Footer.tsx`. Other image tools and their processing logic are unchanged.

**Validation:**
- `node --test tests/*.test.mjs`: 33/33 passed (11 rotation tests plus 22 existing crop/resize tests). Rotation tests cover exact quarter turns, transformed-corner bounds, invalid inputs, explicit EXIF decode options, flip/rotation order, JPEG fills versus PNG/WebP transparency, unencoded preview drawing, format preservation, encoder fallback, and temporary-buffer release. Node prints the existing module-type warning.
- `npm run lint`: zero errors; the existing unused Scissors import warning remains in homepage HeroSection.
- `npx tsc --noEmit`: passed.
- Chromium checks against the existing local development server passed: upload/initial preview, right rotation/output dimensions, horizontal flip pixel verification, reset, custom 45° output bounds, PNG transparency and downloaded dimensions/exact filename, invalid-angle download disabling, 375px mobile overflow, JPEG EXIF orientation 6 (120×80 becomes 80×120), selected JPEG background pixels, and JPEG download signature/original filename. No page errors. Screenshots inspected at desktop/mobile sizes; browser test closed its own browser and did not alter the user’s dev server.
- `npm run build`: attempted; initially blocked fetching Geist. Approved network retry reached the existing Turbopack CSS-worker internal port restriction (`Operation not permitted`). Production build remains unverified.

**Remaining work / next steps:**
- Run the production build in an environment that allows CSS-worker port binding.
- Optional broader browser coverage: all eight EXIF orientations, actual WebP export in additional browsers, vertical flips/slider keyboard interactions, large images and memory limits. PNG/JPEG browser coverage and WebP unit coverage are complete for this task.
- EXIF behavior follows the documented `from-image` option: https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap.

### 2026-10-23 — Watermark Image tool

**Implemented:**
- Added `/watermark_img` with text and image/logo watermarks, live Canvas preview, pointer/touch dragging, proportional corner resizing, a rotation handle, keyboard adjustments, numeric positioning/size/angle controls, nine quick-position presets, and reset/remove actions.
- Text settings include multiline text, four system font families, original-pixel font size, color, bold/italic, opacity, and rotation. Logo settings include local PNG/JPEG/WebP upload, proportional width resizing, opacity, and rotation.
- Added optional tiling for both types using a Canvas repeat pattern instead of an unbounded stamp loop. The watermark anchor controls the pattern phase; repeat cells use display resolution in previews and full resolution during export.
- Stored center position, size, font metrics, and rotation in original-image coordinates. Preview and export use the same renderer and font measurement; pointer coordinates are converted through the actual displayed image rectangle, including on mobile. Marks extending past source edges are clipped as described in the UI.
- Full-resolution exports preserve original dimensions, exact filename/extension, and PNG/JPEG/WebP MIME type. PNG/WebP transparency is retained; unsupported formats and encoder MIME fallback are rejected by shared utilities.
- Decoded source/logo bitmaps once with EXIF orientation applied, redrew previews through requestAnimationFrame/ResizeObserver without encoding, and added stale-upload handling, bitmap cleanup, loading/error states, and invalid-input download disabling.
- Added the existing green/off-white sidebar layout (stacked on mobile) with a sticky desktop preview and a transparency checkerboard. Activated the homepage Watermark card and footer link. No dependencies were added; native pointer capture is sufficient for a single transformable watermark.

**Files / reuse and cleanup:**
- Added `src/lib/image/watermark.ts`, `WatermarkTool.tsx`, `WatermarkPreview.tsx`, `WatermarkSettings.tsx`, `src/app/watermark_img/page.tsx`, and `tests/watermark.test.mjs`.
- Reused shared MIME validation/encoding, download lifecycle, rotation-angle normalization, button styling, checkerboard styling, and inherited navbar. Existing crop/resize/rotate functionality was left unchanged.
- Updated the tool catalog and Footer. No previous Watermark implementation existed to remove; its coming-soon card is now functional.

**Validation:**
- `node --test tests/*.test.mjs`: 44/44 passed (11 watermark tests plus 33 existing tests). Covers text/logo sizing, multiline metrics, rotated quick-position bounds, validation, scaled preview transforms, opacity, transparent no-watermark rendering, tiling patterns, all three output MIME types, fallback rejection, EXIF decode options, and source/buffer preservation. Canvas tests use mocks. Existing Node module-type warnings remain.
- `npm run lint`: zero errors; one existing unused Scissors import warning in homepage HeroSection.
- `npx tsc --noEmit`: passed.
- Chromium checks on the existing local dev server passed: text/font/bold/italic/color controls, quick positions, drag-to-original-pixel mapping, corner resizing, keyboard rotation, tiled preview, logo upload and proportional sizing, original PNG filename/dimensions, actual exported logo placement pixels and transparent pixels, missing-logo export disabling, mobile overflow at 375px, and remove/reset. No browser page errors; desktop/mobile screenshots inspected. The test browser was closed; the user’s dev server was left running.
- `npm run build`: attempted and retried with elevated permission; both hit the existing Turbopack CSS-worker internal port-binding restriction (`Operation not permitted`). Production build remains unverified.

**Remaining work / next steps:**
- Rerun production build where CSS-worker port binding is permitted. Optional additional coverage: touch gestures on physical devices, all corner/rotation handles, tiled full-resolution pixel comparisons, actual JPEG/WebP watermark downloads, EXIF variants, and large-image memory behavior. JPEG/WebP export is covered by unit tests; browser export checks used PNG.

### 2026-10-24 — Compress Image tool

**Implemented:**
- Replaced the Compress coming-soon page with multiple-image upload, original filename/format/dimensions/byte size, original/output previews, actual output bytes and percentage saved, per-image download, and accessible progress/errors.
- Added Automatic (JPEG 82%, WebP 80%, lossless PNG optimization), Manual (1–100% quality), and Target size (KB/MB, 1 KB = 1,024 bytes) modes. Target mode samples quality endpoints and uses a bounded binary search for the highest tested quality meeting the target. It tracks the smallest candidate even if encoding sizes are non-monotonic.
- Never resizes or silently converts images. Output MIME fallback is rejected, and input signatures must match their declared PNG/JPEG/WebP MIME types. When optimized output is larger/equal, or the original already meets the target, the original is offered unchanged. Unreachable targets explicitly offer the smallest result found and explain that resizing/changing format may be necessary.
- Used OffscreenCanvas for JPEG/WebP quality encoding. Added UPNG.js 2.1.0 (plus its Pako dependency) for actual PNG filter/DEFLATE and palette optimization. PNG Automatic/100% is lossless; lower Manual/Target settings reduce colors, then restore every original alpha byte before encoding. Format differences are explained in the UI.
- Retain animated PNG/WebP, 16-bit PNG, and PNGs with EXIF/custom color interpretation metadata unchanged rather than flattening frames, reducing depth, or discarding orientation/profile interpretation. Results explain these limits.
- Run processing sequentially in a Web Worker to limit concurrent image buffers. Cancel terminates the active worker immediately and stops pending jobs; completed results remain downloadable. Added stale-run guards, worker/message/allocation errors, bitmap/Canvas cleanup, and temporary URL cleanup on replacement/rerun/cancellation/unmount. Browsers missing worker/offscreen encoding support receive a clear error instead of blocking the main thread.
- Reused MIME validation, shared download handling, Next Image previews, button/checkerboard styling, inherited navbar, and the green/off-white design. Settings appear above results on mobile and in a sticky right panel on desktop. Activated the homepage Compress card and footer link. Other image tools are unchanged.

**Files / cleanup:**
- Implemented the previously empty `src/lib/image/compress.ts` and `src/workers/image.worker.ts`.
- Added `compression-search.ts`, `compression-protocol.ts`, `compress-client.ts`, `CompressTool.tsx`, `CompressSettings.tsx`, `CompressionResultCard.tsx`, `src/types/upng-js.d.ts`, and `tests/compress.test.mjs`.
- Updated `src/app/compress_img/page.tsx`, the tool catalog, Footer, and dependency manifest/lock. Removed the obsolete coming-soon route implementation; shared ComingSoonTool remains for tools still using it.

**Validation:**
- `node --test tests/*.test.mjs`: 56/56 passed (12 compression tests plus 44 prior tests). Includes real UPNG round trips at multiple qualities, exact PNG alpha preservation, lossless pixel equality, 16-bit/profile/animation retention, defaults/manual quality, reachable/unreachable targets, already-met targets, original fallback, mislabeled input rejection, encoder MIME fallback, and mocked full-size JPEG/WebP cleanup. Existing Node module-type warnings remain.
- `npm run lint`: passed with zero errors and the existing unused Scissors import warning in homepage HeroSection.
- `npx tsc --noEmit`: passed.
- Chromium checks against the existing local server passed: three-image PNG/JPEG/WebP worker processing; downloaded names, signatures/decodability, dimensions, and file sizes no larger than originals; PNG and WebP alpha preservation; target failure and already-met-original handling; Manual quality slider keyboard operation; immediate cancellation; and 375px mobile overflow. No browser page errors. Desktop/mobile screenshots inspected, including the revised mobile settings placement. The test browser was closed and the user’s server was left running.
- `npm run build`: attempted and retried with elevated permission; both failed at the existing Turbopack CSS-worker port-binding restriction (`Operation not permitted`). Production build remains unverified.

**Technical limits / next steps:**
- Run the production build in an environment permitting CSS-worker port binding. Broader browser/device testing and large-image memory-pressure testing remain useful.
- The target search reports the best settings sampled, not a mathematical global optimum for non-monotonic encoders. A target cannot always be met at unchanged dimensions/format, especially when transparency dominates PNG size.
- PNG color/alpha preservation rules are tested; custom profiles/high bit depth/animation are intentionally offered unchanged. No quotas or server uploads were introduced.
- PNG encoder reference: https://github.com/photopea/UPNG.js/ (lossless encoding and quantization). Offscreen encoding reference: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/convertToBlob.

### 2026-10-24 — Convert Image tool

**Implemented:**
- Replaced the Convert coming-soon page with local JPG/PNG/WebP conversion, JPEG/WebP quality controls (1–100%), selectable JPEG matte color (default white), original/output previews, format/dimension/actual-byte-size details, and converted-image download.
- Preserved decoded original dimensions and the filename basename, replacing only the final extension with `.jpg`, `.png`, or `.webp`. Same-format requests explicitly re-encode and explain potential quality/size changes; conversion does not substitute an original file when the requested output is larger.
- Probe actual browser encoders with a small Canvas and disable unsupported output options. Every full-size encoding verifies the returned MIME type, rejecting silent PNG fallback. No AVIF is advertised or codec dependency added without a reliable verified encoder.
- Applied EXIF orientation once when decoding a reusable source bitmap. JPEG composites source transparency onto the chosen color before drawing; PNG/WebP retain transparency. UI explains metadata loss and still-frame export of animated inputs.
- Released output Canvas buffers in finally blocks, closed source bitmaps on replacement/unmount/stale uploads, revoked preview URLs on result changes/replacement/unmount, and cleared stale converted results when settings change. Added responsive settings/preview layouts, labeled keyboard controls, loading/error feedback, and inherited shared navigation.
- Kept conversion logic independent of React: a per-image `convertImage` API accepts a decoded source, filename, and settings and returns a Blob plus output metadata. A later batch UI can queue independent calls while managing bitmap lifetime outside the renderer.

**Files / reuse and cleanup:**
- Implemented the previously empty `src/lib/image/convert.ts`; added `ConvertTool.tsx`, `ConvertSettings.tsx`, `ImagePreview.tsx`, and `tests/convert.test.mjs`.
- Extended the existing shared `encodeCanvas` helper with optional quality and generalized its MIME mismatch message to the requested output format. Existing callers retain unchanged default encoding behavior; related regression assertions now match the generalized message.
- Extracted the repeated checkerboard/photo preview into shared `ImagePreview`, used by Convert and CompressionResultCard. Reused shared file-size formatting, MIME validation, download lifecycle, button styling, and navbar.
- Updated `/convert_img`, tool catalog, and Footer links. Removed `ComingSoonTool.tsx` after confirming that the last placeholder route no longer used it. No dependencies added or removed; still-unfinished homepage tools keep non-interactive coming-soon cards.

**Validation:**
- `node --test tests/*.test.mjs`: 65/65 passed (nine conversion tests and 56 existing tests). Covers basename/extension replacement, all three MIME types and quality arguments, unchanged dimensions, JPEG background-before-image order, buffer release and source preservation, MIME fallback, unavailable encoder detection, invalid inputs, and explicit EXIF decode options. Existing Node module-type warnings remain.
- `npm run lint`: zero errors; one existing unused Scissors import warning in homepage HeroSection.
- `npx tsc --noEmit`: passed.
- Chromium checks on the existing local server passed: actual JPG/PNG/WebP encoding/signatures, unchanged dimensions and basename/extension naming, selected JPEG background pixels, PNG/WebP transparency, same-format warning, PNG quality-control omission, quality slider keyboard use, stale result invalidation, JPEG EXIF orientation 6 normalization (120×80 to 80×120), and 375px mobile overflow. Compress route still renders after shared-preview extraction. No page errors; desktop/mobile screenshots inspected. Browser was closed and the user’s existing server left running.
- `npm run build`: attempted and retried with elevated permission; both failed at the existing Turbopack CSS-worker port-binding restriction (`Operation not permitted`). Production build remains unverified.

**Remaining work / next steps:**
- Rerun production build where CSS-worker port binding is permitted. Optional further checks include physical mobile devices, all EXIF variants, memory-pressure cases, codec unavailability in additional browsers, and batch conversion UI.
- Output is a still Canvas-encoded image; metadata/animation are not retained. Additional output formats remain intentionally unavailable until supported by a verified reliable encoder.

### 2026-10-24 — Extended conversion inputs

**Implemented / technical decisions:**
- Convert now detects actual file signatures for JPG, PNG, WebP, HEIC/HEIF, AVIF, GIF, BMP, and TIFF instead of trusting filename extensions or declared MIME types. Native browser decoding handles supported codecs; HEIC/HEIF falls back to on-demand `heic-to`, and TIFF uses on-demand UTIF.js. Both fallback decoders run in a disposable Web Worker, keeping codec bundles out of ordinary uploads.
- Added reusable `detect-format`, `decode`, `encode`, decode-worker protocol, and TIFF orientation utilities for future tool reuse. Other tools retain their existing input support. Removed the obsolete Convert-specific decoding wrapper.
- Preserve full decoded dimensions and filename stem, with output extensions matching JPG/PNG/WebP. AVIF output appears only after matching MIME/signature and a successful encode/decode probe; full exports also validate their actual encoding. Transparency and selectable JPEG backgrounds remain supported.
- Detect animated PNG/WebP/GIF, HEIF/AVIF sequences or multiple image items, and multiple TIFF pages. Explain first-frame/page conversion and distinguish HEIF auxiliary images from animation frames. Normalize TIFF orientation and native EXIF orientation consistently.
- Added cancellation, worker termination, stale-result guards, bitmap/Canvas/object-URL cleanup, unsupported codec errors, and memory-failure messages. Unsupported source formats use a decoded thumbnail for preview while retaining the full-resolution bitmap for export. Maintained accessible controls and responsive green/off-white styling.

**Validation:**
- `node --test tests/*.test.mjs`: 73/73 passed, including signature detection, animation/container inspection, TIFF orientation matrices, decode failure/cancellation cleanup, validated AVIF capability detection, and all existing tool regressions. Existing Node module-type warnings remain.
- `npx tsc --noEmit`: passed. `npm run lint`: zero errors, with the existing unused Scissors import warning in homepage HeroSection. Reviewed updated React controls and resource lifecycle against the React best-practices checklist.
- Chromium checks passed for a deliberately mislabeled PNG, BMP, animated GIF, an oriented two-page TIFF, real AVIF input, and real HEIC fallback decoding. Verified output dimensions/stems, first-frame warnings, lazy codec loading, 375px mobile layout, and no page errors. AVIF output stayed hidden because the tested browser lacked a validated encoder; its positive capability path is covered by unit tests. Test browser closed; existing development server left running.
- `npm run build`: attempted and retried with elevated permission; both encountered the existing Turbopack CSS-worker port-binding restriction (`Operation not permitted`). Production build remains unverified.

**Limitations / remaining work:**
- Native input support depends on browser codecs. BigTIFF and unsupported TIFF compression/color layouts fail explicitly. Canvas exports use 8-bit pixels; HDR, profiles, metadata, and animation are not retained. Only the first decoded image/page is exported; there is no frame picker. HEIF collections may include thumbnails or auxiliary images.
- Rerun the production build in an environment permitting CSS-worker port binding. Further checks: generic HEIF fixtures, additional browsers/devices, and memory-pressure cases. Decoder utilities are ready for later adoption by other tools; no server processing or quotas were introduced.
- Decoder references: https://github.com/hoppergee/heic-to and https://github.com/photopea/UTIF.js/.

### 2026-10-24 — Remove Batch Processing and Image to PDF listings

- Removed both tool cards from the shared catalog and removed the now-unused PDF category. Homepage filters, search results, and desktop/mobile navigation automatically reflect the updated catalog.
- Removed unused Layers and FileImage icon imports. Neither tool had an implemented route or processing code; existing image tools remain unchanged.
- Validation: `npm run lint` passed with the existing unused Scissors warning; `npx tsc --noEmit` passed. Confirmed no remaining references to these tools in `src/`. Production build was not repeated for this catalog-only removal; the previously documented environment restriction remains unresolved.

### 2026-10-24 — QR Code Generator

**Implemented / technical decisions:**
- Added `/qr-code-generator`, a homepage tool card and Generators category, shared desktop/mobile navigation, and footer link. Reused inherited navbar, green/off-white cards, button styling, and the existing Blob download helper.
- Added URL, plain text, Wi-Fi (WPA/WEP/open, hidden SSID), email (optional subject/body), and phone inputs. Separate pure payload helpers validate values, escape Wi-Fi delimiters, percent-encode email addresses/query fields, and normalize phone formatting. Encode Unicode content as UTF-8 bytes.
- Added lazy-loaded `qr-code-styling` 1.9.2 for local standards-based SVG preview and PNG/SVG export. Generation stays independent of React, with a 200ms debounce, stale-render guards, capacity/error feedback, and disabled stale downloads. No backend, persistence, accounts, AI, or usage quotas.
- Support six dot patterns, three corner styles, foreground/background colors, 256/512/1024px outputs, and L/M/Q/H correction. Preserve a conservative quiet zone (18% per edge, exceeding four modules at the smallest QR version); reject inverted or below-4.5:1 color combinations. Fractional SVG modules avoid blank dense codes caused by integer rounding.
- Optional local raster logos are decoded, scaled into a bounded preview buffer, and embedded in exported SVGs so downloads remain self-contained. Adding a logo selects H correction; users can remove it or reset all settings. Bitmap/Canvas resources are released, and stale logo reads cannot overwrite reset state.
- Explain logo/customization/contrast risks, dense-content output sizing, scanner testing, and the exposure of Wi-Fi credentials to anyone who can scan the code. Controls have accessible names, validation/status feedback, and responsive layouts.

**Validation:**
- `npm run lint`: zero errors; existing unused Scissors warning in homepage HeroSection remains. `npx tsc --noEmit`: passed.
- `node --test tests/*.test.mjs`: 77/77 passed, including four new QR tests covering URL validation, Unicode payload preservation, Wi-Fi escaping/open-network behavior, email/phone delimiter handling, and color contrast. Existing Node module-type warnings remain.
- Chromium browser checks decoded actual generated QR previews using an independent jsQR decoder: all five payload types, non-English text/emoji, styled dots/corners, and a centered logo with H correction passed. PNG and SVG downloads succeeded; PNG dimensions and embedded SVG logo were checked. Contrast rejection, stale-download disabling, reset, 375px layout, and absence of page errors passed. Desktop/mobile screenshots inspected. Test browser closed; existing server left running. Reviewed React controls/lifecycle against the React best-practices checklist.
- `npm run build`: attempted and retried with elevated permission; both encountered the existing Turbopack CSS-worker port-binding restriction (`Operation not permitted`). Production build remains unverified.

**Remaining work / limits:**
- Rerun production build where CSS-worker port binding is permitted. Physical scanner/device/print testing and dense-content cases remain useful: decorative patterns and logos cannot guarantee readability on every scanner. QR capacity depends on content and correction level; oversized payloads show errors rather than imposing a separate usage quota.
- Only locally decoded raster logos are accepted; no remote logo URLs. Wi-Fi enterprise credentials are outside this implementation. Temporary independent browser-test tooling was installed under `/tmp`, outside project dependencies.
- Library reference: https://github.com/kozakdenys/qr-code-styling.

### 2026-10-24 — Remove QR logo uploads

- Removed the QR generator’s image/logo upload, removal controls, loading state, and logo-specific guidance.
- Removed unused logo decoding, image embedding options, and logo state from the QR renderer. QR payload types, styling, correction levels, sizes, preview, and PNG/SVG exports remain available; other tools are unchanged.
- Validation: lint passed with the existing unused Scissors warning; TypeScript passed; all four QR tests passed. Production build was not repeated for this removal; the previously documented environment restriction remains unresolved.

### 2026-10-24 — Remove homepage search

- Removed the homepage search bar, query state, search filtering/reset controls, empty search results, and unused search icons from `ToolDirectory.tsx`.
- Removed unused search keywords from the tool catalog. Category tabs and the All Tools grid remain available; removing the search wrapper also removes its reserved spacing.
- Validation: lint passed with the existing unused Scissors warning; TypeScript passed. Production build was not repeated for this UI removal; the previously documented environment restriction remains unresolved.

### 2026-10-24 — Home and Tools navbar

- Replaced the standalone category links and mobile-only icon menu in `Navbar.tsx` with a visible Home link and hamburger button labeled Tools at every screen size.
- Tools dropdown links directly to implemented tools from the shared catalog and includes All Tools. Uses native details/summary keyboard interaction, visible focus styles, Escape/outside-click dismissal, close-on-navigation behavior, and a viewport-constrained scrollable list. The header can wrap on narrow screens.
- Validation: lint passed with the existing unused Scissors warning; TypeScript passed. Production build was not repeated for this navigation change; the previously documented environment restriction remains unresolved.

### 2026-10-24 — Remove All Tools menu item

- Removed the All Tools link from the navbar hamburger dropdown; individual tool links remain.
- Validation: lint passed with the existing unused Scissors warning; TypeScript passed.

### 2026-10-24 — Footer LinkedIn link

- Added the provided LinkedIn profile beside About Me in `Footer.tsx`, opening in a new tab with safe rel attributes and an accessible label.
- Validation: TypeScript passed; lint reported no errors and two existing unused-import warnings (HeroSection and Footer).

### 2026-10-24 — Remove ready status badges

- Removed “Ready to use” badges from homepage tool cards in `ToolCard.tsx`; unfinished tools still display Coming soon.
- Validation: TypeScript passed; lint reported zero errors and the two existing unused-import warnings.

### 2026-10-24 — Browser tab branding

- Set the root metadata default title to `PhotoBarber - Free Online Image Tools` and the shared child-page template to `%s | PhotoBarber` in `src/app/layout.tsx`.
- Removed hardcoded brand suffixes from six tool-page titles to prevent duplication; Resize already had a plain title and inherits the template.
- Added `src/app/icon.svg` using the existing Lucide scissors branding, white strokes, rounded square, and forest green `#164d3b`. Replaced the default `favicon.ico` with matching 16/32/48px PNG-backed ICO entries. Used existing Sharp tooling for asset generation; added no dependencies. Next.js file-based metadata serves both icons automatically.
- Validation: lint passed with the existing unused Scissors warning; TypeScript passed. Headless Chromium verified the exact homepage title, all seven tool titles with one brand suffix, SVG icon metadata/response, and the multi-size ICO response. Test browser closed; existing development server left running.
- Production build was not repeated for this metadata/asset update; the previously documented Turbopack environment restriction remains unresolved.

### 2026-10-24 — Footer GitHub link

- Added the supplied GitHub profile beside LinkedIn in `Footer.tsx`, matching existing styling and new-tab accessibility/security attributes.
- Validation: TypeScript passed; lint passed with the existing unused Scissors warning.

## Next Steps

1. Complete production build and browser verification for the homepage directory redesign.
2. Apply the shared design system to Resize Image.
3. Continue with the next image-processing tool.
