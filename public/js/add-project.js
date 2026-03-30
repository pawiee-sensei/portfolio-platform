const LOGIN_PATH = '/login.html';
const DASHBOARD_PATH = '/dashboard.html';
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const MESSAGES = {
  titleRequired: 'Title is required.',
  slugInvalid: 'Please enter a clearer title using letters or numbers.',
  yearInvalid: 'Project year must be a 4-digit year.',
  creating: 'Creating portfolio entry...',
  creatingWithMedia: 'Uploading media and creating portfolio entry...',
  createSuccess: 'Portfolio entry created successfully',
  createFailed: 'Failed to create portfolio entry',
  technologiesLoadFailed: 'Unable to load technologies right now.',
  noTechnologies: 'No technologies available yet.',
  requestFailed: 'Request failed',
  serverError: 'Server error'
};
const techList = document.getElementById('techList');
const form = document.getElementById('projectForm');
const formMessage = document.getElementById('formMessage');
const titleInput = document.getElementById('title');
const categoryInput = document.getElementById('category');
const categoryHelp = document.getElementById('categoryHelp');
const technologySection = document.getElementById('technologySection');
const githubLabel = document.getElementById('githubLabel');
const liveLabel = document.getElementById('liveLabel');
const submitButton = document.getElementById('submitProject');
const githubInput = document.getElementById('github_url');
const liveInput = document.getElementById('live_url');
const thumbnailInput = document.getElementById('thumbnail');
const galleryInput = document.getElementById('gallery_images');
const thumbnailMeta = document.getElementById('thumbnailMeta');
const galleryMeta = document.getElementById('galleryMeta');
const thumbnailPreview = document.getElementById('thumbnailPreview');
const galleryPreview = document.getElementById('galleryPreview');
const yearInput = document.getElementById('project_year');
const clientInput = document.getElementById('client_name');
const mediumInput = document.getElementById('medium');
const statusInput = document.getElementById('status');
const shortDescriptionInput = document.getElementById('short_description');
const descriptionInput = document.getElementById('description');
const featuredInput = document.getElementById('is_featured');
const logoutButton = document.getElementById('logout');
let isTechLoading = false;
let thumbnailPreviewUrl = null;
let galleryPreviewUrls = [];

const categoryContent = {
  web: {
    help: 'Web projects usually benefit from technologies, repository links, and a live URL.',
    showTech: true,
    githubLabel: 'Repository URL',
    liveLabel: 'Live URL',
    githubPlaceholder: 'GitHub or repository URL',
    livePlaceholder: 'Live URL'
  },
  app: {
    help: 'App projects can include technologies, repository links, store links, or a landing page.',
    showTech: true,
    githubLabel: 'Repository URL',
    liveLabel: 'App or Demo URL',
    githubPlaceholder: 'Repository URL',
    livePlaceholder: 'App, demo, or store URL'
  },
  'graphic-design': {
    help: 'Graphic design work is usually strongest with a thumbnail, gallery images, and a concise concept summary.',
    showTech: false,
    githubLabel: 'Process or Drive URL',
    liveLabel: 'Project URL',
    githubPlaceholder: 'Process, brief, or drive URL',
    livePlaceholder: 'Project URL'
  },
  poster: {
    help: 'Poster entries work well with a strong cover image, project year, and a short explanation of the concept.',
    showTech: false,
    githubLabel: 'Reference URL',
    liveLabel: 'Project URL',
    githubPlaceholder: 'Reference URL',
    livePlaceholder: 'Project URL'
  },
  pubmat: {
    help: 'PubMat entries usually focus on visual assets, campaign context, and client or organization details.',
    showTech: false,
    githubLabel: 'Reference URL',
    liveLabel: 'Project URL',
    githubPlaceholder: 'Reference URL',
    livePlaceholder: 'Project URL'
  },
  art: {
    help: 'Art entries can stay media-first with medium, year, and an artist statement or brief description.',
    showTech: false,
    githubLabel: 'Reference URL',
    liveLabel: 'Project URL',
    githubPlaceholder: 'Reference URL',
    livePlaceholder: 'Project URL'
  },
  poetry: {
    help: 'Poetry entries usually focus on title, year, context, and the full written piece or description.',
    showTech: false,
    githubLabel: 'Reading URL',
    liveLabel: 'Publication URL',
    githubPlaceholder: 'Reading URL',
    livePlaceholder: 'Publication URL'
  },
  photography: {
    help: 'Photography entries work best with strong thumbnails, gallery images, and brief shoot context.',
    showTech: false,
    githubLabel: 'Reference URL',
    liveLabel: 'Gallery URL',
    githubPlaceholder: 'Reference URL',
    livePlaceholder: 'Gallery URL'
  },
  branding: {
    help: 'Branding projects benefit from client context, year, medium, and supporting gallery images.',
    showTech: false,
    githubLabel: 'Case Study URL',
    liveLabel: 'Brand or Campaign URL',
    githubPlaceholder: 'Case study URL',
    livePlaceholder: 'Brand or campaign URL'
  },
  other: {
    help: 'Use the fields that fit this work best and leave the rest empty.',
    showTech: false,
    githubLabel: 'Reference URL',
    liveLabel: 'Project URL',
    githubPlaceholder: 'Reference URL',
    livePlaceholder: 'Project URL'
  }
};

if (!localStorage.getItem('token')) {
  window.location.href = LOGIN_PATH;
}

logoutButton.onclick = () => {
  localStorage.removeItem('token');
  window.location.href = LOGIN_PATH;
};

document.querySelectorAll('.sidebar li').forEach((item) => {
  item.addEventListener('click', () => {
    const href = item.getAttribute('data-href');

    if (href) {
      window.location.href = href;
    }
  });
});

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function setSubmitting(isSubmitting) {
  const elements = form.querySelectorAll('input, textarea, select, button');

  elements.forEach((element) => {
    element.disabled = isSubmitting;
  });

  submitButton.textContent = isSubmitting ? 'Creating...' : 'Create Portfolio Entry';
}

function updateSubmitAvailability() {
  if (isTechLoading) {
    submitButton.disabled = true;
    submitButton.textContent = 'Loading...';
    return;
  }

  submitButton.disabled = false;
  submitButton.textContent = 'Create Portfolio Entry';
}

function setFormMessage(message) {
  formMessage.textContent = message;
}

function formatFileSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

function revokeMediaPreviewUrls() {
  if (thumbnailPreviewUrl) {
    URL.revokeObjectURL(thumbnailPreviewUrl);
    thumbnailPreviewUrl = null;
  }

  galleryPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  galleryPreviewUrls = [];
}

function getAuthHeaders(extraHeaders = {}) {
  const currentToken = localStorage.getItem('token');

  return {
    ...extraHeaders,
    Authorization: `Bearer ${currentToken}`
  };
}

function getTrimmedValue(input) {
  return input.value.trim();
}

function getSelectedTechIds() {
  return Array.from(techList.querySelectorAll('input:checked'))
    .map((input) => Number(input.value));
}

function updateCategoryUI() {
  const config = categoryContent[categoryInput.value] || categoryContent.other;

  categoryHelp.textContent = config.help;
  githubLabel.textContent = config.githubLabel;
  liveLabel.textContent = config.liveLabel;
  githubInput.placeholder = config.githubPlaceholder;
  liveInput.placeholder = config.livePlaceholder;
  technologySection.classList.toggle('is-hidden', !config.showTech);
}

function renderEmptyThumbnailPreview() {
  thumbnailMeta.textContent = 'No file chosen';
  thumbnailPreview.className = 'media-preview media-preview-single is-empty';
  thumbnailPreview.innerHTML = `
    <div class="media-preview-empty">
      <span class="media-preview-kicker">Cover Preview</span>
      <strong>No thumbnail selected yet</strong>
      <p>Choose one strong image for the project card, featured section, or hero banner.</p>
    </div>
  `;
}

function renderEmptyGalleryPreview() {
  galleryMeta.textContent = 'No files chosen';
  galleryPreview.className = 'media-preview media-preview-grid is-empty';
  galleryPreview.innerHTML = `
    <div class="media-preview-empty">
      <span class="media-preview-kicker">Gallery Preview</span>
      <strong>Your supporting images will appear here</strong>
      <p>Add multiple images to show process shots, alternate views, layouts, or final outputs.</p>
    </div>
  `;
}

function renderThumbnailPreview(file) {
  if (thumbnailPreviewUrl) {
    URL.revokeObjectURL(thumbnailPreviewUrl);
  }

  if (!file) {
    thumbnailPreviewUrl = null;
    renderEmptyThumbnailPreview();
    return;
  }

  thumbnailMeta.textContent = file.name;
  thumbnailPreviewUrl = URL.createObjectURL(file);
  thumbnailPreview.className = 'media-preview media-preview-single';
  thumbnailPreview.innerHTML = `
    <div class="media-preview-frame" data-label="Thumbnail Ready">
      <button type="button" class="media-remove-btn" data-remove-thumbnail aria-label="Remove thumbnail">x</button>
      <img src="${thumbnailPreviewUrl}" alt="Thumbnail preview" class="media-preview-image" />
    </div>
  `;
}

function renderGalleryPreview(files) {
  galleryPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  galleryPreviewUrls = [];

  if (!files.length) {
    renderEmptyGalleryPreview();
    return;
  }

  galleryMeta.textContent = files.length === 1
    ? files[0].name
    : `${files.length} files selected`;
  galleryPreviewUrls = files.map((file) => URL.createObjectURL(file));
  galleryPreview.className = 'media-preview media-preview-grid';
  galleryPreview.innerHTML = `
    <div class="gallery-preview-strip">
      <button type="button" class="gallery-scroll-btn gallery-scroll-btn-prev" data-gallery-scroll="-1" aria-label="Scroll gallery left"><</button>
      <div class="gallery-preview-track" id="galleryPreviewTrack">
        ${galleryPreviewUrls.map((url, index) => `
          <div class="gallery-preview-item">
            <div class="media-preview-frame" data-label="Frame ${index + 1}">
              <button type="button" class="media-remove-btn" data-gallery-index="${index}" aria-label="Remove gallery image ${index + 1}">x</button>
              <img src="${url}" alt="Gallery preview ${index + 1}" class="media-preview-image" />
            </div>
            <span>${files[index].name}</span>
          </div>
        `).join('')}
      </div>
      <button type="button" class="gallery-scroll-btn gallery-scroll-btn-next" data-gallery-scroll="1" aria-label="Scroll gallery right">></button>
    </div>
  `;

  updateGalleryScrollButtons();
}

function getOversizedFiles(files) {
  return files.filter((file) => file.size > MAX_IMAGE_SIZE_BYTES);
}

function validateImageFiles(files, fieldLabel) {
  const oversizedFiles = getOversizedFiles(files);

  if (!oversizedFiles.length) {
    return true;
  }

  const fileNames = oversizedFiles.map((file) => file.name).join(', ');
  setFormMessage(`${fieldLabel} must be ${formatFileSize(MAX_IMAGE_SIZE_BYTES)} or smaller. Oversized file(s): ${fileNames}`);
  return false;
}

function removeThumbnailSelection() {
  revokeMediaPreviewUrls();
  thumbnailInput.value = '';
  renderEmptyThumbnailPreview();
  renderGalleryPreview(Array.from(galleryInput.files));
}

function removeGallerySelection(indexToRemove) {
  const dataTransfer = new DataTransfer();
  const files = Array.from(galleryInput.files);

  files.forEach((file, index) => {
    if (index !== indexToRemove) {
      dataTransfer.items.add(file);
    }
  });

  galleryInput.files = dataTransfer.files;
  renderGalleryPreview(Array.from(galleryInput.files));
}

function buildProjectData(formValues) {
  return {
    title: formValues.title,
    slug: formValues.slug,
    category: formValues.category,
    project_year: formValues.year,
    client_name: formValues.clientName,
    medium: formValues.medium,
    status: formValues.status,
    short_description: formValues.shortDescription,
    description: formValues.description,
    github_url: formValues.githubUrl,
    live_url: formValues.liveUrl,
    is_featured: formValues.isFeatured,
    thumbnail_url: formValues.thumbnailUrl
  };
}

function validateForm({ title, slug, year }) {
  if (!title) {
    return MESSAGES.titleRequired;
  }

  if (!slug) {
    return MESSAGES.slugInvalid;
  }

  if (year && !/^\d{4}$/.test(year)) {
    return MESSAGES.yearInvalid;
  }

  return null;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok || data.success === false) {
    const error = new Error(data.message || MESSAGES.requestFailed);
    error.response = response;
    error.data = data;
    throw error;
  }

  return data;
}

async function uploadImage(file, url) {
  const formData = new FormData();
  formData.append('image', file);

  const data = await fetchJson(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  });

  return data.imageUrl;
}

async function createProject(projectData) {
  const data = await fetchJson('/api/projects', {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(projectData)
  });

  return data;
}

async function assignTechnologies(projectId, techIds) {
  if (technologySection.classList.contains('is-hidden') || techIds.length === 0) {
    return;
  }

  await fetchJson(`/api/projects/${projectId}/technologies`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ techIds })
  });
}

async function uploadGalleryImages(projectId, files) {
  for (const file of files) {
    await uploadImage(file, `/api/projects/${projectId}/images`);
  }
}

async function loadTechnologies() {
  isTechLoading = true;
  updateSubmitAvailability();

  try {
    const data = await fetchJson('/api/technologies');

    if (!data.data.length) {
      techList.textContent = MESSAGES.noTechnologies;
      return;
    }

    techList.innerHTML = data.data.map((technology) => `
      <label>
        <input type="checkbox" value="${technology.id}" />
        ${technology.name}
      </label>
    `).join('');
  } catch (error) {
    techList.textContent = MESSAGES.technologiesLoadFailed;
  } finally {
    isTechLoading = false;
    updateSubmitAvailability();
  }
}

function resetFormState() {
  revokeMediaPreviewUrls();
  form.reset();
  updateCategoryUI();
  renderEmptyThumbnailPreview();
  renderEmptyGalleryPreview();
}

categoryInput.addEventListener('change', updateCategoryUI);
thumbnailInput.addEventListener('change', () => {
  const selectedFile = thumbnailInput.files[0] || null;

  if (selectedFile && !validateImageFiles([selectedFile], 'Thumbnail')) {
    thumbnailInput.value = '';
    renderEmptyThumbnailPreview();
    return;
  }

  renderThumbnailPreview(selectedFile);
});
galleryInput.addEventListener('change', () => {
  const selectedFiles = Array.from(galleryInput.files);

  if (!validateImageFiles(selectedFiles, 'Gallery images')) {
    galleryInput.value = '';
    renderEmptyGalleryPreview();
    return;
  }

  renderGalleryPreview(selectedFiles);
});
thumbnailPreview.addEventListener('click', (event) => {
  if (event.target.closest('[data-remove-thumbnail]')) {
    removeThumbnailSelection();
  }
});
galleryPreview.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-gallery-index]');
  const scrollButton = event.target.closest('[data-gallery-scroll]');

  if (scrollButton) {
    const track = document.getElementById('galleryPreviewTrack');

    if (track) {
      track.scrollBy({
        left: Number(scrollButton.dataset.galleryScroll) * 240,
        behavior: 'smooth'
      });
    }
    return;
  }

  if (!removeButton) {
    return;
  }

  removeGallerySelection(Number(removeButton.dataset.galleryIndex));
});

galleryPreview.addEventListener('scroll', () => {
  updateGalleryScrollButtons();
}, true);

function updateGalleryScrollButtons() {
  const track = document.getElementById('galleryPreviewTrack');
  const prevButton = galleryPreview.querySelector('.gallery-scroll-btn-prev');
  const nextButton = galleryPreview.querySelector('.gallery-scroll-btn-next');

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

form.onsubmit = async (e) => {
  e.preventDefault();

  if (isTechLoading) {
    setFormMessage('Please wait until technologies finish loading.');
    return;
  }

  const formValues = {
    title: getTrimmedValue(titleInput),
    slug: slugify(getTrimmedValue(titleInput)),
    year: getTrimmedValue(yearInput),
    category: categoryInput.value,
    clientName: getTrimmedValue(clientInput),
    medium: getTrimmedValue(mediumInput),
    status: statusInput.value,
    shortDescription: getTrimmedValue(shortDescriptionInput),
    description: getTrimmedValue(descriptionInput),
    githubUrl: getTrimmedValue(githubInput),
    liveUrl: getTrimmedValue(liveInput),
    isFeatured: featuredInput.checked,
    thumbnailFile: thumbnailInput.files[0],
    galleryFiles: Array.from(galleryInput.files),
    selectedTechs: getSelectedTechIds()
  };

  const validationError = validateForm({
    title: formValues.title,
    slug: formValues.slug,
    year: formValues.year
  });

  if (validationError) {
    setFormMessage(validationError);
    return;
  }

  if (formValues.thumbnailFile && !validateImageFiles([formValues.thumbnailFile], 'Thumbnail')) {
    return;
  }

  if (!validateImageFiles(formValues.galleryFiles, 'Gallery images')) {
    return;
  }

  setSubmitting(true);
  setFormMessage(
    formValues.thumbnailFile || formValues.galleryFiles.length
      ? MESSAGES.creatingWithMedia
      : MESSAGES.creating
  );

  try {
    formValues.thumbnailUrl = formValues.thumbnailFile
      ? await uploadImage(formValues.thumbnailFile, '/api/upload')
      : null;

    const projectData = buildProjectData(formValues);

    const project = await createProject(projectData);

    await assignTechnologies(project.id, formValues.selectedTechs);
    await uploadGalleryImages(project.id, formValues.galleryFiles);

    setFormMessage(MESSAGES.createSuccess);
    resetFormState();
    window.location.href = DASHBOARD_PATH;
  } catch (error) {
    setFormMessage(error.message || MESSAGES.serverError);
  } finally {
    setSubmitting(false);
  }
};

async function initPage() {
  updateCategoryUI();
  renderEmptyThumbnailPreview();
  renderEmptyGalleryPreview();
  await loadTechnologies();
}

initPage().catch(() => {
  setFormMessage('Unable to initialize the page.');
});
