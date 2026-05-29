(function () {
  const params = new URLSearchParams(window.location.search);
  if (params.get('edit') !== '1') return;

  const script = document.getElementById('page-editor-script');
  if (!script) return;

  const sourceUrl = script.getAttribute('data-source');
  const fileName = script.getAttribute('data-filename') || 'guide.md';
  if (!sourceUrl) return;

  const editableSelector = '.main-content';
  let sourceMarkdown = '';
  let originalHtml = '';
  let frontMatter = '';

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function splitFrontMatter(markdown) {
    const match = markdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
    if (!match) return { frontMatter: '', body: markdown };
    return {
      frontMatter: match[0].trimEnd(),
      body: markdown.slice(match[0].length)
    };
  }

  function escapeAttribute(value) {
    return String(value || '').replace(/"/g, '&quot;');
  }

  function normalizeText(value) {
    return value.replace(/\s+/g, ' ');
  }

  function trimBlankLines(value) {
    return value
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function inlineMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return normalizeText(node.textContent || '');
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const tag = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map(inlineMarkdown).join('');

    if (tag === 'strong' || tag === 'b') return `**${children.trim()}**`;
    if (tag === 'em' || tag === 'i') return `*${children.trim()}*`;
    if (tag === 'code') return `\`${children.trim()}\``;
    if (tag === 'br') return '\n';

    if (tag === 'a') {
      const href = node.getAttribute('href');
      const label = children.trim() || href || '';
      return href ? `[${label}](${href})` : label;
    }

    if (tag === 'img') {
      return imageMarkdown(node);
    }

    return children;
  }

  function blockChildrenMarkdown(node, depth) {
    return Array.from(node.childNodes)
      .map((child) => blockMarkdown(child, depth))
      .filter(Boolean)
      .join('\n\n');
  }

  function imageMarkdown(node) {
    const className = node.getAttribute('class');
    const src = node.getAttribute('src') || '';
    const alt = node.getAttribute('alt') || '';
    const classAttr = className ? ` class="${escapeAttribute(className)}"` : '';
    return `<img${classAttr} src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}">`;
  }

  function listMarkdown(node, depth, ordered) {
    let index = 1;
    return Array.from(node.children)
      .filter((child) => child.tagName && child.tagName.toLowerCase() === 'li')
      .map((item) => {
        const marker = ordered ? `${index++}. ` : '- ';
        const indent = '   '.repeat(depth);
        const parts = [];

        for (const child of Array.from(item.childNodes)) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const childTag = child.tagName.toLowerCase();
            if (childTag === 'ul' || childTag === 'ol') {
              parts.push({
                type: 'nested',
                value: listMarkdown(child, depth + 1, childTag === 'ol')
              });
              continue;
            }
          }

          const rendered = blockMarkdown(child, depth + 1);
          if (rendered) {
            parts.push({
              type: 'block',
              value: rendered
            });
          }
        }

        const continuationIndent = `${indent}${' '.repeat(marker.length)}`;
        const formatContinuation = (value) => value
          .split('\n')
          .map((line) => `${continuationIndent}${line}`)
          .join('\n');

        if (!parts.length) return `${indent}${marker}`;

        const [first, ...rest] = parts;
        const firstValue = first.type === 'nested' ? `\n${first.value}` : first.value;
        let output = firstValue
          .split('\n')
          .map((line, lineIndex) => (lineIndex === 0 ? `${indent}${marker}${line}` : `${continuationIndent}${line}`))
          .join('\n');

        for (const part of rest) {
          output += part.type === 'nested'
            ? `\n${part.value}`
            : `\n\n${formatContinuation(part.value)}`;
        }

        return output;
      })
      .join('\n');
  }

  function tableMarkdown(node) {
    const rows = Array.from(node.querySelectorAll('tr')).map((row) =>
      Array.from(row.children).map((cell) => inlineMarkdown(cell).trim())
    );
    if (!rows.length) return '';

    const header = rows[0];
    const separator = header.map(() => '---');
    const body = rows.slice(1);
    return [header, separator, ...body].map((row) => `| ${row.join(' | ')} |`).join('\n');
  }

  function blockquoteMarkdown(node, depth) {
    const content = blockChildrenMarkdown(node, depth).trim();
    return content
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
  }

  function blockMarkdown(node, depth = 0) {
    if (node.nodeType === Node.TEXT_NODE) {
      return normalizeText(node.textContent || '').trim();
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const tag = node.tagName.toLowerCase();

    if (node.classList.contains('page-navigation')) return '';
    if (node.classList.contains('markdown-editor-ui')) return '';

    if (/^h[1-6]$/.test(tag)) {
      return `${'#'.repeat(Number(tag.slice(1)))} ${inlineMarkdown(node).trim()}`;
    }

    if (tag === 'p') return inlineMarkdown(node).trim();
    if (tag === 'ul') return listMarkdown(node, depth, false);
    if (tag === 'ol') return listMarkdown(node, depth, true);
    if (tag === 'li') return inlineMarkdown(node).trim();
    if (tag === 'img') return imageMarkdown(node);
    if (tag === 'blockquote') return blockquoteMarkdown(node, depth);
    if (tag === 'table') return tableMarkdown(node);

    if (tag === 'pre') {
      const code = node.querySelector('code');
      return `\`\`\`\n${code ? code.textContent : node.textContent}\n\`\`\``;
    }

    if (tag === 'hr') return '---';
    if (tag === 'div' || tag === 'section' || tag === 'article' || tag === 'main') {
      return blockChildrenMarkdown(node, depth);
    }

    return inlineMarkdown(node).trim();
  }

  function buildMarkdown(editable) {
    const clone = editable.cloneNode(true);
    const navigation = clone.querySelector('.page-navigation');
    if (navigation) navigation.remove();

    const body = trimBlankLines(blockChildrenMarkdown(clone, 0));
    return frontMatter ? `${frontMatter}\n\n${body}\n` : `${body}\n`;
  }

  function downloadMarkdown(markdown) {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 500);
  }

  async function loadSource(status, download) {
    status.textContent = `Loading ${fileName}...`;
    download.disabled = true;

    try {
      const response = await fetch(sourceUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Unable to load ${fileName}: ${response.status}`);
      }

      sourceMarkdown = await response.text();
      frontMatter = splitFrontMatter(sourceMarkdown).frontMatter;
      status.textContent = `Editing ${fileName}`;
      download.disabled = false;
    } catch (error) {
      status.textContent = error.message || 'Unable to load source Markdown.';
    }
  }

  function lockNonArticleControls(editable) {
    const navigation = editable.querySelector('.page-navigation');
    if (navigation) navigation.setAttribute('contenteditable', 'false');

    for (const image of editable.querySelectorAll('img')) {
      image.setAttribute('contenteditable', 'false');
      image.setAttribute('draggable', 'false');
    }
  }

  function buildEditor() {
    const editable = document.querySelector(editableSelector);
    if (!editable) return;

    originalHtml = editable.innerHTML;
    document.body.classList.add('markdown-editor-enabled', 'markdown-editor-inline');
    editable.classList.add('markdown-editor-target');
    editable.setAttribute('contenteditable', 'true');
    editable.setAttribute('spellcheck', 'true');
    editable.setAttribute('aria-label', `Editable article content for ${fileName}`);
    lockNonArticleControls(editable);

    const toolbar = createElement('div', 'markdown-editor-toolbar markdown-editor-ui');
    toolbar.setAttribute('role', 'region');
    toolbar.setAttribute('aria-label', 'Markdown editing controls');

    const status = createElement('p', 'markdown-editor-inline-status', `Editing ${fileName}`);
    const actions = createElement('div', 'markdown-editor-inline-actions');
    const reset = createElement('button', 'markdown-editor-secondary', 'Reset');
    const download = createElement('button', 'markdown-editor-primary', 'Download .md');
    const exit = createElement('button', 'markdown-editor-secondary', 'Exit');
    reset.type = 'button';
    download.type = 'button';
    exit.type = 'button';
    actions.append(reset, download, exit);
    toolbar.append(status, actions);
    document.body.append(toolbar);

    loadSource(status, download);

    reset.addEventListener('click', () => {
      editable.innerHTML = originalHtml;
      lockNonArticleControls(editable);
      status.textContent = `${fileName} reset`;
      editable.focus();
    });

    download.addEventListener('click', () => {
      downloadMarkdown(buildMarkdown(editable));
      status.textContent = `${fileName} downloaded`;
    });

    exit.addEventListener('click', () => {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete('edit');
      window.location.href = nextUrl.toString();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildEditor);
  } else {
    buildEditor();
  }
})();
