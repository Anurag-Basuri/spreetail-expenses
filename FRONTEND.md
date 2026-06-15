# EquiSplit Frontend Implementation Guide

## Technology Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Component Library**: React (with custom components, avoiding bulky UI libraries)
- **State Management**: React Context (for global user/group state) + SWR (for data fetching and caching)
- **Icons**: Lucide React
- **HTTP Client**: Axios (or native fetch wrapper)

## Design Aesthetics
- **Theme**: Dark Mode by default.
- **Colors**: Deep vibrant accents (e.g., Violet/Indigo for primary buttons), dark slate backgrounds (`bg-slate-900`), and glassmorphism panels (semi-transparent backgrounds with backdrop blur).
- **Typography**: Inter (sans-serif) for clean readability.
- **Animations**: Subtle micro-animations (Framer Motion or CSS transitions) for hover states, modal popups, and the CSV import wizard.

## Folder Structure (App Router)
```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Global layout (Navbar, Auth Provider)
│   │   ├── page.tsx           # Landing page
│   │   ├── login/             # Auth pages
│   │   ├── register/
│   │   ├── dashboard/         # Main user dashboard
│   │   │   ├── page.tsx       # List of groups
│   │   │   └── [groupId]/     # Specific group details
│   │   │       ├── page.tsx   # Group summary & simplified debts (Aisha's view)
│   │   │       ├── expenses/  # Ledger of all expenses (Rohan's view)
│   │   │       └── import/    # The Smart CSV Import Wizard
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # Buttons, Inputs, Modals, Cards
│   │   ├── expenses/          # AddExpenseModal, ExpenseList
│   │   ├── import/            # AnomalyCard, ResolutionWizard
│   │   └── dashboard/         # BalanceSummary, SettlementButton
│   ├── lib/                   # Utility functions
│   │   ├── api.ts             # Axios instance & API calls
│   │   ├── auth.ts            # JWT parsing & token management
│   │   └── utils.ts           # Date formatting, currency formatters
│   └── context/               # React Context Providers
│       └── AuthContext.tsx
```

## Key Pages & Views

### 1. Group Dashboard (`/dashboard/[groupId]`)
- **Hero Section**: Group name, total group spend, and your personal net balance.
- **Simplified Balances (Aisha's View)**: A clean list of "You owe X" or "Y owes you" based on the graph simplification algorithm. Includes a "Settle Up" button that triggers a settlement API call.
- **Recent Activity**: A mini-feed of the last 5 expenses or settlements.

### 2. The Ledger (`/dashboard/[groupId]/expenses`)
- **Full History (Rohan's View)**: A paginated, filterable table of every transaction.
- **Detail Modal**: Clicking an expense shows exactly how it was split, the original currency, and the exchange rate used.

### 3. The Smart CSV Importer (`/dashboard/[groupId]/import`)
*This is the crown jewel of the application.*
- **Step 1: Upload**: Drag and drop CSV file.
- **Step 2: Processing State**: A loader while the backend runs the `anomaly_detector`.
- **Step 3: The Resolution Wizard (Meera's View)**:
  - If anomalies are detected, the user is presented with a carousel or list of "Anomaly Cards".
  - **Anomaly Card**: Displays the Row Number, Severity (Red/Yellow), the specific issue (e.g., "Missing Payer"), and a form to fix it (e.g., a dropdown to select the correct payer).
  - Users can either "Approve Fix" or "Skip Row".
- **Step 4: Success Summary**: Shows the `ImportReportOut` (Total imported, auto-fixed, skipped).

## State Management Strategy
1. **Authentication**: Stored in HTTP-only cookies or `localStorage` (if simplicity is preferred for MVP), managed globally via `AuthContext`.
2. **Data Fetching**: Use `SWR` hooks (e.g., `useGroup(groupId)`) to fetch data. SWR automatically handles caching, revalidation on focus, and provides a clean `isLoading` and `error` state.
3. **Form Handling**: React Hook Form for complex forms like "Add Expense" which has dynamic split inputs (equal, percentage, exact).

## Next Steps for Implementation
1. Initialize the Next.js project with Tailwind CSS.
2. Setup the Axios interceptor to automatically attach the JWT Bearer token to all requests.
3. Build the foundational UI components (Buttons, Modals, Inputs).
4. Implement the Authentication flows (Login/Register).
5. Build the Dashboard and Group Views.
6. Build the interactive CSV Import Wizard.
