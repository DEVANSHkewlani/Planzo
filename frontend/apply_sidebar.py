import os, re

# Read dashboard as source of truth
with open('dashboard.html', 'r', encoding='utf-8') as f:
    dashboard_html = f.read()

# Extract styles
style_match = re.search(r'(/\* Sidebar \*/.*?)(?=</style>)', dashboard_html, re.DOTALL)
styles = style_match.group(1) if style_match else ''
styles = '\n' + styles.strip() + '\n'

# Extract JS
js_match = re.search(r'(function toggleSidebar.*?document\.getElementById\(\'menu-toggle\'\)\?\.addEventListener\(\'click\', toggleSidebar\);)', dashboard_html, re.DOTALL)
js = js_match.group(1) if js_match else ''
js += "\n\n  // Handle logout from sidebar\n  document.getElementById('logout-btn')?.addEventListener('click', () => { Api.auth.logout(); window.location.href = '/login.html'; });\n  document.getElementById('logout-btn-mobile')?.addEventListener('click', () => { Api.auth.logout(); window.location.href = '/login.html'; });\n"

# Extract sidebar HTML elements
sidebar_html = re.search(r'(<!-- Sidebar \(Desktop\) -->.*?)</main>', dashboard_html, re.DOTALL)
sidebar_template = sidebar_html.group(1) if sidebar_html else ''
# Remove active class from dashboard link in template
sidebar_template = sidebar_template.replace('class="sidebar-link active"', 'class="sidebar-link"')
sidebar_template = sidebar_template.replace('class="sidebar-link" href="dashboard.html"', 'class="sidebar-link active" href="dashboard.html"') # keep only one active? No, we will replace active dynamically.

target_files = [
    'projects.html', 'projectoverview.html', 'calendar.html', 
    'chat.html', 'settings.html', 'notifications.html', 
    'task.html', 'draw.html', 'AddProject.html', 'AddTask.html'
]

for filename in target_files:
    if not os.path.exists(filename): continue
    print(f"Processing {filename}...")
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Inject styles
    if '/* Sidebar */' not in content:
        content = content.replace('</style>', styles + '</style>')
    
    # 2. Inject JS
    if 'toggleSidebar()' not in content:
        if '</script>\n<script src="/js/pwa.js">' in content:
            content = content.replace('</script>\n<script src="/js/pwa.js">', '\n' + js + '\n</script>\n<script src="/js/pwa.js">')
        elif '</script>\n</body>' in content:
            content = content.replace('</script>\n</body>', '\n' + js + '\n</script>\n</body>')
        else:
            content = content.replace('</body>', '<script>\n' + js + '\n</script>\n</body>')
        
    # 3. Handle HTML body replacement
    # Make active link based on current page
    page_id = filename.replace('.html', '')
    if page_id in ['projectoverview', 'AddProject', 'task', 'AddTask']: page_id = 'projects'
    custom_sidebar = sidebar_template.replace(
        f'href="{page_id}.html" class="sidebar-link"', 
        f'href="{page_id}.html" class="sidebar-link active"'
    )
    # Ensure dashboard isn't active by default if not dashboard
    custom_sidebar = custom_sidebar.replace('href="dashboard.html" class="sidebar-link active"', 'href="dashboard.html" class="sidebar-link"')
    if page_id == 'dashboard':
        custom_sidebar = custom_sidebar.replace('href="dashboard.html" class="sidebar-link"', 'href="dashboard.html" class="sidebar-link active"')
    
    # Remove old headers/navbars, but keep the <header> tag content for the title if needed
    header_match = re.search(r'<header[^>]*>(.*?)</header>', content, re.DOTALL)
    nav_match = re.search(r'<nav[^>]*>(.*?)</nav>', content, re.DOTALL)
    
    content = re.sub(r'<header.*?</header>', '', content, flags=re.DOTALL)
    content = re.sub(r'<nav.*?</nav>', '', content, flags=re.DOTALL)
    
    # Check if already has main-content structure
    if 'class="main-content"' not in content:
        # Wrap everything between <body> and scripts in main-content
        body_content = re.search(r'<body[^>]*>(.*?)(<script.*)', content, re.DOTALL)
        if body_content:
            inner_html = body_content.group(1).strip()
            scripts = body_content.group(2)
            
            # Put back button
            back_btn_html = f'''
  <div class="px-8 py-6 max-w-5xl mx-auto flex-1">
    <div class="flex items-center gap-4 mb-6">
      <button onclick="history.back()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
    </div>
'''
            
            new_body = f"\n{custom_sidebar}\n\n<main class=\"main-content flex flex-col min-h-screen\" style=\"margin-left:240px;\">\n{back_btn_html}\n{inner_html}\n  </div>\n</main>\n\n{scripts}"
            content = re.sub(r'<body[^>]*>.*', lambda x: f'<body class="text-on-surface bg-[#0a0a0a]">{new_body}', content, flags=re.DOTALL)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Updated {filename}")

EOF
