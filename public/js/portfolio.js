window.loadPortfolioPage = async function loadPortfolioPage(content, token) {
  const state = {
    projects: [],
    selectedProject: null,
    activeMenuId: null,
    linkDrafts: [],
    activeLinkIndex: 0
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
      state.linkDrafts = (response.data.links || []).map((link) => ({
        label: link.label || '',
        url: link.url || ''
      }));

      if (!state.linkDrafts.length) {
        state.linkDrafts = [{ label: '', url: '' }];
      }

      state.activeLinkIndex = 0;
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

  function renderLinksManager() {
    const links = state.linkDrafts.length ? state.linkDrafts : [{ label: '', url: '' }];
    const safeIndex = Math.min(state.activeLinkIndex, links.length - 1);
    const activeLink = links[safeIndex] || { label: '', url: '' };

    state.activeLinkIndex = safeIndex;

    return `
      <div class="portfolio-links-switcher">
        ${links.map((link, index) => `
          <button
            type="button"
            class="portfolio-link-tab ${index === safeIndex ? 'is-active' : ''}"
            data-link-tab="${index}"
          >${escapeHtml(link.label || `Link ${index + 1}`)}</button>
        `).join('')}
      </div>
      <div class="portfolio-link-single-editor">
        <div class="portfolio-link-focus-head">
          <div>
            <strong>${escapeHtml(activeLink.label || `Link ${safeIndex + 1}`)}</strong>
            <p class="portfolio-section-copy">Edit one link at a time so this section stays compact.</p>
          </div>
          <button
            type="button"
            class="ghost-btn portfolio-remove-inline-btn"
            id="removeActiveLinkButton"
            ${links.length === 1 && !activeLink.label && !activeLink.url ? 'disabled' : ''}
          >Delete Link</button>
        </div>
        <div class="portfolio-link-single-grid">
          <div class="portfolio-field-group">
            <label class="portfolio-field-label" for="activeLinkLabel">Platform or label</label>
            <input id="activeLinkLabel" type="text" value="${escapeHtml(activeLink.label || '')}" placeholder="Instagram" />
          </div>
          <div class="portfolio-field-group">
            <label class="portfolio-field-label" for="activeLinkUrl">Link URL</label>
            <input id="activeLinkUrl" type="url" value="${escapeHtml(activeLink.url || '')}" placeholder="https://example.com" />
          </div>
        </div>
      </div>
      <div class="portfolio-inline-actions portfolio-inline-actions-links">
        <button type="button" class="ghost-btn" id="addLinkRowButton">Add Link Row</button>
        <button type="button" class="primary-btn" id="saveLinksButton">Save Links</button>
      </div>
    `;
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
                          aria-label="Delete image"
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
              <p class="portfolio-section-copy">Keep your cover image and supporting gallery fresh without leaving this editor.</p>
              <div class="portfolio-upload-group">
                <div class="portfolio-inline-form portfolio-upload-card">
                  <label class="portfolio-field-label" for="thumbnailUpload">Replace Thumbnail</label>
                  <input type="file" id="thumbnailUpload" class="portfolio-file-input" accept="image/*" />
                  <p class="portfolio-input-note">Best for the main card and featured view.</p>
                  <button type="button" class="primary-btn" id="saveThumbnailButton">Upload Thumbnail</button>
                </div>
              </div>
              <div class="portfolio-upload-group">
                <div class="portfolio-inline-form portfolio-upload-card">
                  <label class="portfolio-field-label" for="galleryUpload">Add Gallery Images</label>
                  <input type="file" id="galleryUpload" class="portfolio-file-input" accept="image/*" multiple />
                  <p class="portfolio-input-note">Add process shots, alternate layouts, or extra visuals. Larger images are supported up to 15MB each.</p>
                  <button type="button" class="primary-btn" id="saveGalleryImagesButton">Upload Images</button>
                </div>
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
              <button type="button" class="primary-btn portfolio-save-details-btn" id="savePortfolioMetaButton">Save Portfolio Details</button>
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
              <button type="button" class="primary-btn portfolio-save-details-btn" id="savePortfolioDetailsButton">Save Descriptions</button>
            </div>

          </div>
        </div>

        <div class="portfolio-inline-card portfolio-inline-card-wide">
          <h3>Editable Links</h3>
          <p class="portfolio-section-copy">Organize portfolio links cleanly so visitors can jump straight to the right platform.</p>
          <div id="portfolioLinksSection">
            ${renderLinksManager()}
          </div>
        </div>

        <div class="portfolio-inline-card portfolio-inline-card-wide">
          <h3>Uploaded Files</h3>
          <p class="portfolio-section-copy">Attach supporting assets and keep downloadable files under control.</p>
          ${(project.files || []).length
            ? `<div class="portfolio-file-editor">
                ${project.files.map((file) => `
                  <div class="portfolio-file-editor-row">
                    <a href="${escapeHtml(file.file_url)}" target="_blank" rel="noreferrer">${escapeHtml(file.file_name)}</a>
                    <button type="button" class="ghost-btn portfolio-remove-inline-btn" data-remove-file="${file.id}">Delete</button>
                  </div>
                `).join('')}
              </div>`
            : '<p class="portfolio-empty-copy">No supporting files uploaded yet.</p>'}
          <div class="portfolio-inline-form portfolio-upload-card">
            <input type="file" id="fileInput" class="portfolio-file-input" />
            <p class="portfolio-input-note">Accepted: JPG, JPEG, PNG, or WEBP up to 15MB.</p>
            <button type="button" class="primary-btn" id="uploadFileButton">Upload File</button>
          </div>
        </div>
      </section>
    `;

    bindProjectDetailEvents(project.id);
    hydrateHeroImageSizing();
  }

  function bindProjectDetailEvents(projectId) {
    const closeButton = document.getElementById('closePortfolioDetail');
    const savePortfolioMetaButton = document.getElementById('savePortfolioMetaButton');
    const savePortfolioDetailsButton = document.getElementById('savePortfolioDetailsButton');
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
        hydrateHeroImageSizing();
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

    savePortfolioMetaButton?.addEventListener('click', async () => {
      await savePortfolioDetails(projectId);
    });
    savePortfolioDetailsButton?.addEventListener('click', async () => {
      await savePortfolioDetails(projectId);
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

    bindLinksManagerEvents(projectId);
  }

  function hydrateHeroImageSizing() {
    const image = document.querySelector('.portfolio-gallery-hero');

    if (!image) {
      return;
    }

    const applySizing = () => {
      const ratio = image.naturalWidth / image.naturalHeight;

      image.classList.remove('is-landscape', 'is-square', 'is-portrait');

      if (ratio < 0.9) {
        image.classList.add('is-portrait');
        return;
      }

      if (ratio <= 1.12) {
        image.classList.add('is-square');
        return;
      }

      image.classList.add('is-landscape');
    };

    if (image.complete) {
      applySizing();
      return;
    }

    image.addEventListener('load', applySizing, { once: true });
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

  function renderLinksSection(projectId) {
    const section = document.getElementById('portfolioLinksSection');

    if (!section) {
      return;
    }

    section.innerHTML = renderLinksManager();
    bindLinksManagerEvents(projectId);
  }

  function bindLinksManagerEvents(projectId) {
    document.querySelectorAll('[data-link-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        syncActiveLinkDraft();
        state.activeLinkIndex = Number(button.dataset.linkTab);
        renderLinksSection(projectId);
      });
    });

    document.getElementById('activeLinkLabel')?.addEventListener('input', (event) => {
      updateActiveLinkDraft({ label: event.target.value });
      syncLinkTabLabels();
    });

    document.getElementById('activeLinkUrl')?.addEventListener('input', (event) => {
      updateActiveLinkDraft({ url: event.target.value });
    });

    document.getElementById('addLinkRowButton')?.addEventListener('click', () => {
      syncActiveLinkDraft();
      state.linkDrafts.push({ label: '', url: '' });
      state.activeLinkIndex = state.linkDrafts.length - 1;
      renderLinksSection(projectId);
    });

    document.getElementById('removeActiveLinkButton')?.addEventListener('click', () => {
      if (!state.linkDrafts.length) {
        return;
      }

      if (state.linkDrafts.length === 1) {
        state.linkDrafts = [{ label: '', url: '' }];
        state.activeLinkIndex = 0;
        renderLinksSection(projectId);
        return;
      }

      state.linkDrafts.splice(state.activeLinkIndex, 1);
      state.activeLinkIndex = Math.max(0, state.activeLinkIndex - 1);
      renderLinksSection(projectId);
    });

    document.getElementById('saveLinksButton')?.addEventListener('click', async () => {
      syncActiveLinkDraft();
      await saveLinks(projectId);
    });
  }

  function updateActiveLinkDraft(patch) {
    if (!state.linkDrafts.length) {
      state.linkDrafts = [{ label: '', url: '' }];
      state.activeLinkIndex = 0;
    }

    state.linkDrafts[state.activeLinkIndex] = {
      ...state.linkDrafts[state.activeLinkIndex],
      ...patch
    };
  }

  function syncActiveLinkDraft() {
    const labelInput = document.getElementById('activeLinkLabel');
    const urlInput = document.getElementById('activeLinkUrl');

    if (!labelInput || !urlInput) {
      return;
    }

    updateActiveLinkDraft({
      label: labelInput.value.trim(),
      url: urlInput.value.trim()
    });
  }

  function syncLinkTabLabels() {
    const tabs = document.querySelectorAll('[data-link-tab]');

    tabs.forEach((tab) => {
      const index = Number(tab.dataset.linkTab);
      const draft = state.linkDrafts[index] || {};
      tab.textContent = draft.label || `Link ${index + 1}`;
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
    return state.linkDrafts
      .map((link) => ({
        label: String(link.label || '').trim(),
        url: String(link.url || '').trim()
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

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const maxSize = 15 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > maxSize) {
      alert('File too large. Max size is 15MB.');
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
