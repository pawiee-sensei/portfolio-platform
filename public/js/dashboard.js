const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '/login.html';
}

document.getElementById('logout').onclick = () => {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
};

document.querySelectorAll('.sidebar li').forEach((item) => {
  item.addEventListener('click', () => {
    const page = item.getAttribute('data-page');

    document.querySelectorAll('.sidebar li').forEach((navItem) => {
      navItem.classList.toggle('active', navItem === item);
    });

    loadPage(page);
  });
});

async function loadPage(page) {
  const content = document.getElementById('content');

  if (page === 'projects') {
    try {
      const res = await fetch('/api/projects', {
        headers: { Authorization: 'Bearer ' + token }
      });

      const data = await res.json();

      content.innerHTML = `
        <div class="panel-head">
          <h2>Projects</h2>
        </div>
        <p class="panel-copy">Manage your existing portfolio projects from here.</p>
        <ul class="project-list">
          ${data.data.map((p) => `
            <li class="project-list-item">
              <strong>${p.title}</strong>
              <button class="primary-btn" onclick="openProject(${p.id})">Manage</button>
            </li>
          `).join('')}
        </ul>
      `;
    } catch (error) {
      content.innerHTML = `
        <div class="panel-head">
          <h2>Projects</h2>
        </div>
        <p class="panel-copy">Something went wrong while loading projects.</p>
        <pre class="output-card">Failed to fetch projects.</pre>
      `;
    }
  }

  if (page === 'create') {
    content.innerHTML = `
      <div class="panel-head">
        <h2>Add Project</h2>
      </div>
      <p class="panel-copy">Create a new portfolio project with the minimum required fields.</p>
      <form id="createForm" class="dashboard-form">
        <label for="title">Title</label>
        <input id="title" placeholder="Project title" required />

        <label for="slug">Slug</label>
        <input id="slug" placeholder="project-slug" required />

        <button type="submit" class="primary-btn">Create</button>
      </form>
      <p id="formMessage" class="panel-copy"></p>
    `;

    document.getElementById('createForm').onsubmit = async (e) => {
      e.preventDefault();

      const formMessage = document.getElementById('formMessage');
      formMessage.textContent = 'Creating project...';

      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
          },
          body: JSON.stringify({
            title: document.getElementById('title').value,
            slug: document.getElementById('slug').value
          })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          formMessage.textContent = data.message || 'Failed to create project';
          return;
        }

        formMessage.textContent = 'Project created successfully';
      } catch (error) {
        formMessage.textContent = 'Server error';
      }
    };
  }

  if (page === 'contacts') {
    content.innerHTML = `
      <div class="panel-head">
        <h2>Contacts</h2>
      </div>
      <p class="panel-copy">Contacts management is coming soon.</p>
      <pre class="output-card">Contacts module is not connected yet.</pre>
    `;
  }
}

window.openProject = async (id) => {
  const content = document.getElementById('content');

  content.innerHTML = `
    <div class="panel-head">
      <h2>Manage Project</h2>
    </div>

    <h3>Add Link</h3>
    <input id="linkLabel" placeholder="Label (GitHub)" />
    <input id="linkUrl" placeholder="URL" />
    <button class="primary-btn" onclick="addLink(${id})">Add Link</button>

    <h3>Upload File</h3>
    <input type="file" id="fileInput" />
    <button class="primary-btn" onclick="uploadFile(${id})">Upload</button>
  `;
};

window.addLink = async (id) => {
  const label = document.getElementById('linkLabel').value;
  const url = document.getElementById('linkUrl').value;

  await fetch(`/api/projects/${id}/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({ label, url })
  });

  alert('Link added');
};

window.uploadFile = async (id) => {
  const file = document.getElementById('fileInput').files[0];

  const formData = new FormData();
  formData.append('file', file);

  await fetch(`/api/projects/${id}/files`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token
    },
    body: formData
  });

  alert('File uploaded');
};

loadPage('projects');
