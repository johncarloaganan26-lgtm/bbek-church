# Sidebar Navigation Component - React Implementation

## Menu Structure

```
DASHBOARD
└── Overview

RECORDS
├── Users
├── Events
└── Registrations

MAINTENANCE
├── Analytics
├── Archive
└── Audit Trail
```

---

## Design Specifications

### Colors
| Element | Hex Code |
|---------|----------|
| Sidebar Background | #FFFFFF |
| Active Item BG | #E3F2FD |
| Active Icon/Text | #007BFF |
| Inactive Icon | #6C757D |
| Inactive Text | #212529 |
| Hover BG | #F8F9FA |
| Divider | #E0E0E0 |

### Typography
- **Font Family**: Roboto
- **Section Headers**: 14px, Bold, UPPERCASE, letter-spacing: 0.5px
- **Menu Items**: 14px, Regular

### Spacing
- **Sidebar Width**: 280px (desktop), 240px (mobile)
- **Icon Size**: 24px
- **Item Padding**: 12px 16px
- **Item Margin**: 4px 8px
- **Border Radius**: 8px

---

## React Component Code

```jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronDown,
  Home,
  Database,
  Calendar,
  FileText,
  BarChart3,
  Archive,
  ClipboardList
} from 'lucide-react';

// Icon mapping
const iconMap = {
  'dashboard': Home,
  'records': Database,
  'users': FileText,
  'events': Calendar,
  'registrations': FileText,
  'maintenance': BarChart3,
  'analytics': BarChart3,
  'archive': Archive,
  'audit-trail': ClipboardList,
};

// Menu data structure
const menuItems = [
  {
    title: 'DASHBOARD',
    icon: 'dashboard',
    children: [
      { title: 'Overview', path: '/dashboard', icon: 'dashboard' }
    ]
  },
  {
    title: 'RECORDS',
    icon: 'records',
    children: [
      { title: 'Users', path: '/users', icon: 'users' },
      { title: 'Events', path: '/events', icon: 'events' },
      { title: 'Registrations', path: '/registrations', icon: 'registrations' }
    ]
  },
  {
    title: 'MAINTENANCE',
    icon: 'maintenance',
    children: [
      { title: 'Analytics', path: '/analytics', icon: 'analytics' },
      { title: 'Archive', path: '/archive', icon: 'archive' },
      { title: 'Audit Trail', path: '/audit-trail', icon: 'audit-trail' }
    ]
  }
];

// Menu item component
const MenuItem = ({ item, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(level === 0);
  const hasChildren = item.children && item.children.length > 0;
  const IconComponent = iconMap[item.icon];

  const handleToggle = (e) => {
    if (hasChildren && level > 0) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const paddingLeft = 16 + (level * 24);

  if (hasChildren && level === 0) {
    return (
      <div className="menu-group">
        <div className="menu-item section-header">
          {IconComponent && <IconComponent size={20} className="menu-icon" />}
          <span className="menu-title">{item.title}</span>
        </div>
        <div className="menu-children">
          {item.children.map((child, index) => (
            <MenuItem key={index} item={child} level={level + 1} />
          ))}
        </div>
      </div>
    );
  }

  if (hasChildren) {
    return (
      <div className="menu-group">
        <div 
          className="menu-item sub-header"
          onClick={handleToggle}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          {IconComponent && <IconComponent size={18} className="menu-icon" />}
          <span className="menu-title">{item.title}</span>
          <span className="chevron">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        </div>
        
        {isOpen && (
          <div className="menu-children">
            {item.children.map((child, index) => (
              <MenuItem key={index} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink 
      to={item.path} 
      className={({ isActive }) => 
        `menu-item ${isActive ? 'active' : ''}`
      }
      style={{ paddingLeft: `${paddingLeft}px` }}
    >
      {IconComponent && <IconComponent size={18} className="menu-icon" />}
      <span className="menu-title">{item.title}</span>
    </NavLink>
  );
};

// Main Sidebar component
const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <MenuItem key={index} item={item} />
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
```

---

## CSS Styles

```css
/* Sidebar.css */
:root {
  --sidebar-bg: #FFFFFF;
  --sidebar-width: 280px;
  --active-bg: #E3F2FD;
  --active-color: #007BFF;
  --inactive-icon: #6C757D;
  --inactive-text: #212529;
  --hover-bg: #F8F9FA;
  --divider: #E0E0E0;
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--sidebar-bg);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  overflow-y: auto;
  border-right: 1px solid var(--divider);
  font-family: 'Roboto', sans-serif;
}

.sidebar-nav {
  padding: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin: 4px 8px;
  border-radius: 8px;
  color: var(--inactive-text);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.menu-item:hover {
  background: var(--hover-bg);
}

.menu-item.active {
  background: var(--active-bg);
  color: var(--active-color);
}

.menu-item.active .menu-icon {
  color: var(--active-color);
}

.menu-item.section-header {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--inactive-icon);
  cursor: default;
}

.menu-item.section-header:hover {
  background: transparent;
}

.menu-item.sub-header {
  font-size: 14px;
  font-weight: 500;
}

.menu-icon {
  color: var(--inactive-icon);
  flex-shrink: 0;
}

.menu-title {
  font-size: 14px;
  flex: 1;
}

.chevron {
  color: var(--inactive-icon);
}

.menu-children {
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile */
@media (max-width: 768px) {
  .sidebar {
    width: 240px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1000;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
}
```

---

## Dependencies
```bash
npm install lucide-react react-router-dom
```
