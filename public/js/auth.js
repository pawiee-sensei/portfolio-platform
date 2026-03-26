const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const errorEl = document.getElementById('error');
const successEl = document.getElementById('success');

const clearMessages = () => {
  if (errorEl) {
    errorEl.innerText = '';
  }

  if (successEl) {
    successEl.innerText = '';
  }
};

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!data.success) {
        errorEl.innerText = data.message || 'Login failed';
        return;
      }

      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard.html';
    } catch (err) {
      errorEl.innerText = 'Server error';
    }
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();

    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!data.success) {
        errorEl.innerText = data.message || 'Sign up failed';
        return;
      }

      localStorage.setItem('token', data.token);
      successEl.innerText = 'Account created successfully';
      window.location.href = '/dashboard.html';
    } catch (err) {
      errorEl.innerText = 'Server error';
    }
  });
}
