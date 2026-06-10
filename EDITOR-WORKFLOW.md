# Editor workflow

This site is static. The browser editor can create or edit Markdown files, but it cannot publish changes directly.

## Edit an existing article

1. Open any article and add `?edit=1` to the URL.
2. Edit the rendered page.
3. Use the toolbar for headings, bold, italic, lists, links, and images.
4. Select `Download .md`.
5. Replace the matching file in `docs/`.
6. Commit and push to GitHub. GitHub Actions publishes the Pages site.

## Create a new article

1. Open any article and add `?edit=1&new=1` to the URL, or open `?edit=1` and select `New Article`.
2. Enter the article title, filename slug, description, sidebar section, sidebar title, and sidebar order.
3. Edit the draft article content in the page.
4. Add screenshots with `Add Image` after the files have been uploaded to SharePoint.
5. Select `Download .md`.
6. Save the downloaded file into `docs/` using the downloaded filename.

## Sidebar navigation

The sidebar is generated from each Markdown file's front matter during the build. New downloaded articles include the needed fields:

```yaml
navTitle: "Example Article"
navSection: "Content Creation"
navIcon: "file-text"
navOrder: 999
```

Use `navTitle` for the shorter sidebar label, `navSection` for the sidebar group, and `navOrder` to place the article within that group. Lower `navOrder` values appear earlier.

No `docmd.config.js` edit is needed for new articles unless you are adding an entirely new sidebar section.

## Print

Use the `Print` button on any article page. The print layout hides the sidebar, editor toolbar, search UI, footer, and page navigation so the article content prints cleanly.

## Publish

1. Commit the new or updated files.
2. Push to `main`.
3. GitHub Actions rebuilds and deploys the site to GitHub Pages.

Images are not stored in GitHub. Upload screenshots to SharePoint first, keeping the expected folder and file names.
