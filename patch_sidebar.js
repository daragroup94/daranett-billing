const fs = require('fs');
const file = '/home/dg/daranett-billing/src/components/Sidebar.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
  /ChevronLeft, ChevronRight, Server/,
  'ChevronLeft, ChevronRight, Server, Search, User'
);

// 2. States
content = content.replace(
  /const \[collapsed, setCollapsed\] = useState\(false\);/,
  `const [collapsed, setCollapsed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredLink, setHoveredLink] = useState({ section: null, top: 0 });`
);

// 3. renderLink function
const renderLinkSearch = `const renderLink = (link) => {`;
const renderLinkReplace = `const renderLink = (link, index, sectionName) => {`;
content = content.replace(renderLinkSearch, renderLinkReplace);

content = content.replace(
  /<li key={link.href}>/,
  `<li 
        key={link.href}
        onMouseEnter={(e) => setHoveredLink({ section: sectionName, top: e.currentTarget.offsetTop })}
        style={{ animationDelay: \`\${index * 0.05}s\` }}
        className="nav-item-animated"
      >`
);

// 4. Nav Sections
content = content.replace(
  /<ul className="nav-links">{mainLinks.map\(renderLink\)}<\/ul>/,
  `<ul className="nav-links" onMouseLeave={() => setHoveredLink({ section: null, top: 0 })}>
              {hoveredLink.section === 'main' && <div className="fluid-hover-bg" style={{ top: hoveredLink.top }} />}
              {mainLinks.map((link, i) => renderLink(link, i, 'main'))}
            </ul>`
);

content = content.replace(
  /<ul className="nav-links">{otherLinks.map\(renderLink\)}<\/ul>/,
  `<ul className="nav-links" onMouseLeave={() => setHoveredLink({ section: null, top: 0 })}>
              {hoveredLink.section === 'other' && <div className="fluid-hover-bg" style={{ top: hoveredLink.top }} />}
              {otherLinks.map((link, i) => renderLink(link, i + mainLinks.length, 'other'))}
            </ul>`
);

// 5. Search Bar
content = content.replace(
  /<\/div>\s*<\/div>\s*\{\/\* SCROLLABLE MIDDLE AREA/,
  `</div>
          
          {/* Quick Search */}
          <div className="sidebar-search">
            <Search size={16} className="search-icon" />
            <input type="text" placeholder="Cari... ⌘K" className="search-input" />
          </div>
        </div>

        {/* SCROLLABLE MIDDLE AREA`
);

// 6. Sidebar Footer Dropdown
const oldFooter = /<div className="sidebar-footer">[\s\S]*?<div className="version-info-premium">\s*<p>Core Build v2\.1\.0<\/p>\s*<p className="active-badge">Online: 350 Users<\/p>\s*<\/div>\s*<\/div>/;
const newFooter = `<div className="sidebar-footer">
            <div className={\`user-profile-premium \${showDropdown ? 'active' : ''}\`} onClick={() => setShowDropdown(!showDropdown)}>
              <div className="user-avatar">
                <User size={18} />
              </div>
              <div className="user-info">
                <span className="user-name">Admin DaraNet</span>
                <span className="user-role">Superuser</span>
              </div>
              <Settings size={14} className="user-settings-icon" />
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="user-dropdown-menu">
                <button onClick={() => window.location.href='/pengaturan'} className="dropdown-item">
                  <Settings size={14} className="dropdown-icon" /> Pengaturan Akun
                </button>
                <div className="dropdown-divider" />
                <button onClick={handleLogout} className="dropdown-item logout-text">
                  <LogOut size={14} className="dropdown-icon" /> Keluar
                </button>
              </div>
            )}
            
            <div className="version-info-premium">
              <p>Core Build v2.1.0</p>
            </div>
          </div>`;
content = content.replace(oldFooter, newFooter);

// 7. Replace all `.sidebar.sidebar-collapsed` with `.sidebar.sidebar-collapsed:not(:hover)`
content = content.replace(/\.sidebar\.sidebar-collapsed(?!\:not)/g, '.sidebar.sidebar-collapsed:not(:hover)');

// 8. Add new CSS rules
const newCSS = `
        .sidebar-search {
          display: flex;
          align-items: center;
          background: var(--input-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0.6rem 0.8rem;
          margin-top: 1rem;
          gap: 0.5rem;
          color: var(--text-secondary);
          transition: var(--transition-smooth);
        }
        .sidebar-search:focus-within {
          border-color: var(--accent-cyan);
          background: var(--input-bg-focus);
          box-shadow: 0 0 0 2px rgba(6,182,212,0.2);
        }
        .search-icon {
          flex-shrink: 0;
        }
        .search-input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 0.8rem;
          width: 100%;
          font-family: inherit;
        }
        .search-input::placeholder {
          color: var(--text-muted);
        }
        .sidebar.sidebar-collapsed:not(:hover) .sidebar-search {
          display: none;
        }

        .nav-item-animated {
          opacity: 0;
          animation: slideIn 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-15px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .fluid-hover-bg {
          position: absolute;
          left: 0;
          width: 100%;
          height: 38px;
          background: var(--hover-overlay-strong);
          border-radius: 12px;
          transition: top 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
          z-index: 0;
          pointer-events: none;
        }

        :global(.nav-links) { position: relative; }
        :global(.nav-link) {
          position: relative;
          z-index: 1;
        }
        :global(.nav-link:hover) {
          background: transparent !important; 
          border-color: transparent !important;
        }

        /* User Profile Dropdown */
        .user-profile-premium {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.85rem;
          background: var(--hover-overlay);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          cursor: pointer;
          transition: var(--transition-smooth);
          position: relative;
        }
        .user-profile-premium:hover, .user-profile-premium.active {
          background: var(--hover-overlay-strong);
          border-color: var(--accent-cyan);
        }
        .user-avatar {
          width: 32px;
          height: 32px;
          background: var(--gradient-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }
        .user-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }
        .user-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-heading);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .user-role {
          font-size: 0.65rem;
          color: var(--text-muted);
        }
        .user-settings-icon {
          color: var(--text-secondary);
          transition: transform 0.3s ease;
        }
        .user-profile-premium.active .user-settings-icon {
          transform: rotate(90deg);
          color: var(--text-heading);
        }
        .sidebar.sidebar-collapsed:not(:hover) .user-info,
        .sidebar.sidebar-collapsed:not(:hover) .user-settings-icon {
          display: none;
        }
        .sidebar.sidebar-collapsed:not(:hover) .user-profile-premium {
          padding: 0.4rem;
          justify-content: center;
        }

        .user-dropdown-menu {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 0;
          width: 100%;
          background: var(--glass-bg);
          backdrop-filter: blur(24px);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          box-shadow: var(--shadow-lg);
          animation: fadeIn 0.2s ease;
          z-index: 10;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.6rem 0.8rem;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 500;
          font-family: inherit;
          text-align: left;
          border-radius: 8px;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .dropdown-item:hover {
          background: var(--hover-overlay-strong);
          color: var(--text-heading);
        }
        .dropdown-divider {
          height: 1px;
          background: var(--border-color);
          margin: 0.25rem 0;
        }
        .logout-text {
          color: var(--accent-rose);
        }
        .logout-text:hover {
          background: rgba(244, 63, 94, 0.1);
          color: var(--accent-rose);
        }
        .sidebar.sidebar-collapsed:not(:hover) .user-dropdown-menu {
          display: none;
        }
`;
content = content.replace(/<\/style>/, newCSS + '\n      </style>');

fs.writeFileSync(file, content);
console.log('Sidebar.js patched successfully');
