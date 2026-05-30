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
2. Enter the article title, filename slug, description, and sidebar section.
3. Edit the draft article content in the page.
4. Add screenshots with `Add Image` after the files have been uploaded to SharePoint.
5. Select `Download .md`.
6. Save the downloaded file into `docs/` using the downloaded filename.

## Add the article to the sidebar

Open `docmd.config.js` and add the generated sidebar line under the selected section's `children` array.

Example:

```js
{ title: 'Example Article', path: 'example-article', icon: 'file-text' },
```

The `path` must match the Markdown filename without `.md`.

## Publish

1. Commit the new or updated files.
2. Push to `main`.
3. GitHub Actions rebuilds and deploys the site to GitHub Pages.

Images are not stored in GitHub. Upload screenshots to SharePoint first, keeping the expected folder and file names.
