const token = localStorage.getItem('token');
const LOGIN_PATH = '/login.html';
const DASHBOARD_PATH = '/dashboard.html';
const API_HEADERS = {
  Authorization: `Bearer ${token}`
};
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
const yearInput = document.getElementById('project_year');
const clientInput = document.getElementById('client_name');
const mediumInput = document.getElementById('medium');
const statusInput = document.getElementById('status');
const shortDescriptionInput = document.getElementById('short_description');
const descriptionInput = document.getElementById('description');
const featuredInput = document.getElementById('is_featured');
const logoutButton = document.getElementById('logout');

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

if (!token) {
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
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? 'Creating...' : 'Create Portfolio Entry';
}

function setFormMessage(message) {
  formMessage.textContent = message;
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

function buildProjectData({ title, slug, year, thumbnailUrl }) {
  return {
    title,
    slug,
    category: categoryInput.value,
    project_year: year,
    client_name: getTrimmedValue(clientInput),
    medium: getTrimmedValue(mediumInput),
    status: statusInput.value,
    short_description: getTrimmedValue(shortDescriptionInput),
    description: getTrimmedValue(descriptionInput),
    github_url: getTrimmedValue(githubInput),
    live_url: getTrimmedValue(liveInput),
    is_featured: featuredInput.checked,
    thumbnail_url: thumbnailUrl
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
    headers: API_HEADERS,
    body: formData
  });

  return data.imageUrl;
}

async function createProject(projectData) {
  return fetchJson('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...API_HEADERS
    },
    body: JSON.stringify(projectData)
  });
}

async function assignTechnologies(projectId, techIds) {
  if (technologySection.classList.contains('is-hidden') || techIds.length === 0) {
    return;
  }

  await fetchJson(`/api/projects/${projectId}/technologies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...API_HEADERS
    },
    body: JSON.stringify({ techIds })
  });
}

async function uploadGalleryImages(projectId, files) {
  for (const file of files) {
    await uploadImage(file, `/api/projects/${projectId}/images`);
  }
}

async function loadTechnologies() {
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
  }
}

async function resetFormState() {
  form.reset();
  updateCategoryUI();
  await loadTechnologies();
}

categoryInput.addEventListener('change', updateCategoryUI);

form.onsubmit = async (e) => {
  e.preventDefault();

  const title = getTrimmedValue(titleInput);
  const slug = slugify(title);
  const year = getTrimmedValue(yearInput);
  const thumbnailFile = thumbnailInput.files[0];
  const galleryFiles = Array.from(galleryInput.files);
  const selectedTechs = getSelectedTechIds();

  const validationError = validateForm({ title, slug, year });

  if (validationError) {
    setFormMessage(validationError);
    return;
  }

  setSubmitting(true);
  setFormMessage(
    thumbnailFile || galleryFiles.length
      ? MESSAGES.creatingWithMedia
      : MESSAGES.creating
  );

  try {
    const thumbnailUrl = thumbnailFile
      ? await uploadImage(thumbnailFile, '/api/upload')
      : null;

    const projectData = buildProjectData({
      title,
      slug,
      year,
      thumbnailUrl
    });

    const project = await createProject(projectData);

    await assignTechnologies(project.id, selectedTechs);
    await uploadGalleryImages(project.id, galleryFiles);

    setFormMessage(MESSAGES.createSuccess);
    await resetFormState();
    window.location.href = DASHBOARD_PATH;
  } catch (error) {
    setFormMessage(error.message || MESSAGES.serverError);
  } finally {
    setSubmitting(false);
  }
};

function initPage() {
  updateCategoryUI();
  loadTechnologies();
}

initPage();
