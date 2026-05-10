---
name: NIRFactura Design System
description: Design tokens, component API, layout conventions and rules for the NIRFactura UI. Use this skill before writing any UI code — components, layouts, styling, new pages, or visual changes.
---

# NIRFactura Design System

Reference this before writing any UI code. All components live in `components/ui/` and are exported from `components/ui/index.ts`.

---

## Color Palette

### Background
| Token | Value | Usage |
|---|---|---|
| `--background` | `#f5f5f0` | Page background (warm off-white) |
| `bg-white` | `#ffffff` | Cards, tables, input surfaces — must pop against page bg |
| `bg-[#f5f5f0]` | `#f5f5f0` | Explicit page bg on `<main>` |

### Text
| Class | Hex | Contrast on `#f5f5f0` | Usage |
|---|---|---|---|
| `text-gray-900` | `#111827` | 16:1 ✅ | Headings, strong emphasis |
| `text-gray-700` | `#374151` | 9:1 ✅ | Body text |
| `text-gray-600` | `#4B5563` | 6.5:1 ✅ | Computed values, secondary body |
| `text-gray-500` | `#6B7280` | 4.6:1 ✅ | Subheadings, labels, muted text |
| `text-gray-400` | `#9CA3AF` | 2.3:1 ❌ | **NEVER use on page background** |

### Semantic
| Purpose | Classes |
|---|---|
| Primary action | `bg-green-600` / `hover:bg-green-700` |
| Destructive | `text-red-400` / `hover:text-red-600` |
| Error feedback | `text-red-600 bg-red-50 border-red-200` |
| Link / info | `text-blue-600` / `hover:text-blue-800` |
| Focus ring | `focus:ring-1 focus:ring-blue-400` |
| Disabled | `bg-gray-300 cursor-not-allowed` |
| Drag active | `border-blue-500 bg-blue-50` |
| Table header | `bg-blue-50 text-gray-700` |
| Table footer | `bg-yellow-50 text-gray-900` |
| Table computed cell | `bg-gray-50 text-gray-600` |

### Borders
- Default: `border-gray-200`
- Dashed upload zone: `border-gray-300` → hover `border-blue-400`

---

## Typography — `<Text>`

**File:** `components/ui/Text.tsx`

```tsx
<Text variant="heading">NIRFactura</Text>
<Text variant="subheading">Factura → NIR Excel in secunde</Text>
<Text variant="body">Regular content</Text>
<Text variant="muted">Secondary hint</Text>

// Render as different HTML tag
<Text as="h1" variant="heading">Title</Text>
<Text as="span" variant="muted">Inline hint</Text>
```

| Variant | Classes | Usage |
|---|---|---|
| `heading` | `text-4xl font-bold text-gray-900` | Page titles only |
| `subheading` | `text-base text-gray-500` | Page subtitles, section labels |
| `body` | `text-base text-gray-700` | General content, descriptions |
| `muted` | `text-sm text-gray-500` | Hints, file size limits, captions |

**Rules:**
- Always use `<Text>` for content — never raw `<p>` or `<span>` with ad-hoc color classes
- `text-gray-400` is banned for new text — minimum is `text-gray-500`
- `heading` is `text-4xl` — do not add a bigger size elsewhere; use `heading` and override sparingly via `className`

---

## Buttons — `<Button>`

**File:** `components/ui/Button.tsx`

Polymorphic — renders as `<button>`, `<a>`, or `<label>`.

```tsx
// Standard button
<Button variant="primary" onClick={fn}>Save</Button>
<Button variant="primary" loading={true}>Saving...</Button>
<Button variant="primary" disabled>Disabled</Button>

// Text-style actions
<Button variant="ghost" onClick={fn}>Cancel</Button>
<Button variant="link" onClick={fn}>View details</Button>
<Button variant="danger" onClick={fn}>✕</Button>

// Hyperlink
<Button as="a" href="/page" variant="link">Go somewhere</Button>

// Pressable card / file input trigger
<Button as="label" htmlFor="input-id" variant="card" className="...your styles...">
  <input id="input-id" type="file" className="hidden" />
  Drop content here
</Button>
```

| Variant | Style | When to use |
|---|---|---|
| `primary` | Green filled, white text, rounded-xl | Main CTA — one per view |
| `ghost` | Gray underlined text | Secondary action, reset, cancel |
| `link` | Blue text + gap for icon | Navigation, inline links |
| `danger` | Red text, xs | Destructive row-level actions (delete) |
| `card` | `block w-full cursor-pointer` | Pressable card/label areas — caller provides all visual styling via `className` |

**Press feedback (built-in, do not override):**
- `primary`: `active:scale-[0.97] active:brightness-95`
- `ghost/link/danger`: `active:opacity-60`
- `card`: `active:opacity-80`

**Rules:**
- Every tappable surface must use `<Button>` — no raw `<div onClick>`, `<a>`, or `<label>` directly
- `loading` prop only works on `as="button"` (default)
- `disabled` prop only applies when `as="button"`

---

## Card — `<Card>`

**File:** `components/ui/Card.tsx`

```tsx
<Card>Content</Card>
<Card className="grid grid-cols-2 gap-4">...</Card>
```

- Background: `bg-white` (always white — must contrast against `#f5f5f0` page bg)
- Border: `border border-gray-200`
- Radius: `rounded-xl`
- Padding: `p-4` default — override with `className`

**Rule:** Use `Card` for any grouped content section. Never use a raw `<div>` with manual `bg-white border rounded` — that duplicates the component.

---

## Input — `<Input>`

**File:** `components/ui/Input.tsx`

```tsx
<Input value={val} onChange={fn} />                    // default variant
<Input variant="cell" value={val} onChange={fn} />     // compact table cell
```

| Variant | Usage |
|---|---|
| `default` | Form fields, search, standalone inputs |
| `cell` | Inside table cells — no border, no padding |

Both variants: `text-sm text-gray-900 focus:ring-1 focus:ring-blue-400`

---

## Label — `<Label>`

**File:** `components/ui/Label.tsx`

```tsx
<Label>Furnizor</Label>
```

- Style: `text-xs font-medium text-gray-500 uppercase tracking-wide`
- Used as **form field labels only** — not as pressable areas (use `<Button as="label">` for that)

---

## Field — `<Field>`

```tsx
<Field label="Furnizor" value={val} onChange={(v) => set(v)} />
```

Combines `<Label>` + `<Input>`. Use for all form fields inside `<Card>`.

---

## ErrorMessage — `<ErrorMessage>`

```tsx
<ErrorMessage>Something went wrong</ErrorMessage>
<ErrorMessage className="mt-2">Inline under a field</ErrorMessage>
```

Style: `text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2`

---

## Table

```tsx
<TableRoot>
  <Thead><Tr className="bg-blue-50 text-gray-700">
    <Th>Name</Th>
    <Th className="bg-gray-100">Computed</Th>
  </Tr></Thead>
  <Tbody>
    <Tr className="hover:bg-gray-50">
      <Td>Value</Td>
      <Td computed>42.00</Td>
    </Tr>
  </Tbody>
  <Tfoot>
    <Tr className="bg-yellow-50 font-semibold text-gray-900">
      <Td colSpan={2} className="text-right">TOTAL</Td>
      <Td computed className="text-right">42.00</Td>
    </Tr>
  </Tfoot>
</TableRoot>
```

- `<TableRoot>` wraps with `overflow-x-auto rounded-xl border border-gray-200 bg-white`
- `computed` prop on `<Td>`: adds `bg-gray-50 text-gray-600 tabular-nums`
- Header row: `bg-blue-50 text-gray-700`
- Footer row: `bg-yellow-50 font-semibold text-gray-900`
- Row hover: `hover:bg-gray-50`

---

## Layout Conventions

### Page structure
```tsx
<main className="min-h-screen bg-[#f5f5f0]">

  {/* Header — always full-width with border separator */}
  <header className="bg-[#f5f5f0] border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-6 py-10 text-center relative">
      <Text as="h1" variant="heading">Page Title</Text>
      <Text variant="subheading" className="mt-2">Subtitle</Text>
      {/* Absolute-positioned actions go top-right */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2">
        <Button variant="ghost" onClick={fn}>Action</Button>
      </div>
    </div>
  </header>

  {/* Content */}
  <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
    {/* page content */}
  </div>

</main>
```

### Spacing scale
| Usage | Class |
|---|---|
| Header vertical padding | `py-10` |
| Content vertical padding | `py-12` |
| Horizontal padding | `px-6` |
| Between content sections | `space-y-10` |
| Between form rows | `space-y-6` to `space-y-8` |
| Card internal grid gap | `gap-4` |

### Max width
Always `max-w-7xl mx-auto` on inner containers.

---

## Rules Summary

1. **Every pressable element uses `<Button>`** — no exceptions
2. **Never use `text-gray-400`** on the page background — minimum is `text-gray-500`
3. **Cards and tables must be `bg-white`** — page bg is `#f5f5f0`, surfaces need to pop
4. **Text hierarchy**: always via `<Text variant="...">` — no ad-hoc `text-*` color classes on raw elements
5. **One `primary` button per view** — it's the main CTA
6. **Header is centered, has `border-b border-gray-200`**, with absolute-positioned secondary actions
7. **Content padding**: `px-6 py-12` inside `max-w-7xl mx-auto`
