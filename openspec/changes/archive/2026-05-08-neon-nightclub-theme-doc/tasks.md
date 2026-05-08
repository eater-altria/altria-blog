## 1. Theme Foundations

- [ ] 1.1 Define neon-club design tokens for background, text hierarchy, accent colors, borders, glow, and motion timing
- [ ] 1.2 Document token usage rules and semantic naming for engineering handoff
- [ ] 1.3 Establish readability constraints for body text and interactive states in dark mode

## 2. Component Style Specifications

- [ ] 2.1 Define `Nav` style rules for neon brand treatment, active link state, and header surface behavior
- [ ] 2.2 Define homepage hero style rules including headline treatment, CTA hierarchy, and background visual layers
- [ ] 2.3 Define content card style rules for posts list/detail metadata, hover response, and spacing rhythm
- [ ] 2.4 Define form style rules for inputs, labels, validation states, and focus glow behavior
- [ ] 2.5 Define admin surface style rules that preserve hierarchy while matching neon system

## 3. Motion and Interaction Rules

- [ ] 3.1 Specify hover/focus/active transitions with bounded durations and easing curves
- [ ] 3.2 Specify ambient effects (if any) with low-frequency constraints to avoid flicker fatigue
- [ ] 3.3 Define “no-glow” zones for long-form reading content and dense data views

## 4. Review and Acceptance Documentation

- [ ] 4.1 Create a structured review doc layout covering intent, tokens, components, and accessibility guardrails
- [ ] 4.2 Build checklist-based acceptance criteria shared by design and frontend reviewers
- [ ] 4.3 Map each design rule to target implementation surfaces (`globals`, `Nav`, `Home`, `forms`, `posts`, `admin`)
- [ ] 4.4 Run stakeholder review and capture required adjustments before `/opsx:apply`
