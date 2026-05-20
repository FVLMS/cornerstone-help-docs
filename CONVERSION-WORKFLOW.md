# Tip Sheet Conversion Workflow

Use this workflow to convert the remaining Word tip sheets into the `cornerstone-help-docs` site.

## Source Selection

- Use the `.docx` file as the primary source.
- Use the matching PDF only as a visual reference when the Word conversion is messy.
- Flag duplicate, outdated, or year-specific documents before converting them.

## Article Conversion

1. Convert the Word file with `pandoc` to inspect the text and extract media.
2. Rewrite the article manually into the web documentation pattern:
   - front matter with `title` and `description`
   - one `# H1`
   - short intro
   - `## Before You Begin` when permissions, risk, or setup matter
   - `## Steps`
   - `## Notes` for exceptions and support guidance
3. Remove Word conversion artifacts such as repeated numbers, collapsed spacing, and manual page-layout leftovers.
4. Use exact Cornerstone UI labels in bold.
5. Keep one action per step when possible.

## Image Workflow

- Store extracted local screenshots in `image-upload-staging/<article-slug>/`.
- Keep unannotated source extractions only if they help future editing.
- Create web-ready annotated PNGs named `step-01.png`, `step-02.png`, and so on.
- Default to no numbered callouts. The written procedure already provides the sequence.
- Crop screenshots tightly around the relevant UI area.
- Use a thin warm-coral focus ring or halo around the target control.
- Use numbers only when a single screenshot must explain multiple actions and the order is not obvious from the text.
- Use arrows sparingly, only when the target is far from the label or the screenshot is too dense to read otherwise.
- Avoid thick red rectangles, heavy leader lines, large callout circles, sticker-like dots, and any annotation that covers UI text.
- Do not rely on image callouts alone; the written step must describe the action.
- Screenshots are not intended to be hosted from GitHub. The local `image-upload-staging/` folder is ignored by Git and kept outside `assets/` so docmd does not copy it into the built site.
- Before public publishing, replace any local staged image paths with externally hosted SharePoint image URLs.
- The production image base path is `https://mnfhs.sharepoint.com/sites/LearningManagementSystem/Shared%20Documents/cornerstone-help-docs/`.
- Use `conversion/image-manifest.csv` to track the final URL for each screenshot, then run `python conversion/update_image_urls.py --apply` after `final_sharepoint_url` is filled in.

Current pilot style:

- target emphasis: thin warm-coral rounded rectangle or halo, approximately `#e05c38`
- secondary edge: very light coral outer ring, approximately `#ffd8cc`
- no shadows, filled dots, or number badges for simple one-step targets
- output: antialiased PNG

If local install fails on Windows because `npm config get os` returns `linux`, use a command-scoped override before installing:

```powershell
$env:npm_config_os='win32'
$env:npm_config_cpu='x64'
npm ci
```

## Pilot Standard

Use `docs/content-create-material.md` as the first completed example. Future conversions should match its structure, tone, and screenshot treatment unless review feedback changes the standard.

## Review Checklist

- The article can be followed without opening the old Word/PDF file.
- Screenshot callouts match the written steps.
- No private learner or employee data appears in screenshots.
- Navigation/sidebar title is clear.
- Search terms are present in the title, description, and first paragraph.
- Local staged image paths are acceptable for review but must not remain before final public publish.
- `rg -n "assets/images-staged" docs` returns no matches before the GitHub Pages push.
