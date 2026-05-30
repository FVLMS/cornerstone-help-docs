(function () {
  const params = new URLSearchParams(window.location.search);
  if (params.get('edit') !== '1') return;

  const script = document.getElementById('page-editor-script');
  if (!script) return;

  const sourceUrl = script.getAttribute('data-source');
  const pageFileName = script.getAttribute('data-filename') || 'guide.md';
  let outputFileName = pageFileName;
  if (!sourceUrl) return;

  const editableSelector = '.main-content';
  const imageBaseUrl = 'https://mnfhs.sharepoint.com/sites/LearningManagementSystem/Shared%20Documents/cornerstone-help-docs/';
  const editorClassPrefix = 'markdown-editor-';

  let sourceMarkdown = '';
  let originalHtml = '';
  let frontMatter = '';
  let isNewArticle = params.get('new') === '1';
  let selectedImage = null;
  let savedRange = null;

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function slugify(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  function escapeYaml(value) {
    return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function buildFrontMatter(title, description) {
    return [
      '---',
      `title: "${escapeYaml(title)}"`,
      `description: "${escapeYaml(description)}"`,
      '---'
    ].join('\n');
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

  function safeDecode(value) {
    try {
      return decodeURIComponent(value);
    } catch (_error) {
      return value;
    }
  }

  function encodeSharePointPath(value) {
    return value
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => encodeURIComponent(safeDecode(part)))
      .join('/');
  }

  function cleanPath(value) {
    return value.trim().replace(/^\/+|\/+$/g, '');
  }

  function joinImagePath(folder, imageFile) {
    const cleanFolder = cleanPath(folder);
    const cleanFile = imageFile.trim().replace(/^\/+/, '');

    if (/^https?:\/\//i.test(cleanFile)) return cleanFile;

    const relativePath = cleanFolder ? `${cleanFolder}/${cleanFile}` : cleanFile;
    return `${imageBaseUrl}${encodeSharePointPath(relativePath)}`;
  }

  function imageClassesForSize(size) {
    const classes = ['guide-image'];

    if (size === 'small') classes.push('guide-image--small');
    if (size === 'phone') classes.push('guide-image--phone');
    if (size === 'tiny') classes.push('guide-image--tiny');
    if (size === 'small-phone') classes.push('guide-image--small', 'guide-image--phone');

    return classes;
  }

  function imageSizeFromClassList(classList) {
    const hasSmall = classList.contains('guide-image--small');
    const hasPhone = classList.contains('guide-image--phone');

    if (hasSmall && hasPhone) return 'small-phone';
    if (classList.contains('guide-image--tiny')) return 'tiny';
    if (hasPhone) return 'phone';
    if (hasSmall) return 'small';
    return 'normal';
  }

  function imagePartsFromSrc(src) {
    const rawSrc = src || '';
    if (!rawSrc.startsWith(imageBaseUrl)) {
      return { folder: '', imageFile: rawSrc };
    }

    const relativePath = rawSrc.slice(imageBaseUrl.length);
    const parts = relativePath.split('/');
    const imageFile = safeDecode(parts.pop() || '');
    const folder = parts.map(safeDecode).join('/');

    return { folder, imageFile };
  }

  function defaultImageFolder(editable) {
    const firstImage = editable.querySelector(`img[src^="${imageBaseUrl}"]`);
    if (firstImage) return imagePartsFromSrc(firstImage.getAttribute('src')).folder;
    return outputFileName.replace(/\.md$/i, '');
  }

  function setSelectedImage(image) {
    if (selectedImage) selectedImage.classList.remove('markdown-editor-selected-image');
    selectedImage = image;
    if (selectedImage) selectedImage.classList.add('markdown-editor-selected-image');
  }

  function setImageClasses(image, size) {
    image.className = imageClassesForSize(size).join(' ');
    if (image === selectedImage) image.classList.add('markdown-editor-selected-image');
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
    const classNames = Array.from(node.classList).filter((className) => !className.startsWith(editorClassPrefix));
    const src = node.getAttribute('src') || '';
    const alt = node.getAttribute('alt') || '';
    const classAttr = classNames.length ? ` class="${escapeAttribute(classNames.join(' '))}"` : '';
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

    if (tag === 'p') {
      const hasBlockChild = Array.from(node.children).some((child) =>
        ['blockquote', 'ol', 'pre', 'table', 'ul'].includes(child.tagName.toLowerCase())
      );

      return hasBlockChild ? blockChildrenMarkdown(node, depth) : inlineMarkdown(node).trim();
    }
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
    link.download = outputFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 500);
  }

  async function loadSource(status, download) {
    status.textContent = `Loading ${outputFileName}...`;
    download.disabled = true;

    try {
      const response = await fetch(sourceUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Unable to load ${outputFileName}: ${response.status}`);
      }

      sourceMarkdown = await response.text();
      frontMatter = splitFrontMatter(sourceMarkdown).frontMatter;
      status.textContent = `Editing ${outputFileName}`;
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
      image.tabIndex = 0;
    }
  }

  function refreshImageControls(editable, imagePanel) {
    for (const control of editable.querySelectorAll('.markdown-editor-image-chip')) {
      control.remove();
    }

    for (const image of editable.querySelectorAll('img')) {
      if (image.closest('.page-navigation')) continue;

      const button = createElement('button', 'markdown-editor-image-chip markdown-editor-ui', 'Edit Image');
      button.type = 'button';
      button.setAttribute('contenteditable', 'false');
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        imagePanel.openForImage(image);
      });
      image.after(button);
    }
  }

  function saveSelection(editable) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;

    if (container && editable.contains(container) && !container.closest('.page-navigation')) {
      savedRange = range.cloneRange();
    }
  }

  function restoreSelection(editable) {
    const selection = window.getSelection();
    editable.focus();

    if (!savedRange || !selection) return;

    selection.removeAllRanges();
    selection.addRange(savedRange);
  }

  function cleanupEditableMarkup(editable) {
    const blockTags = ['blockquote', 'ol', 'pre', 'table', 'ul'];

    for (const paragraph of Array.from(editable.querySelectorAll('p'))) {
      const blockChildren = Array.from(paragraph.children).filter((child) =>
        blockTags.includes(child.tagName.toLowerCase())
      );

      if (!blockChildren.length) continue;

      for (const child of blockChildren) {
        paragraph.before(child);
      }

      if (!paragraph.textContent.trim() && paragraph.children.length === 0) {
        paragraph.remove();
      }
    }
  }

  function runEditorCommand(editable, status, command, value) {
    restoreSelection(editable);
    document.execCommand(command, false, value || null);
    cleanupEditableMarkup(editable);
    saveSelection(editable);
    status.textContent = 'Formatting updated';
  }

  function buildFormatControls(editable, status) {
    const controls = createElement('div', 'markdown-editor-format-controls');
    controls.setAttribute('aria-label', 'Formatting controls');

    const formatSelect = createElement('select', 'markdown-editor-format-select');
    formatSelect.setAttribute('aria-label', 'Block style');

    [
      ['p', 'Paragraph'],
      ['h1', 'Heading 1'],
      ['h2', 'Heading 2'],
      ['h3', 'Heading 3']
    ].forEach(([value, label]) => {
      const option = createElement('option', null, label);
      option.value = value;
      formatSelect.append(option);
    });

    const buttons = [
      ['B', 'Bold', 'bold'],
      ['I', 'Italic', 'italic'],
      ['- List', 'Bulleted list', 'insertUnorderedList'],
      ['1. List', 'Numbered list', 'insertOrderedList']
    ].map(([text, label, command]) => {
      const button = createElement('button', 'markdown-editor-format-button', text);
      button.type = 'button';
      button.setAttribute('aria-label', label);
      button.addEventListener('mousedown', (event) => event.preventDefault());
      button.addEventListener('click', () => runEditorCommand(editable, status, command));
      return button;
    });

    const link = createElement('button', 'markdown-editor-format-button', 'Link');
    link.type = 'button';
    link.addEventListener('mousedown', (event) => event.preventDefault());
    link.addEventListener('click', () => {
      restoreSelection(editable);
      const href = window.prompt('Link URL');
      if (!href) return;
      runEditorCommand(editable, status, 'createLink', href);
    });

    formatSelect.addEventListener('mousedown', () => restoreSelection(editable));
    formatSelect.addEventListener('change', () => {
      runEditorCommand(editable, status, 'formatBlock', formatSelect.value);
      formatSelect.value = 'p';
    });

    controls.append(formatSelect, ...buttons, link);
    return controls;
  }

  function closestInsertionTarget(editable) {
    if (selectedImage && editable.contains(selectedImage)) return selectedImage;

    if (savedRange) {
      const container = savedRange.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? savedRange.commonAncestorContainer
        : savedRange.commonAncestorContainer.parentElement;
      const target = container ? container.closest('img, li, p, h1, h2, h3, h4, h5, h6') : null;

      if (target && editable.contains(target) && !target.closest('.page-navigation')) {
        return target;
      }
    }

    return null;
  }

  function insertImage(editable, image) {
    const target = closestInsertionTarget(editable);
    const navigation = editable.querySelector('.page-navigation');

    if (target && target.tagName.toLowerCase() === 'li') {
      target.append(document.createTextNode('\n'));
      target.append(image);
    } else if (target && editable.contains(target)) {
      target.after(image);
    } else if (navigation) {
      navigation.before(image);
    } else {
      editable.append(image);
    }

    lockNonArticleControls(editable);
    setSelectedImage(image);
    image.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function imageFromEvent(event, editable) {
    if (!(event.target instanceof Element)) return null;

    const image = event.target.closest('img');
    if (!image || !editable.contains(image) || image.closest('.page-navigation')) {
      return null;
    }

    return image;
  }

  function field(labelText, input) {
    const wrapper = createElement('label', 'markdown-editor-image-field');
    const label = createElement('span', null, labelText);
    wrapper.append(label, input);
    return wrapper;
  }

  function buildImagePanel(editable, status) {
    const panel = createElement('form', 'markdown-editor-image-panel markdown-editor-ui');
    panel.hidden = true;

    const heading = createElement('p', 'markdown-editor-image-title', 'Image');
    const folderInput = createElement('input');
    const fileInput = createElement('input');
    const altInput = createElement('input');
    const sizeSelect = createElement('select');
    const preview = createElement('p', 'markdown-editor-image-preview');

    folderInput.type = 'text';
    fileInput.type = 'text';
    altInput.type = 'text';
    folderInput.placeholder = 'create-material';
    fileInput.placeholder = 'step-04.png';
    altInput.placeholder = 'Describe the screenshot';

    [
      ['normal', 'Normal'],
      ['small', 'Small'],
      ['phone', 'Phone'],
      ['tiny', 'Tiny'],
      ['small-phone', 'Small phone']
    ].forEach(([value, label]) => {
      const option = createElement('option', null, label);
      option.value = value;
      sizeSelect.append(option);
    });

    const fields = createElement('div', 'markdown-editor-image-fields');
    fields.append(
      field('Folder', folderInput),
      field('File', fileInput),
      field('Alt text', altInput),
      field('Size', sizeSelect)
    );

    const actions = createElement('div', 'markdown-editor-image-actions');
    const apply = createElement('button', 'markdown-editor-primary', 'Apply');
    const insert = createElement('button', 'markdown-editor-primary', 'Insert Image');
    const remove = createElement('button', 'markdown-editor-secondary', 'Remove');
    const close = createElement('button', 'markdown-editor-secondary', 'Close');
    apply.type = 'button';
    insert.type = 'button';
    remove.type = 'button';
    close.type = 'button';
    actions.append(apply, insert, remove, close);
    panel.append(heading, fields, preview, actions);

    function currentSrc() {
      return joinImagePath(folderInput.value, fileInput.value);
    }

    function updatePreview() {
      preview.textContent = currentSrc();
    }

    function fillFromImage(image) {
      const parts = imagePartsFromSrc(image.getAttribute('src'));
      folderInput.value = parts.folder;
      fileInput.value = parts.imageFile;
      altInput.value = image.getAttribute('alt') || '';
      sizeSelect.value = imageSizeFromClassList(image.classList);
      updatePreview();
    }

    function openForImage(image) {
      setSelectedImage(image);
      heading.textContent = 'Edit image';
      fillFromImage(image);
      apply.hidden = false;
      remove.hidden = false;
      insert.hidden = true;
      panel.hidden = false;
      fileInput.focus();
    }

    function openForInsert() {
      setSelectedImage(null);
      heading.textContent = 'Add image';
      folderInput.value = defaultImageFolder(editable);
      fileInput.value = '';
      altInput.value = '';
      sizeSelect.value = 'normal';
      updatePreview();
      apply.hidden = true;
      remove.hidden = true;
      insert.hidden = false;
      panel.hidden = false;
      fileInput.focus();
    }

    function applyToImage(image) {
      if (!image || !fileInput.value.trim()) return;

      image.setAttribute('src', currentSrc());
      image.setAttribute('alt', altInput.value.trim());
      setImageClasses(image, sizeSelect.value);
      lockNonArticleControls(editable);
      status.textContent = 'Image updated';
    }

    folderInput.addEventListener('input', updatePreview);
    fileInput.addEventListener('input', updatePreview);

    apply.addEventListener('click', () => {
      applyToImage(selectedImage);
    });

    insert.addEventListener('click', () => {
      if (!fileInput.value.trim()) return;

      const image = document.createElement('img');
      image.setAttribute('src', currentSrc());
      image.setAttribute('alt', altInput.value.trim());
      setImageClasses(image, sizeSelect.value);
      insertImage(editable, image);
      refreshImageControls(editable, imageApi);
      status.textContent = 'Image inserted';
      openForImage(image);
    });

    remove.addEventListener('click', () => {
      if (!selectedImage) return;

      const imageControl = selectedImage.nextElementSibling;
      if (imageControl && imageControl.classList.contains('markdown-editor-image-chip')) {
        imageControl.remove();
      }
      selectedImage.remove();
      setSelectedImage(null);
      panel.hidden = true;
      status.textContent = 'Image removed';
      editable.focus();
    });

    close.addEventListener('click', () => {
      panel.hidden = true;
      setSelectedImage(null);
      editable.focus();
    });

    panel.addEventListener('submit', (event) => {
      event.preventDefault();
    });

    const imageApi = {
      element: panel,
      openForImage,
      openForInsert
    };

    return imageApi;
  }

  function navigationSections() {
    return Array.from(document.querySelectorAll('.sidebar-nav > ul > li > a .nav-item-title'))
      .map((node) => node.textContent.trim())
      .filter((title) => title && title !== 'Home');
  }

  function newArticleTemplate(title) {
    return `
                    <h1>${title}</h1>
                    <p>Briefly explain what this guide helps the reader do.</p>
                    <h2>Before You Begin</h2>
                    <ul>
                        <li>Add prerequisite access, files, or decisions here.</li>
                    </ul>
                    <h2>Steps</h2>
                    <ol>
                        <li><p>Write the first action the reader should take.</p></li>
                        <li><p>Write the next action.</p></li>
                    </ol>
                    <h2>Notes</h2>
                    <ul>
                        <li>Add support notes, exceptions, or LMS team contact guidance here.</li>
                    </ul>
                `;
  }

  function replaceArticle(editable, html) {
    editable.innerHTML = html;
    originalHtml = html;
    setSelectedImage(null);
    lockNonArticleControls(editable);
  }

  function buildNewArticlePanel(editable, status, download, imagePanel) {
    const panel = createElement('form', 'markdown-editor-new-panel markdown-editor-ui');
    const heading = createElement('p', 'markdown-editor-new-title', 'New article draft');
    const fields = createElement('div', 'markdown-editor-new-fields');

    const titleInput = createElement('input');
    const slugInput = createElement('input');
    const descriptionInput = createElement('input');
    const sectionSelect = createElement('select');

    titleInput.type = 'text';
    slugInput.type = 'text';
    descriptionInput.type = 'text';
    titleInput.placeholder = 'Create a Material';
    slugInput.placeholder = 'content-create-material';
    descriptionInput.placeholder = 'Short search/SEO description.';

    for (const section of navigationSections()) {
      const option = createElement('option', null, section);
      option.value = section;
      sectionSelect.append(option);
    }

    if (!sectionSelect.children.length) {
      const option = createElement('option', null, 'Content Creation');
      option.value = 'Content Creation';
      sectionSelect.append(option);
    }

    fields.append(
      field('Title', titleInput),
      field('Filename slug', slugInput),
      field('Description', descriptionInput),
      field('Sidebar section', sectionSelect)
    );

    const navSnippet = createElement('pre', 'markdown-editor-new-snippet');
    const instructions = createElement('div', 'markdown-editor-new-instructions');
    instructions.innerHTML = [
      '<strong>Publish steps after downloading:</strong>',
      '<ol>',
      '<li>Save the downloaded file into the repo <code>docs/</code> folder.</li>',
      '<li>Add the sidebar line below to <code>docmd.config.js</code> under the selected section.</li>',
      '<li>Commit and push to GitHub. GitHub Actions will rebuild the Pages site.</li>',
      '<li>If the article uses screenshots, upload those files to the matching SharePoint folder first.</li>',
      '</ol>'
    ].join('');

    const close = createElement('button', 'markdown-editor-secondary', 'Close');
    close.type = 'button';

    panel.append(heading, fields, navSnippet, instructions, close);

    function syncDraft() {
      const title = titleInput.value.trim() || 'New Help Article';
      const description = descriptionInput.value.trim() || 'Add a short description for this help article.';
      const slug = slugify(slugInput.value || title) || 'new-help-article';

      outputFileName = `${slug}.md`;
      frontMatter = buildFrontMatter(title, description);

      const h1 = editable.querySelector('h1');
      if (h1) h1.textContent = title;

      navSnippet.textContent = `{ title: '${title.replace(/'/g, "\\'")}', path: '${slug}', icon: 'file-text' },`;
      status.textContent = `Drafting ${outputFileName}`;
      download.disabled = false;
    }

    function startDraft() {
      isNewArticle = true;
      const defaultTitle = 'New Help Article';
      titleInput.value = defaultTitle;
      slugInput.value = slugify(defaultTitle);
      descriptionInput.value = 'Add a short description for this help article.';
      outputFileName = `${slugInput.value}.md`;
      frontMatter = buildFrontMatter(titleInput.value, descriptionInput.value);
      replaceArticle(editable, newArticleTemplate(defaultTitle));
      refreshImageControls(editable, imagePanel);
      syncDraft();
      panel.hidden = false;
      titleInput.focus();
    }

    titleInput.addEventListener('input', () => {
      if (!slugInput.dataset.touched) slugInput.value = slugify(titleInput.value);
      syncDraft();
    });
    slugInput.addEventListener('input', () => {
      slugInput.dataset.touched = 'true';
      syncDraft();
    });
    descriptionInput.addEventListener('input', syncDraft);
    sectionSelect.addEventListener('change', syncDraft);
    close.addEventListener('click', () => {
      panel.hidden = true;
      editable.focus();
    });
    panel.addEventListener('submit', (event) => event.preventDefault());

    panel.hidden = true;

    return {
      element: panel,
      startDraft
    };
  }

  function buildEditor() {
    const editable = document.querySelector(editableSelector);
    if (!editable) return;

    originalHtml = editable.innerHTML;
    document.body.classList.add('markdown-editor-enabled', 'markdown-editor-inline');
    editable.classList.add('markdown-editor-target');
    editable.setAttribute('contenteditable', 'true');
    editable.setAttribute('spellcheck', 'true');
    editable.setAttribute('aria-label', `Editable article content for ${outputFileName}`);
    lockNonArticleControls(editable);

    const toolbar = createElement('div', 'markdown-editor-toolbar markdown-editor-ui');
    toolbar.setAttribute('role', 'region');
    toolbar.setAttribute('aria-label', 'Markdown editing controls');

    const status = createElement('p', 'markdown-editor-inline-status', `Editing ${outputFileName}`);
    const formatControls = buildFormatControls(editable, status);
    const actions = createElement('div', 'markdown-editor-inline-actions');
    const newArticle = createElement('button', 'markdown-editor-secondary', 'New Article');
    const addImage = createElement('button', 'markdown-editor-secondary', 'Add Image');
    const reset = createElement('button', 'markdown-editor-secondary', 'Reset');
    const download = createElement('button', 'markdown-editor-primary', 'Download .md');
    const exit = createElement('button', 'markdown-editor-secondary', 'Exit');
    newArticle.type = 'button';
    addImage.type = 'button';
    reset.type = 'button';
    download.type = 'button';
    exit.type = 'button';
    actions.append(newArticle, addImage, reset, download, exit);
    toolbar.append(status, formatControls, actions);

    const imagePanel = buildImagePanel(editable, status);
    const newArticlePanel = buildNewArticlePanel(editable, status, download, imagePanel);
    document.body.append(toolbar, imagePanel.element, newArticlePanel.element);
    refreshImageControls(editable, imagePanel);

    if (isNewArticle) {
      newArticlePanel.startDraft();
    } else {
      loadSource(status, download);
    }

    document.addEventListener('selectionchange', () => saveSelection(editable));
    editable.addEventListener('keyup', () => saveSelection(editable));
    editable.addEventListener('mouseup', () => saveSelection(editable));

    const openImageFromEvent = (event) => {
      const image = imageFromEvent(event, editable);
      if (image) {
        event.preventDefault();
        event.stopPropagation();
        imagePanel.openForImage(image);
      }
    };

    editable.addEventListener('pointerdown', openImageFromEvent, true);
    editable.addEventListener('mousedown', openImageFromEvent, true);
    editable.addEventListener('click', openImageFromEvent, true);

    editable.addEventListener('keydown', (event) => {
      const image = imageFromEvent(event, editable);
      if (image && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        imagePanel.openForImage(image);
      }
    });

    addImage.addEventListener('click', () => {
      saveSelection(editable);
      imagePanel.openForInsert();
    });

    newArticle.addEventListener('click', () => {
      imagePanel.element.hidden = true;
      newArticlePanel.startDraft();
    });

    reset.addEventListener('click', () => {
      editable.innerHTML = originalHtml;
      setSelectedImage(null);
      imagePanel.element.hidden = true;
      newArticlePanel.element.hidden = true;
      lockNonArticleControls(editable);
      refreshImageControls(editable, imagePanel);
      status.textContent = `${outputFileName} reset`;
      editable.focus();
    });

    download.addEventListener('click', () => {
      downloadMarkdown(buildMarkdown(editable));
      status.textContent = `${outputFileName} downloaded`;
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
