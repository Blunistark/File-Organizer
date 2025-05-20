# Style Guide

## Design System

### Color Palette
- **Primary**: #4285F4 (Blue)
- **Secondary**: #34A853 (Green)
- **Accent**: #FBBC05 (Yellow)
- **Error**: #EA4335 (Red)
- **Background**: #F8F9FA (Light Gray)
- **Surface**: #FFFFFF (White)
- **Text Primary**: #202124 (Dark Gray)
- **Text Secondary**: #5F6368 (Medium Gray)

### Typography
- **Font Family**: Roboto, system-ui, sans-serif
- **Headings**:
  - H1: 28px, 300 weight
  - H2: 24px, 400 weight
  - H3: 20px, 500 weight
  - H4: 18px, 500 weight
- **Body**:
  - Regular: 16px, 400 weight
  - Small: 14px, 400 weight
- **Button Text**: 14px, 500 weight, uppercase

### Spacing
- Base unit: 8px
- Components spacing: multiples of 8px (8px, 16px, 24px, 32px, etc.)
- Page margins: 24px on mobile, 48px on desktop

### Elevation and Shadows
- **Level 1**: 0 1px 2px rgba(0,0,0,0.1)
- **Level 2**: 0 2px 4px rgba(0,0,0,0.1)
- **Level 3**: 0 4px 8px rgba(0,0,0,0.1)
- **Level 4**: 0 8px 16px rgba(0,0,0,0.1)

## Component Guidelines

### Buttons
- **Primary**: Filled with primary color
- **Secondary**: Outlined with primary color
- **Tertiary**: Text only with primary color
- Height: 40px
- Padding: 8px 16px
- Border radius: 4px

### Cards
- Background: Surface color
- Padding: 16px
- Border radius: 8px
- Elevation: Level 2 shadow

### Inputs
- Height: 40px
- Border: 1px solid #DADCE0
- Border radius: 4px
- Focus state: Primary color border, no shadow
- Padding: 8px 12px

### Lists and Tables
- Row height: 56px
- Divider: 1px solid #DADCE0
- Hover state: #F1F3F4

### File and Folder Icons
- Size: 32px x 32px
- Folder color: #FBBC05 (Yellow)
- File colors: Vary by type
  - Documents: #4285F4 (Blue)
  - Images: #34A853 (Green)
  - Audio/Video: #EA4335 (Red)
  - Archives: #5F6368 (Gray)

## Responsive Breakpoints
- **Mobile**: 0-599px
- **Tablet**: 600-1023px
- **Desktop**: 1024px and above

## Interaction Patterns

### Loading States
- Use skeleton loaders for content loading
- Progress indicators for file operations
- Subtle animations for transitions

### Feedback
- Toast notifications for success/error messages
- Inline validation for form inputs
- Animation duration: 150-200ms

### Transitions
- Ease-in-out timing function
- Duration: 150-200ms for UI elements, 300ms for larger transitions

## Accessibility Guidelines
- Maintain 4.5:1 contrast ratio for text
- Support keyboard navigation
- Use aria attributes appropriately
- Ensure all interactive elements have focus states
- Provide text alternatives for non-text content 