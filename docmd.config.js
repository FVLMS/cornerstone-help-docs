// docmd.config.js
module.exports = {
  // --- Core Metadata ---
  siteTitle: 'Cornerstone Help Docs',
  siteUrl: process.env.SITE_URL || '', // e.g. https://mysite.com (Critical for SEO/Sitemap)

  // --- Branding ---
  logo: null,
  favicon: 'assets/favicon.svg',

  // --- Source & Output ---
  srcDir: 'docs',
  outputDir: 'site',

  // --- Theme & Layout ---
  theme: {
    name: 'sky',            // Options: 'default', 'sky', 'ruby', 'retro'
    defaultMode: 'system',  // 'light', 'dark', or 'system'
    enableModeToggle: true, // Show mode toggle button
    positionMode: 'top',    // 'top' or 'bottom'
    codeHighlight: true,    // Enable Highlight.js
    customCss: ['assets/css/custom.css'],          // e.g. ['assets/css/custom.css']
  },

  // --- Features ---
  search: true,           // Built-in offline search
  minify: true,           // Minify HTML/CSS/JS in build
  autoTitleFromH1: true,  // Auto-generate page title from first H1
  copyCode: true,         // Show "copy" button on code blocks
  pageNavigation: true,   // Prev/Next buttons at bottom

  // --- Navigation (Sidebar) ---
  navigation: [
    { title: 'Home', path: '/', icon: 'home' },
    {
      title: 'Learner Guides',
      path: '#',
      icon: 'user',
      collapsible: true,
      children: [
        { title: 'Access Completed Training', path: 'learner-access-completed-training', icon: 'check-circle' },
        { title: 'Enroll in Basic Life Support', path: 'learner-enroll-basic-life-support', icon: 'heart-pulse' },
        { title: 'Enroll in Safety Always', path: 'learner-enroll-safety-always', icon: 'shield-check' },
        { title: 'Lippincott CE Certificate', path: 'learner-lippincott-ce-certificate', icon: 'award' },
        { title: 'Cornerstone Mobile App', path: 'learner-mobile-app', icon: 'smartphone' },
        { title: 'Pharmacy Certification Upload', path: 'learner-pharmacy-certification-upload', icon: 'upload' },
        { title: 'Print Certificate', path: 'learner-print-certificate', icon: 'award' },
        { title: 'Print Curriculum Certificate', path: 'learner-print-certificate-from-curriculum', icon: 'printer' },
        { title: 'Print Transcript Report', path: 'learner-print-transcript-report', icon: 'printer' },
        { title: 'Remove Self-Requested Training', path: 'learner-remove-self-requested-training', icon: 'x-circle' },
        { title: 'Request Training or Self-Enroll', path: 'learner-request-training-self-enroll', icon: 'search' },
        { title: 'View Training Details', path: 'learner-view-training-details', icon: 'info' },
      ],
    },
    {
      title: 'Manager Guides',
      path: '#',
      icon: 'users',
      collapsible: true,
      children: [
        { title: 'Manager Dashboard', path: 'manager-dashboard', icon: 'layout-dashboard' },
      ],
    },
    {
      title: 'Admin Guides',
      path: '#',
      icon: 'settings',
      collapsible: true,
      children: [
        { title: 'Add an External User', path: 'admin-add-external-user', icon: 'user-plus' },
        { title: 'Auto Assign Dashboard', path: 'admin-auto-assign-dashboard', icon: 'layout-dashboard' },
        { title: 'Edit Due Dates', path: 'admin-edit-due-dates', icon: 'calendar-clock' },
        { title: 'Learning Assignment Tool', path: 'admin-learning-assignment-tool', icon: 'user-plus' },
        { title: 'Remove Training', path: 'admin-remove-training', icon: 'trash-2' },
      ],
    },
    {
      title: 'Content Creation',
      path: '#',
      icon: 'file-plus',
      collapsible: true,
      children: [
        { title: 'Add a Curriculum Note', path: 'content-add-curriculum-note', icon: 'sticky-note' },
        { title: 'Content Development Guidelines', path: 'content-development-guidelines', icon: 'book-open' },
        { title: 'Create Material', path: 'content-create-material', icon: 'file-plus' },
        { title: 'Create Video Lesson', path: 'content-create-video-lesson', icon: 'video' },
        { title: 'Materials With No Signature', path: 'content-materials-no-signature-required', icon: 'file-check' },
        { title: 'Create Test', path: 'content-create-test', icon: 'clipboard-list' },
      ],
    },
    {
      title: 'Events and Sessions',
      path: '#',
      icon: 'calendar',
      collapsible: true,
      children: [
        { title: 'Add a Learner to Roster', path: 'sessions-add-learner-to-roster', icon: 'user-plus' },
        { title: 'Add Learners to Roster', path: 'sessions-add-learners-to-roster', icon: 'users' },
        { title: 'Edit Date, Time, or Location', path: 'sessions-edit-date-time-location', icon: 'calendar-clock' },
        { title: 'Track Interest as ILT Admin', path: 'sessions-interest-tracking-ilt-admins', icon: 'list-checks' },
        { title: 'Track Interest for Sessions', path: 'sessions-interest-tracking', icon: 'list-checks' },
        { title: 'Mark Attendance', path: 'sessions-mark-attendance', icon: 'check-square' },
        { title: 'Withdraw from Session', path: 'sessions-withdraw-from-session', icon: 'log-out' },
      ],
    },
    {
      title: 'Reports and Transcripts',
      path: '#',
      icon: 'bar-chart',
      collapsible: true,
      children: [
        { title: 'Common Reports', path: 'reports-common-reports', icon: 'file-text' },
        { title: 'Print Certificate as Admin', path: 'reports-print-certificate-admin', icon: 'printer' },
        { title: 'Print POCT Transcript Report', path: 'reports-print-poct-transcript', icon: 'printer' },
        { title: 'Run Standard Reports', path: 'reports-run-standard-reports', icon: 'bar-chart-3' },
        { title: 'Run the Time Spent Report', path: 'reports-time-spent', icon: 'clock' },
      ],
    },
    {
      title: 'Tests and Checklists',
      path: '#',
      icon: 'check-square',
      collapsible: true,
      children: [
        { title: 'Edit Validation Details', path: 'checklists-edit-validation-details', icon: 'settings' },
        { title: 'Grade Checklists', path: 'checklists-grade-checklists', icon: 'check-circle' },
        { title: 'Grade Free Form Essay', path: 'tests-grade-free-form-essay', icon: 'edit-3' },
        { title: 'Review Test Results', path: 'tests-review-test-results', icon: 'clipboard-check' },
        { title: 'Test AutoPass Option', path: 'tests-autopass-option', icon: 'check-check' },
      ],
    },
    {
      title: 'Ongoing Competency 2025',
      path: '#',
      icon: 'layers',
      collapsible: true,
      children: [
        { title: 'Learning Assignment Tool', path: 'ongoing-competency-2025-learning-assignment-tool', icon: 'user-plus' },
        { title: 'Review', path: 'ongoing-competency-2025-review', icon: 'clipboard-check' },
      ],
    },
    {
      title: 'Ongoing Competency 2026',
      path: '#',
      icon: 'layers',
      collapsible: true,
      children: [
        { title: 'Introduction', path: 'ongoing-competency', icon: 'book-open' },
        { title: 'Templates', path: 'templates', icon: 'layout' },
        { title: 'Validation Options', path: 'validation-options', icon: 'check-circle' },
        { title: 'Create Material', path: 'how-to-create-material', icon: 'file-plus' },
        { title: 'Create Test', path: 'how-to-create-test', icon: 'clipboard-list' },
        { title: 'Create Curriculum', path: 'how-to-create-curriculum', icon: 'layers' },
        { title: 'Create ILT Events', path: 'how-to-create-event', icon: 'calendar' },
        { title: 'Create Evaluation', path: 'how-to-create-evaluation', icon: 'message-square' },
        { title: 'Reversion Material', path: 'how-to-reversion-material', icon: 'rotate-ccw' },
        { title: 'Reversion Test', path: 'how-to-reversion-test', icon: 'rotate-ccw' },
        { title: 'Reversion Curriculum', path: 'how-to-reversion-curriculum', icon: 'rotate-ccw' },
        { title: 'Assign', path: 'how-to-assign', icon: 'user-plus' },
      ],
    },
  ],

  // --- Plugins ---
  plugins: {
    seo: {
      defaultDescription: 'Cornerstone LMS help documentation for Fairview educators, managers, learners, and administrators.',
      openGraph: {
        defaultImage: '',   // e.g. 'assets/images/og-image.png'
      },
      twitter: {
        cardType: 'summary_large_image',
      }
    },
    sitemap: {
      defaultChangefreq: 'weekly',  // e.g. 'daily', 'weekly', 'monthly'
      defaultPriority: 0.8          // Priority between 0.0 and 1.0
    }
  },

  // --- Footer ---
  footer: null,
  
  // --- Edit Link ---
  editLink: {
    enabled: false,
    baseUrl: 'https://github.com/USERNAME/REPO/edit/main/docs',
    text: 'Edit this page'
  }
};
