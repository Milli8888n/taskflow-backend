import { apiGet } from '../api/apiClient.js';
import { getMyInvitations, respondToInvitation } from '../services/invitation.js';

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value ?? 0);
}

function showError(message) {
  const errorEl = document.getElementById('dashboard-error');
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

async function loadDashboard() {
  try {
    // Ưu tiên endpoint theo sprint3
    let data;
    try {
      data = await apiGet('/dashboard/stats');
    } catch {
      // fallback nếu backend cũ
      data = await apiGet('/dashboard');
    }

    const stats = data?.data?.stats || data?.stats || {};

    setText('stat-projects', stats.totalProjects ?? stats.total ?? 0);
    setText('stat-todo', stats.todoCount ?? stats.todo ?? 0);
    setText('stat-inprogress', stats.inProgressCount ?? stats.inProgress ?? 0);
    setText('stat-done', stats.doneCount ?? stats.done ?? 0);
    setText('stat-overdue', stats.overdueTasks ?? stats.overdue ?? 0);

    const completionRate = Number(stats.completionRate ?? 0);
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    if (progressBar) progressBar.style.width = `${completionRate}%`;
    if (progressText) progressText.textContent = `${completionRate}%`;
  } catch (error) {
    showError(`Lỗi tải dashboard: ${error.message}`);
  }
}

async function loadInvitations() {
  try {
    const res = await getMyInvitations();
    const invitations = res?.data?.invitations || [];
    const section = document.getElementById('invitations-section');
    const container = document.getElementById('invitations-list');
    const countEl = document.getElementById('invitations-count');

    if (!section || !container || !countEl) return;

    if (invitations.length > 0) {
      section.classList.remove('hidden');
      countEl.textContent = invitations.length;
      container.innerHTML = invitations.map(inv => `
        <div class="p-4 rounded-2xl bg-surface-container flex items-center justify-between gap-4 group hover:bg-surface-container-high transition-colors">
          <div class="flex items-center gap-4">
            <img src="${inv.inviter?.avatar || '/img/default-avatar.png'}" alt="Avatar" class="w-10 h-10 rounded-full object-cover shadow-sm">
            <div>
              <p class="text-sm font-bold text-on-surface">
                <span class="text-primary">${inv.inviter?.name || 'Ai đó'}</span> đã mời bạn tham gia dự án
              </p>
              <p class="text-xs font-black text-on-surface-variant uppercase tracking-widest italic">${inv.project?.name || 'Dự án không tên'}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-black uppercase tracking-widest hover:shadow-[0_4px_15px_rgba(var(--primary-rgb),0.3)] transition-all btn-accept" data-id="${inv._id}">
              Đồng ý
            </button>
            <button class="px-5 py-2 rounded-xl bg-error/10 text-error text-xs font-black uppercase tracking-widest hover:bg-error hover:text-white transition-all btn-decline" data-id="${inv._id}">
              Từ chối
            </button>
          </div>
        </div>
      `).join('');

      // Add event listeners
      container.querySelectorAll('.btn-accept').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const invId = e.currentTarget.dataset.id;
          await handleInvitationResponse(invId, 'accept');
        });
      });

      container.querySelectorAll('.btn-decline').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const invId = e.currentTarget.dataset.id;
          await handleInvitationResponse(invId, 'decline');
        });
      });
    } else {
      section.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error loading invitations:', error);
  }
}

async function handleInvitationResponse(invitationId, response) {
  try {
    await respondToInvitation(invitationId, response);
    if (window.__TF__ && window.__TF__.Toast) {
      if (response === 'accept') {
        window.__TF__.Toast.success('Đã chấp nhận lời mời tham gia dự án!');
      } else {
        window.__TF__.Toast.info('Đã từ chối lời mời.');
      }
    } else {
      alert('Đã xử lý lời mời thành công!');
    }
    await loadInvitations(); // Refresh list
    await loadDashboard(); // Tải lại số liệu dashboard có thể tăng lên
  } catch (error) {
    if (window.__TF__ && window.__TF__.Toast) {
      window.__TF__.Toast.error('Lỗi khi xử lý lời mời: ' + error.message);
    } else {
      alert('Lỗi: ' + error.message);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  loadInvitations();

  // Listen for new notifications to refresh invitations list
  window.addEventListener('new-notification-app', (e) => {
    // Reload even if it's not an invitation, to keep things simple
    loadInvitations();
  });
});
