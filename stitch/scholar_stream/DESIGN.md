```markdown
# Design System Document: Academic Sophistication

## 1. Overview & Creative North Star: "The Academic Curator"
This design system moves away from the cluttered, "dashboard-heavy" look of traditional student portals. Instead, it adopts the persona of **The Academic Curator**. This North Star prioritizes focus, intentional breathing room, and a high-end editorial feel that treats a student’s schedule and coursework as a curated gallery rather than a chaotic to-do list.

To break the "SaaS template" mold, we utilize **Asymmetric Composition**. Large, bold display type is balanced by expansive white space. Content isn't just "placed" on a grid; it is layered. We use overlapping elements—such as a floating card partially breaking the boundary of a background section—to create a sense of tactile depth and kinetic energy appropriate for a modern college experience.

---

## 2. Colors: Tonal Architecture
We move beyond flat hex codes to a system of "Tonal Architecture." Colors are not just decorations; they define the physical environment.

### The Palette
- **Primary (`#0055c7`):** Use for high-intent actions. This is your "Action Ink."
- **Primary Container (`#2d6fe7`):** Used for large interactive areas or hero states.
- **Surface Tiers:** 
  - `surface_container_lowest` (#ffffff): Your floating "Hero" cards.
  - `surface` (#f7f9fc): The base canvas.
  - `surface_container_low` (#f2f4f7): Subtle structural grouping.
- **Tertiary (`#964400`):** Use sparingly for "Focus" moments—deadlines, alerts, or high-priority notifications.

### The "No-Line" Rule
**Explicit Instruction:** Junior designers are prohibited from using 1px solid borders to separate sections. 
*   **Correction:** Define boundaries through background shifts. Place a `surface_container_lowest` card on top of a `surface_container_low` background. The shift in tone provides all the visual affordance needed without the "jail-cell" feel of grid lines.

### The "Glass & Gradient" Rule
Standard SaaS feels "plastic." To achieve a "premium" feel:
- **Signature Textures:** Apply a linear gradient from `primary` to `primary_container` (angled at 135°) for primary buttons and progress bars. This adds a "jewel-like" depth.
- **Glassmorphism:** Navigation rails and floating headers must use `surface_container_lowest` at 80% opacity with a `20px` backdrop-blur. This allows the student's content to "bleed" through the chrome, creating a unified, immersive experience.

---

## 3. Typography: Editorial Authority
We use a dual-font strategy to balance character with readability.

- **Display & Headlines (Manrope):** Chosen for its modern, geometric structure. Use `display-lg` and `headline-lg` with tight letter-spacing (-0.02em) to create a "Newsroom" authority.
- **Body & Labels (Inter):** The workhorse. Inter’s tall x-height ensures that long-form academic readings or dense course lists remain legible at `body-md` (0.875rem).
- **Hierarchy Tip:** Use `label-sm` in all-caps with 0.05em tracking for category tags (e.g., "COURSEWORK," "DUE TODAY") to provide a clear contrast against sentence-case headlines.

---

## 4. Elevation & Depth: The Layering Principle
Forget "boxes on a page." Think of the UI as **Stacked Sheets of Fine Paper.**

- **Tonal Layering:** Depth is achieved by nesting. 
  - *Level 0:* `surface` (The desk).
  - *Level 1:* `surface_container_low` (A tray on the desk).
  - *Level 2:* `surface_container_lowest` (A sheet of paper in the tray).
- **Ambient Shadows:** Shadows should never be "gray." Use the `on_surface` color at 4% opacity with a `32px` blur and an `8px` Y-offset. This creates a "soft lift" that feels like natural light hitting a physical object.
- **The Ghost Border:** If a component (like an input field) risks disappearing, use `outline_variant` at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Polished Primitives

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), `xl` (1.5rem) rounded corners. Text is `on_primary`. 
- **Secondary:** `surface_container_high` background with `primary` text. No border.
- **Tertiary:** Pure text with a 2px underline that appears only on hover.

### Cards & Lists
- **The Rule:** No dividers. Use `xl` (1.5rem) corner radius for cards.
- **Spacing:** Use 24px (1.5rem) internal padding as a minimum. 
- **List Interaction:** On hover, a list item should transition from `surface` to `surface_container_highest` with a smooth 200ms ease.

### Input Fields
- **Style:** Background should be `surface_container_low`. 
- **Focus State:** Transition the background to `surface_container_lowest` and add a 2px "Ghost Border" of `primary` at 30% opacity. 

### Custom Component: The "Focus Float"
For a student platform, we introduce the **Focus Float**. A large, `xl` rounded container using Glassmorphism that houses the student's current "Deep Work" task. It should overlap two different surface-colored sections to emphasize its importance above the standard grid.

---

## 6. Do’s and Don’ts

### Do:
- **Embrace White Space:** If you think a section needs more content, add 16px of padding instead.
- **Use Intentional Asymmetry:** Align your headlines to the left, but let your primary CTA float to the far right of a card to create a visual "path" for the eye.
- **Check Contrast:** Ensure all `on_surface_variant` text on `surface` containers meets WCAG AA standards.

### Don’t:
- **Don’t use 100% Black:** Never use `#000000`. Use `on_surface` (#191c1e) for a softer, more premium reading experience.
- **Don’t use "Drop Shadows" on everything:** If every card has a shadow, nothing is elevated. Use tonal shifts for 90% of your components; save shadows for floating modals or global navigation.
- **Don’t use hard corners:** Avoid `none` or `sm` rounding. This platform should feel approachable and "soft," mirroring the supportive nature of an educational environment. Use `lg` and `xl` scales consistently.