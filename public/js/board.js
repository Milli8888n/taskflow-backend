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
  let id = params.get('projectId');
  if (!id) {
    const match = window.location.pathname.match(/\/projects\/([^\/]+)\/board/);
    if (match) id = match[1];
  }
  return id;
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
    listEl.querySelectorAll('.fetched-project').forEach((n) => n.remove());

    if (!projects || projects.length === 0) {
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    for (const p of projects) {
      const el = document.createElement('div');
      // Using Stitch design
      el.className = 'fetched-project bg-surface-container-low rounded-xl p-6 flex flex-col gap-5 hover:translate-y-[-4px] transition-all duration-300 cursor-pointer border border-outline-variant/10';
      el.onclick = () => {
        window.location.href = `/projects/${encodeURIComponent(p._id)}/board`;
      };
      
      const status = p.status || 'Đang hoạt động';
      
      el.innerHTML = `
        <div class="flex justify-between items-start">
            <span class="px-3 py-1 rounded-full bg-primary-container/20 text-primary text-[10px] font-bold tracking-wider uppercase">${escapeHtml(status)}</span>
            <button class="text-on-surface-variant hover:text-white transition-colors" onclick="event.stopPropagation();">
                <span class="material-symbols-outlined text-xl">more_vert</span>
            </button>
        </div>
        <div>
            <h3 class="font-headline font-bold text-lg text-on-surface leading-snug">${escapeHtml(p.name)}</h3>
            <p class="text-on-surface-variant text-xs mt-2 line-clamp-2">${escapeHtml(p.description || 'Không có mô tả')}</p>
        </div>
        <div class="flex -space-x-2">
            <div class="w-8 h-8 rounded-full bg-surface-container-highest border-2 border-surface-container-low flex items-center justify-center text-[10px] font-bold text-on-surface-variant" title="Owner: ${escapeHtml(p.owner?.name || '')}">
                ${p.owner?.name ? escapeHtml(p.owner.name.charAt(0).toUpperCase()) : 'U'}
            </div>
        </div>
        <div class="mt-auto pt-4">
            <div class="flex justify-between items-end mb-2">
                <span class="text-xs font-semibold text-on-surface-variant">Tiến độ</span>
                <span class="text-xs font-bold text-primary">0%</span>
            </div>
            <div class="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-primary to-primary-container w-[0%]"></div>
            </div>
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

window.createNewProject = async function() {
    const token = localStorage.getItem('token');
    if (!token) return alert('Vui lòng đăng nhập lại');
    
    // Quick prompt for UX, replace with a nice modal in the future if requested
    const name = prompt('Nhập tên dự án mới:');
    if (!name || name.trim() === '') return;
    const description = prompt('Mô tả dự án (tùy chọn):') || '';
    
    try {
        const res = await fetch('/api/v1/projects', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name.trim(), description: description.trim() })
        });
        const data = await res.json();
        if (data.status === 'success') {
            window.location.reload(); // reload
        } else {
            alert('Lỗi: ' + (data.message || 'Không thể tạo dự án'));
        }
    } catch (err) {
        alert('Lỗi kết nối máy chủ khi tạo dự án');
    }
};

function renderTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'group bg-surface-container-low p-5 rounded-xl border border-transparent hover:border-outline-variant/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20 mb-4 cursor-pointer';
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

  let priorityIcon = 'schedule';
  let priorityColor = 'text-on-surface-variant';
  let priorityTagBg = 'bg-secondary-container text-on-secondary-container';
  
  if (priority.toLowerCase() === 'high') {
    priorityIcon = 'priority_high';
    priorityColor = 'text-error';
    priorityTagBg = 'bg-error-container/30 text-error';
  } else if (priority.toLowerCase() === 'low') {
    priorityTagBg = 'bg-primary-container text-on-primary-container';
    priorityColor = 'text-primary';
  }

  let deadlineHtml = '';
  if (task.deadline) {
    const d = new Date(task.deadline);
    const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }) : '';
    deadlineHtml = `
      <div class="flex items-center gap-2 text-on-surface-variant mt-2">
        <span class="material-symbols-outlined text-sm">schedule</span>
        <span class="text-[10px] font-medium uppercase tracking-tight">${dateStr}</span>
      </div>
    `;
  }

  let assigneeAvatar = '';
  if (task.assignee?.avatar) {
    assigneeAvatar = `<img alt="Assignee" class="h-6 w-6 rounded-full border border-surface" src="${escapeHtml(task.assignee.avatar)}"/>`;
  } else if (task.assignee?.name) {
    assigneeAvatar = `<div class="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">${escapeHtml(task.assignee.name.charAt(0).toUpperCase())}</div>`;
  }

  card.innerHTML = `
    <div class="flex justify-between items-start mb-3">
      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${priorityTagBg}">${priority}</span>
      <span class="material-symbols-outlined text-on-surface-variant text-sm cursor-grab">drag_indicator</span>
    </div>
    <h3 class="text-on-surface font-semibold text-base mb-2 group-hover:text-primary transition-colors">${title}</h3>
    ${desc ? `<p class="text-on-surface-variant text-xs mb-4 line-clamp-2 leading-relaxed">${desc}</p>` : ''}
    <div class="flex items-end justify-between mt-auto">
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2 ${priorityColor}">
          <span class="material-symbols-outlined text-sm">${priorityIcon}</span>
          <span class="text-[10px] font-bold uppercase tracking-tight">${priority} Priority</span>
        </div>
        ${deadlineHtml}
      </div>
      ${assigneeAvatar}
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

  /* Thêm mới - Upload với fetch trực tiếp */
  document.getElementById('task-upload-btn').addEventListener('click', async (e) => {
    const fileInput = document.getElementById('task-upload-input');
    const file = fileInput.files[0];
    
    // Lấy ID của task hiện tại trên Modal
    const taskId = currentTask?._id;
    
    if (!file) return alert('Vui lòng chọn 1 file!');

    try {
        const formData = new FormData();
        formData.append('file', file);

        // Thay nút Tải lên thành Uploading...
        e.target.innerHTML = 'Đang Upload...';

        const projectId = getProjectIdFromUrl();
        const res = await fetch(`/api/v1/projects/${projectId}/tasks/${taskId}/upload`, {
            method: 'POST',
            body: formData
        });
        const result = await res.json();

        if(result.status === 'success') {
            alert('Upload thành công!');
            // Cập nhật attachments
            if(currentTask && result.data) {
              currentTask.attachments = result.data.attachments || [];
              fill(currentTask);
            }
        } else {
             alert(result.message);
        }
    } catch(err) {
        alert('Lỗi mạng hoặc server');
    } finally {
        e.target.innerHTML = 'Tải Lên';
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
        const tasksRes = await apiGet(`/projects/${encodeURIComponent(projectId)}/tasks`);
        tasks = tasksRes.data?.tasks || [];
      } catch (e) {
        if (e.status !== 404) throw e;
      }

      const taskById = new Map(tasks.map((t) => [t._id, t]));

      initTaskModal({
        getTaskById: async (taskId) => {
          const res = await apiGet(`/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`);
          return res.data?.task || res.data?.data?.task || null;
        },
        uploadTaskFile: async (taskId, file) => {
          const fd = new FormData();
          // Theo checklist: upload 1 file
          fd.append('file', file);

          const res = await apiPostForm(`/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/upload`, fd);

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
  
  initUploadFile(); // Kích hoạt sự kiện nút Upload file
}

function initUploadFile() {
  const uploadBtn = document.getElementById('task-upload-btn');
  const uploadInput = document.getElementById('task-upload-input');
  const errorEl = document.getElementById('task-upload-error');
  const attachmentsList = document.getElementById('task-attachments');
  const emptyText = document.getElementById('task-attachments-empty');

  if (!uploadBtn || !uploadInput) return;

  uploadBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const file = uploadInput.files[0];
    
    const modal = document.getElementById('task-modal');
    const taskId = modal ? modal.dataset.taskId : null;

    if (!taskId) {
      if (errorEl) {
        errorEl.textContent = 'Lỗi: Không xác định được ID công việc.';
        errorEl.style.display = 'block';
      }
      return;
    }

    if (!file) {
      if (errorEl) {
        errorEl.textContent = 'Vui lòng chọn 1 file trước khi tải lên!';
        errorEl.style.display = 'block';
      }
      return;
    }

    if (errorEl) errorEl.style.display = 'none';
    uploadBtn.textContent = 'Đang tải...';
    uploadBtn.disabled = true;

    try {
      const token = getAccessToken();
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/tasks/${taskId}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
         alert('Tải file thành công!');
         if (emptyText) emptyText.style.display = 'none';

         const fileUrl = data.data?.filePath || '';
         const fileName = file.name;
         
         if (attachmentsList) {
           attachmentsList.innerHTML += `
             <div class="attachment-item" style="margin-top: 5px;">
               <a href="${escapeHtml(fileUrl)}" target="_blank" style="text-decoration: underline; color: #2563EB;">📄 ${escapeHtml(fileName)}</a>
             </div>
           `;
         }
         uploadInput.value = '';
      } else {
         if (errorEl) {
           errorEl.textContent = data.message || 'Lỗi server khi upload file';
           errorEl.style.display = 'block';
         }
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = 'Lỗi kết nối mạng';
        errorEl.style.display = 'block';
      }
    } finally {
      uploadBtn.textContent = 'Tải Lên';
      uploadBtn.disabled = false;
    }
  });
}

(function main() {
  const page = window.__TF__?.page;
  if (page === 'projects-index') {
    loadProjectsIndex();
  } else if (page === 'projects-board') {
    loadBoardPage();
  }
})();

document.addEventListener('DOMContentLoaded', () => {
    const btnInvite = document.getElementById('btn-invite-member');
    const inviteModalOverlay = document.getElementById('invite-modal-overlay');
    const inviteModalClose = document.getElementById('invite-modal-close');
    const inviteCancelBtn = document.getElementById('invite-cancel-btn');
    const inviteSendBtn = document.getElementById('invite-send-btn');
    
    if (btnInvite && inviteModalOverlay) {
        const toggleInviteModal = (show) => {
            inviteModalOverlay.style.display = show ? 'flex' : 'none';
        };

        btnInvite.addEventListener('click', () => toggleInviteModal(true));
        
        if (inviteModalClose) inviteModalClose.addEventListener('click', () => toggleInviteModal(false));
        if (inviteCancelBtn) inviteCancelBtn.addEventListener('click', () => toggleInviteModal(false));
        if (inviteSendBtn) inviteSendBtn.addEventListener('click', () => {
             alert('Đã gửi lời mời thành công!');
             toggleInviteModal(false);
        });
    }
});
