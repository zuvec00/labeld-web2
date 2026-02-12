# Tutorial & Onboarding System - Implementation Plan

## Overview
This plan outlines the implementation of a comprehensive, skippable tutorial and onboarding system for Labeld Studio. It builds on the existing `OnboardingChecklist` component and extends it with guided tours, help menus, and role-specific onboarding paths.

---

## 🎯 Goals

1. **Get users to first value fast** - Guide them to publish a brand page OR publish an event
2. **Reduce confusion** - Clear "where do I go next?" guidance
3. **Teach UI patterns once** - Spotlight system for navigation, actions, publish, preview, share
4. **Convert to PRO** - Show locked value at the right moment (site customization, analytics)
5. **Non-intrusive** - Always skippable, never blocks workflow

---

## 📋 Current State Analysis

### ✅ What Exists
- **OnboardingChecklist Component** (`src/components/dashboard/OnboardingChecklist.tsx`)
  - Shows brand setup steps (bank, profile, shipping, product)
  - Uses `useBrandOnboardingStatus` hook
  - Displays on dashboard and brand-space pages
  - Hides when complete
  - Carousel UI for incomplete steps

- **Brand Onboarding Hook** (`src/hooks/useBrandOnboardingStatus.ts`)
  - Checks: bank account, profile (name + phone), shipping, products
  - Returns steps, percentage, completion status

- **Event Organizer Onboarding** (separate flow)
  - `EventOnboardingFlow` component
  - `EventOrganizerOnboardingModal` component
  - Creates event organizer document

### ❌ What's Missing
- Event organizer onboarding checklist (similar to brand)
- Guided tour/spotlight system
- Help menu in topbar
- Tutorial state persistence (Firestore)
- Empty state tutorials
- Modular tour system (can re-run specific tours)
- Path selection (brand vs event vs explore)

---

## 🏗️ Architecture

### 1. Data Layer (Firestore)

**User Document Extension:**
```typescript
// In users/{userId}
onboarding: {
  // Path selection
  selectedPath: "brand" | "event" | null; // null = not selected yet
  
  // Checklist completion
  checklistCompleted: boolean;
  checklistCompletedAt: Timestamp | null;
  
  // Tutorial state
  tutorials: {
    dismissed: string[]; // ["brand-setup", "event-setup", "orders", "wallet"]
    completed: string[]; // Same format
    lastSeenAt: Timestamp | null;
  };
  
  // Tour preferences
  tourPreferences: {
    skipAllTours: boolean; // "Don't show again" global toggle
    autoStartTours: boolean; // Auto-start tours on first visit
  };
}
```

**Why this structure:**
- Minimal data (only what we need)
- Backward compatible (existing users get defaults)
- Easy to query and update
- Supports future analytics

---

### 2. Component Structure

```
src/
├── components/
│   ├── tutorial/
│   │   ├── TutorialProvider.tsx          # Context provider for tutorial state
│   │   ├── TourOverlay.tsx                # Spotlight overlay component
│   │   ├── TourStep.tsx                  # Individual tour step card
│   │   ├── TourProgress.tsx              # Progress indicator (3/9)
│   │   └── TourConfig.ts                  # Tour configuration types
│   │
│   ├── onboarding/
│   │   ├── OnboardingChecklist.tsx       # ✅ EXISTS - Expand this
│   │   ├── EventOnboardingChecklist.tsx  # NEW - Event organizer version
│   │   ├── PathSelector.tsx              # NEW - "What are you here to do?"
│   │   └── EmptyStateTutorial.tsx       # NEW - Empty state with tutorial CTA
│   │
│   └── dashboard/
│       └── HelpMenu.tsx                   # NEW - Help dropdown in topbar
│
├── hooks/
│   ├── useBrandOnboardingStatus.ts       # ✅ EXISTS - Keep as is
│   ├── useEventOnboardingStatus.ts       # NEW - Event organizer version
│   ├── useTutorial.ts                    # NEW - Tutorial state management
│   └── useOnboardingState.ts            # NEW - Unified onboarding state
│
└── lib/
    ├── tutorial/
    │   ├── tours.ts                      # Tour configurations
    │   ├── selectors.ts                  # CSS selectors for tour targets
    │   └── storage.ts                    # Firestore read/write utilities
    └── firebase/
        └── callables/
            └── onboarding.ts             # Cloud function for onboarding updates
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Safe, Non-Breaking)
**Goal:** Extend existing checklist without breaking anything

#### 1.1 Create Event Onboarding Hook
- **File:** `src/hooks/useEventOnboardingStatus.ts`
- **Logic:**
  - Check if event organizer doc exists
  - Check if at least one event exists
  - Check if at least one ticket type exists (for any event)
  - Check if bank account is verified (shared with brand)
  - Return steps similar to brand hook

#### 1.2 Create Event Onboarding Checklist Component
- **File:** `src/components/onboarding/EventOnboardingChecklist.tsx`
- **Pattern:** Copy `OnboardingChecklist.tsx`, adapt for event steps
- **Steps:**
  1. Create organizer profile (if missing)
  2. Create first event
  3. Add ticket types
  4. Publish event
  5. Add bank details (shared step)

#### 1.3 Update Dashboard to Show Role-Appropriate Checklist
- **File:** `src/app/(protected)/(dashboard)/dashboard/page.tsx`
- **Change:** Show `EventOnboardingChecklist` when `activeRole === "organizer"`
- **Safety:** Keep existing brand checklist logic intact

#### 1.4 Create Unified Onboarding State Hook
- **File:** `src/hooks/useOnboardingState.ts`
- **Purpose:** Wrapper that returns appropriate checklist based on role
- **Usage:** Replace direct `useBrandOnboardingStatus` calls

**Testing:**
- ✅ Brand users see brand checklist (unchanged)
- ✅ Event organizers see event checklist
- ✅ Users with both roles see appropriate checklist based on active role
- ✅ No breaking changes to existing functionality

---

### Phase 2: Tutorial System Core
**Goal:** Build the guided tour infrastructure

#### 2.1 Create Tutorial Provider
- **File:** `src/components/tutorial/TutorialProvider.tsx`
- **Features:**
  - Loads tutorial state from Firestore
  - Manages active tour state
  - Provides context to child components
  - Handles tour dismissal/completion

#### 2.2 Create Tour Overlay Component
- **File:** `src/components/tutorial/TourOverlay.tsx`
- **Features:**
  - Spotlight effect (blur background, highlight target)
  - Tooltip card (title, description, CTA)
  - Progress indicator
  - Skip button (always visible)
  - Next/Previous navigation
  - Keyboard support (Esc to skip, Arrow keys to navigate)

#### 2.3 Create Tour Configuration System
- **File:** `src/lib/tutorial/tours.ts`
- **Structure:**
```typescript
export const TOURS = {
  "brand-setup": {
    id: "brand-setup",
    title: "Brand Setup Tour",
    steps: [
      {
        target: "[data-tour='brand-profile']",
        title: "Create Your Brand Profile",
        description: "Set up your brand identity here",
        placement: "bottom",
        action: { type: "navigate", href: "/brand-space/setup" }
      },
      // ... more steps
    ]
  },
  "event-setup": { /* ... */ },
  "orders": { /* ... */ },
  "wallet": { /* ... */ }
} as const;
```

#### 2.4 Create Tutorial Hook
- **File:** `src/hooks/useTutorial.ts`
- **Features:**
  - Start tour
  - Skip tour
  - Complete tour
  - Check if tour was dismissed
  - Update Firestore state

**Testing:**
- ✅ Tour overlay renders correctly
- ✅ Spotlight highlights correct elements
- ✅ Navigation works (next/prev/skip)
- ✅ State persists to Firestore
- ✅ Keyboard shortcuts work

---

### Phase 3: Help Menu & Entry Points
**Goal:** Add help menu and multiple tutorial entry points

#### 3.1 Create Help Menu Component
- **File:** `src/components/dashboard/HelpMenu.tsx`
- **Location:** Topbar (next to profile)
- **Menu Items:**
  - "Start Tutorial" (context-aware: brand or event)
  - "Studio Guide" (link to docs/help hub)
  - "Contact Support"
  - Divider
  - "Don't show tutorials" (toggle)

#### 3.2 Integrate Help Menu into Topbar
- **File:** `src/components/dashboard/Topbar.tsx`
- **Change:** Add HelpMenu component
- **Position:** Right side, before profile dropdown

#### 3.3 Add Tutorial Triggers
- **Empty States:** Add "Start guided setup" button
- **Feature-Gated:** Show tutorial when user clicks locked feature
- **First Login:** Auto-start tutorial if `autoStartTours` is true

**Testing:**
- ✅ Help menu appears in topbar
- ✅ Menu items work correctly
- ✅ Tutorial triggers from various entry points
- ✅ "Don't show tutorials" toggle persists

---

### Phase 4: Path Selection & Enhanced Checklists
**Goal:** Add path selection and improve checklist UX

#### 4.1 Create Path Selector Component
- **File:** `src/components/onboarding/PathSelector.tsx`
- **When to show:**
  - First time user (no `onboarding.selectedPath`)
  - After signup, before dashboard
- **Options:**
  - "Set up Brand Space" → `/brand-space/setup`
  - "Set up an Event" → `/events` (or event onboarding)
  - "I'm exploring" → Skip to dashboard (no tutorial)

#### 4.2 Enhance Onboarding Checklists
- **Add "Start Tutorial" button** to checklist header
- **Add "Dismiss" option** (with "Don't show again")
- **Improve empty states** with tutorial CTAs
- **Add completion celebration** (subtle animation)

#### 4.3 Create Empty State Tutorial Component
- **File:** `src/components/onboarding/EmptyStateTutorial.tsx`
- **Usage:** Replace generic empty states
- **Features:**
  - Contextual message
  - "Start guided setup" button
  - Optional: "Watch 60s demo" link

**Testing:**
- ✅ Path selector shows for new users
- ✅ Selection persists to Firestore
- ✅ Checklists show tutorial button
- ✅ Empty states are helpful

---

### Phase 5: Tour Configurations
**Goal:** Define all tour steps for each feature

#### 5.1 Brand Setup Tour
- **Steps:**
  1. Brand Space navigation item
  2. Create brand profile
  3. Add first product
  4. Publish brand page
  5. Share link
  6. View storefront

#### 5.2 Event Setup Tour
- **Steps:**
  1. Events navigation item
  2. Create event
  3. Add ticket types
  4. Publish event
  5. Test checkout (optional)
  6. Share event link

#### 5.3 Orders Tour
- **Steps:**
  1. Orders page overview
  2. Order statuses
  3. Fulfillment process
  4. Analytics

#### 5.4 Wallet Tour
- **Steps:**
  1. Wallet overview
  2. Earnings breakdown
  3. Payout schedule
  4. Add bank details
  5. Transaction ledger

**Testing:**
- ✅ All tours complete without errors
- ✅ Steps highlight correct elements
- ✅ Navigation flows make sense
- ✅ Copy is clear and concise

---

## 🔒 Safety Measures

### 1. Backward Compatibility
- **Existing users:** Get default onboarding state (all null/false)
- **No breaking changes:** All new code is additive
- **Graceful degradation:** If Firestore fails, tutorials just don't show (no errors)

### 2. Performance
- **Lazy load tour components:** Only load when tour starts
- **Debounce Firestore writes:** Don't write on every step change
- **Cache tutorial state:** Use React Query or similar

### 3. Error Handling
- **Try-catch all Firestore operations**
- **Fallback UI:** If tour fails, show error message, allow skip
- **Log errors:** For debugging, but don't break user flow

### 4. Testing Strategy
- **Unit tests:** Hooks and utilities
- **Integration tests:** Tour flow end-to-end
- **Manual testing:** All entry points, all roles, all scenarios

---

## 📊 Data Migration

### For Existing Users
```typescript
// On first load, if onboarding field doesn't exist:
// Set defaults in Firestore (via cloud function or client-side)
{
  onboarding: {
    selectedPath: null,
    checklistCompleted: false,
    checklistCompletedAt: null,
    tutorials: {
      dismissed: [],
      completed: [],
      lastSeenAt: null
    },
    tourPreferences: {
      skipAllTours: false,
      autoStartTours: true
    }
  }
}
```

**Migration Strategy:**
- Client-side: Check on first dashboard load, set defaults if missing
- Cloud function: Optional batch migration for all users

---

## 🎨 UI/UX Guidelines

### Visual Style
- **Consistent with Studio:** Use existing design tokens
- **Spotlight overlay:** Soft blur, subtle shadow
- **Tooltip cards:** Small, non-intrusive, clear typography
- **Progress indicator:** "3/9" format, always visible

### Copy Style
- **Action-first titles:** "Publish your event" not "Event Publishing"
- **One sentence descriptions:** Keep it short
- **Clear CTAs:** "Open Ticket Types" not "Click here"

### Accessibility
- **Keyboard navigation:** Full support
- **Screen readers:** Proper ARIA labels
- **Focus management:** Trap focus in tour overlay
- **Color contrast:** Meet WCAG AA standards

---

## 📝 Implementation Checklist

### Phase 1: Foundation
- [ ] Create `useEventOnboardingStatus` hook
- [ ] Create `EventOnboardingChecklist` component
- [ ] Update dashboard to show role-appropriate checklist
- [ ] Create `useOnboardingState` wrapper hook
- [ ] Test with brand users (no regressions)
- [ ] Test with event organizers
- [ ] Test with users having both roles

### Phase 2: Tutorial Core
- [ ] Create `TutorialProvider` component
- [ ] Create `TourOverlay` component
- [ ] Create tour configuration system
- [ ] Create `useTutorial` hook
- [ ] Add Firestore schema for tutorial state
- [ ] Test tour overlay rendering
- [ ] Test spotlight highlighting
- [ ] Test navigation (next/prev/skip)
- [ ] Test Firestore persistence

### Phase 3: Help Menu
- [ ] Create `HelpMenu` component
- [ ] Integrate into Topbar
- [ ] Add tutorial triggers to empty states
- [ ] Add feature-gated tutorial triggers
- [ ] Test help menu functionality
- [ ] Test all entry points

### Phase 4: Path Selection
- [ ] Create `PathSelector` component
- [ ] Add path selection to onboarding flow
- [ ] Enhance checklist components
- [ ] Create `EmptyStateTutorial` component
- [ ] Test path selection flow
- [ ] Test enhanced checklists

### Phase 5: Tour Configurations
- [ ] Define brand setup tour steps
- [ ] Define event setup tour steps
- [ ] Define orders tour steps
- [ ] Define wallet tour steps
- [ ] Test all tours end-to-end
- [ ] Polish copy and UX

---

## 🚦 Rollout Strategy

### Development
1. Implement Phase 1 (foundation)
2. Test thoroughly
3. Implement Phase 2 (tutorial core)
4. Test thoroughly
5. Continue with remaining phases

### Staging
- Deploy to staging environment
- Test with real user scenarios
- Gather feedback
- Iterate on UX

### Production
- **Feature flag:** Use existing feature flag system
- **Gradual rollout:** Enable for 10% → 50% → 100%
- **Monitor:** Track tutorial completion rates
- **Iterate:** Based on analytics and feedback

---

## 🔮 Future Enhancements (Out of Scope)

- Video tutorials (60s demos)
- Interactive walkthroughs (click-to-continue)
- Contextual tooltips (hover hints)
- Analytics dashboard for tutorial performance
- A/B testing different tour flows
- Multi-language support

---

## 📚 References

- Existing `OnboardingChecklist` component
- ChatGPT blueprint (inspiration, not strict implementation)
- Next.js App Router patterns
- Firebase best practices
- Accessibility guidelines (WCAG)

---

## ✅ Success Metrics

- **Activation rate:** % of users who complete first publish (brand or event)
- **Time to first value:** Average time to publish
- **Tutorial completion:** % of users who complete tours
- **Support tickets:** Reduction in "how do I..." tickets
- **PRO conversion:** % of users who upgrade after seeing locked features

---

**Last Updated:** [Current Date]
**Status:** Planning Phase
**Next Steps:** Review plan, get approval, begin Phase 1 implementation

