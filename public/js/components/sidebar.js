/**
 * Sidebar Component Logic
 * Xử lý việc thu nhỏ/mở rộng thanh sidebar
 */

export const initSidebar = () => {
    const sidebar = document.getElementById('main-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const toggleIcon = document.getElementById('toggle-icon');
    const body = document.body;

    if (!sidebar || !toggleBtn) return;

    // Khôi phục trạng thái từ localStorage
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (isCollapsed) {
        sidebar.classList.add('sidebar-collapsed');
        body.classList.add('sidebar-is-collapsed');
        if (toggleIcon) toggleIcon.textContent = 'keyboard_double_arrow_right';
    }

    toggleBtn.addEventListener('click', () => {
        const currentlyCollapsed = sidebar.classList.toggle('sidebar-collapsed');
        body.classList.toggle('sidebar-is-collapsed', currentlyCollapsed);

        // Cập nhật icon
        if (toggleIcon) {
            toggleIcon.textContent = currentlyCollapsed 
                ? 'keyboard_double_arrow_right' 
                : 'keyboard_double_arrow_left';
        }

        // Lưu trạng thái
        localStorage.setItem('sidebar-collapsed', currentlyCollapsed);

        // Dispatch event để các component khác (như Kanban) có thể resize nếu cần
        window.dispatchEvent(new Event('resize'));
    });
};
