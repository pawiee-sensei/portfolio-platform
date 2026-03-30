window.loadPortfolioPage = async function loadPortfolioPage(content, token) {
  const state = {
    projects: [],
    selectedProject: null,
    activeMenuId: null
  };

  document.addEventListener('click', handleOutsideClick);

  content.innerHTML = `
    <div class="portfolio-shell is-loading">
      <div class="panel-head">
        <h2>Portfolio Gallery</h2>
      </div>
      <p class="panel-copy">Loading your portfolio collection...</p>
    </div>
  `;

  try {
    const data = await fetchJson('/api/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });

    state.projects = data.data || [];
    state.selectedProject = null;
    state.activeMenuId = null;
    renderPortfolioPage();
  } catch (error) {
    content.innerHTML = `
      <div class="panel-head">
        <h2>Portfolio Gallery</h2>
      </div>
      <p class="panel-copy">Something went wrong while loading your portfolio.</p>
      <pre class="output-card">${escapeHtml(error.message || 'Failed to fetch portfolio.')}</pre>
    `;
  }

  function handleOutsideClick(event) {
    if (!event.target.closest('[data-menu-wrap]')) {
      state.activeMenuId = null;
      syncMenuState();
    }
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatLabel(value) {
    if (!value) {
      return 'Uncategorized';
    }

    return String(value)
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  function formatDescription(value, fallback) {
    if (!value) {
      return `<p class="portfolio-empty-copy">${escapeHtml(fallback)}</p>`;
    }

    return `<p>${escapeHtml(value).replace(/\n/g, '<br />')}</p>`;
  }

  function getPrimaryImage(project) {
    if (project.thumbnail_url) {
      return project.thumbnail_url;
    }

    if (project.images?.length) {
      return project.images[0].image_url;
    }

    return '';
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  function renderPortfolioPage() {
    const featuredCount = state.projects.filter((project) => Number(project.is_featured) === 1).length;

    content.innerHTML = `
      <section class="portfolio-shell">
        <div class="portfolio-hero">
          <div>
            <span class="portfolio-kicker">Curated archive</span>
            <h2>Portfolio Gallery</h2>
            <p class="panel-copy">A visual control room for every portfolio piece, with quick access to details, media, and edits.</p>
          </div>
          <div class="portfolio-summary">
            <div class="portfolio-stat">
              <strong>${state.projects.length}</strong>
              <span>Total entries</span>
            </div>
            <div class="portfolio-stat">
              <strong>${featuredCount}</strong>
              <span>Featured</span>
            </div>
          </div>
        </div>

        ${renderPortfolioGrid()}
        <section id="portfolioDetailRegion"></section>
      </section>
    `;

    bindPortfolioEvents();
  }

  function renderPortfolioGrid() {
    if (!state.projects.length) {
      return `
        <div class="portfolio-empty-state">
          <span class="portfolio-kicker">Nothing here yet</span>
          <h3>Your portfolio gallery is ready for its first entry.</h3>
          <p>Once you add work, this page will turn it into a visual gallery with thumbnails, descriptions, and edit actions.</p>
        </div>
      `;
    }

    return `
      <div class="portfolio-grid">
        ${state.projects.map((project) => {
          const imageUrl = getPrimaryImage(project);
          const summary = project.short_description || project.description || 'Add a short description to make this card more scannable.';

          return `
            <article class="portfolio-card">
              <div class="portfolio-card-media ${imageUrl ? '' : 'is-empty'}">
                ${imageUrl
                  ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(project.title)} thumbnail" class="portfolio-card-image" />`
                  : `<div class="portfolio-card-placeholder"><span>${escapeHtml(formatLabel(project.category).slice(0, 2))}</span></div>`}
                <div class="portfolio-card-overlay">
                  <span class="portfolio-chip">${escapeHtml(formatLabel(project.category))}</span>
                  ${Number(project.is_featured) === 1 ? '<span class="portfolio-chip is-accent">Featured</span>' : ''}
                </div>
              </div>

              <div class="portfolio-card-body">
                <div class="portfolio-card-topline">
                  <div>
                    <h3>${escapeHtml(project.title)}</h3>
                    <p class="portfolio-card-year">${escapeHtml(project.project_year || 'No year yet')}</p>
                  </div>
                  <div class="portfolio-menu-wrap" data-menu-wrap>
                    <button
                      type="button"
                      class="portfolio-menu-btn"
                      data-menu-button="${project.id}"
                      aria-label="Open portfolio actions for ${escapeHtml(project.title)}"
                      aria-expanded="false"
                    >...</button>
                    <div class="portfolio-menu" data-menu="${project.id}" hidden>
                      <button type="button" data-open-project="${project.id}">Open portfolio</button>
                    </div>
                  </div>
                </div>

                <p class="portfolio-card-copy">${escapeHtml(summary)}</p>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  function bindPortfolioEvents() {
    content.querySelectorAll('[data-menu-button]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const projectId = Number(button.dataset.menuButton);
        state.activeMenuId = state.activeMenuId === projectId ? null : projectId;
        syncMenuState();
      });
    });

    content.querySelectorAll('[data-open-project]').forEach((button) => {
      button.addEventListener('click', () => {
        openProject(Number(button.dataset.openProject));
      });
    });
  }

  function syncMenuState() {
    content.querySelectorAll('[data-menu]').forEach((menu) => {
      const projectId = Number(menu.dataset.menu);
      menu.hidden = state.activeMenuId !== projectId;
    });

    content.querySelectorAll('[data-menu-button]').forEach((button) => {
      const projectId = Number(button.dataset.menuButton);
      button.setAttribute('aria-expanded', String(state.activeMenuId === projectId));
    });
  }

  async function openProject(id) {
    const detailRegion = document.getElementById('portfolioDetailRegion');

    state.activeMenuId = null;
    syncMenuState();

    if (!detailRegion) {
      return;
    }

    detailRegion.innerHTML = `
      <section class="portfolio-detail-card">
        <div class="panel-head">
          <h2>Loading Portfolio</h2>
        </div>
        <p class="panel-copy">Pulling in thumbnails, descriptions, and editable assets.</p>
      </section>
    `;

    try {
      const response = await fetchJson(`/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      state.selectedProject = response.data;
      renderProjectDetail();
      detailRegion.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      detailRegion.innerHTML = `
        <section class="portfolio-detail-card">
          <div class="panel-head">
            <h2>Portfolio Detail</h2>
          </div>
          <p class="panel-copy">We could not load this portfolio entry.</p>
          <pre class="output-card">${escapeHtml(error.message || 'Failed to load portfolio.')}</pre>
        </section>
      `;
    }
  }

  function renderProjectDetail() {
    const detailRegion = document.getElementById('portfolioDetailRegion');
    const project = state.selectedProject;

    if (!detailRegion || !project) {
      return;
    }

    const galleryImages = [project.thumbnail_url, ...(project.images || []).map((image) => image.image_url)]
      .filter(Boolean)
      .filter((url, index, array) => array.indexOf(url) === index);

    detailRegion.innerHTML = `
      <section class="portfolio-detail-card">
        <div class="portfolio-detail-head">
          <div>
            <span class="portfolio-kicker">Portfolio detail</span>
            <h2>${escapeHtml(project.title)}</h2>
            <p class="panel-copy">Review media, short and long descriptions, then keep editing from one place.</p>
          </div>
          <button type="button" class="ghost-btn" id="closePortfolioDetail">Close</button>
        </div>

        <div class="portfolio-detail-layout">
          <div class="portfolio-gallery-panel">
            <div class="portfolio-gallery-main ${galleryImages.length ? '' : 'is-empty'}">
              ${galleryImages.length
                ? `<img src="${escapeHtml(galleryImages[0])}" alt="${escapeHtml(project.title)} preview" class="portfolio-gallery-hero" />`
                : '<div class="portfolio-gallery-empty">No images uploaded yet</div>'}
            </div>
            <div class="portfolio-gallery-strip">
              ${galleryImages.length
                ? galleryImages.map((imageUrl, index) => `
                  <button type="button" class="portfolio-thumb" data-gallery-image="${escapeHtml(imageUrl)}" aria-label="Preview image ${index + 1}">
                    <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(project.title)} image ${index + 1}" />
                  </button>
                `).join('')
                : '<p class="portfolio-empty-copy">Upload a thumbnail or gallery images to make this section visual.</p>'}
            </div>
          </div>

          <div class="portfolio-detail-copy">
            <div class="portfolio-meta-grid">
              <div class="portfolio-meta-card">
                <span>Category</span>
                <strong>${escapeHtml(formatLabel(project.category))}</strong>
              </div>
              <div class="portfolio-meta-card">
                <span>Status</span>
                <strong>${escapeHtml(formatLabel(project.status || 'published'))}</strong>
              </div>
              <div class="portfolio-meta-card">
                <span>Year</span>
                <strong>${escapeHtml(project.project_year || 'Not set')}</strong>
              </div>
              <div class="portfolio-meta-card">
                <span>Client / Medium</span>
                <strong>${escapeHtml(project.client_name || project.medium || 'Not set')}</strong>
              </div>
            </div>

            <div class="portfolio-description-block">
              <h3>Short Description</h3>
              ${formatDescription(project.short_description, 'No short description yet.')}
            </div>

            <div class="portfolio-description-block">
              <h3>Full Description</h3>
              ${formatDescription(project.description, 'No full description yet.')}
            </div>

            <div class="portfolio-description-block">
              <h3>Links</h3>
              ${(project.links || []).length
                ? `<div class="portfolio-link-list">
                    ${project.links.map((link) => `
                      <a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>
                    `).join('')}
                  </div>`
                : '<p class="portfolio-empty-copy">No extra links added yet.</p>'}
            </div>

            <div class="portfolio-description-block">
              <h3>Technologies</h3>
              ${(project.technologies || []).length
                ? `<div class="portfolio-tag-list">
                    ${project.technologies.map((technology) => `<span>${escapeHtml(technology.name)}</span>`).join('')}
                  </div>`
                : '<p class="portfolio-empty-copy">No technologies assigned.</p>'}
            </div>

            <div class="portfolio-description-block">
              <h3>Files</h3>
              ${(project.files || []).length
                ? `<div class="portfolio-file-list">
                    ${project.files.map((file) => `
                      <a href="${escapeHtml(file.file_url)}" target="_blank" rel="noreferrer">${escapeHtml(file.file_name)}</a>
                    `).join('')}
                  </div>`
                : '<p class="portfolio-empty-copy">No supporting files uploaded yet.</p>'}
            </div>
          </div>
        </div>

        <div class="portfolio-edit-zone">
          <div class="portfolio-inline-card">
            <h3>Add Link</h3>
            <div class="portfolio-inline-form">
              <input id="linkLabel" placeholder="Label (Behance, GitHub, Case Study)" />
              <input id="linkUrl" placeholder="https://example.com" />
              <button class="primary-btn" id="addLinkButton">Add Link</button>
            </div>
          </div>

          <div class="portfolio-inline-card">
            <h3>Upload File</h3>
            <div class="portfolio-inline-form">
              <input type="file" id="fileInput" />
              <button class="primary-btn" id="uploadFileButton">Upload File</button>
            </div>
            <p class="portfolio-empty-copy">Accepted: PNG, JPG, WEBP, or PDF up to 2MB.</p>
          </div>
        </div>
      </section>
    `;

    bindProjectDetailEvents(project.id);
  }

  function bindProjectDetailEvents(projectId) {
    const closeButton = document.getElementById('closePortfolioDetail');
    const addLinkButton = document.getElementById('addLinkButton');
    const uploadFileButton = document.getElementById('uploadFileButton');
    const galleryMain = document.querySelector('.portfolio-gallery-main');

    closeButton?.addEventListener('click', () => {
      state.selectedProject = null;
      document.getElementById('portfolioDetailRegion').innerHTML = '';
    });

    document.querySelectorAll('[data-gallery-image]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!galleryMain) {
          return;
        }

        galleryMain.classList.remove('is-empty');
        galleryMain.innerHTML = `
          <img src="${escapeHtml(button.dataset.galleryImage)}" alt="Selected gallery preview" class="portfolio-gallery-hero" />
        `;
      });
    });

    addLinkButton?.addEventListener('click', async () => {
      await addLink(projectId);
    });

    uploadFileButton?.addEventListener('click', async () => {
      await uploadFile(projectId);
    });
  }

  async function addLink(id) {
    const label = document.getElementById('linkLabel').value.trim();
    const url = document.getElementById('linkUrl').value.trim();

    if (!label || !url) {
      alert('Please enter both a label and a URL.');
      return;
    }

    try {
      await fetchJson(`/api/projects/${id}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ label, url })
      });

      await openProject(id);
    } catch (error) {
      alert(error.message || 'Failed to add link.');
    }
  }

  async function uploadFile(id) {
    const input = document.getElementById('fileInput');
    const file = input.files[0];

    if (!file) {
      alert('Please select a file first.');
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    const maxSize = 2 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type.');
      return;
    }

    if (file.size > maxSize) {
      alert('File too large. Max size is 2MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetchJson(`/api/projects/${id}/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      await openProject(id);
    } catch (error) {
      alert(error.message || 'Upload failed.');
    }
  }
};
