const token = localStorage.getItem('token');
const techList = document.getElementById('techList');
const form = document.getElementById('projectForm');
const formMessage = document.getElementById('formMessage');

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

form.onsubmit = async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const slug = document.getElementById('slug').value.trim();
  const selectedTechs = Array.from(
    techList.querySelectorAll('input:checked')
  ).map((input) => Number(input.value));

  const projectData = {
    title,
    slug,
    short_description: document.getElementById('short_description').value.trim(),
    description: document.getElementById('description').value.trim(),
    github_url: document.getElementById('github_url').value.trim(),
    live_url: document.getElementById('live_url').value.trim(),
    is_featured: document.getElementById('is_featured').checked
  };

  formMessage.textContent = 'Creating project...';

  try {
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
      return;
    }

    if (selectedTechs.length > 0) {
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
        return;
      }
    }

    formMessage.textContent = 'Project created successfully';
    form.reset();
    await loadTechnologies();
    window.location.href = '/dashboard.html';
  } catch (error) {
    formMessage.textContent = 'Server error';
  }
};

loadTechnologies();
