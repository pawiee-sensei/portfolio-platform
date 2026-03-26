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
    const href = item.getAttribute('data-href');
    const page = item.getAttribute('data-page');

    if (href) {
      window.location.href = href;
      return;
    }

    loadPage(page);
  });
});

async function loadPage(page) {
  const content = document.getElementById('content');

  setActiveNav(page);
  window.location.hash = page;

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

function setActiveNav(page) {
  document.querySelectorAll('.sidebar li').forEach((item) => {
    item.classList.toggle('active', item.getAttribute('data-page') === page);
  });
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
  const input = document.getElementById('fileInput');
  const file = input.files[0];

  if (!file) {
    alert('Please select a file first');
    return;
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
  const maxSize = 2 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    alert('Invalid file type');
    return;
  }

  if (file.size > maxSize) {
    alert('File too large (max 2MB)');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`/api/projects/${id}/files`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    alert('File uploaded');
    input.value = '';
  } catch (err) {
    alert(err.message);
  }
};

const initialPage = window.location.hash.replace('#', '') || 'projects';
loadPage(initialPage === 'contacts' ? 'contacts' : 'projects');
