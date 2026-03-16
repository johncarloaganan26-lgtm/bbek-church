# Sidebar Component Design Prompt

## Project Overview
Design and implement an enhanced sidebar navigation component for the BBEK Church Admin Dashboard. The sidebar should provide intuitive navigation with clear visual hierarchy, consistent styling, and responsive behavior.

## Current Implementation Reference
The existing sidebar is located at `fe/src/views/AdminDashboard.vue` and uses Vuetify's `v-navigation-drawer` component with `v-list` and `v-list-group` for navigation structure.

## Design Requirements

### 1. Visual Hierarchy & Structure
- **Container**: Fixed sidebar with width of 280px (desktop), temporary (overlay) on mobile
- **Logo Area**: Display church logo (40x40px) with church name and acronym
- **Panel Label**: Show "ADMIN PANEL" or "STAFF PANEL" in uppercase with small font
- **Navigation Sections**: Group menu items into logical sections with expandable groups

### 2. Menu Item Design
- **Icon Size**: 24px (Material Design Icons)
- **Text Style**: 
  - Section headers: Uppercase, bold, 14px
  - Menu items: Sentence case, 14px
- **Active State**: Highlight selected menu item with primary color background
- **Hover State**: Subtle background color change on hover

### 3. Color Scheme
- **Primary Color**: #007bff (blue) - for active states and accents
- **Secondary Color**: #6c757d (gray) - for icons and inactive items
- **Background**: #ffffff (white) - sidebar background
- **Hover Background**: #f8f9fa (light gray)
- **Active Background**: #e3f2fd (light blue)
- **Text Colors**:
  - Primary: #212529 (dark gray) - for main text
  - Secondary: #6c757d (gray) - for subtitles and metadata
  - Active: #007bff (blue) - for selected menu item text

### 4. Icon Selection Guidelines
- Use Material Design Icons (MDI) library
- Select icons that clearly represent the functionality
- Ensure consistency in icon style (outline vs filled)
- Icon List:
  - Dashboard: `mdi-home`
  - Church Records: `mdi-database`
  - Accounts: `mdi-account`
  - Departments: `mdi-office-building`
  - Member Record: `mdi-account-group`
  - Church Leaders: `mdi-account-tie`
  - Events Records: `mdi-calendar`
  - Tithes & Offerings: `mdi-gift`
  - Ministries: `mdi-handshake`
  - Services: `mdi-gift-outline`
  - Discipleship Requests: `mdi-account-plus`
  - Water Baptism: `mdi-water`
  - Child Dedication: `mdi-baby-face`
  - Burial Service: `mdi-coffin`
  - Communication: `mdi-message`
  - Messages: `mdi-message-text`
  - Maintenance: `mdi-cog`
  - Archives: `mdi-folder`
  - Audit Trail: `mdi-file-document`
  - Settings: `mdi-cog`
  - Content Management: `mdi-file-document-edit`

### 5. Typography
- **Font Family**: Roboto (Google Fonts)
- **Section Headers**: 14px, uppercase, bold, letter-spacing: 0.5px
- **Menu Items**: 14px, regular weight, line-height: 1.4
- **Panel Label**: 12px, uppercase, gray text

### 6. Spacing & Layout
- **Container Padding**: 16px (pa-4 in Vuetify)
- **Logo Area**: 40px bottom margin after church name
- **Panel Label**: 24px bottom margin
- **Menu Group Spacing**: 8px between groups
- **Menu Item Padding**: 12px (compact density)
- **Icon-to-Text Spacing**: 16px (8px Vuetify default)
- **Sub-menu Indentation**: 40px (24px icon + 16px spacing)

### 7. Responsive Behavior
- **Desktop (≥ 1200px)**: Persistent (always visible), width 280px
- **Tablet (768px - 1199px)**: Temporary (overlay), width 260px
- **Mobile (< 768px)**: Temporary (overlay), width 240px
- **Drawer Toggle**: App bar navigation icon for mobile, persistent on desktop

### 8. Interactions
- **Expand/Collapse Groups**: Click section header to toggle sub-menu visibility
- **Navigation**: Click menu item to navigate to corresponding route
- **Active State**: Highlight current route with primary color
- **Mobile Close**: Auto-close drawer when menu item is selected
- **Hover Effects**: Smooth transition on hover and active states (0.2s duration)

### 9. Accessibility
- **Focus States**: Clear focus indicator for keyboard navigation
- **ARIA Labels**: Proper accessibility attributes for screen readers
- **Contrast**: Ensure text meets WCAG 2.0 AA contrast requirements (≥ 4.5:1)
- **Keyboard Navigation**: Support for Tab, Enter, and Arrow keys

### 10. Animation & Transitions
- **Drawer Animation**: Smooth slide-in from left (300ms duration)
- **Group Expansion**: Collapse/expand with fade and slide (200ms duration)
- **Hover Transitions**: Background color change with 0.2s ease-in-out
- **Active State Transition**: Smooth color change when selected (0.3s duration)

## Implementation Guidelines

### 1. Vue 3 + Vuetify 3
- Use `<v-navigation-drawer>` component with appropriate props
- Implement `<v-list>` and `<v-list-group>` for navigation structure
- Utilize Vuetify's color system and typography utilities

### 2. Data Structure
- Define navigation items in a structured format (array of objects)
- Include: icon, title, route name, section, admin-only flag
- Example:
  ```javascript
  const navigationItems = [
    { 
      section: 'Overview',
      items: [
        { icon: 'mdi-home', title: 'Dashboard', route: 'Dashboard' }
      ]
    },
    {
      section: 'Church Records',
      items: [
        { icon: 'mdi-account', title: 'Accounts', route: 'Accounts' },
        { icon: 'mdi-office-building', title: 'Departments', route: 'Departments' }
      ]
    }
  ]
  ```

### 3. Route Integration
- Use `$route.name` to determine active state
- Implement navigation via `:to` prop with route name
- Handle mobile drawer closing on navigation

### 4. User Role Handling
- Hide admin-only items based on user position
- Show "ADMIN PANEL" or "STAFF PANEL" label based on user role

## Performance Considerations
- Lazy load navigation items if needed (for very large menus)
- Debounce any search/filter functionality
- Optimize icon loading (use SVG or tree-shake icon library)

## Browser Compatibility
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Testing Requirements
- Test on various screen sizes (mobile, tablet, desktop)
- Test navigation functionality and active states
- Test accessibility (screen reader, keyboard navigation)
- Test responsive behavior and drawer animations
