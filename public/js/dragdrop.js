window.TaskflowDragDrop = window.TaskflowDragDrop || (function () {
  function qsa(sel) {
    return Array.from(document.querySelectorAll(sel));
  }

  function initDraggables() {
    qsa('.task-card[draggable="true"]').forEach((card) => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('is-dragging');
        const payload = {
          taskId: card.dataset.taskId || '',
          fromStatus: card.dataset.status || '',
        };
        e.dataTransfer?.setData('application/json', JSON.stringify(payload));
        e.dataTransfer?.setData('text/plain', payload.taskId);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
      });
    });
  }

  function initDropzones() {
    qsa('[data-dropzone]').forEach((zone) => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        zone.classList.add('is-over');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('is-over');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('is-over');

        const dragging = document.querySelector('.task-card.is-dragging');
        if (!dragging) return;

        // Chỉ setup UI kéo-thả. Chưa implement logic "move" gọi API update status.
        zone.appendChild(dragging);
        dragging.dataset.status = zone.dataset.dropzone || dragging.dataset.status;
      });
    });
  }

  function init() {
    initDraggables();
    initDropzones();
  }

  return { init };
})();

