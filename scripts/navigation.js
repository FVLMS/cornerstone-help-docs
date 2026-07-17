const fs = require('fs');
const path = require('path');

const sections = [
  { title: 'Learner Guides', icon: 'user' },
  { title: 'Manager Guides', icon: 'users' },
  {
    title: 'Admin Guides',
    icon: 'settings',
    groups: [
      { title: 'Administrative Guides', icon: 'settings' }
    ]
  },
  { title: 'Content Creation Guides', icon: 'file-plus' },
  { title: 'Ongoing Competency 2026', icon: 'layers' }
];

function parseScalar(value) {
  const trimmed = value.trim();

  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }

  return trimmed;
}

function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return {};

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) continue;
    data[field[1]] = parseScalar(field[2]);
  }

  return data;
}

function titleFromFileName(fileName) {
  return path
    .basename(fileName, '.md')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function itemFromPage(file, data, overrides = {}) {
  return {
    title: overrides.title || data.navTitle || data.title || titleFromFileName(file),
    path: overrides.path || path.basename(file, '.md'),
    icon: overrides.icon || data.navIcon || 'file-text',
    order: Number.isFinite(overrides.order)
      ? overrides.order
      : Number.isFinite(data.navOrder)
        ? data.navOrder
        : 999,
    section: overrides.section || data.navSection,
    group: overrides.group || data.navGroup
  };
}

function stripSortFields({ order, section, group, ...item }) {
  return item;
}

function sortItems(items) {
  return items
    .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title))
    .map(stripSortFields);
}

function buildNavigation(docsDir = path.join(process.cwd(), 'docs')) {
  const items = [];

  for (const file of fs.readdirSync(docsDir).filter((entry) => entry.endsWith('.md'))) {
    if (file === 'index.md') continue;

    const filePath = path.join(docsDir, file);
    const data = parseFrontMatter(fs.readFileSync(filePath, 'utf8'));
    if (data.navExclude === true) continue;

    if (data.navSection) items.push(itemFromPage(file, data));

    if (data.navAlsoSection) {
      items.push(
        itemFromPage(file, data, {
          title: data.navAlsoTitle,
          icon: data.navAlsoIcon,
          order: data.navAlsoOrder,
          section: data.navAlsoSection,
          group: data.navAlsoGroup
        })
      );
    }
  }

  return [
    { title: 'Home', path: '/', icon: 'home' },
    ...sections
      .map((section) => ({
        ...section,
        children: buildSectionChildren(section, items)
      }))
      .filter((section) => section.children.length)
      .map((section) => ({
        title: section.title,
        path: '#',
        icon: section.icon,
        collapsible: true,
        children: section.children
      }))
  ];
}

function buildSectionChildren(section, items) {
  const sectionItems = items.filter((item) => item.section === section.title);
  const groups = section.groups || [];
  const groupTitles = new Set(groups.map((group) => group.title));
  const children = [];

  for (const group of groups) {
    const groupItems = sectionItems.filter((item) => item.group === group.title);
    if (!groupItems.length) continue;

    children.push({
      title: group.title,
      path: '#',
      icon: group.icon || 'folder',
      collapsible: true,
      children: sortItems(groupItems)
    });
  }

  const remainingItems = sectionItems.filter((item) => !item.group || !groupTitles.has(item.group));
  children.push(...sortItems(remainingItems));

  return children;
}

module.exports = {
  buildNavigation,
  sections
};
