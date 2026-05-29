const fs = require('fs');
const path = require('path');

const root = process.cwd();
const docsDir = path.join(root, 'docs');
const siteDir = path.join(root, 'site');
const sourceDocsDir = path.join(siteDir, '_source', 'docs');
const editorScriptPath = path.join(siteDir, 'assets', 'js', 'page-editor.js');

function toUrlPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function htmlEscape(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyMarkdownSources() {
  fs.rmSync(sourceDocsDir, { recursive: true, force: true });
  ensureDir(sourceDocsDir);

  const markdownFiles = fs.readdirSync(docsDir).filter((file) => file.endsWith('.md'));
  for (const file of markdownFiles) {
    fs.copyFileSync(path.join(docsDir, file), path.join(sourceDocsDir, file));
  }

  return markdownFiles.length;
}

function walkHtmlFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '_source') continue;

    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(entryPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(entryPath);
    }
  }
  return files;
}

function sourceFileForHtml(htmlPath) {
  const relativeHtml = path.relative(siteDir, htmlPath);
  const dir = path.dirname(relativeHtml);

  if (relativeHtml === 'index.html') {
    return 'index.md';
  }

  if (path.basename(relativeHtml) !== 'index.html' || dir === '.') {
    return null;
  }

  return `${path.basename(dir)}.md`;
}

function injectEditorScript() {
  let injected = 0;

  for (const htmlPath of walkHtmlFiles(siteDir)) {
    const sourceFile = sourceFileForHtml(htmlPath);
    if (!sourceFile || !fs.existsSync(path.join(sourceDocsDir, sourceFile))) continue;

    const htmlDir = path.dirname(htmlPath);
    const scriptSrc = toUrlPath(path.relative(htmlDir, editorScriptPath));
    const sourceHref = toUrlPath(path.relative(htmlDir, path.join(sourceDocsDir, sourceFile)));
    const scriptTag = `<script id="page-editor-script" src="${htmlEscape(scriptSrc)}" data-source="${htmlEscape(sourceHref)}" data-filename="${htmlEscape(sourceFile)}" defer></script>`;

    let html = fs.readFileSync(htmlPath, 'utf8');
    if (html.includes('id="page-editor-script"')) continue;

    if (html.includes('</body>')) {
      html = html.replace('</body>', `  ${scriptTag}\n</body>`);
    } else {
      html += `\n${scriptTag}\n`;
    }

    fs.writeFileSync(htmlPath, html);
    injected += 1;
  }

  return injected;
}

if (!fs.existsSync(siteDir)) {
  throw new Error('site directory does not exist. Run docmd build first.');
}

const copied = copyMarkdownSources();
const injected = injectEditorScript();

console.log(`Copied ${copied} Markdown source file(s) for edit-mode downloads.`);
console.log(`Injected edit-mode script into ${injected} HTML page(s).`);
