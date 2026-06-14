# jq Playground UI Design Specification

**Version:** 1.0  
**Date:** 2026-06-08  
**Status:** Draft for Implementation

---

## Overview

A browser-based jq (JSON query language) playground that allows users to interactively query, transform, and explore JSON data using jq filters. Privacy-first, local execution, no server required.

---

## User Stories

### Primary Users
1. **Backend Developer:** "I need to extract specific fields from a large JSON API response"
2. **DevOps Engineer:** "I want to filter Kubernetes JSON output to find pods in error state"
3. **Data Analyst:** "I need to transform nested JSON into a flat structure for analysis"
4. **Learning Developer:** "I want to learn jq syntax with instant feedback"

### Core Use Cases
1. Query JSON data with jq filters
2. Transform JSON structure (map, select, group)
3. Extract specific values from nested data
4. Test jq filters before using in scripts
5. Learn jq syntax through examples

---

## Layout Design

### Desktop Layout (>= 1024px)

```
┌─────────────────────────────────────────────────────────┐
│  Header: jq Playground + Quick Actions                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────┐  ┌──────────────────────────┐│
│  │                      │  │                          ││
│  │   JSON Input         │  │   Output Preview         ││
│  │   (Monaco Editor)    │  │   (Monaco Read-only)     ││
│  │                      │  │                          ││
│  │                      │  │                          ││
│  │                      │  │                          ││
│  │                      │  │                          ││
│  └──────────────────────┘  └──────────────────────────┘│
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ jq Filter: [________________________] [▶ Run]      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Examples: [Identity] [Select] [Map] [Group] ...   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px)

```
┌────────────────────────┐
│ Header + Actions       │
├────────────────────────┤
│ JSON Input             │
│ (Monaco or Textarea)   │
│                        │
├────────────────────────┤
│ jq Filter: [_____] [▶]│
├────────────────────────┤
│ Examples: [v]          │
├────────────────────────┤
│ Output Preview         │
│ (Monaco or Textarea)   │
│                        │
└────────────────────────┘
```

---

## Component Breakdown

### 1. Header Section

**Elements:**
- Tool title: "jq Playground"
- Description: "Query and transform JSON with jq filters"
- Action buttons:
  - [Try Example] - Load sample data
  - [Clear All] - Reset everything
  - [Share] - Copy shareable URL (future)

**Visual Style:**
- Clean, minimal header
- Icon: Terminal or code bracket icon
- Responsive: Collapse to minimal on mobile

---

### 2. JSON Input Editor

**Features:**
- Monaco Editor (syntax highlighting)
- Line numbers
- Collapsible/expandable
- JSON validation (real-time)
- Paste detection (auto-format)
- Error indicators for invalid JSON

**Toolbar:**
- [Format JSON] - Pretty-print
- [Minify] - Compress JSON
- [Upload File] - Import JSON file
- [Clear] - Empty input

**Placeholder Text:**
```json
{
  "users": [
    {"name": "Alice", "age": 30},
    {"name": "Bob", "age": 25}
  ]
}
```

**Size:**
- Desktop: 50% width, 400-600px height
- Mobile: Full width, 300px height (expandable)

---

### 3. jq Filter Input

**Design:**
- Large text input field
- Monospace font
- Syntax highlighting (if possible)
- Auto-complete suggestions for common functions
- Error highlighting

**Features:**
- Real-time validation
- History (localStorage, last 10 filters)
- Keyboard shortcut: Ctrl/Cmd+Enter to run

**Placeholder:**
```
.users[] | select(.age > 25)
```

**Common Errors to Catch:**
- Missing quotes
- Unmatched brackets
- Invalid function names
- Syntax errors

**Size:**
- Full width
- Single line (expandable to multi-line if complex)

---

### 4. Output Preview

**Features:**
- Monaco Editor (read-only)
- Syntax highlighting for JSON output
- Copy to clipboard button
- Download as JSON button
- Toggle between:
  - Formatted (pretty-print)
  - Compact (single-line)
  - Raw (jq raw output)

**Error Display:**
- Show jq error messages prominently
- Highlight error location in filter if possible
- Suggest common fixes

**Example Error:**
```
❌ jq error: Cannot iterate over null (.users)
   at filter: .users[]
   
💡 Suggestion: Check if .users exists first: .users[]?
```

**Size:**
- Desktop: 50% width, 400-600px height
- Mobile: Full width, 300px height (expandable)

---

### 5. Example Filters Section

**Layout:**
- Horizontal scrollable chips/buttons
- Icon + Label for each example

**Examples (Minimum 10):**

1. **Identity** - `.` (return input as-is)
2. **Field Access** - `.name` (get field value)
3. **Array Item** - `.[0]` (first element)
4. **All Items** - `.[]` (iterate all)
5. **Select** - `.[] | select(.age > 25)` (filter items)
6. **Map** - `.[] | .name` (extract field from all)
7. **Keys** - `keys` (get object keys)
8. **Length** - `length` (count items)
9. **Group By** - `group_by(.category)` (group items)
10. **Sort** - `sort_by(.age)` (sort items)
11. **Unique** - `unique` (remove duplicates)
12. **First/Last** - `first`, `last` (boundary items)

**Interaction:**
- Click example → loads sample data + filter
- Each example has:
  - Name
  - jq filter
  - Sample input data
  - Expected output

**Visual:**
- Chips with hover effect
- Icon indicating category (filter, transform, aggregate)
- Tooltip with description

---

### 6. Advanced Features Panel (Collapsible)

**Location:** Below examples, initially collapsed

**Contents:**

**A. Filter Library**
- Saved filters (localStorage)
- "Star" button to save current filter
- List of saved filters with:
  - Name (editable)
  - Filter text
  - Date saved
  - Delete button

**B. jq Cheatsheet**
- Quick reference accordion:
  - Basic operations (., .field, .[])
  - Filters (select, map, sort, group_by)
  - Operators (|, ,, ?)
  - Functions (keys, length, type, has)
  - String operations (split, join, startswith)
  - Math operations (add, min, max, floor)

**C. Performance Metrics**
- Execution time
- Input size (bytes)
- Output size (bytes)
- Memory usage (if available)

---

## Color Scheme & Visual Design

### Colors

**Light Mode:**
- Background: `#ffffff`
- Card Background: `#f8f9fa`
- Border: `#e2e8f0`
- Primary (Run button): `#0ea5e9` (cyan-500)
- Success (output): `#10b981` (emerald-500)
- Error: `#ef4444` (red-500)
- Text: `#1e293b` (slate-800)

**Dark Mode:**
- Background: `#0f172a` (slate-900)
- Card Background: `#1e293b` (slate-800)
- Border: `#334155` (slate-700)
- Primary: `#38bdf8` (cyan-400)
- Success: `#34d399` (emerald-400)
- Error: `#f87171` (red-400)
- Text: `#f1f5f9` (slate-100)

### Typography
- Headers: `font-semibold text-lg`
- Code: `font-mono text-sm`
- Labels: `font-medium text-sm`
- Body: `text-base`

---

## Interaction Patterns

### Auto-Run vs Manual Run

**Default:** Manual run (click [▶ Run] button)

**Auto-run Toggle (Optional):**
- Checkbox: "Auto-run on input change"
- Debounce: 500ms after typing stops
- Disable for large inputs (>1MB)

**Decision:** Start with manual run, add auto-run in Phase 2

---

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Run filter |
| `Ctrl/Cmd + K` | Focus filter input |
| `Ctrl/Cmd + /` | Toggle cheatsheet |
| `Ctrl/Cmd + L` | Clear all |
| `Ctrl/Cmd + S` | Save current filter |
| `Alt + F` | Format JSON |

---

### Error Handling

**Levels:**

1. **JSON Parse Error** (Input)
   - Show error inline below JSON input
   - Highlight error line in Monaco
   - Suggest: "Check for missing commas, quotes, or brackets"

2. **jq Syntax Error** (Filter)
   - Show error inline below filter input
   - Parse jq error message
   - Show user-friendly explanation
   - Suggest correction if possible

3. **jq Runtime Error** (Execution)
   - Show in output area
   - Explain what went wrong (e.g., "Cannot iterate over null")
   - Show filter that caused error
   - Suggest using optional operator (?)

**Example Error Component:**
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>jq Error</AlertTitle>
  <AlertDescription>
    Cannot iterate over null at <code>.users[]</code>
    <br />
    <span className="text-sm text-muted-foreground">
      💡 Try using the optional operator: <code>.users[]?</code>
    </span>
  </AlertDescription>
</Alert>
```

---

## Responsive Behavior

### Breakpoints

- **Mobile:** < 768px
- **Tablet:** 768px - 1023px
- **Desktop:** >= 1024px

### Mobile Adaptations

1. **Stack Layout:**
   - Input → Filter → Output (vertical)
   - No side-by-side editors

2. **Simplified Editors:**
   - Fall back to `<textarea>` if Monaco is too heavy
   - Or use lightweight Monaco with fewer features

3. **Collapsible Sections:**
   - Examples: Dropdown instead of horizontal scroll
   - Cheatsheet: Modal instead of inline panel

4. **Touch Optimizations:**
   - Larger tap targets (44×44px minimum)
   - Swipe to switch between input/output
   - Bottom-anchored action buttons

---

## Performance Considerations

### Large Inputs

**Problem:** jq execution can be slow for large JSON (>10MB)

**Solutions:**
1. **Input Size Warning:**
   - Show warning at >5MB: "Large input detected. Processing may take a few seconds."
   - Recommend: "Consider filtering input first or using a smaller sample."

2. **Loading State:**
   - Show spinner during execution
   - "Processing..." message
   - Cancel button (if possible)

3. **Worker Thread:**
   - Run jq in Web Worker to avoid blocking UI
   - Show progress if execution takes >500ms

---

## Accessibility (A11Y)

### WCAG 2.1 AA Compliance

1. **Keyboard Navigation:**
   - All actions accessible via keyboard
   - Logical tab order
   - Focus visible indicators

2. **Screen Readers:**
   - `aria-label` on all icon buttons
   - `role="region"` for main sections
   - Announce errors with `aria-live="polite"`

3. **Color Contrast:**
   - 4.5:1 minimum for text
   - 3:1 for UI components
   - Don't rely solely on color for error states

4. **Text Scaling:**
   - Support up to 200% zoom
   - Use relative units (rem, em)

---

## MVP Feature Checklist

### Phase 1 (Week 1)

- [ ] JSON input editor (Monaco)
- [ ] jq filter input field
- [ ] Output preview (Monaco read-only)
- [ ] [Run] button
- [ ] Error display
- [ ] 5 example filters with sample data
- [ ] Copy output button
- [ ] Basic responsive layout
- [ ] jq-wasm integration
- [ ] JSON validation

### Phase 2 (Week 2)

- [ ] 10+ example filters
- [ ] Filter history (localStorage)
- [ ] Format/Minify JSON buttons
- [ ] Upload JSON file
- [ ] Download output
- [ ] jq cheatsheet (collapsible)
- [ ] Keyboard shortcuts
- [ ] Auto-run toggle
- [ ] Performance metrics

### Phase 3 (Future)

- [ ] Filter library (save/load)
- [ ] Share via URL
- [ ] Multi-step pipeline builder
- [ ] Syntax highlighting for jq filter
- [ ] Auto-complete for jq functions
- [ ] Diff view (input vs output)

---

## Component File Structure

```
src/
  app/[lang]/jq-playground/
    page.tsx                 # Main page component
  features/tools/jq-playground/components/
    jq-input-editor.tsx      # JSON input Monaco editor
    jq-filter-input.tsx      # jq filter input field
    jq-output-preview.tsx    # Output Monaco editor
    jq-examples.tsx          # Example filters chips
    jq-cheatsheet.tsx        # Collapsible cheatsheet
    jq-error-display.tsx     # Error message component
  lib/
    jq-utils.ts              # jq execution wrapper
    jq-examples.ts           # Example filters data
    jq-error-parser.ts       # Parse jq errors to friendly messages
  tests/
    jq-utils.test.ts         # jq execution tests
    jq-error-parser.test.ts  # Error parsing tests
```

---

## Example Filter Data Structure

```typescript
export interface JqExample {
  id: string
  name: string
  category: 'basic' | 'filter' | 'transform' | 'aggregate'
  filter: string
  input: unknown
  expectedOutput: unknown
  description: string
  icon?: string
}

export const JQ_EXAMPLES: JqExample[] = [
  {
    id: 'identity',
    name: 'Identity',
    category: 'basic',
    filter: '.',
    input: { name: 'Alice', age: 30 },
    expectedOutput: { name: 'Alice', age: 30 },
    description: 'Return the input unchanged',
  },
  // ... more examples
]
```

---

## Success Metrics

### User Engagement
- Time spent on tool (target: >2 minutes)
- Filters executed per session (target: >5)
- Example usage rate (target: >70% try at least 1)

### Technical
- Error rate (target: <5% of executions fail)
- Load time (target: <3s on 3G)
- Bundle size increase (target: <2MB gzipped)

### Quality
- Mobile usability score (target: >90)
- Accessibility score (target: 100)
- Performance score (target: >90)

---

## Open Questions

1. **Monaco vs Lightweight Editor:**
   - Monaco is feature-rich but large bundle (~500KB)
   - CodeMirror is lighter (~200KB) but fewer features
   - Decision: Start with Monaco, optimize later

2. **Auto-run Default:**
   - Pro: Instant feedback, better UX
   - Con: Performance issues with large inputs
   - Decision: Manual run for MVP, add toggle later

3. **Share Feature:**
   - Encode filter + sample data in URL
   - Privacy concern: sensitive data in URL
   - Decision: Phase 3, add privacy warning

---

## Next Steps

1. ✅ **Research complete** - jq-wasm selected
2. ✅ **UI design complete** - documented in this file
3. ⏭️ **Prototype:** Build basic HTML mockup
4. ⏭️ **Implementation:** Create React components
5. ⏭️ **Integration:** Install jq-wasm and wire up
6. ⏭️ **Testing:** Unit + integration tests
7. ⏭️ **Polish:** Add examples, cheatsheet, documentation

---

**Design Status:** ✅ Ready for Implementation  
**Approved By:** Technical Team  
**Date:** 2026-06-08
