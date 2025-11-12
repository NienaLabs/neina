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

To get started with the project, you need to have [Node.js](https://nodejs.org/) and [Yarn](https://yarnpkg.com/) installed.

1.  **Install dependencies:**

    ```bash
    yarn install
    ```

2.  **Run the development server:**

    ```bash
    yarn dev
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