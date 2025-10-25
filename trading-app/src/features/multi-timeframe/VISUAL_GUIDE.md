# 📱 Visual Guide - Multi-Timeframe Charts

## 🖥️ Application Layout

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  [← Back]  ₿ Bitcoin Multi-Timeframe Analysis  $67,234.50 +2.34%       │
│                                                                          │
│  [+ Add Chart] [⚡ Swing Structure] [Lookback: 5▼] [Analyze: 200▼] ⏱️  │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ 1 Minute ▼  │  │ 5 Minutes ▼ │  │ 15 Minutes▼ │  │ 30 Minutes▼ │  │
│  │     +12.50  │  │     +15.25  │  │     +18.75  │  │     +22.10  │  │
│  │             │  │             │  │             │  │             │  │
│  │   [Chart]   │  │   [Chart]   │  │   [Chart]   │  │   [Chart]   │  │
│  │             │  │             │  │             │  │             │  │
│  │      ⋮      │  │      ⋮      │  │      ⋮      │  │      ⋮      │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ 1 Hour ▼    │  │ 4 Hours ▼   │  │ Daily ▼     │  │ Weekly ▼    │  │
│  │     +25.50  │  │     +32.75  │  │     +45.20  │  │     +78.90  │  │
│  │             │  │             │  │             │  │             │  │
│  │   [Chart]   │  │   [Chart]   │  │   [Chart]   │  │   [Chart]   │  │
│  │             │  │             │  │             │  │             │  │
│  │      ⋮      │  │      ⋮      │  │      ⋮      │  │      ⋮      │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```text
---

## 🎯 Feature Interactions

### 1. ➕ Add Chart

#### Visual Flow

```text
Step 1: Click "Add Chart" Button
┌─────────────────┐
│  [+ Add Chart]  │ ← Click here
└─────────────────┘

         ↓

Step 2: Modal Appears
┌────────────────────────────────────┐
│  Add New Chart                  [×]│
│────────────────────────────────────│
│                                    │
│  ┌──────┐ ┌──────┐ ┌──────┐      │
│  │ 1m   │ │ 3m   │ │ 5m   │      │
│  └──────┘ └──────┘ └──────┘      │
│                                    │
│  ┌──────┐ ┌──────┐ ┌──────┐      │
│  │ 15m  │ │ 30m  │ │ 1h   │      │
│  └──────┘ └──────┘ └──────┘      │
│                                    │
│  ┌──────┐ ┌──────┐ ┌──────┐      │
│  │ 2h   │ │ 4h ✓ │ │ 6h   │      │ ← Selected
│  └──────┘ └──────┘ └──────┘      │
│                                    │
│        [Cancel]  [Add Chart]      │
└────────────────────────────────────┘

         ↓

Step 3: New Chart Appears
┌─────────────┐
│ 4 Hours ▼   │ ← New chart added!
│    +32.75   │
│             │
│  [Chart]    │
│             │
│     ⋮       │
└─────────────┘
```text
---

### 2. 📏 Resize Chart

#### Visual Flow

```text
Normal State (No Hover):
┌─────────────┐
│ 1 Hour ▼    │
│    +25.50   │
│             │
│  [Chart]    │
│             │
│             │
└─────────────┘

Hover State (Handle Appears):
┌─────────────┐
│ 1 Hour ▼    │
│    +25.50   │
│             │
│  [Chart]    │
│             │
│             │
│    ╱═══╲    │ ← Resize handle appears!
└─────────────┘

Dragging (Resize in Progress):
┌─────────────┐
│ 1 Hour ▼    │
│    +25.50   │
│             │
│  [Chart]    │
│             │
│             │
│             │
│             │ ← Dragging down increases height
│    ╱═══╲    │
└─────────────┘
      ↓ drag

Result (New Size):
┌─────────────┐
│ 1 Hour ▼    │
│    +25.50   │
│             │
│             │
│  [Chart]    │
│             │
│             │
│             │
│             │ ← Taller chart!
│             │
└─────────────┘
```text
---

### 3. 🗑️ Delete Chart

#### Visual Flow

```text
Normal State:
┌─────────────┐
│ 1 Hour ▼  [×]│ ← Delete button
│    +25.50   │
│             │
│  [Chart]    │
│             │
└─────────────┘

Hover on Delete Button:
┌─────────────┐
│ 1 Hour ▼  [×]│ ← Button turns red
│    +25.50   │
│             │
│  [Chart]    │
│             │
└─────────────┘

After Click (Chart Removed):
┌─────────────────────────────────┐
│                                  │
│  (Chart has been removed)        │
│  Grid re-flows automatically     │
│                                  │
└─────────────────────────────────┘
```text
---

### 4. ⏱️ Change Timeframe

#### Visual Flow

```text
Initial State:
┌─────────────┐
│ 1 Hour ▼    │ ← Click dropdown
│    +25.50   │
│             │
│  [Chart]    │
│             │
└─────────────┘

Dropdown Open:
┌─────────────┐
│ 1 Hour ▼    │
├─────────────┤
│  1 Minute   │
│  3 Minutes  │
│  5 Minutes  │
│  15 Minutes │
│  30 Minutes │
│→ 1 Hour ✓   │ ← Current
│  2 Hours    │
│  4 Hours ←  │ ← Select this
│  6 Hours    │
│  ...        │
└─────────────┘

Loading State:
┌─────────────┐
│ 4 Hours ▼   │ ← Changed!
│  Loading... │
│             │
│     ⏳      │
│             │
└─────────────┘

Updated Chart:
┌─────────────┐
│ 4 Hours ▼   │
│    +32.75   │
│             │
│  [Chart]    │ ← New data loaded
│             │
└─────────────┘
```text
---

## 🎨 UI States

### Chart States

**1. Normal State**

```text
┌──────────────────────┐
│ 15 Minutes ▼     [×] │
│              +18.75   │
├──────────────────────┤
│                      │
│    📊 Chart Data     │
│                      │
└──────────────────────┘
```text
**2. Hover State**

```text
┌══════════════════════┐ ← Blue border
│ 15 Minutes ▼     [×] │
│              +18.75   │
├══════════════════════┤
│                      │
│    📊 Chart Data     │
│                      │
│       ╱═══╲         │ ← Resize handle visible
└══════════════════════┘
```text
**3. Loading State**

```text
┌──────────────────────┐
│ 15 Minutes ▼     [×] │
│          Loading...   │
├──────────────────────┤
│                      │
│        ⏳  ⏳        │
│                      │
└──────────────────────┘
```text
**4. Error State**

```text
┌──────────────────────┐
│ 15 Minutes ▼     [×] │
│          Failed       │
├──────────────────────┤
│                      │
│    ⚠️ Load Error    │
│                      │
└──────────────────────┘

┌────────────────────────┐
│ ⚠️ Failed to load data │ ← Error toast
└────────────────────────┘
```text
---

## 📱 Responsive Behavior

### Desktop (> 1920px) - 4 Columns

```text
┌───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │
├───┼───┼───┼───┤
│ 5 │ 6 │ 7 │ 8 │
└───┴───┴───┴───┘
```text
### Laptop (1600px) - 3 Columns

```text
┌───┬───┬───┐
│ 1 │ 2 │ 3 │
├───┼───┼───┤
│ 4 │ 5 │ 6 │
├───┼───┼───┤
│ 7 │ 8 │   │
└───┴───┴───┘
```text
### Tablet (1200px) - 2 Columns

```text
┌─────┬─────┐
│  1  │  2  │
├─────┼─────┤
│  3  │  4  │
├─────┼─────┤
│  5  │  6  │
├─────┼─────┤
│  7  │  8  │
└─────┴─────┘
```text
### Mobile (768px) - 1 Column

```text
┌───────────┐
│     1     │
├───────────┤
│     2     │
├───────────┤
│     3     │
├───────────┤
│     4     │
└───────────┘
```text
---

## 🎮 Keyboard Shortcuts

While there are no keyboard shortcuts implemented yet, the UI is keyboard-accessible:

```text
Tab      → Navigate between controls
Enter    → Activate button/select
Space    → Toggle button
Esc      → Close modal
↑/↓      → Navigate dropdown
```text
---

## 🎨 Color Scheme

### Main Colors

```text
Background:     #0a0e27  ████████
Card:           #131722  ████████
Border:         #2a2e39  ████████
Text:           #d1d4dc  ████████
Accent:         #2962ff  ████████
Bitcoin:        #f7931a  ████████
Bullish:        #26a69a  ████████
Bearish:        #ef5350  ████████
```text
### States

```text
Hover:          #2962ff with opacity
Active:         #1e53e5
Disabled:       #787b86
Loading:        Animated spinner
```text
---

## 🔄 Auto-Refresh Visual

```text
Normal State:
┌──────────────────────┐
│ 🟢 Auto-refresh: 30s │
└──────────────────────┘

Refreshing:
┌──────────────────────┐
│ 🔄 Refreshing...     │
└──────────────────────┘

Complete:
┌──────────────────────┐
│ ✅ Updated           │
└──────────────────────┘
(Returns to normal after 2s)
```text
---

## 💡 UI Tips

### Visual Feedback

- **Buttons**: Change color on hover
- **Charts**: Blue border on hover
- **Resize**: Handle appears on hover
- **Loading**: Spinner animation
- **Success**: Green indicators
- **Error**: Red notifications

### Interactions

1. **Hover** reveals additional controls
2. **Click** activates primary action
3. **Drag** for resize operation
4. **Select** from dropdowns for choices
5. **Modal** for complex selections

### Best Practices

- ✅ Wait for charts to load before resizing
- ✅ Use modal to add multiple charts at once
- ✅ Hover to reveal resize handles
- ✅ Watch for loading indicators
- ✅ Check error messages if issues occur

---

## 📊 Chart Anatomy

```text
┌─────────────────────────────────────────┐
│ ┌─ Header ──────────────────────────┐  │
│ │                                    │  │
│ │  [Timeframe ▼]     +$123.45   [×] │  │
│ │   ↑                  ↑          ↑  │  │
│ │   │                  │          │  │  │
│ │   └─Select           └─Price    └─Delete
│ │                                    │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌─ Chart Area ──────────────────────┐  │
│ │                                    │  │
│ │    📊 LightweightCharts Canvas    │  │
│ │                                    │  │
│ │    ─── Candlesticks               │  │
│ │    ─── Swing Lines                │  │
│ │    ─── Crosshair                  │  │
│ │                                    │  │
│ └────────────────────────────────────┘  │
│                                          │
│         ┌─ Resize Handle ─┐             │
│         │     ╱═══╲       │             │
│         └──────────────────┘             │
│                                          │
└─────────────────────────────────────────┘
```text
---

## 🎯 Quick Reference Guide

### Common Actions

| Action | Steps | Visual Cue |
|--------|-------|------------|
| Add Chart | Click "Add Chart" → Select → Confirm | Blue button, modal |
| Resize | Hover → Drag handle | Handle appears |
| Delete | Click X in header | Red on hover |
| Change TF | Click dropdown → Select | Dropdown arrow |
| Toggle Swing | Click "Swing Structure" | Active = blue |

---

## 🖱️ Mouse Interactions

```text
Single Click:
  - Buttons → Action
  - Dropdown → Open
  - Chart → Focus

Drag:
  - Resize handle → Adjust height
  - (Future: Chart → Reorder)

Hover:
  - Charts → Show controls
  - Buttons → Highlight
  - Handle → Reveal

Double Click:
  - (Future: Chart → Fullscreen)
```text
---

## ✨ Animation & Transitions

### Smooth Transitions

- Buttons: 0.2s ease
- Charts: 0.3s fade-in
- Modal: 0.2s slide-up
- Resize: Real-time (no transition)
- Delete: Instant removal with re-flow

### Loading States

- Spinner rotation: 1s linear infinite
- Pulse indicator: 2s ease infinite
- Fade effects: 0.3s

---

## 📐 Dimensions

### Default Sizes

```text
Chart Height:    400px (default)
Chart Min Height: 250px
Chart Max Height: Unlimited
Header Height:    60px
Grid Gap:         10px
```text
### Responsive Breakpoints

```text
1920px+  →  4 columns
1600px+  →  3 columns
1200px+  →  2 columns
768px+   →  2 columns
<768px   →  1 column
```text
---

**This visual guide helps you understand all UI interactions in the Multi-Timeframe Chart application!**

