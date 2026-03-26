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
    content.innerHTML = `
      <div class="panel-head">
        <h2>Projects</h2>
      </div>
      <p class="panel-copy">Loading your portfolio entries from the API.</p>
      <pre class="output-card">Loading...</pre>
    `;

    try {
      const res = await fetch('/api/projects', {
        headers: {
          Authorization: 'Bearer ' + token
        }
      });

      const data = await res.json();

      content.innerHTML = `
        <div class="panel-head">
          <h2>Projects</h2>
        </div>
        <p class="panel-copy">Here is the current project payload returned by your backend.</p>
        <pre class="output-card">${JSON.stringify(data, null, 2)}</pre>
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

loadPage('projects');
