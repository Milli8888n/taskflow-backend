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

async function apiPostForm(path, formData) {
  const token = getAccessToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
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

function isImagePath(path) {
  const p = String(path || '').toLowerCase();
  return p.endsWith('.png') || p.endsWith('.jpg') || p.endsWith('.jpeg') || p.endsWith('.gif') || p.endsWith('.webp');
}

function fileNameFromPath(path) {
  try {
    const p = String(path || '');
    const cleaned = p.split('?')[0].split('#')[0];
    const parts = cleaned.split('/');
    return parts[parts.length - 1] || cleaned;
  } catch {
    return String(path || '');
  }
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

  // Click để mở task detail modal
  card.addEventListener('click', () => {
    if (window.TaskflowTaskModal?.open) {
      window.TaskflowTaskModal.open(task);
    }
  });

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

function initTaskModal({ getTaskById, uploadTaskFile }) {
  const overlay = document.getElementById('task-modal-overlay');
  const modal = document.getElementById('task-modal');
  const btnClose = document.getElementById('task-modal-close');
  const titleEl = document.getElementById('task-modal-title');
  const subtitleEl = document.getElementById('task-modal-subtitle');
  const descEl = document.getElementById('task-modal-desc');
  const attachmentsEl = document.getElementById('task-attachments');
  const attachmentsEmptyEl = document.getElementById('task-attachments-empty');
  const uploadInput = document.getElementById('task-upload-input');
  const uploadBtn = document.getElementById('task-upload-btn');
  const uploadErrorEl = document.getElementById('task-upload-error');

  let currentTask = null;

  const setUploadError = (msg) => {
    uploadErrorEl.textContent = msg;
    uploadErrorEl.style.display = 'block';
  };
  const clearUploadError = () => {
    uploadErrorEl.textContent = '';
    uploadErrorEl.style.display = 'none';
  };

  const show = () => {
    overlay.style.display = 'block';
    modal.style.display = 'block';
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const hide = () => {
    overlay.style.display = 'none';
    modal.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentTask = null;
    clearUploadError();
    if (uploadInput) uploadInput.value = '';
  };

  const renderAttachments = (attachments) => {
    attachmentsEl.innerHTML = '';
    const list = Array.isArray(attachments) ? attachments : [];

    if (list.length === 0) {
      attachmentsEmptyEl.style.display = 'block';
      return;
    }
    attachmentsEmptyEl.style.display = 'none';

    for (const a of list) {
      const path = String(a || '');
      const name = fileNameFromPath(path);
      const isImg = isImagePath(path);

      const wrap = document.createElement('div');
      wrap.className = 'attachment';
      wrap.innerHTML = `
        <div class="attachment__preview">
          ${isImg ? `<img src="${escapeHtml(path)}" alt="${escapeHtml(name)}">` : `<span class="pill">FILE</span>`}
        </div>
        <div class="attachment__meta">
          <div class="attachment__name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
          <a class="attachment__link" href="${escapeHtml(path)}" target="_blank" rel="noreferrer">Mở</a>
        </div>
      `;
      attachmentsEl.appendChild(wrap);
    }
  };

  const fill = (task) => {
    titleEl.textContent = task?.title || 'Task';
    subtitleEl.textContent = task?.status ? `Trạng thái: ${task.status}` : '';
    descEl.textContent = task?.description ? task.description : '—';
    renderAttachments(task?.attachments);
  };

  const open = async (task) => {
    currentTask = task;
    clearUploadError();
    fill(task);
    show();

    // Nếu backend có endpoint task detail thì load mới để lấy attachments chuẩn
    if (task?._id && getTaskById) {
      try {
        const fresh = await getTaskById(task._id);
        if (fresh) {
          currentTask = fresh;
          fill(fresh);
        }
      } catch {
        // bỏ qua nếu API chưa có
      }
    }
  };

  overlay?.addEventListener('click', hide);
  btnClose?.addEventListener('click', hide);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  });

  uploadBtn?.addEventListener('click', async () => {
    clearUploadError();
    if (!currentTask?._id) return setUploadError('Không xác định được taskId.');
    const file = uploadInput?.files?.[0];
    if (!file) return setUploadError('Vui lòng chọn file trước.');

    uploadBtn.disabled = true;
    const oldText = uploadBtn.textContent;
    uploadBtn.textContent = 'Đang tải...';
    try {
      const updated = await uploadTaskFile(currentTask._id, file);
      if (updated) {
        currentTask = updated;
        fill(updated);
      } else {
        // fallback: nếu API trả về chỉ 1 path
        const existing = Array.isArray(currentTask.attachments) ? currentTask.attachments : [];
        currentTask.attachments = existing;
        fill(currentTask);
      }
      if (uploadInput) uploadInput.value = '';
    } catch (e) {
      setUploadError(e.status === 401 ? 'Bạn chưa đăng nhập (thiếu token).' : e.message);
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = oldText;
    }
  });

  window.TaskflowTaskModal = { open, hide };
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

      const taskById = new Map(tasks.map((t) => [t._id, t]));

      initTaskModal({
        getTaskById: async (taskId) => {
          const res = await apiGet(`/tasks/${encodeURIComponent(taskId)}`);
          return res.data?.task || res.data?.data?.task || null;
        },
        uploadTaskFile: async (taskId, file) => {
          const fd = new FormData();
          // Theo checklist: upload 1 file
          fd.append('file', file);

          const res = await apiPostForm(`/tasks/${encodeURIComponent(taskId)}/upload`, fd);

          // chấp nhận nhiều kiểu response khác nhau
          const task =
            res.data?.task ||
            res.data?.data?.task ||
            res.task ||
            null;

          if (task) return task;

          const filePath =
            res.data?.filePath ||
            res.data?.path ||
            res.filePath ||
            res.path ||
            null;

          const current = taskById.get(taskId) || { _id: taskId, attachments: [] };
          const attachments = Array.isArray(current.attachments) ? current.attachments : [];
          if (filePath) attachments.push(filePath);
          current.attachments = attachments;
          taskById.set(taskId, current);
          return current;
        },
      });

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

