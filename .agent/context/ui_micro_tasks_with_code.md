# 📋 Hướng Dẫn Tích Hợp Giao Diện Stitch — Toàn Bộ Luồng UI (Copy & Paste)

> **Mục đích:** File này chứa **toàn bộ code HTML/EJS/Tailwind** cho mọi trang trong dự án TaskFlow.
> Bạn chỉ cần **copy đoạn code** rồi **paste vào file tương ứng**.
>
> **Thiết kế gốc tham chiếu:** `designs/stitch/*.html` + `designs/stitch/*.png`

---

## 📑 Mục Lục

| # | Trang | File EJS | Design gốc |
|---|-------|----------|-------------|
| 1.1 | Header (Đầu trang chung) | `partials/_header.ejs` | Mọi trang |
| 1.2 | Sidebar (Thanh trái) | `partials/_sidebar.ejs` | Mọi trang |
| 1.3 | Topbar (Thanh trên) | `partials/_topbar.ejs` | Mọi trang |
| 1.4 | Footer (Chân trang) | `partials/_footer.ejs` | Mọi trang |
| 2.1 | Đăng nhập | `auth/login.ejs` | `login.html` |
| 2.2 | Đăng ký | `auth/register.ejs` | `login.html` (tương tự) |
| 3.1 | Dashboard (Thống kê) | `dashboard/index.ejs` | `dashboard.html` |
| 3.2 | Danh sách Dự án | `projects/index.ejs` | `project_list.html` / `home.html` |
| 3.3 | Bảng Kanban | `projects/board.ejs` | `board.html` |
| 3.4 | Chi tiết Task (Modal) | Tích hợp trong `board.ejs` | `task_detail.html` |
| 3.5 | Mời thành viên (Modal) | Tích hợp trong `board.ejs` | `invite.html` |
| 4.1 | Hồ sơ cá nhân | `profile/index.ejs` | `profile.html` |
| 4.2 | Cài đặt Dự án (gộp Activity + Roles) | `settings/index.ejs` | `settings_activity.html` + `settings_roles.html` |
| 4.3 | Thông báo | `notifications/index.ejs` | `notifications.html` |
| 5.1 | ViewRoutes (BẮT BUỘC) | `routes/viewRoutes.js` | — |
| 6.1 | Trang lỗi 404 | `errors/404.ejs` | — |

---

## 🏗️ PHẦN 1: NỀN TẢNG (Foundation — CARD UI-01)

> Làm phần này **TRƯỚC TIÊN**. Mọi trang khác đều dùng lại 3 file này.

### 1.1 — Đầu trang chung `_header.ejs`

**Mở file:** `src/views/partials/_header.ejs`
**Xoá hết nội dung cũ**, paste đoạn sau:

```html
<!DOCTYPE html>
<html class="dark" lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= typeof title != 'undefined' ? title : 'TaskFlow' %></title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Material Symbols Icons -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

    <!-- Tailwind CSS CDN + Plugins -->
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

    <!-- Stitch Design Tokens (BẮT BUỘC) -->
    <script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#c3c0ff",
                        "primary-container": "#544bea",
                        "on-primary": "#1d00a5",
                        "on-primary-container": "#e2dfff",
                        "secondary": "#b7c8e1",
                        "secondary-container": "#3a4a5f",
                        "on-secondary": "#213145",
                        "on-secondary-container": "#a9bad3",
                        "tertiary": "#4edea3",
                        "tertiary-container": "#00734e",
                        "on-tertiary": "#003824",
                        "on-tertiary-container": "#6efbbd",
                        "error": "#ffb4ab",
                        "error-container": "#93000a",
                        "on-error": "#690005",
                        "on-error-container": "#ffdad6",
                        "surface": "#12131b",
                        "surface-dim": "#12131b",
                        "surface-bright": "#383842",
                        "surface-container-lowest": "#0d0e16",
                        "surface-container-low": "#1a1b24",
                        "surface-container": "#1e1f28",
                        "surface-container-high": "#292932",
                        "surface-container-highest": "#34343e",
                        "on-surface": "#e3e1ee",
                        "on-surface-variant": "#c5c5d8",
                        "on-background": "#e3e1ee",
                        "background": "#12131b",
                        "outline": "#8f8fa1",
                        "outline-variant": "#444655",
                        "inverse-surface": "#e3e1ee",
                        "inverse-on-surface": "#2f3039",
                        "inverse-primary": "#4d44e3",
                        "surface-tint": "#c3c0ff",
                        "surface-variant": "#34343e",
                    },
                    borderRadius: {
                        DEFAULT: "0.125rem",
                        lg: "0.25rem",
                        xl: "0.5rem",
                        full: "0.75rem",
                    },
                    fontFamily: {
                        headline: ["Manrope", "sans-serif"],
                        body: ["Inter", "sans-serif"],
                        label: ["Inter", "sans-serif"],
                    },
                },
            },
        }
    </script>

    <!-- Stitch Base Styles -->
    <style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            display: inline-block;
            vertical-align: middle;
        }
        body {
            font-family: 'Inter', sans-serif;
            background-color: #12131b;
            color: #e3e1ee;
        }
        h1, h2, h3 { font-family: 'Manrope', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #12131b; }
        ::-webkit-scrollbar-thumb { background: #34343e; border-radius: 10px; }
    </style>

    <!-- Custom CSS (nếu có) -->
    <link rel="stylesheet" href="/css/style.css">
</head>
<body class="bg-background text-on-background font-body antialiased selection:bg-primary/30">
```

---

### 1.2 — Thanh điều hướng trái `_sidebar.ejs`

**Tạo mới file:** `src/views/partials/_sidebar.ejs`
Paste toàn bộ đoạn sau:

```html
<!-- ===== SideNavBar (Stitch) ===== -->
<aside class="hidden md:flex flex-col h-screen w-64 bg-surface-container-low fixed left-0 top-0 py-6 px-4 z-50 transition-all duration-200">

    <!-- Logo + Workspace -->
    <div class="flex items-center gap-3 mb-10 px-2">
        <div class="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
            <span class="material-symbols-outlined text-on-primary-container">layers</span>
        </div>
        <div>
            <h2 class="text-sm font-semibold text-on-surface leading-tight">TaskFlow</h2>
            <p class="text-xs text-on-surface-variant opacity-80">Workspace</p>
        </div>
    </div>

    <!-- Menu chính -->
    <nav class="flex-1 space-y-1">
        <a href="/dashboard" class="flex items-center gap-3 px-4 py-3 rounded-lg
            <%= typeof activePage !== 'undefined' && activePage === 'dashboard'
                ? 'bg-[#3E52E8]/10 text-primary font-semibold border-r-4 border-[#3E52E8]'
                : 'text-on-surface-variant opacity-80 hover:bg-surface-container-high hover:text-on-surface'
            %> transition-all duration-200">
            <span class="material-symbols-outlined">grid_view</span>
            <span class="text-sm tracking-wide">Dashboard</span>
        </a>

        <a href="/projects" class="flex items-center gap-3 px-4 py-3 rounded-lg
            <%= typeof activePage !== 'undefined' && activePage === 'projects'
                ? 'bg-[#3E52E8]/10 text-primary font-semibold border-r-4 border-[#3E52E8]'
                : 'text-on-surface-variant opacity-80 hover:bg-surface-container-high hover:text-on-surface'
            %> transition-all duration-200">
            <span class="material-symbols-outlined">assignment</span>
            <span class="text-sm tracking-wide">Projects</span>
        </a>

        <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg
            <%= typeof activePage !== 'undefined' && activePage === 'team'
                ? 'bg-[#3E52E8]/10 text-primary font-semibold border-r-4 border-[#3E52E8]'
                : 'text-on-surface-variant opacity-80 hover:bg-surface-container-high hover:text-on-surface'
            %> transition-all duration-200">
            <span class="material-symbols-outlined">group</span>
            <span class="text-sm tracking-wide">Team</span>
        </a>

        <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg
            <%= typeof activePage !== 'undefined' && activePage === 'settings'
                ? 'bg-[#3E52E8]/10 text-primary font-semibold border-r-4 border-[#3E52E8]'
                : 'text-on-surface-variant opacity-80 hover:bg-surface-container-high hover:text-on-surface'
            %> transition-all duration-200">
            <span class="material-symbols-outlined">settings</span>
            <span class="text-sm tracking-wide">Settings</span>
        </a>
    </nav>

    <!-- Footer Sidebar -->
    <div class="mt-auto space-y-1 pt-6 border-t border-outline-variant/10">
        <button class="w-full mb-6 bg-primary-container text-on-primary-container py-2.5 rounded-xl font-semibold text-sm hover:brightness-110 transition-all">
            New Project
        </button>
        <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant opacity-80 hover:bg-surface-container-high hover:text-on-surface transition-all">
            <span class="material-symbols-outlined">contact_support</span>
            <span class="text-sm tracking-wide">Support</span>
        </a>
        <a href="/auth/logout" class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant opacity-80 hover:bg-surface-container-high hover:text-on-surface transition-all">
            <span class="material-symbols-outlined">logout</span>
            <span class="text-sm tracking-wide">Sign Out</span>
        </a>
    </div>
</aside>
```

---

### 1.3 — Thanh điều hướng trên `_topbar.ejs`

**Tạo mới file:** `src/views/partials/_topbar.ejs`
Paste toàn bộ:

```html
<!-- ===== TopNavBar (Stitch) ===== -->
<header class="fixed top-0 left-64 right-0 h-16 bg-background flex justify-between items-center px-6 z-40 border-b-0">
    <!-- Left: Search -->
    <div class="flex items-center gap-8">
        <span class="text-xl font-bold tracking-tighter text-on-surface font-headline">TaskFlow</span>
        <div class="hidden lg:flex items-center bg-surface-container-low px-4 py-1.5 rounded-lg border border-outline-variant/10">
            <span class="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
            <input type="text" placeholder="Quick search..." class="bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-on-surface-variant/50 w-48">
        </div>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
            <!-- Notification Dropdown -->
            <div class="relative group">
                <button class="p-2 text-primary bg-surface-container-high rounded-full relative transition-transform active:scale-90">
                    <span class="material-symbols-outlined">notifications</span>
                    <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-container rounded-full ring-2 ring-background"></span>
                </button>
                <!-- Notification Popover -->
                <div class="absolute right-0 mt-3 w-[400px] bg-surface-container-high rounded-xl shadow-2xl border border-outline-variant/20 z-[60] overflow-hidden backdrop-blur-md bg-opacity-95 hidden group-focus-within:block group-hover:block transition-all">
                    <div class="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10">
                        <h3 class="font-headline font-bold text-on-surface">Notifications</h3>
                        <button class="text-xs font-bold text-primary hover:text-primary-container transition-colors uppercase tracking-wider">Mark all as read</button>
                    </div>
                    <div class="max-h-[480px] overflow-y-auto">
                        <!-- Notification Item 1 -->
                        <div class="px-5 py-4 flex gap-4 hover:bg-surface-container-highest transition-colors cursor-pointer">
                            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                                <span class="material-symbols-outlined text-[20px]">chat_bubble</span>
                            </div>
                            <div class="flex-1">
                                <p class="text-sm text-on-surface leading-snug">
                                    <span class="font-bold">Sarah Chen</span> added a comment on <span class="font-bold text-primary italic">"API Integration"</span>
                                </p>
                                <span class="text-[11px] text-on-surface-variant font-medium mt-1 inline-block">2 mins ago</span>
                            </div>
                            <div class="w-2 h-2 rounded-full bg-primary mt-2"></div>
                        </div>
                        <!-- Notification Item 2 -->
                        <div class="px-5 py-4 flex gap-4 hover:bg-surface-container-highest transition-colors cursor-pointer">
                            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                                <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                            </div>
                            <div class="flex-1">
                                <p class="text-sm text-on-surface leading-snug">
                                    <span class="font-bold">Marcus Thorne</span> moved <span class="font-bold text-primary italic">"Redesign Sprint"</span> to <span class="text-tertiary font-bold uppercase text-[10px] tracking-wide">Done</span>
                                </p>
                                <span class="text-[11px] text-on-surface-variant font-medium mt-1 inline-block">45 mins ago</span>
                            </div>
                            <div class="w-2 h-2 rounded-full bg-primary mt-2"></div>
                        </div>
                        <!-- Notification Item 3 (Read) -->
                        <div class="px-5 py-4 flex gap-4 opacity-60 hover:opacity-100 hover:bg-surface-container-highest transition-all cursor-pointer">
                            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-outline-variant/20 flex items-center justify-center text-on-surface-variant">
                                <span class="material-symbols-outlined text-[20px]">update</span>
                            </div>
                            <div class="flex-1">
                                <p class="text-sm text-on-surface-variant leading-snug">
                                    System update completed for <span class="italic text-on-surface">V2.4 Architecture</span>
                                </p>
                                <span class="text-[11px] text-on-surface-variant font-medium mt-1 inline-block">Yesterday</span>
                            </div>
                        </div>
                    </div>
                    <a class="block w-full py-4 text-center text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-all border-t border-outline-variant/10" href="/notifications">
                        View all notifications
                    </a>
                </div>
            </div>
            
            <button class="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
                <span class="material-symbols-outlined">help</span>
            </button>
        </div>
        <button class="bg-[#3E52E8] text-white px-4 py-1.5 rounded-lg font-headline font-bold text-sm hover:brightness-110 transition-all">
            Create
        </button>
        <div class="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-highest flex items-center justify-center">
            <% if (typeof user !== 'undefined' && user) { %>
                <span class="text-xs font-bold text-primary"><%= user.name ? user.name.charAt(0).toUpperCase() : 'U' %></span>
            <% } else { %>
                <span class="material-symbols-outlined text-on-surface-variant text-sm">person</span>
            <% } %>
        </div>
    </div>
</header>
```

---

### 1.4 — Chân trang `_footer.ejs`

**Mở file:** `src/views/partials/_footer.ejs`
**Thay thế** nội dung cũ bằng:

```html
</body>
</html>
```

---

## 🔐 PHẦN 2: XÁC THỰC (Auth — CARD UI-02)

### 2.1 — Màn hình Đăng nhập `login.ejs`

**Mở file:** `src/views/auth/login.ejs`
**Xoá hết**, paste toàn bộ:

```html
<%- include('../partials/_header', { title: 'Đăng nhập | TaskFlow' }) %>

<!-- Background Blobs -->
<div class="fixed inset-0 overflow-hidden pointer-events-none">
    <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
    <div class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary-container/10 rounded-full blur-[120px]"></div>
</div>

<main class="min-h-screen flex items-center justify-center p-6 relative z-10">
    <div class="w-full max-w-[1100px] grid lg:grid-cols-2 bg-surface-container-lowest rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-outline-variant/10">

        <!-- Cột trái: Hero -->
        <div class="relative hidden lg:flex flex-col justify-between p-12 bg-surface-container-low overflow-hidden">
            <div class="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,_#c3c0ff_0%,_transparent_70%)]"></div>
            <div class="relative z-20">
                <div class="flex items-center gap-3 mb-16">
                    <div class="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center shadow-lg shadow-primary-container/20">
                        <span class="material-symbols-outlined text-on-primary text-2xl">token</span>
                    </div>
                    <span class="text-2xl font-extrabold tracking-tight text-on-surface">TaskFlow</span>
                </div>
                <h1 class="text-5xl font-extrabold text-on-surface leading-[1.15] tracking-tight mb-6 font-headline">
                    Organize.<br><span class="text-primary">Collaborate.</span><br>Deliver.
                </h1>
                <p class="text-on-surface-variant/80 text-lg leading-relaxed max-w-sm">
                    Nền tảng quản lý dự án thế hệ mới. Đơn giản, mạnh mẽ, không giới hạn.
                </p>
            </div>
            <p class="relative z-20 text-xs text-on-surface-variant/40 mt-auto pt-10">© 2026 TaskFlow. All rights reserved.</p>
        </div>

        <!-- Cột phải: Form -->
        <div class="flex items-center justify-center p-10 md:p-16">
            <div class="w-full max-w-sm">
                <h2 class="text-3xl font-extrabold tracking-tight text-on-surface font-headline mb-2">Welcome back</h2>
                <p class="text-on-surface-variant mb-10">Nhập thông tin để truy cập workspace của bạn.</p>

                <form id="login-form" class="space-y-6">
                    <!-- Email -->
                    <div class="space-y-2">
                        <label for="email" class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Email</label>
                        <div class="relative group">
                            <input type="email" id="email" name="email" required
                                placeholder="you@company.com"
                                class="w-full bg-surface-container-low border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 px-0 py-3 text-on-surface placeholder:text-outline/50 transition-all">
                            <span class="absolute right-0 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/30 group-focus-within:text-primary">mail</span>
                        </div>
                    </div>

                    <!-- Password -->
                    <div class="space-y-2">
                        <label for="password" class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Mật khẩu</label>
                        <div class="relative group">
                            <input type="password" id="password" name="password" required
                                placeholder="••••••••"
                                class="w-full bg-surface-container-low border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 px-0 py-3 text-on-surface placeholder:text-outline/50 transition-all">
                            <span class="absolute right-0 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/30 group-focus-within:text-primary">lock</span>
                        </div>
                    </div>

                    <!-- Error -->
                    <div id="error-message" class="text-error text-sm hidden"></div>

                    <!-- Submit -->
                    <button type="submit" id="login-btn"
                        class="w-full py-3.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold tracking-tight text-center hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
                        Đăng nhập
                    </button>
                </form>

                <p class="text-center mt-8 text-sm text-on-surface-variant">
                    Chưa có tài khoản? <a href="/register" class="font-bold text-primary hover:underline">Đăng ký ngay</a>
                </p>
            </div>
        </div>
    </div>
</main>

<script src="/js/auth.js"></script>
<%- include('../partials/_footer') %>
```

---

### 2.2 — Màn hình Đăng ký `register.ejs`

**Mở file:** `src/views/auth/register.ejs`
**Xoá hết**, paste toàn bộ:

```html
<%- include('../partials/_header', { title: 'Đăng ký | TaskFlow' }) %>

<!-- Background Blobs -->
<div class="fixed inset-0 overflow-hidden pointer-events-none">
    <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
    <div class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary-container/10 rounded-full blur-[120px]"></div>
</div>

<main class="min-h-screen flex items-center justify-center p-6 relative z-10">
    <div class="w-full max-w-[1100px] grid lg:grid-cols-2 bg-surface-container-lowest rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-outline-variant/10">

        <!-- Cột trái: Hero -->
        <div class="relative hidden lg:flex flex-col justify-between p-12 bg-surface-container-low overflow-hidden">
            <div class="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,_#c3c0ff_0%,_transparent_70%)]"></div>
            <div class="relative z-20">
                <div class="flex items-center gap-3 mb-16">
                    <div class="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center shadow-lg shadow-primary-container/20">
                        <span class="material-symbols-outlined text-on-primary text-2xl">token</span>
                    </div>
                    <span class="text-2xl font-extrabold tracking-tight text-on-surface">TaskFlow</span>
                </div>
                <h1 class="text-5xl font-extrabold text-on-surface leading-[1.15] tracking-tight mb-6 font-headline">
                    Start<br><span class="text-primary">building</span><br>today.
                </h1>
                <p class="text-on-surface-variant/80 text-lg leading-relaxed max-w-sm">
                    Tạo tài khoản miễn phí và bắt đầu quản lý dự án ngay hôm nay.
                </p>
            </div>
            <p class="relative z-20 text-xs text-on-surface-variant/40 mt-auto pt-10">© 2026 TaskFlow. All rights reserved.</p>
        </div>

        <!-- Cột phải: Form -->
        <div class="flex items-center justify-center p-10 md:p-16">
            <div class="w-full max-w-sm">
                <h2 class="text-3xl font-extrabold tracking-tight text-on-surface font-headline mb-2">Create account</h2>
                <p class="text-on-surface-variant mb-10">Điền thông tin để tạo workspace mới.</p>

                <form id="register-form" class="space-y-6">
                    <!-- Name -->
                    <div class="space-y-2">
                        <label for="name" class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Họ và tên</label>
                        <div class="relative group">
                            <input type="text" id="name" name="name" required
                                placeholder="Nguyễn Văn A"
                                class="w-full bg-surface-container-low border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 px-0 py-3 text-on-surface placeholder:text-outline/50 transition-all">
                            <span class="absolute right-0 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/30 group-focus-within:text-primary">person</span>
                        </div>
                    </div>

                    <!-- Email -->
                    <div class="space-y-2">
                        <label for="email" class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Email</label>
                        <div class="relative group">
                            <input type="email" id="email" name="email" required
                                placeholder="you@company.com"
                                class="w-full bg-surface-container-low border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 px-0 py-3 text-on-surface placeholder:text-outline/50 transition-all">
                            <span class="absolute right-0 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/30 group-focus-within:text-primary">mail</span>
                        </div>
                    </div>

                    <!-- Password -->
                    <div class="space-y-2">
                        <label for="password" class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Mật khẩu</label>
                        <div class="relative group">
                            <input type="password" id="password" name="password" required minlength="6"
                                placeholder="Ít nhất 6 ký tự"
                                class="w-full bg-surface-container-low border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 px-0 py-3 text-on-surface placeholder:text-outline/50 transition-all">
                            <span class="absolute right-0 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/30 group-focus-within:text-primary">lock</span>
                        </div>
                    </div>

                    <!-- Error -->
                    <div id="error-message" class="text-error text-sm hidden"></div>

                    <!-- Submit -->
                    <button type="submit"
                        class="w-full py-3.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold tracking-tight text-center hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
                        Tạo tài khoản
                    </button>
                </form>

                <p class="text-center mt-8 text-sm text-on-surface-variant">
                    Đã có tài khoản? <a href="/login" class="font-bold text-primary hover:underline">Đăng nhập</a>
                </p>
            </div>
        </div>
    </div>
</main>

<script src="/js/auth.js"></script>
<%- include('../partials/_footer') %>
```

---

## 📊 PHẦN 3: TRANG CHÍNH (Core — CARD UI-03)

### 3.1 — Dashboard (Thống kê) `dashboard/index.ejs`

**Tạo thư mục:** `src/views/dashboard/` (nếu chưa có)
**Tạo file:** `src/views/dashboard/index.ejs`
Paste toàn bộ:

```html
<%- include('../partials/_header', { title: 'Dashboard | TaskFlow' }) %>
<%- include('../partials/_sidebar', { activePage: 'dashboard' }) %>
<%- include('../partials/_topbar') %>

<!-- Main Content (lệch phải 256px do sidebar) -->
<main class="md:ml-64 pt-16 min-h-screen bg-background">
    <div class="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">

        <!-- Page Header -->
        <header>
            <h1 class="text-4xl font-extrabold tracking-tight font-headline text-on-surface">Dashboard</h1>
            <p class="text-on-surface-variant mt-2 text-lg font-light">Tổng quan hiệu suất làm việc của bạn.</p>
        </header>

        <!-- Stats Bento Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <!-- Card lớn: Tiến độ -->
            <div class="col-span-1 md:col-span-2 bg-surface-container-low p-6 rounded-xl flex flex-col justify-between hover:bg-surface-container transition-colors duration-300 border border-outline-variant/10">
                <div class="flex justify-between items-start">
                    <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary">analytics</span>
                    </div>
                    <span class="text-tertiary font-bold text-sm bg-tertiary/10 px-2 py-1 rounded">+12%</span>
                </div>
                <div class="mt-8">
                    <p class="text-on-surface-variant text-sm font-medium tracking-wider uppercase">Tiến độ Dự án</p>
                    <h3 class="text-5xl font-extrabold font-headline mt-2 text-on-surface">84<span class="text-primary text-3xl">%</span></h3>
                </div>
            </div>

            <!-- Card: Quá hạn -->
            <div class="bg-surface-container-low p-6 rounded-xl flex flex-col justify-between border-b-2 border-error/30">
                <div class="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-error">priority_high</span>
                </div>
                <div class="mt-4">
                    <p class="text-on-surface-variant text-sm font-medium">Quá hạn</p>
                    <h3 class="text-4xl font-bold font-headline mt-1 text-error">03</h3>
                </div>
            </div>

            <!-- Card: Hôm nay -->
            <div class="bg-surface-container-low p-6 rounded-xl flex flex-col justify-between border-b-2 border-primary/30">
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary">schedule</span>
                </div>
                <div class="mt-4">
                    <p class="text-on-surface-variant text-sm font-medium">Hôm nay</p>
                    <h3 class="text-4xl font-bold font-headline mt-1 text-primary">07</h3>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <section class="space-y-6">
            <h3 class="text-xl font-bold font-headline text-on-surface">Hoạt động gần đây</h3>
            <div class="bg-surface-container-low p-8 rounded-xl">
                <div class="relative space-y-8">
                    <div class="absolute left-[19px] top-2 bottom-2 w-0.5 bg-outline-variant/20"></div>
                    <!-- Timeline Entry mẫu -->
                    <div class="relative flex gap-6">
                        <div class="relative z-10 w-10 h-10 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-primary text-xl">task_alt</span>
                        </div>
                        <div class="flex-1 space-y-1">
                            <div class="flex items-center justify-between">
                                <p class="text-sm text-on-surface"><span class="font-bold text-primary">Bạn</span> đã hoàn thành task <span class="font-semibold">"Setup Database"</span></p>
                                <span class="text-xs text-on-surface-variant">2 giờ trước</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

    </div>
</main>

<%- include('../partials/_footer') %>
```

---

### 3.2 — Danh sách Dự án `projects/index.ejs`

**Mở file:** `src/views/projects/index.ejs`
**Xoá hết**, paste:

```html
<%- include('../partials/_header', { title: 'Dự án | TaskFlow' }) %>
<%- include('../partials/_sidebar', { activePage: 'projects' }) %>
<%- include('../partials/_topbar') %>

<main class="md:ml-64 pt-16 min-h-screen bg-background">
    <div class="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">

        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <h1 class="text-4xl font-extrabold tracking-tight font-headline text-on-surface">Trung tâm Dự án</h1>
                <p class="text-on-surface-variant mt-2 max-w-xl leading-relaxed">Quản lý tất cả các dự án tại đây.</p>
            </div>
            <button class="flex items-center gap-2 bg-primary-container text-on-primary-container px-5 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all">
                <span class="material-symbols-outlined text-xl">add</span> Tạo dự án mới
            </button>
        </div>

        <!-- Project Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="projects-list">

            <!-- Loading state -->
            <div class="col-span-full text-center py-20" id="projects-loading">
                <span class="material-symbols-outlined text-4xl text-on-surface-variant animate-spin">progress_activity</span>
                <p class="text-on-surface-variant mt-4">Đang tải danh sách dự án...</p>
            </div>

            <!-- Empty state (ẩn mặc định) -->
            <div class="col-span-full text-center py-20 hidden" id="projects-empty">
                <span class="material-symbols-outlined text-6xl text-outline/30">folder_off</span>
                <p class="text-on-surface-variant mt-4">Chưa có dự án nào.</p>
            </div>

            <!-- =========================================
                 MẪU 1 THẺ DỰ ÁN (JS sẽ render nhiều thẻ)
                 ========================================= -->
            <!--
            <div class="group bg-surface-container-low rounded-xl p-6 hover:bg-surface-container-high transition-all duration-300 border border-outline-variant/10 cursor-pointer">
                <div class="flex justify-between items-start mb-4">
                    <div class="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">Thiết kế</div>
                    <button class="text-on-surface-variant hover:text-on-surface"><span class="material-symbols-outlined">more_horiz</span></button>
                </div>
                <h3 class="text-xl font-bold text-on-surface mb-2 font-headline">Tên dự án</h3>
                <p class="text-on-surface-variant text-sm line-clamp-2 leading-relaxed mb-6">Mô tả ngắn gọn...</p>
                <div class="flex items-center justify-between">
                    <div class="flex -space-x-2">
                        <div class="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-bold border-2 border-surface-container-low">A</div>
                        <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-on-surface-variant border-2 border-surface-container-low">+2</div>
                    </div>
                    <div class="relative w-12 h-12 flex items-center justify-center">
                        <svg class="w-12 h-12 -rotate-90">
                            <circle class="text-surface-container-highest" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" stroke-width="4"></circle>
                            <circle class="text-primary" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" stroke-dasharray="125.6" stroke-dashoffset="31.4" stroke-width="4"></circle>
                        </svg>
                        <span class="absolute text-[10px] font-bold text-on-surface">75%</span>
                    </div>
                </div>
            </div>
            -->
        </div>

        <div class="text-error text-sm hidden" id="projects-error"></div>
    </div>
</main>

<script>
    window.__TF__ = window.__TF__ || {};
    window.__TF__.page = 'projects-index';
</script>
<script src="/js/board.js"></script>
<%- include('../partials/_footer') %>
```

---

### 3.3 — Bảng Kanban `projects/board.ejs`

**Mở file:** `src/views/projects/board.ejs`
**Xoá hết**, paste:

```html
<%- include('../partials/_header', { title: 'Board | TaskFlow' }) %>
<%- include('../partials/_sidebar', { activePage: 'projects' }) %>
<%- include('../partials/_topbar') %>

<main class="md:ml-64 pt-16 min-h-screen bg-background overflow-hidden">
    <div class="p-6 lg:p-10 flex flex-col h-[calc(100vh-4rem)]">

        <!-- Board Header -->
        <header class="flex justify-between items-center mb-6 shrink-0">
            <div>
                <h2 class="text-3xl font-extrabold font-headline text-on-surface tracking-tight" id="board-title">Kanban Board</h2>
                <p class="text-on-surface-variant text-sm mt-1" id="board-subtitle">Theo dõi tasks theo trạng thái</p>
            </div>
            <div class="flex gap-3">
                <button class="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary/20 transition-colors" id="btn-invite-member">
                    <span class="material-symbols-outlined text-sm mr-1 align-middle">person_add</span> Mời
                </button>
                <button class="bg-primary-container text-on-primary-container px-6 py-2 rounded-xl font-bold text-sm hover:brightness-110 transition-all" id="btn-refresh-board">
                    <span class="material-symbols-outlined text-sm mr-1 align-middle">add</span> Thêm thẻ
                </button>
            </div>
        </header>

        <!-- Kanban Columns -->
        <section class="flex gap-6 flex-1 overflow-x-auto pb-4 items-start" id="board" aria-label="Kanban board">

            <!-- Column: To Do -->
            <div class="min-w-[320px] w-[320px] flex flex-col" data-status="To Do">
                <div class="flex items-center justify-between mb-4 px-2">
                    <h4 class="text-xs font-black uppercase tracking-widest text-on-surface-variant">Cần làm (<span data-count="To Do">0</span>)</h4>
                    <span class="material-symbols-outlined text-sm text-on-surface-variant/40">more_horiz</span>
                </div>
                <div class="space-y-4 flex-1 overflow-y-auto" data-dropzone="To Do">
                    <!-- Task cards render vào đây -->
                </div>
            </div>

            <!-- Column: In Progress -->
            <div class="min-w-[320px] w-[320px] flex flex-col bg-surface-container-lowest/30 p-4 rounded-[2rem]" data-status="In Progress">
                <div class="flex items-center justify-between mb-4 px-2">
                    <h4 class="text-xs font-black uppercase tracking-widest text-on-surface-variant">Đang làm (<span data-count="In Progress">0</span>)</h4>
                    <span class="material-symbols-outlined text-sm text-on-surface-variant/40">more_horiz</span>
                </div>
                <div class="space-y-4 flex-1 overflow-y-auto" data-dropzone="In Progress">
                    <!-- Task cards render vào đây -->
                </div>
            </div>

            <!-- Column: Done -->
            <div class="min-w-[320px] w-[320px] flex flex-col" data-status="Done">
                <div class="flex items-center justify-between mb-4 px-2">
                    <h4 class="text-xs font-black uppercase tracking-widest text-on-surface-variant">Hoàn thành (<span data-count="Done">0</span>)</h4>
                    <span class="material-symbols-outlined text-sm text-on-surface-variant/40">more_horiz</span>
                </div>
                <div class="space-y-4 flex-1 overflow-y-auto" data-dropzone="Done">
                    <!-- Task cards render vào đây -->
                </div>
            </div>
        </section>

        <div class="text-error text-sm hidden" id="board-error"></div>
    </div>
</main>

<!-- ========== Task Detail Modal (3.4) ========== -->
<div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-md hidden items-center justify-center p-6" id="task-modal-overlay">
    <div class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-2xl shadow-black/60 overflow-hidden max-h-[90vh] overflow-y-auto p-8">

        <!-- Cột 8: Nội dung chính -->
        <div class="col-span-1 lg:col-span-8 space-y-6">
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-on-surface-variant uppercase tracking-wider" id="task-modal-project">Dự án</span>
                <button class="text-on-surface-variant hover:text-on-surface" id="task-modal-close">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <h1 class="text-3xl font-extrabold tracking-tight text-on-surface leading-tight font-headline" id="task-modal-title">Tiêu đề task</h1>
            <div class="space-y-4">
                <h3 class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Mô tả</h3>
                <p class="text-on-surface leading-relaxed font-light" id="task-modal-desc">—</p>
            </div>

            <!-- Attachments -->
            <div class="space-y-4">
                <h3 class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Đính kèm</h3>
                <div id="task-attachments"></div>
                <div class="hidden text-on-surface-variant text-sm" id="task-attachments-empty">Chưa có file đính kèm.</div>
                <div class="flex items-center gap-3">
                    <input type="file" id="task-upload-input" class="text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-surface-container-high file:text-on-surface hover:file:bg-surface-bright">
                    <button id="task-upload-btn" class="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110 transition-all">Tải lên</button>
                </div>
                <div class="text-error text-sm hidden" id="task-upload-error"></div>
            </div>
        </div>

        <!-- Cột 4: Sidebar thông tin -->
        <div class="col-span-1 lg:col-span-4 space-y-6">
            <div class="bg-surface-container-low p-6 rounded-xl space-y-6">
                <div>
                    <label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">Trạng thái</label>
                    <select id="task-modal-status" class="w-full bg-primary-container/20 text-primary px-4 py-3 rounded-lg font-bold text-sm border-none focus:ring-primary">
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                    </select>
                </div>
                <div>
                    <label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">Độ ưu tiên</label>
                    <select id="task-modal-priority" class="w-full bg-surface-container text-on-surface px-4 py-3 rounded-lg font-medium text-sm border border-outline-variant/10 focus:ring-primary">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
                <div>
                    <label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">Hạn chót</label>
                    <input type="date" id="task-modal-deadline" class="w-full bg-surface-container text-on-surface px-4 py-3 rounded-lg text-sm border border-outline-variant/10 focus:ring-primary">
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ========== Invite Modal (3.5) ========== -->
<div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-md hidden items-center justify-center p-6" id="invite-modal-overlay">
    <div class="w-full max-w-lg bg-surface-container-low rounded-xl overflow-hidden shadow-2xl shadow-black/60 flex flex-col">
        <!-- Modal Header -->
        <div class="p-8 pb-0">
            <div class="flex justify-between items-start mb-2">
                <h2 class="text-2xl font-extrabold tracking-tight text-on-surface font-headline">Mời thành viên</h2>
                <button class="text-on-surface-variant hover:bg-surface-container-high p-1 rounded-md transition-colors" id="invite-modal-close">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <p class="text-on-surface-variant text-sm">Nhập email người bạn muốn mời vào dự án.</p>
        </div>
        <!-- Modal Body -->
        <div class="p-8 space-y-8">
            <div class="space-y-2">
                <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Email</label>
                <div class="relative group">
                    <input class="w-full bg-surface-container-low border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 px-0 py-3 text-on-surface placeholder:text-outline/50 transition-all" placeholder="colleague@company.com" type="email" id="invite-email"/>
                    <span class="absolute right-0 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/30 group-focus-within:text-primary">mail</span>
                </div>
            </div>
            <!-- Role -->
            <div class="space-y-4">
                <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Vai trò</label>
                <div class="grid grid-cols-2 gap-4">
                    <label class="flex flex-col p-4 rounded-xl border border-outline-variant/10 bg-surface-container hover:bg-surface-container-high cursor-pointer has-[:checked]:border-primary/50 has-[:checked]:bg-surface-container-high transition-all">
                        <input class="sr-only" name="role" type="radio" value="owner"/>
                        <span class="material-symbols-outlined text-on-surface-variant mb-3">verified_user</span>
                        <span class="font-bold text-on-surface font-headline text-sm">Owner</span>
                        <span class="text-xs text-on-surface-variant">Full admin access.</span>
                    </label>
                    <label class="flex flex-col p-4 rounded-xl border border-outline-variant/10 bg-surface-container hover:bg-surface-container-high cursor-pointer has-[:checked]:border-primary/50 has-[:checked]:bg-surface-container-high transition-all">
                        <input class="sr-only" name="role" type="radio" value="member" checked/>
                        <span class="material-symbols-outlined text-on-surface-variant mb-3">group</span>
                        <span class="font-bold text-on-surface font-headline text-sm">Member</span>
                        <span class="text-xs text-on-surface-variant">Create & edit tasks.</span>
                    </label>
                </div>
            </div>
        </div>
        <!-- Modal Footer -->
        <div class="px-8 py-6 bg-surface-container flex flex-row-reverse gap-4">
            <button class="flex-1 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20" id="invite-send-btn">
                Gửi lời mời
            </button>
            <button class="flex-1 py-3 rounded-xl bg-surface-container-high text-on-surface-variant font-bold hover:text-on-surface transition-all" id="invite-cancel-btn">
                Huỷ
            </button>
        </div>
    </div>
</div>

<script>
    window.__TF__ = window.__TF__ || {};
    window.__TF__.page = 'projects-board';
</script>
<script src="/js/dragdrop.js"></script>
<script src="/js/board.js"></script>
<%- include('../partials/_footer') %>
```

---

## 🛠️ PHẦN 4: TRANG MỞ RỘNG (Extended — CARD UI-04)

### 4.1 — Hồ sơ cá nhân `profile/index.ejs`

**Tạo thư mục:** `src/views/profile/` (nếu chưa có)
**Tạo file:** `src/views/profile/index.ejs`
Paste:

```html
<%- include('../partials/_header', { title: 'Hồ sơ | TaskFlow' }) %>
<%- include('../partials/_sidebar', { activePage: 'profile' }) %>
<%- include('../partials/_topbar') %>

<main class="md:ml-64 pt-16 min-h-screen bg-background">
    <div class="p-6 lg:p-10 max-w-4xl mx-auto space-y-10">

        <!-- Profile Header -->
        <div class="flex flex-col items-center text-center space-y-4">
            <div class="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-3xl font-bold font-headline">
                <% if (typeof user !== 'undefined' && user && user.name) { %>
                    <%= user.name.charAt(0).toUpperCase() %>
                <% } else { %>
                    U
                <% } %>
            </div>
            <div>
                <h1 class="text-3xl font-extrabold font-headline text-on-surface">
                    <%= typeof user !== 'undefined' && user ? user.name : 'Người dùng' %>
                </h1>
                <p class="text-on-surface-variant">
                    <%= typeof user !== 'undefined' && user ? user.email : 'user@email.com' %>
                </p>
            </div>
        </div>

        <!-- Info Sections -->
        <section class="space-y-6">
            <h3 class="text-xl font-bold font-headline text-on-surface">Thông tin cá nhân</h3>
            <div class="bg-surface-container-low p-8 rounded-xl space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-2">
                        <label class="block text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Họ và tên</label>
                        <input class="w-full bg-surface-container-low border-b-2 border-outline-variant text-on-surface px-0 py-2 focus:border-primary focus:ring-0 transition-colors" type="text" value="<%= typeof user !== 'undefined' && user ? user.name : '' %>" />
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Email</label>
                        <input class="w-full bg-surface-container-low border-b-2 border-outline-variant/20 text-on-surface-variant/60 px-0 py-2 cursor-not-allowed" readonly type="email" value="<%= typeof user !== 'undefined' && user ? user.email : '' %>" />
                    </div>
                </div>
                <div class="flex justify-end pt-2">
                    <button class="bg-surface-container-highest hover:bg-surface-bright text-on-surface px-6 py-2 rounded-lg text-sm font-semibold transition-all">Lưu thay đổi</button>
                </div>
            </div>
        </section>

        <!-- Stats -->
        <section class="space-y-6">
            <h3 class="text-xl font-bold font-headline text-on-surface">Thống kê hoạt động</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-surface-container-low p-6 rounded-xl text-center">
                    <p class="text-on-surface-variant text-sm">Dự án tham gia</p>
                    <h3 class="text-3xl font-extrabold font-headline text-primary mt-2">5</h3>
                </div>
                <div class="bg-surface-container-low p-6 rounded-xl text-center">
                    <p class="text-on-surface-variant text-sm">Tasks hoàn thành</p>
                    <h3 class="text-3xl font-extrabold font-headline text-tertiary mt-2">42</h3>
                </div>
                <div class="bg-surface-container-low p-6 rounded-xl text-center">
                    <p class="text-on-surface-variant text-sm">Tasks đang làm</p>
                    <h3 class="text-3xl font-extrabold font-headline text-secondary mt-2">7</h3>
                </div>
            </div>
        </section>
    </div>
</main>

<%- include('../partials/_footer') %>
```

---

### 4.2 — Cài đặt Dự án `settings/index.ejs`

**Tạo thư mục:** `src/views/settings/` (nếu chưa có)
**Tạo file:** `src/views/settings/index.ejs`
Paste:

```html
<%- include('../partials/_header', { title: 'Cài đặt | TaskFlow' }) %>
<%- include('../partials/_sidebar', { activePage: 'settings' }) %>
<%- include('../partials/_topbar') %>

<main class="md:ml-64 pt-16 min-h-screen bg-background">
    <div class="p-6 lg:p-10 max-w-4xl mx-auto space-y-12">

        <!-- Header -->
        <div class="space-y-1">
            <h1 class="text-4xl font-extrabold tracking-tight font-headline text-on-surface">Project Settings</h1>
            <p class="text-on-surface-variant">Quản lý workspace, thành viên và bảo mật.</p>
        </div>

        <!-- ===== Tab Navigation (Activity / Roles) ===== -->
        <div class="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl w-fit">
            <button class="px-5 py-2 rounded-lg text-sm font-bold bg-surface-container-highest text-on-surface transition-colors" data-tab="activity">Cài đặt chung</button>
            <button class="px-5 py-2 rounded-lg text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors" data-tab="roles">Vai trò & Quyền</button>
        </div>

        <!-- General Settings -->
        <section class="space-y-6">
            <h3 class="text-xl font-bold font-headline text-on-surface">General Settings</h3>
            <div class="bg-surface-container-low p-8 rounded-xl space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-2">
                        <label class="block text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Tên dự án</label>
                        <input class="w-full bg-surface-container-low border-b-2 border-outline-variant text-on-surface px-0 py-2 focus:border-primary focus:ring-0 transition-colors" type="text" value="Dự án mẫu" />
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Project ID</label>
                        <input class="w-full bg-surface-container-low border-b-2 border-outline-variant/20 text-on-surface-variant/60 px-0 py-2 cursor-not-allowed" readonly type="text" value="PROJ-001" />
                    </div>
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Mô tả</label>
                    <textarea class="w-full bg-surface-container-low border-b-2 border-outline-variant text-on-surface px-0 py-2 focus:border-primary focus:ring-0 transition-colors resize-none" rows="3">Mô tả dự án tại đây.</textarea>
                </div>
                <div class="flex justify-end pt-2">
                    <button class="bg-surface-container-highest hover:bg-surface-bright text-on-surface px-6 py-2 rounded-lg text-sm font-semibold transition-all">Lưu thay đổi</button>
                </div>
            </div>
        </section>

        <!-- Team Access -->
        <section class="space-y-6">
            <div class="flex items-center justify-between">
                <h3 class="text-xl font-bold font-headline text-on-surface">Team Access</h3>
                <button class="flex items-center gap-2 bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110 transition-all">
                    <span class="material-symbols-outlined text-lg">person_add</span> Mời thành viên
                </button>
            </div>
            <div class="bg-surface-container-low rounded-xl overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-surface-container-lowest/50">
                            <th class="px-6 py-4 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Thành viên</th>
                            <th class="px-6 py-4 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Vai trò</th>
                            <th class="px-6 py-4 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Ngày tham gia</th>
                            <th class="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-outline-variant/10">
                        <!-- Hàng mẫu -->
                        <tr class="hover:bg-surface-container-high transition-colors">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-bold text-on-primary-container">A</div>
                                    <div>
                                        <div class="font-semibold text-on-surface">Admin User</div>
                                        <div class="text-xs text-on-surface-variant">admin@taskflow.com</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-tertiary-container/20 text-on-tertiary-container border border-tertiary-container/30">Owner</span>
                            </td>
                            <td class="px-6 py-4 text-sm text-on-surface-variant">01/01/2026</td>
                            <td class="px-6 py-4 text-right">
                                <button class="p-2 text-on-surface-variant hover:text-on-surface"><span class="material-symbols-outlined">more_vert</span></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Danger Zone -->
        <section class="space-y-6 pt-10">
            <div class="border-t border-error/20 pt-10">
                <div class="flex items-center gap-3 text-error mb-4">
                    <span class="material-symbols-outlined">warning</span>
                    <h3 class="text-xl font-bold font-headline">Danger Zone</h3>
                </div>
                <div class="bg-error-container/5 border border-error/10 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div class="space-y-1">
                        <h4 class="font-bold text-on-surface">Xoá dự án này</h4>
                        <p class="text-sm text-on-surface-variant max-w-lg">Thao tác này không thể hoàn tác. Toàn bộ dữ liệu sẽ bị xoá vĩnh viễn.</p>
                    </div>
                    <button class="shrink-0 bg-error text-on-error px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-error/10">
                        Xoá Dự Án
                    </button>
                </div>
            </div>
        </section>

        <div class="h-20"></div>
    </div>
</main>

<%- include('../partials/_footer') %>
```

---

### 4.3 — Thông báo `notifications/index.ejs`

**Tạo thư mục:** `src/views/notifications/` (nếu chưa có)
**Tạo file:** `src/views/notifications/index.ejs`
Paste:

```html
<%- include('../partials/_header', { title: 'Thông báo | TaskFlow' }) %>
<%- include('../partials/_sidebar', { activePage: 'notifications' }) %>
<%- include('../partials/_topbar') %>

<main class="md:ml-64 pt-16 min-h-screen bg-background">
    <div class="p-6 lg:p-10 max-w-3xl mx-auto space-y-8">
        <h1 class="text-4xl font-extrabold tracking-tight font-headline text-on-surface">Thông báo</h1>

        <div class="space-y-4">
            <!-- Notification Item mẫu -->
            <div class="flex gap-4 p-4 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-colors border border-outline-variant/10 cursor-pointer">
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-primary">task_alt</span>
                </div>
                <div class="flex-1">
                    <p class="text-sm text-on-surface"><span class="font-bold">System</span> — Task "Setup Database" đã được cập nhật.</p>
                    <span class="text-xs text-on-surface-variant">2 giờ trước</span>
                </div>
                <div class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
            </div>

            <!-- Empty state -->
            <!--
            <div class="text-center py-20">
                <span class="material-symbols-outlined text-6xl text-outline/30">notifications_off</span>
                <p class="text-on-surface-variant mt-4">Không có thông báo mới.</p>
            </div>
            -->
        </div>
    </div>
</main>

<%- include('../partials/_footer') %>
```

---

## ✅ Bảng Tham Chiếu Nhanh

| Design file gốc | → File EJS cần tạo/sửa | Mục trong tài liệu |
|---|---|---|
| `login.html` | `auth/login.ejs` | §2.1 |
| (tương tự login) | `auth/register.ejs` | §2.2 |
| `dashboard.html` | `dashboard/index.ejs` | §3.1 |
| `project_list.html` / `home.html` | `projects/index.ejs` | §3.2 |
| `board.html` | `projects/board.ejs` | §3.3 |
| `task_detail.html` | Modal trong `board.ejs` | §3.4 |
| `invite.html` | Modal trong `board.ejs` | §3.5 |
| `profile.html` | `profile/index.ejs` | §4.1 |
| `settings_activity.html` + `settings_roles.html` | `settings/index.ejs` (gộp 2 tab) | §4.2 |
| `notifications.html` *(PNG only)* | `notifications/index.ejs` | §4.3 |
| — | `routes/viewRoutes.js` | §5.1 |
| — | `errors/404.ejs` | §6.1 |

---

## 🔧 PHẦN 5: CẬP NHẬT ROUTES (BẮT BUỘC)

> Không có bước này, các trang mới sẽ **không truy cập được** từ trình duyệt.

### 5.1 — Cập nhật `viewRoutes.js`

**Mở file:** `src/routes/viewRoutes.js`
**Xoá hết nội dung cũ**, paste:

```javascript
const express = require('express');
const router = express.Router();

// ===== Trang công khai (không cần đăng nhập) =====
router.get('/', (req, res) => {
  res.redirect('/login');
});

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Đăng Nhập - TaskFlow' });
});

router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Đăng Ký - TaskFlow' });
});

// ===== Trang yêu cầu đăng nhập (truyền user nếu có) =====
// Lưu ý: Nếu đã có middleware xác thực, thêm `protect` trước callback.
// Ví dụ: router.get('/dashboard', protect, (req, res) => {...})

router.get('/dashboard', (req, res) => {
  res.render('dashboard/index', {
    title: 'Dashboard - TaskFlow',
    activePage: 'dashboard',
    user: req.user || null
  });
});

router.get('/projects', (req, res) => {
  res.render('projects/index', {
    title: 'Dự án - TaskFlow',
    activePage: 'projects',
    user: req.user || null
  });
});

router.get('/projects/:id/board', (req, res) => {
  res.render('projects/board', {
    title: 'Board - TaskFlow',
    activePage: 'projects',
    user: req.user || null,
    projectId: req.params.id
  });
});

router.get('/profile', (req, res) => {
  res.render('profile/index', {
    title: 'Hồ sơ - TaskFlow',
    activePage: 'profile',
    user: req.user || null
  });
});

router.get('/settings', (req, res) => {
  res.render('settings/index', {
    title: 'Cài đặt - TaskFlow',
    activePage: 'settings',
    user: req.user || null
  });
});

router.get('/notifications', (req, res) => {
  res.render('notifications/index', {
    title: 'Thông báo - TaskFlow',
    activePage: 'notifications',
    user: req.user || null
  });
});

// ===== Trang lỗi 404 =====
router.get('/404', (req, res) => {
  res.status(404).render('errors/404', { title: '404 - TaskFlow' });
});

module.exports = router;
```

---

## ❌ PHẦN 6: TRANG LỖI 404 (Bonus)

### 6.1 — Trang 404 `errors/404.ejs`

**Tạo thư mục:** `src/views/errors/` (nếu chưa có)
**Tạo file:** `src/views/errors/404.ejs`
Paste:

```html
<%- include('../partials/_header', { title: '404 - Không tìm thấy' }) %>

<main class="min-h-screen flex items-center justify-center p-6">
    <div class="text-center space-y-6 max-w-md">
        <div class="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center mx-auto">
            <span class="material-symbols-outlined text-5xl text-on-surface-variant/40">explore_off</span>
        </div>
        <h1 class="text-6xl font-extrabold font-headline text-on-surface">404</h1>
        <p class="text-on-surface-variant text-lg">Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
        <a href="/projects" class="inline-flex items-center gap-2 kinetic-gradient text-on-primary font-bold py-3 px-8 rounded-xl hover:scale-[0.98] transition-transform">
            <span class="material-symbols-outlined">arrow_back</span> Về trang chủ
        </a>
    </div>
</main>

<%- include('../partials/_footer') %>
```

---

## ✅ PHẦN 7: TRẠNG THÁI HIỆN TẠI & CHECKLIST BÀN GIAO

### 7.1 — Đã hoàn thành (bởi hệ thống)

| File | Trạng thái | Ghi chú |
|------|-----------|---------|
| `partials/_header.ejs` | ✅ Đã cập nhật | Stitch tokens + Tailwind CDN + Fonts |
| `partials/_sidebar.ejs` | ✅ Đã tạo mới | Sidebar với active page highlighting |
| `partials/_topbar.ejs` | ✅ Đã tạo mới | Top bar với search + avatar |
| `partials/_footer.ejs` | ✅ Đã cập nhật | Chỉ đóng `</body></html>` |

### 7.2 — Cần làm (bàn giao cho đồng nghiệp)

| # | Việc cần làm | File | Hướng dẫn |
|---|-------------|------|-----------|
| 1 | Auth: Login | `src/views/auth/login.ejs` | Copy code tại **§2.1** |
| 2 | Auth: Register | `src/views/auth/register.ejs` | Copy code tại **§2.2** |
| 3 | Dashboard | `src/views/dashboard/index.ejs` | Tạo thư mục + Copy **§3.1** |
| 4 | Projects List | `src/views/projects/index.ejs` | Xoá cũ + Copy **§3.2** |
| 5 | Kanban Board | `src/views/projects/board.ejs` | Xoá cũ + Copy **§3.3** (gồm Modal §3.4 + §3.5) |
| 6 | Profile | `src/views/profile/index.ejs` | Tạo thư mục + Copy **§4.1** |
| 7 | Settings | `src/views/settings/index.ejs` | Tạo thư mục + Copy **§4.2** |
| 8 | Notifications | `src/views/notifications/index.ejs` | Tạo thư mục + Copy **§4.3** |
| 9 | Error 404 | `src/views/errors/404.ejs` | Tạo thư mục + Copy **§6.1** |
| 10 | Routes | `src/routes/viewRoutes.js` | Xoá cũ + Copy **§5.1** |

### 7.3 — Thứ tự thực hiện đề xuất

```
Bước 1: Routes (§5.1) — để server nhận diện URL mới
Bước 2: Auth pages (§2.1, §2.2) — test đăng nhập/ký trước
Bước 3: Dashboard (§3.1) — trang chính sau login
Bước 4: Projects + Board (§3.2, §3.3)
Bước 5: Profile + Settings + Notifications (§4.1, §4.2, §4.3)
Bước 6: Error 404 (§6.1) — bonus
```

### 7.4 — Cấu trúc thư mục views SAU KHI HOÀN THÀNH

```
src/views/
├── auth/
│   ├── login.ejs          ← §2.1
│   └── register.ejs       ← §2.2
├── dashboard/
│   └── index.ejs          ← §3.1 (TẠO MỚI)
├── errors/
│   └── 404.ejs            ← §6.1 (TẠO MỚI)
├── notifications/
│   └── index.ejs          ← §4.3 (TẠO MỚI)
├── partials/
│   ├── _header.ejs        ✅ ĐÃ LÀM
│   ├── _sidebar.ejs       ✅ ĐÃ LÀM
│   ├── _topbar.ejs        ✅ ĐÃ LÀM
│   └── _footer.ejs        ✅ ĐÃ LÀM
├── profile/
│   └── index.ejs          ← §4.1 (TẠO MỚI)
├── projects/
│   ├── index.ejs          ← §3.2
│   └── board.ejs          ← §3.3 (gồm Modal Task + Invite)
└── settings/
    └── index.ejs          ← §4.2 (TẠO MỚI)
```

---

> **Ghi nhớ quan trọng:**
> - Luôn bắt đầu bằng `<%- include('../partials/_header', { title: '...' }) %>`
> - Kết thúc bằng `<%- include('../partials/_footer') %>`
> - Mọi trang có sidebar đều cần `md:ml-64 pt-16` trên thẻ `<main>`
> - Color tokens đã khai báo sẵn trong `_header.ejs`, **không cần** khai báo lại
> - Mỗi route trong `viewRoutes.js` phải truyền `activePage` và `user` cho sidebar/topbar hoạt động
> - **Design gốc tham chiếu** nằm tại: `designs/stitch/*.html` + `designs/stitch/*.png`
