# Project: Job AI

## Project Overview

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). It is a web application called "Job AI" that helps users with their job search, including features like an AI resume builder, interview coach, and smart job matcher.

The project uses the following technologies:

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
*   **API:** [tRPC](https://trpc.io/)
*   **Authentication:** [better-auth](https://better-auth.dev/)
*   **Background Jobs:** [Inngest](https://www.inngest.com/)
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Testing:** [Jest](https://jestjs.io/) and [Cypress](https://www.cypress.io/)
*   **Linting:** [ESLint](https://eslint.org/)

## Building and Running

To get started with the project, you need to have [Node.js](https://nodejs.org/), [Yarn](https://yarnpkg.com/) Bun  installed.

1.  **Install dependencies:**

    ```bash
    yarn install or bun install
    ```

2.  **Run the development server:**

    ```bash
    yarn dev or bun dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

3.  **Build the application for production:**

    ```bash
    yarn build
    ```

4.  **Start the production server:**

    ```bash
    yarn start
    ```

## Development Conventions

*   **Code Style:** The project uses ESLint to enforce a consistent code style. You can run the linter with `yarn lint` and fix issues automatically with `yarn lint:fix`.
*   **Testing:** The project uses Jest for unit tests and Cypress for end-to-end tests. You can run the tests with `yarn test` and `yarn cy:open`. You can write unit tests in `/app/__test__`.You can write end-to-end tests in `/cypress/e2e`.`/cypress/support` contains custom cypress commands like login.Don't install any dependencies for tests unless when necessary and ask before doing so

*   **Components:** The project uses `shadcn/ui` for UI components. You can find the components in the `components/ui` directory.
*   **API:** The project uses tRPC for API communication. You can find the tRPC routers in the `trpc/routers` directory.
*   **Database:** The project uses Prisma as an ORM. You can find the Prisma schema in the `prisma/schema.prisma` file.
*   **Styling:** The project tailwind css v4 for styling,check `/app/global.css` for the theme of the project

## Development Rules
*   **Comments:** Add function header comments to all functions created including components to help make your code maintable and understandable by following the structure
*  **Dependencies:** Don't install any new dependencies into the project,only do it unless when necessary and ask before doing it.
*  **Coding Conventions:** Follow coding standards like Idempotency, single level of abstraction,eslint rules and other best practices  
* **Date and Time:** Parse all dates and times with date-fns,it has already been installed in the project

## Nielson's Heuristics
Jakob Nielsen’s **10 Usability Heuristics for User Interface Design** are foundational principles for evaluating and designing user-friendly systems. Below are all 10 heuristics with **detailed, practical guidelines** under each to help you apply them effectively in real-world UI/UX design.

# 1. Visibility of System Status

**The system should always keep users informed about what is going on through appropriate feedback within a reasonable time.**

### Detailed Guidelines:

* Show immediate feedback after user actions (button clicks, form submissions, uploads).
* Use progress indicators for long processes (loaders, progress bars, skeleton screens).
* Display system states clearly (online/offline, syncing, saved/unsaved changes).
* Provide confirmation messages for successful actions (e.g., “Profile updated successfully”).
* Use microinteractions (subtle animations, icon changes) to signal activity.
* Show real-time validation in forms (e.g., password strength, email format).
* Avoid silent failures — always explain what is happening.
* Keep feedback proportional to action importance (major actions → stronger confirmation).

---

# 2. Match Between System and the Real World

**The system should speak the users’ language and follow real-world conventions.**

### Detailed Guidelines:

* Use familiar words instead of technical jargon (e.g., “Delete” instead of “Remove instance”).
* Organize information in natural, logical order.
* Use metaphors that users understand (trash can for delete, cart for shopping).
* Follow cultural norms (date formats, currency symbols, time representation).
* Use icons that are universally recognizable.
* Structure workflows like real-world processes.
* Avoid internal system terminology in UI labels.
* Ensure tone and language match user expectations (formal vs casual).

---

# 3. User Control and Freedom

**Users often perform actions by mistake. They need clearly marked exits.**

### Detailed Guidelines:

* Provide undo and redo functionality.
* Allow users to cancel ongoing actions.
* Avoid trapping users in forced flows (e.g., no back button).
* Provide confirmation dialogs for destructive actions.
* Enable easy navigation back to previous screens.
* Allow users to edit previously entered data.
* Make it easy to log out or switch accounts.
* Provide visible exit options in modals and popups.

---

# 4. Consistency and Standards

**Users should not have to wonder whether different words, situations, or actions mean the same thing.**

### Detailed Guidelines:

* Maintain consistent button styles, colors, and typography.
* Use the same terminology throughout the product.
* Follow platform conventions (iOS vs Android design standards).
* Keep interaction patterns consistent (swipe, tap, hover).
* Standardize error message formats.
* Keep navigation placement consistent across pages.
* Avoid mixing different design styles randomly.
* Follow industry standards (e.g., underlined text for links).

---

# 5. Error Prevention

**Prevent problems before they occur rather than just showing error messages.**

### Detailed Guidelines:

* Use input constraints (dropdowns, date pickers, numeric-only fields).
* Disable buttons until requirements are met.
* Provide inline validation before form submission.
* Use autofill and suggestions where appropriate.
* Confirm before destructive actions.
* Design defaults carefully to prevent accidental misuse.
* Avoid ambiguous instructions.
* Use clear labeling to reduce misunderstandings.

---

# 6. Recognition Rather Than Recall

**Minimize the user’s memory load by making options visible.**

### Detailed Guidelines:

* Show available actions clearly (don’t hide essential features).
* Use dropdown suggestions and autocomplete.
* Keep navigation menus visible.
* Use visual cues and icons alongside text.
* Provide tooltips and hints.
* Avoid requiring users to remember codes or commands.
* Use breadcrumbs for navigation context.
* Display recently used items or history.

---

# 7. Flexibility and Efficiency of Use

**Interfaces should cater to both inexperienced and experienced users.**

### Detailed Guidelines:

* Provide keyboard shortcuts for power users.
* Enable customization (themes, layout preferences).
* Allow batch actions where possible.
* Support auto-complete and predictive text.
* Offer search functionality.
* Use progressive disclosure (advanced features hidden but accessible).
* Allow gesture shortcuts in mobile apps.
* Provide reusable templates.

---

# 8. Aesthetic and Minimalist Design

**Interfaces should not contain irrelevant or rarely needed information.**

### Detailed Guidelines:

* Remove unnecessary elements from the screen.
* Prioritize content hierarchy (headings, spacing, contrast).
* Use whitespace effectively.
* Avoid cluttered layouts.
* Keep text concise.
* Avoid too many competing colors.
* Make primary actions visually dominant.
* Reduce cognitive load by simplifying navigation.

---

# 9. Help Users Recognize, Diagnose, and Recover from Errors

**Error messages should be expressed in plain language and suggest solutions.**

### Detailed Guidelines:

* Clearly state what went wrong.
* Explain why it happened (if possible).
* Provide steps to fix the issue.
* Highlight problematic fields visually.
* Avoid blaming language.
* Use human-friendly tone.
* Allow retry options.
* Log errors silently for developers but show helpful guidance to users.

---

# 10. Help and Documentation

**Even though the system should be usable without documentation, help should be available when needed.**

### Detailed Guidelines:

* Provide searchable help centers.
* Include contextual help (tooltips, inline guidance).
* Use onboarding tutorials for first-time users.
* Offer walkthroughs for complex features.
* Include FAQs.
* Provide quick-start guides.
* Use visuals (videos, screenshots) in help sections.
* Keep documentation concise and task-focused.

