(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  ready(function () {
    var root = document.querySelector('[data-support-updates]');
    if (!root) return;

    var search = root.querySelector('[data-support-search]');
    var clear = root.querySelector('[data-support-clear]');
    var summary = root.querySelector('[data-support-summary]');
    var empty = root.querySelector('[data-support-empty]');
    var filters = Array.prototype.slice.call(root.querySelectorAll('[data-support-filter]'));
    var entries = Array.prototype.slice.call(root.querySelectorAll('[data-support-entry]'));
    var groups = Array.prototype.slice.call(root.querySelectorAll('[data-support-group]'));
    var activeFilter = 'all';

    entries.forEach(function (entry) {
      entry.dataset.searchText = [
        entry.textContent,
        entry.getAttribute('data-category') || '',
        entry.getAttribute('data-date') || '',
        entry.getAttribute('data-keywords') || ''
      ].join(' ').replace(/\s+/g, ' ').toLowerCase();
    });

    function setActiveFilter(nextFilter) {
      activeFilter = nextFilter;
      filters.forEach(function (button) {
        var isActive = button.getAttribute('data-support-filter') === activeFilter;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });
    }

    function matchesSearch(entry, terms) {
      if (!terms.length) return true;
      return terms.every(function (term) {
        return entry.dataset.searchText.indexOf(term) !== -1;
      });
    }

    function refresh() {
      var query = search.value.trim().toLowerCase();
      var terms = query.split(/\s+/).filter(Boolean);
      var visibleCount = 0;

      entries.forEach(function (entry) {
        var category = entry.getAttribute('data-category');
        var categoryMatch = activeFilter === 'all' || category === activeFilter;
        var isVisible = categoryMatch && matchesSearch(entry, terms);
        entry.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
      });

      groups.forEach(function (group) {
        group.hidden = !group.querySelector('[data-support-entry]:not([hidden])');
      });

      empty.hidden = visibleCount !== 0;
      summary.textContent = query || activeFilter !== 'all'
        ? 'Showing ' + visibleCount + ' of ' + entries.length + ' updates.'
        : 'Showing all ' + entries.length + ' updates.';
    }

    filters.forEach(function (button) {
      button.addEventListener('click', function () {
        setActiveFilter(button.getAttribute('data-support-filter') || 'all');
        refresh();
      });
    });

    search.addEventListener('input', refresh);
    clear.addEventListener('click', function () {
      search.value = '';
      setActiveFilter('all');
      refresh();
      search.focus();
    });

    refresh();
  });
})();
