const LOGIN_PATH = '/login.html';
const DEFAULT_PAGE = 'projects';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = LOGIN_PATH;
}

const content = document.getElementById('content');
const logoutButton = document.getElementById('logout');

logoutButton.onclick = () => {
  localStorage.removeItem('token');
  window.location.href = LOGIN_PATH;
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

function setActiveNav(page) {
  document.querySelectorAll('.sidebar li').forEach((item) => {
    item.classList.toggle('active', item.getAttribute('data-page') === page);
  });
}

async function loadPage(page) {
  setActiveNav(page);
  window.location.hash = page;

  if (page === 'contacts') {
    content.innerHTML = `
      <div class="panel-head">
        <h2>Contacts</h2>
      </div>
      <p class="panel-copy">Contacts management is coming soon.</p>
      <pre class="output-card">Contacts module is not connected yet.</pre>
    `;
    return;
  }

  if (typeof window.loadPortfolioPage === 'function') {
    await window.loadPortfolioPage(content, token);
    return;
  }

  content.innerHTML = `
    <div class="panel-head">
      <h2>Portfolio</h2>
    </div>
    <p class="panel-copy">Portfolio view is not available right now.</p>
    <pre class="output-card">Missing portfolio module.</pre>
  `;
}

const initialPage = window.location.hash.replace('#', '') || DEFAULT_PAGE;
loadPage(initialPage === 'contacts' ? 'contacts' : DEFAULT_PAGE);
