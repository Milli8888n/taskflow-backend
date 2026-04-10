<script src="/socket.io/socket.io.js"></script>
const API_BASE = '/api/v1';

function getAccessToken() {
  return localStorage.getItem('accessToken');
}

async function apiGet(path) {
  const token = getAccessToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.message || `Request failed: ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function priorityClass(priority) {
  const p = String(priority || '').toLowerCase();
  if (p === 'high') return 'pill pill--high';
  if (p === 'low') return 'pill pill--low';
  return 'pill pill--medium';
}

function getProjectIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('projectId');
}

async function loadProjectsIndex() {
  const listEl = document.getElementById('projects-list');
  const loadingEl = document.getElementById('projects-loading');
  const emptyEl = document.getElementById('projects-empty');
  const errorEl = document.getElementById('projects-error');
  const btnRefresh = document.getElementById('btn-refresh-projects');

  const setError = (msg) => {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  };
  const clearError = () => {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  };

  const render = (projects) => {
    loadingEl.style.display = 'none';
    listEl.querySelectorAll('.project-item').forEach((n) => n.remove());

    if (!projects || projects.length === 0) {
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    for (const p of projects) {
      const el = document.createElement('article');
      el.className = 'project-item';
      el.innerHTML = `
        <div>
          <div class="task-title">${escapeHtml(p.name)}</div>
          <div class="task-desc">${escapeHtml(p.description || '')}</div>
        </div>
        <div class="task-meta">
          <span>${escapeHtml(p.owner?.name || '')}</span>
          <a class="pill" href="/projects/board?projectId=${encodeURIComponent(p._id)}">Open board</a>
        </div>
      `;
      listEl.appendChild(el);
    }
  };

  const fetchAndRender = async () => {
    clearError();
    loadingEl.style.display = 'block';
    emptyEl.style.display = 'none';
    try {
      const data = await apiGet('/projects');
      render(data.data?.projects || []);
    } catch (e) {
      loadingEl.style.display = 'none';
      setError(
        e.status === 401
          ? 'Bạn chưa đăng nhập. Hãy đăng nhập trước (token lưu trong localStorage).'
          : e.message
      );
    }
  };

  btnRefresh?.addEventListener('click', fetchAndRender);
  await fetchAndRender();
}

function renderTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.draggable = true;
  card.dataset.taskId = task._id || '';
  card.dataset.status = task.status || 'To Do';

  const title = escapeHtml(task.title);
  const desc = escapeHtml(task.description || '');
  const priority = escapeHtml(task.priority || 'Medium');

  card.innerHTML = `
    <div class="task-title">${title}</div>
    ${desc ? `<div class="task-desc">${desc}</div>` : ''}
    <div class="task-meta">
      <span class="${priorityClass(task.priority)}">${priority}</span>
      <span>${escapeHtml(task.assignee?.name || '')}</span>
    </div>
  `;
  return card;
}

function clearBoardColumns() {
  document.querySelectorAll('[data-dropzone]').forEach((z) => {
    z.innerHTML = '';
  });
  document.querySelectorAll('[data-count]').forEach((c) => {
    c.textContent = '0';
  });
}

function countByStatus(tasks) {
  const counts = { 'To Do': 0, 'In Progress': 0, Done: 0 };
  for (const t of tasks) {
    const s = t.status || 'To Do';
    if (counts[s] === undefined) counts[s] = 0;
    counts[s] += 1;
  }
  return counts;
}

async function loadBoardPage() {
  const errorEl = document.getElementById('board-error');
  const titleEl = document.getElementById('board-title');
  const subtitleEl = document.getElementById('board-subtitle');
  const btnRefresh = document.getElementById('btn-refresh-board');

  const setError = (msg) => {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  };
  const clearError = () => {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  };

  const projectId = getProjectIdFromUrl();
  if (!projectId) {
    setError('Thiếu projectId. Hãy mở URL dạng /projects/board?projectId=<id>.');
    return;
  }

  const fetchAndRender = async () => {
    clearError();
    clearBoardColumns();
    try {
      const projectRes = await apiGet(`/projects/${encodeURIComponent(projectId)}`);
      const project = projectRes.data?.project;
      if (project) {
        titleEl.textContent = project.name || 'Kanban Board';
        subtitleEl.textContent = project.description || 'Theo dõi tasks theo trạng thái';
      }

      // Tasks API chưa có trong codebase hiện tại; xử lý mềm để không làm vỡ UI.
      // Khi bạn thêm tasks routes (ví dụ: GET /api/v1/tasks?projectId=...), UI sẽ tự đổ dữ liệu.
      let tasks = [];
      try {
        const tasksRes = await apiGet(`/tasks?projectId=${encodeURIComponent(projectId)}`);
        tasks = tasksRes.data?.tasks || [];
      } catch (e) {
        if (e.status !== 404) throw e;
      }

      const zones = {
        'To Do': document.querySelector('[data-dropzone="To Do"]'),
        'In Progress': document.querySelector('[data-dropzone="In Progress"]'),
        Done: document.querySelector('[data-dropzone="Done"]'),
      };

      for (const t of tasks) {
        const z = zones[t.status] || zones['To Do'];
        z?.appendChild(renderTaskCard(t));
      }

      const counts = countByStatus(tasks);
      for (const [status, count] of Object.entries(counts)) {
        const el = document.querySelector(`[data-count="${CSS.escape(status)}"]`);
        if (el) el.textContent = String(count);
      }

      if (window.TaskflowDragDrop?.init) {
        window.TaskflowDragDrop.init();
      }
    } catch (e) {
      setError(
        e.status === 401
          ? 'Bạn chưa đăng nhập. Hãy đăng nhập trước (token lưu trong localStorage).'
          : e.message
      );
    }
  };

  btnRefresh?.addEventListener('click', fetchAndRender);
  await fetchAndRender();
}

(function main() {
  const page = window.__TF__?.page;
  if (page === 'projects-index') {
    loadProjectsIndex();
  } else if (page === 'projects-board') {
    loadBoardPage();
  }
})();

