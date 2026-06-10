const fs = require('fs');
const path = require('path');

const sections = [
  { title: 'Learner Guides', icon: 'user' },
  { title: 'Manager Guides', icon: 'users' },
  { title: 'Admin Guides', icon: 'settings' },
  { title: 'Content Creation', icon: 'file-plus' },
  { title: 'Events and Sessions', icon: 'calendar' },
  { title: 'Reports and Transcripts', icon: 'bar-chart' },
  { title: 'Tests and Checklists', icon: 'check-square' },
  { title: 'Ongoing Competency 2025', icon: 'layers' },
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

function buildNavigation(docsDir = path.join(process.cwd(), 'docs')) {
  const bySection = new Map(sections.map((section) => [section.title, []]));

  for (const file of fs.readdirSync(docsDir).filter((entry) => entry.endsWith('.md'))) {
    if (file === 'index.md') continue;

    const filePath = path.join(docsDir, file);
    const data = parseFrontMatter(fs.readFileSync(filePath, 'utf8'));
    if (data.navExclude === true) continue;

    const section = data.navSection;
    if (!section) continue;

    if (!bySection.has(section)) bySection.set(section, []);

    bySection.get(section).push({
      title: data.navTitle || data.title || titleFromFileName(file),
      path: path.basename(file, '.md'),
      icon: data.navIcon || 'file-text',
      order: Number.isFinite(data.navOrder) ? data.navOrder : 999
    });
  }

  return [
    { title: 'Home', path: '/', icon: 'home' },
    ...sections
      .filter((section) => bySection.get(section.title)?.length)
      .map((section) => ({
        title: section.title,
        path: '#',
        icon: section.icon,
        collapsible: true,
        children: bySection
          .get(section.title)
          .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title))
          .map(({ order, ...item }) => item)
      }))
  ];
}

module.exports = {
  buildNavigation,
  sections
};
