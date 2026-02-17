# AI Development Principles for AURA

## Core Philosophy: Think Before You Code

**Always design features completely upfront, not iteratively.**

---

## Pre-Implementation Checklist

Before implementing ANY feature, think through:

### 1. User Experience
- [ ] What are the user's expectations?
- [ ] How will they know it's working?
- [ ] What feedback do they need (loading states, progress, completion)?
- [ ] Is the timing/speed acceptable?
- [ ] What will confuse them?

### 2. Edge Cases
- [ ] What if the API fails?
- [ ] What if there's no data?
- [ ] What if it takes too long?
- [ ] What if the user clicks multiple times?
- [ ] What if they navigate away mid-process?

### 3. Performance & Scale
- [ ] Will this work with 10 items? 1,000 items? 10,000 items?
- [ ] Are there timeouts to consider?
- [ ] Should this be async/background?
- [ ] Do we need caching?
- [ ] Will this slow down the page?

### 4. Data Flow
- [ ] Where does the data come from?
- [ ] Is it real-time or cached?
- [ ] How fresh does it need to be?
- [ ] What happens if data is stale?
- [ ] Do we need to refresh other parts of the UI?

### 5. Error Handling
- [ ] What error messages will users see?
- [ ] Can they retry?
- [ ] Should errors be logged?
- [ ] Is there a fallback?
- [ ] How do we prevent data loss?

### 6. Complete Feature Set
- [ ] Progress indicators (spinners, timers, progress bars)
- [ ] Success/failure feedback
- [ ] Empty states
- [ ] Loading states
- [ ] Error states
- [ ] Disabled states (when action unavailable)

---

## Real Example: SEO Site Crawler

### ❌ Initial Implementation (Incomplete)
```
- Button triggers scan
- Shows "scanning..." 
- That's it
```

**Problems:**
- No indication of time
- No progress tracking
- User doesn't know when it will finish
- No automatic refresh when done

### ✅ Complete Implementation
```
- Button triggers scan
- Fetches product count to estimate time
- Shows countdown timer (MM:SS format)
- Displays product count being scanned
- Disables button during scan
- Auto-refreshes dashboard when complete
- Shows last scan timestamp
- Handles API failures gracefully
- Prevents double-clicks
```

---

## Common Patterns to Always Include

### For Any Background Process:
1. **Before**: Clear call-to-action
2. **During**: Progress indicator + estimated time
3. **After**: Success message + timestamp
4. **Error**: Clear error message + retry option

### For Any Data Fetch:
1. **Loading**: Skeleton or spinner
2. **Success**: Display data with freshness indicator
3. **Empty**: Helpful empty state with next steps
4. **Error**: User-friendly error + fallback

### For Any Form/Action:
1. **Idle**: Clear what will happen
2. **Submitting**: Disabled with loading state
3. **Success**: Confirmation + next steps
4. **Validation**: Real-time inline errors
5. **Server Error**: Preserve user input + retry

---

## Questions to Ask Yourself

1. **"What's the user thinking right now?"**
   - Are they confused?
   - Do they know what's happening?
   - Can they predict what will happen next?

2. **"What could go wrong?"**
   - Network failure?
   - Invalid data?
   - Permissions issue?
   - Rate limiting?

3. **"Is this fast enough?"**
   - If not, show progress
   - If yes, still show feedback
   - Never leave users hanging

4. **"What happens if..."**
   - They refresh the page?
   - They close the browser?
   - They do this 100 times?
   - Multiple users do this simultaneously?

5. **"Does this scale?"**
   - Works for 5 products AND 5,000 products?
   - Works for 1 user AND 1,000 concurrent users?

---

## Testing Mindset

Before marking something "done", test:

1. **Happy Path**: Works as expected
2. **Sad Path**: Handles errors gracefully
3. **Edge Cases**: Works with extreme data
4. **UX**: Feels polished and professional
5. **Performance**: Responds quickly enough

---

## Remember

> "The user should never have to guess what's happening or what will happen next."

> "Every action should have clear feedback. Every wait should show progress."

> "Handle errors gracefully. Never show raw error messages or leave users stuck."

> "Think about the complete feature, not just the happy path."

---

## When in Doubt

Ask yourself: **"What would frustrate a user about this?"**

Then fix it before they encounter it.

---

_Last updated: 2026-02-17_
_Context: After implementing SEO crawler with incomplete UX, then adding countdown timer retroactively_
