window.loadPortfolioPage = async function loadPortfolioPage(content, token) {
  const state = {
    projects: [],
    selectedProject: null,
    activeMenuId: null
  };

  const categories = [
    'web',
    'app',
    'graphic-design',
    'poster',
    'pubmat',
    'art',
    'poetry',
    'photography',
    'branding',
    'other'
  ];
  const statuses = ['draft', 'published', 'archived'];

  if (window.__portfolioOutsideClickHandler) {
    document.removeEventListener('click', window.__portfolioOutsideClickHandler);
  }

  window.__portfolioOutsideClickHandler = handleOutsideClick;
  document.addEventListener('click', window.__portfolioOutsideClickHandler);

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

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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

  function getAuthHeaders(extraHeaders = {}) {
    return {
      ...extraHeaders,
      Authorization: `Bearer ${token}`
    };
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : { message: await response.text() };

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

  function buildLinksEditor(links) {
    const rows = (links || []).length
      ? links
      : [{ label: '', url: '' }];

    return rows.map((link, index) => `
      <div class="portfolio-link-editor-row" data-link-row="${index}">
        <input type="text" value="${escapeHtml(link.label || '')}" placeholder="Link label" data-link-label="${index}" />
        <input type="url" value="${escapeHtml(link.url || '')}" placeholder="https://example.com" data-link-url="${index}" />
        <button type="button" class="ghost-btn portfolio-remove-inline-btn" data-remove-link-row="${index}">Remove</button>
      </div>
    `).join('');
  }

  function renderProjectDetail() {
    const detailRegion = document.getElementById('portfolioDetailRegion');
    const project = state.selectedProject;

    if (!detailRegion || !project) {
      return;
    }

    const galleryImages = [project.thumbnail_url ? { id: 'thumbnail', image_url: project.thumbnail_url, isThumbnail: true } : null]
      .concat((project.images || []).map((image) => ({ ...image, isThumbnail: false })))
      .filter(Boolean);

    detailRegion.innerHTML = `
      <section class="portfolio-detail-card">
        <div class="portfolio-detail-head">
          <div>
            <span class="portfolio-kicker">Portfolio detail</span>
            <h2>${escapeHtml(project.title)}</h2>
            <p class="panel-copy">Edit your portfolio details, manage links, and keep media tidy from this one panel.</p>
          </div>
          <button type="button" class="ghost-btn" id="closePortfolioDetail">Close</button>
        </div>

        <div class="portfolio-detail-layout">
          <div class="portfolio-gallery-panel">
            <div class="portfolio-gallery-main ${galleryImages.length ? '' : 'is-empty'}" id="portfolioGalleryMain">
              ${galleryImages.length
                ? `<img src="${escapeHtml(galleryImages[0].image_url)}" alt="${escapeHtml(project.title)} preview" class="portfolio-gallery-hero" />`
                : '<div class="portfolio-gallery-empty">No images uploaded yet</div>'}
            </div>
            <div class="portfolio-gallery-strip">
              ${galleryImages.length
                ? `
                  <button type="button" class="portfolio-gallery-scroll-btn portfolio-gallery-scroll-btn-prev" data-gallery-scroll="-1" aria-label="Scroll gallery left"><</button>
                  <div class="portfolio-gallery-track" id="portfolioGalleryTrack">
                    ${galleryImages.map((image, index) => `
                      <div class="portfolio-thumb-wrap">
                        <button type="button" class="portfolio-thumb" data-gallery-image="${escapeHtml(image.image_url)}" aria-label="Preview image ${index + 1}">
                          <img src="${escapeHtml(image.image_url)}" alt="${escapeHtml(project.title)} image ${index + 1}" />
                        </button>
                        <button
                          type="button"
                          class="portfolio-thumb-remove"
                          aria-label="Remove image"
                          data-remove-image="${image.isThumbnail ? 'thumbnail' : image.id}"
                        >x</button>
                      </div>
                    `).join('')}
                  </div>
                  <button type="button" class="portfolio-gallery-scroll-btn portfolio-gallery-scroll-btn-next" data-gallery-scroll="1" aria-label="Scroll gallery right">></button>
                `
                : '<p class="portfolio-empty-copy">Upload a thumbnail or gallery images to make this section visual.</p>'}
            </div>

            <div class="portfolio-inline-card">
              <h3>Media Updates</h3>
              <div class="portfolio-inline-form">
                <label class="portfolio-field-label" for="thumbnailUpload">Replace Thumbnail</label>
                <input type="file" id="thumbnailUpload" accept="image/*" />
                <button type="button" class="primary-btn" id="saveThumbnailButton">Upload Thumbnail</button>
              </div>
              <div class="portfolio-inline-form">
                <label class="portfolio-field-label" for="galleryUpload">Add Gallery Images</label>
                <input type="file" id="galleryUpload" accept="image/*" multiple />
                <button type="button" class="primary-btn" id="saveGalleryImagesButton">Upload Images</button>
              </div>
            </div>
          </div>

          <div class="portfolio-detail-copy">
            <div class="portfolio-inline-card">
              <h3>Portfolio Details</h3>
              <div class="portfolio-edit-grid">
                <div class="portfolio-field-group">
                  <label class="portfolio-field-label" for="editTitle">Title</label>
                  <input id="editTitle" type="text" value="${escapeHtml(project.title || '')}" />
                </div>
                <div class="portfolio-field-group">
                  <label class="portfolio-field-label" for="editYear">Year</label>
                  <input id="editYear" type="text" inputmode="numeric" maxlength="4" value="${escapeHtml(project.project_year || '')}" />
                </div>
                <div class="portfolio-field-group">
                  <label class="portfolio-field-label" for="editCategory">Category</label>
                  <select id="editCategory">
                    ${categories.map((category) => `
                      <option value="${category}" ${project.category === category ? 'selected' : ''}>${formatLabel(category)}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="portfolio-field-group">
                  <label class="portfolio-field-label" for="editStatus">Status</label>
                  <select id="editStatus">
                    ${statuses.map((status) => `
                      <option value="${status}" ${project.status === status ? 'selected' : ''}>${formatLabel(status)}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="portfolio-field-group">
                  <label class="portfolio-field-label" for="editClient">Client</label>
                  <input id="editClient" type="text" value="${escapeHtml(project.client_name || '')}" />
                </div>
                <div class="portfolio-field-group">
                  <label class="portfolio-field-label" for="editMedium">Medium</label>
                  <input id="editMedium" type="text" value="${escapeHtml(project.medium || '')}" />
                </div>
                <div class="portfolio-field-group">
                  <label class="portfolio-field-label" for="editGithub">Reference URL</label>
                  <input id="editGithub" type="url" value="${escapeHtml(project.github_url || '')}" />
                </div>
                <div class="portfolio-field-group">
                  <label class="portfolio-field-label" for="editLive">Live URL</label>
                  <input id="editLive" type="url" value="${escapeHtml(project.live_url || '')}" />
                </div>
                <label class="toggle-card portfolio-toggle-card">
                  <div>
                    <span class="toggle-card-title">Featured Portfolio</span>
                    <p>Highlight this entry across your portfolio.</p>
                  </div>
                  <input id="editFeatured" type="checkbox" ${Number(project.is_featured) === 1 ? 'checked' : ''} />
                </label>
              </div>
            </div>

            <div class="portfolio-inline-card">
              <h3>Descriptions</h3>
              <div class="portfolio-inline-form">
                <label class="portfolio-field-label" for="editShortDescription">Short Description</label>
                <textarea id="editShortDescription" rows="4" placeholder="Compact summary for cards and previews.">${escapeHtml(project.short_description || '')}</textarea>
              </div>
              <div class="portfolio-inline-form">
                <label class="portfolio-field-label" for="editDescription">Long Description</label>
                <textarea id="editDescription" rows="8" placeholder="Tell the full story behind this work.">${escapeHtml(project.description || '')}</textarea>
              </div>
              <button type="button" class="primary-btn" id="savePortfolioDetailsButton">Save Portfolio Details</button>
            </div>

            <div class="portfolio-inline-card">
              <h3>Editable Links</h3>
              <div id="portfolioLinksEditor" class="portfolio-links-editor">
                ${buildLinksEditor(project.links || [])}
              </div>
              <div class="portfolio-inline-actions">
                <button type="button" class="ghost-btn" id="addLinkRowButton">Add Another Link</button>
                <button type="button" class="primary-btn" id="saveLinksButton">Save Links</button>
              </div>
            </div>

            <div class="portfolio-inline-card">
              <h3>Uploaded Files</h3>
              ${(project.files || []).length
                ? `<div class="portfolio-file-editor">
                    ${project.files.map((file) => `
                      <div class="portfolio-file-editor-row">
                        <a href="${escapeHtml(file.file_url)}" target="_blank" rel="noreferrer">${escapeHtml(file.file_name)}</a>
                        <button type="button" class="ghost-btn portfolio-remove-inline-btn" data-remove-file="${file.id}">Remove</button>
                      </div>
                    `).join('')}
                  </div>`
                : '<p class="portfolio-empty-copy">No supporting files uploaded yet.</p>'}
              <div class="portfolio-inline-form">
                <input type="file" id="fileInput" />
                <button type="button" class="primary-btn" id="uploadFileButton">Upload File</button>
              </div>
              <p class="portfolio-empty-copy">Accepted: PNG, JPG, WEBP, or PDF up to 2MB.</p>
            </div>
          </div>
        </div>
      </section>
    `;

    bindProjectDetailEvents(project.id);
  }

  function bindProjectDetailEvents(projectId) {
    const closeButton = document.getElementById('closePortfolioDetail');
    const savePortfolioDetailsButton = document.getElementById('savePortfolioDetailsButton');
    const addLinkRowButton = document.getElementById('addLinkRowButton');
    const saveLinksButton = document.getElementById('saveLinksButton');
    const saveThumbnailButton = document.getElementById('saveThumbnailButton');
    const saveGalleryImagesButton = document.getElementById('saveGalleryImagesButton');
    const uploadFileButton = document.getElementById('uploadFileButton');
    const galleryMain = document.getElementById('portfolioGalleryMain');

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

    document.querySelectorAll('[data-gallery-scroll]').forEach((button) => {
      button.addEventListener('click', () => {
        const track = document.getElementById('portfolioGalleryTrack');

        if (!track) {
          return;
        }

        track.scrollBy({
          left: Number(button.dataset.galleryScroll) * 260,
          behavior: 'smooth'
        });
      });
    });

    document.querySelectorAll('[data-remove-image]').forEach((button) => {
      button.addEventListener('click', async () => {
        await removeImage(projectId, button.dataset.removeImage);
      });
    });

    document.querySelectorAll('[data-remove-file]').forEach((button) => {
      button.addEventListener('click', async () => {
        await removeFile(projectId, Number(button.dataset.removeFile));
      });
    });

    document.querySelectorAll('[data-remove-link-row]').forEach((button) => {
      button.addEventListener('click', () => {
        button.closest('.portfolio-link-editor-row')?.remove();
      });
    });

    addLinkRowButton?.addEventListener('click', appendLinkRow);
    savePortfolioDetailsButton?.addEventListener('click', async () => {
      await savePortfolioDetails(projectId);
    });
    saveLinksButton?.addEventListener('click', async () => {
      await saveLinks(projectId);
    });
    saveThumbnailButton?.addEventListener('click', async () => {
      await saveThumbnail(projectId);
    });
    saveGalleryImagesButton?.addEventListener('click', async () => {
      await saveGalleryImages(projectId);
    });
    uploadFileButton?.addEventListener('click', async () => {
      await uploadFile(projectId);
    });

    const galleryTrack = document.getElementById('portfolioGalleryTrack');

    if (galleryTrack) {
      galleryTrack.addEventListener('scroll', updateGalleryScrollButtons);
      updateGalleryScrollButtons();
    }
  }

  function updateGalleryScrollButtons() {
    const track = document.getElementById('portfolioGalleryTrack');
    const prevButton = document.querySelector('.portfolio-gallery-scroll-btn-prev');
    const nextButton = document.querySelector('.portfolio-gallery-scroll-btn-next');

    if (!track || !prevButton || !nextButton) {
      return;
    }

    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    const hasOverflow = maxScrollLeft > 4;

    prevButton.classList.toggle('is-hidden', !hasOverflow);
    nextButton.classList.toggle('is-hidden', !hasOverflow);
    prevButton.disabled = track.scrollLeft <= 4;
    nextButton.disabled = track.scrollLeft >= maxScrollLeft - 4;
  }

  function appendLinkRow() {
    const editor = document.getElementById('portfolioLinksEditor');

    if (!editor) {
      return;
    }

    const index = editor.querySelectorAll('.portfolio-link-editor-row').length;
    const wrapper = document.createElement('div');
    wrapper.className = 'portfolio-link-editor-row';
    wrapper.dataset.linkRow = String(index);
    wrapper.innerHTML = `
      <input type="text" placeholder="Link label" data-link-label="${index}" />
      <input type="url" placeholder="https://example.com" data-link-url="${index}" />
      <button type="button" class="ghost-btn portfolio-remove-inline-btn" data-remove-link-row="${index}">Remove</button>
    `;
    editor.appendChild(wrapper);

    wrapper.querySelector('[data-remove-link-row]')?.addEventListener('click', () => {
      wrapper.remove();
    });
  }

  async function savePortfolioDetails(projectId) {
    const payload = {
      title: document.getElementById('editTitle').value.trim(),
      slug: slugify(document.getElementById('editTitle').value),
      project_year: document.getElementById('editYear').value.trim(),
      category: document.getElementById('editCategory').value,
      status: document.getElementById('editStatus').value,
      client_name: document.getElementById('editClient').value.trim(),
      medium: document.getElementById('editMedium').value.trim(),
      github_url: document.getElementById('editGithub').value.trim(),
      live_url: document.getElementById('editLive').value.trim(),
      short_description: document.getElementById('editShortDescription').value.trim(),
      description: document.getElementById('editDescription').value.trim(),
      is_featured: document.getElementById('editFeatured').checked
    };

    try {
      await fetchJson(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(payload)
      });

      await refreshProjects();
      await openProject(projectId);
    } catch (error) {
      alert(error.message || 'Failed to save portfolio details.');
    }
  }

  function getLinksPayload() {
    return Array.from(document.querySelectorAll('.portfolio-link-editor-row'))
      .map((row) => ({
        label: row.querySelector('input[type="text"]').value.trim(),
        url: row.querySelector('input[type="url"]').value.trim()
      }))
      .filter((link) => link.label || link.url);
  }

  async function saveLinks(projectId) {
    try {
      await fetchJson(`/api/projects/${projectId}/links`, {
        method: 'PUT',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ links: getLinksPayload() })
      });

      await openProject(projectId);
    } catch (error) {
      alert(error.message || 'Failed to save links.');
    }
  }

  async function saveThumbnail(projectId) {
    const input = document.getElementById('thumbnailUpload');
    const file = input.files[0];

    if (!file) {
      alert('Please choose a thumbnail image first.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const upload = await fetchJson('/api/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      await fetchJson(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ thumbnail_url: upload.imageUrl })
      });

      await refreshProjects();
      await openProject(projectId);
    } catch (error) {
      alert(error.message || 'Failed to upload thumbnail.');
    }
  }

  async function saveGalleryImages(projectId) {
    const input = document.getElementById('galleryUpload');
    const files = Array.from(input.files);

    if (!files.length) {
      alert('Please choose one or more gallery images first.');
      return;
    }

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);

        await fetchJson(`/api/projects/${projectId}/images`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData
        });
      }

      await refreshProjects();
      await openProject(projectId);
    } catch (error) {
      alert(error.message || 'Failed to upload gallery images.');
    }
  }

  async function removeImage(projectId, imageId) {
    try {
      if (imageId === 'thumbnail') {
        await fetchJson(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: getAuthHeaders({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ thumbnail_url: null })
        });
      } else {
        await fetchJson(`/api/projects/${projectId}/images/${imageId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      }

      await refreshProjects();
      await openProject(projectId);
    } catch (error) {
      alert(error.message || 'Failed to remove image.');
    }
  }

  async function uploadFile(projectId) {
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

    try {
      const formData = new FormData();
      formData.append('file', file);

      await fetchJson(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      await openProject(projectId);
    } catch (error) {
      alert(error.message || 'Upload failed.');
    }
  }

  async function removeFile(projectId, fileId) {
    try {
      await fetchJson(`/api/projects/${projectId}/files/${fileId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      await openProject(projectId);
    } catch (error) {
      alert(error.message || 'Failed to remove file.');
    }
  }

  async function refreshProjects() {
    const data = await fetchJson('/api/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });

    state.projects = data.data || [];
    renderPortfolioPage();
  }
};
