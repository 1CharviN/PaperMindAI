# PaperMind AI - Design Guidelines

## Design Approach
**System-Based Approach** with modern productivity tool aesthetics inspired by Linear, Notion, and academic platforms like Mendeley. This academic research tool requires clarity, data hierarchy, and professional credibility while maintaining a modern, accessible interface.

---

## Core Design Principles

### Typography System
- **Primary Font**: Inter or Source Sans Pro (Google Fonts)
- **Monospace**: JetBrains Mono for code/citation snippets
- **Hierarchy**:
  - H1: text-4xl font-bold (Main dashboard headers)
  - H2: text-2xl font-semibold (Section titles)
  - H3: text-xl font-medium (Card headers, module titles)
  - Body: text-base (Standard content)
  - Small: text-sm (Metadata, timestamps)
  - Caption: text-xs (Helper text, labels)

### Layout & Spacing System
**Tailwind Spacing Units**: Consistently use 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-6 to p-8
- Section spacing: space-y-8 to space-y-12
- Card gaps: gap-6
- Container max-width: max-w-7xl with px-6

---

## Component Library

### 1. Navigation & Header
- **Top Navigation Bar**: Fixed header with logo left, main nav center, user profile/theme toggle right
- **Sidebar Navigation** (Dashboard): Collapsible side panel (w-64) with icon + label navigation
- Navigation items: Clean, minimal design with subtle hover states
- Include: Dashboard, Upload, History, Settings, Language selector

### 2. Upload Module Components
- **Drag-and-Drop Zone**: Large, prominent area (min-h-64) with dashed border, upload icon, clear instructions
- **File List Display**: Compact cards showing filename, size, status (processing/complete)
- **Progress Indicators**: Linear progress bars for upload and processing states
- **Supported Format Badges**: Small pills showing "PDF", "TXT" accepted formats

### 3. Dashboard & Results Display
- **Document Card Layout**: Grid system (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- **Analysis Results Panels**: Tabbed interface or accordion sections for Summary/Citations/Paraphrase/Plagiarism
- **Statistics Cards**: 4-column grid showing key metrics (document count, processing time, plagiarism score)
- **Data Visualization**: 
  - Donut chart for plagiarism score (use Chart.js or Recharts)
  - Circular progress indicators for completion status
  - Clean, minimal chart design with clear labels

### 4. Text Display Areas
- **Extracted Text Viewer**: White/neutral background panel with monospace font, line numbers optional
- **AI Results Display**: 
  - Summary: Paragraph format with generous line-height (leading-relaxed)
  - Citations: Numbered list with hanging indent
  - Paraphrased Text: Side-by-side comparison layout (original vs. paraphrased)

### 5. Action Components
- **Primary Actions**: Bold, clear buttons for "Upload Document", "Process with AI", "Generate Audio"
- **Secondary Actions**: Outlined style for "Download PDF", "Export Results"
- **Icon Buttons**: For theme toggle, language selector, audio controls
- **Audio Player**: Custom styled with play/pause, progress bar, timestamp, download option

### 6. History & Archive
- **Document List View**: Table layout with columns: Title, Upload Date, Plagiarism Score, Status, Actions
- **Quick Actions**: Inline icons for view, download, delete
- **Search & Filter Bar**: Top of history section with date range picker

### 7. Export & Download Center
- **Export Options Grid**: Cards for PDF Report, MP3 Audio, JSON Data, ZIP Archive
- Each card shows file type icon, format label, estimated size, download button

---

## Page-Specific Layouts

### Landing Page (Marketing)
- **Hero Section** (h-screen): 
  - Left: Large headline "AI-Powered Research Assistant", subheading, CTA buttons
  - Right: Dashboard screenshot or abstract illustration of document analysis
- **Features Grid**: 3-column layout showcasing key modules (Upload, AI Analysis, TTS, Export)
- **How It Works**: 4-step horizontal timeline with icons
- **Pricing/CTA Section**: Centered with plan comparison table
- **Footer**: Multi-column with links, social, newsletter signup

### Dashboard (Authenticated)
- **Sidebar + Main Content Layout**: 
  - Left sidebar (w-64) with navigation
  - Main content area with generous padding (p-8)
- **Welcome Header**: User name, quick stats row (4 stat cards)
- **Recent Documents**: Grid of document cards with thumbnails
- **Quick Actions**: Upload new document button (prominent), view history link

### Document Analysis View
- **Document Header**: Filename, upload date, processing status badge
- **Two-Column Layout**:
  - Left (60%): Extracted text viewer with scroll
  - Right (40%): AI results tabs (sticky position)
- **Bottom Action Bar**: Fixed bar with Export options, TTS controls

---

## Visual Patterns

### Cards & Containers
- Border radius: rounded-lg (8px)
- Subtle shadows: shadow-sm for elevation
- Border: border border-gray-200 in light mode
- Consistent padding: p-6

### Interactive States
- Hover: Subtle scale or brightness shift
- Active: Brief scale reduction
- Disabled: Reduced opacity (opacity-50)

### Icons
**Use Heroicons** via CDN (outline for nav, solid for actions)
- Navigation: 20px icons
- Action buttons: 16px icons
- Status indicators: 12px icons

### Loading States
- Skeleton screens for content loading
- Spinner for processing operations
- Linear progress bar for file uploads

---

## Accessibility & Themes

### Dark Mode Requirements
- Implement complete theme toggle (stored in localStorage)
- Use Tailwind's dark: prefix throughout
- Ensure contrast ratios meet WCAG AA standards
- Charts adapt to theme with appropriate color palettes

### Multi-Language Support
- Include language selector in header (dropdown with flags)
- All UI text in translation keys
- RTL support consideration for Arabic, Hebrew

---

## Special Considerations

### AI Processing Feedback
- Clear "Processing..." states with animated icons
- Success notifications with checkmark animations
- Error states with retry options

### Mobile Responsiveness
- Stack sidebar below header on mobile
- Single column layouts for document cards
- Collapsible sections for AI results
- Bottom navigation for key actions

### Performance Indicators
- Show processing time estimates
- Display API credit usage (if applicable)
- File size warnings for large uploads

---

This design creates a professional, data-rich academic tool that balances sophisticated functionality with approachable, modern aesthetics suitable for researchers and students.