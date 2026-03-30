const token = localStorage.getItem('token');
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

const categoryContent = {
  web: {
    help: 'Web projects usually benefit from technologies, repository links, and a live URL.',
    showTech: true,
    githubLabel: 'Repository URL',
    liveLabel: 'Live URL'
  },
  app: {
    help: 'App projects can include technologies, repository links, store links, or a landing page.',
    showTech: true,
    githubLabel: 'Repository URL',
    liveLabel: 'App or Demo URL'
  },
  'graphic-design': {
    help: 'Graphic design work is usually strongest with a thumbnail, gallery images, and a concise concept summary.',
    showTech: false,
    githubLabel: 'Process or Drive URL',
    liveLabel: 'Project URL'
  },
  poster: {
    help: 'Poster entries work well with a strong cover image, project year, and a short explanation of the concept.',
    showTech: false,
    githubLabel: 'Reference URL',
    liveLabel: 'Project URL'
  },
  pubmat: {
    help: 'Pubmat entries usually focus on visual assets, campaign context, and client or organization details.',
    showTech: false,
    githubLabel: 'Reference URL',
    liveLabel: 'Project URL'
  },
  art: {
    help: 'Art entries can stay media-first with medium, year, and an artist statement or brief description.',
    showTech: false,
    githubLabel: 'Reference URL',
    liveLabel: 'Project URL'
  },
  poetry: {
    help: 'Poetry entries usually focus on title, year, context, and the full written piece or description.',
    showTech: false,
    githubLabel: 'Reading URL',
    liveLabel: 'Publication URL'
  },
  photography: {
    help: 'Photography entries work best with strong thumbnails, gallery images, and brief shoot context.',
    showTech: false,
    githubLabel: 'Reference URL',
    liveLabel: 'Gallery URL'
  },
  branding: {
    help: 'Branding projects benefit from client context, year, medium, and supporting gallery images.',
    showTech: false,
    githubLabel: 'Case Study URL',
    liveLabel: 'Brand or Campaign URL'
  },
  other: {
    help: 'Use the fields that fit this work best and leave the rest empty.',
    showTech: false,
    githubLabel: 'Reference URL',
    liveLabel: 'Project URL'
  }
};

if (!token) {
  window.location.href = '/login.html';
}

document.getElementById('logout').onclick = () => {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
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
  submitButton.textContent = isSubmitting ? 'Creating...' : 'Create Project';
}

function updateCategoryUI() {
  const config = categoryContent[categoryInput.value] || categoryContent.other;

  categoryHelp.textContent = config.help;
  githubLabel.textContent = config.githubLabel;
  liveLabel.textContent = config.liveLabel;
  technologySection.classList.toggle('is-hidden', !config.showTech);
}

async function loadTechnologies() {
  try {
    const res = await fetch('/api/technologies');
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to load technologies');
    }

    if (!data.data.length) {
      techList.textContent = 'No technologies available yet.';
      return;
    }

    techList.innerHTML = data.data.map((technology) => `
      <label>
        <input type="checkbox" value="${technology.id}" />
        ${technology.name}
      </label>
    `).join('');
  } catch (error) {
    techList.textContent = 'Unable to load technologies right now.';
  }
}

categoryInput.addEventListener('change', updateCategoryUI);

form.onsubmit = async (e) => {
  e.preventDefault();

  const selectedTechs = Array.from(
    techList.querySelectorAll('input:checked')
  ).map((input) => Number(input.value));
  const thumbnailFile = document.getElementById('thumbnail').files[0];
  const galleryFiles = Array.from(document.getElementById('gallery_images').files);
  const year = document.getElementById('project_year').value.trim();

  let thumbnail_url = null;

  if (year && !/^\d{4}$/.test(year)) {
    formMessage.textContent = 'Project year must be a 4-digit year.';
    return;
  }

  setSubmitting(true);
  formMessage.textContent = 'Uploading media and creating project...';

  try {
    if (thumbnailFile) {
      const thumbnailData = new FormData();
      thumbnailData.append('image', thumbnailFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token
        },
        body: thumbnailData
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        formMessage.textContent = uploadData.message || 'Thumbnail upload failed';
        setSubmitting(false);
        return;
      }

      thumbnail_url = uploadData.imageUrl;
    }

    const projectData = {
      title: titleInput.value.trim(),
      slug: slugify(titleInput.value),
      category: categoryInput.value,
      project_year: year,
      client_name: document.getElementById('client_name').value.trim(),
      medium: document.getElementById('medium').value.trim(),
      status: document.getElementById('status').value,
      short_description: document.getElementById('short_description').value.trim(),
      description: document.getElementById('description').value.trim(),
      github_url: document.getElementById('github_url').value.trim(),
      live_url: document.getElementById('live_url').value.trim(),
      is_featured: document.getElementById('is_featured').checked,
      thumbnail_url
    };

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(projectData)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      formMessage.textContent = data.message || 'Failed to create project';
      setSubmitting(false);
      return;
    }

    if (!technologySection.classList.contains('is-hidden') && selectedTechs.length > 0) {
      const techRes = await fetch(`/api/projects/${data.id}/technologies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ techIds: selectedTechs })
      });

      const techData = await techRes.json();

      if (!techRes.ok || !techData.success) {
        formMessage.textContent = techData.message || 'Project created, but technologies were not saved';
        setSubmitting(false);
        return;
      }
    }

    for (const file of galleryFiles) {
      const galleryData = new FormData();
      galleryData.append('image', file);

      const imageRes = await fetch(`/api/projects/${data.id}/images`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token
        },
        body: galleryData
      });

      const imageData = await imageRes.json();

      if (!imageRes.ok || !imageData.success) {
        formMessage.textContent = imageData.message || 'Project created, but some gallery images failed to upload';
        setSubmitting(false);
        return;
      }
    }

    formMessage.textContent = 'Project created successfully';
    form.reset();
    updateCategoryUI();
    await loadTechnologies();
    window.location.href = '/dashboard.html';
  } catch (error) {
    formMessage.textContent = 'Server error';
  } finally {
    setSubmitting(false);
  }
};

updateCategoryUI();
loadTechnologies();
