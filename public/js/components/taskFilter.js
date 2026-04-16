/**
 * TaskFilter Component
 * - Render bộ lọc: status, priority, search
 * - Gọi callback mỗi khi filter thay đổi
 */

export class TaskFilter {
  constructor() {
    this.container = document.getElementById('filter-container');
    this.onChange = null;
    this.filters = { status: '', priority: '', q: '' };
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="bg-surface-container-low rounded-xl border border-outline-variant/10 p-4 flex flex-col lg:flex-row gap-3 lg:items-end">
        <div class="flex-1">
          <label for="task-filter-q" class="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Tìm kiếm</label>
          <input
            id="task-filter-q"
            type="text"
            placeholder="Tiêu đề hoặc mô tả task..."
            class="mt-2 w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-0"
          />
        </div>

        <div class="w-full lg:w-56">
          <label for="task-filter-status" class="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Trạng thái</label>
          <select
            id="task-filter-status"
            class="mt-2 w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-0"
          >
            <option value="">Tất cả</option>
            <option value="To Do">Cần làm</option>
            <option value="In Progress">Đang làm</option>
            <option value="Done">Hoàn thành</option>
          </select>
        </div>

        <div class="w-full lg:w-56">
          <label for="task-filter-priority" class="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Ưu tiên</label>
          <select
            id="task-filter-priority"
            class="mt-2 w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-0"
          >
            <option value="">Tất cả</option>
            <option value="Low">Thấp</option>
            <option value="Medium">Trung bình</option>
            <option value="High">Cao</option>
          </select>
        </div>

        <button
          id="task-filter-clear"
          class="h-[38px] px-4 rounded-lg bg-surface-container-high text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors"
          type="button"
        >
          Xóa lọc
        </button>
      </div>
    `;

    this.bindEvents();
  }

  onFilterChanged(callback) {
    this.onChange = callback;
  }

  bindEvents() {
    const qInput = document.getElementById('task-filter-q');
    const statusSelect = document.getElementById('task-filter-status');
    const prioritySelect = document.getElementById('task-filter-priority');
    const clearBtn = document.getElementById('task-filter-clear');

    const emit = () => {
      this.filters = {
        q: qInput?.value?.trim() || '',
        status: statusSelect?.value || '',
        priority: prioritySelect?.value || '',
      };
      if (this.onChange) this.onChange(this.filters);
    };

    let debounceTimer;
    qInput?.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(emit, 250);
    });
    statusSelect?.addEventListener('change', emit);
    prioritySelect?.addEventListener('change', emit);

    clearBtn?.addEventListener('click', () => {
      if (qInput) qInput.value = '';
      if (statusSelect) statusSelect.value = '';
      if (prioritySelect) prioritySelect.value = '';
      emit();
    });
  }
}

export default TaskFilter;
