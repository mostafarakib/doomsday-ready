# Doomsday Ready --- Implementation Roadmap

This roadmap breaks the assessment into manageable stages. Each phase
should be completed and reviewed before moving on. The order is
intentional: the API and its data rules should be reliable before the
frontend depends on them.

## Working approach

-   Follow the requirements in `PROJECT_SPEC.md`.
-   Follow the implementation boundaries in `DEVELOPMENT_RULES.md`.
-   Work on one phase at a time.
-   Do not start a later phase just because some of its files already
    exist.
-   I will review the implementation and verification report before
    approving the next phase.
-   The core algorithms must remain straightforward, hand-written
    implementations rather than being delegated to a graph or
    optimization library. AI assistance may be used to implement them,
    but I will review the logic, test it, and make sure I can explain it.
-   I will create the Git repository manually. The agent should not
    initialize a repository or make the initial commit.
-   Once the initial project structure is ready, I will review it and
    make the first commit myself. For later work, the agent must not
    commit or push unless I explicitly ask.

## Phase 1 --- Repository and development foundation

**Goal:** Create a working monorepo with independently runnable frontend
and backend applications.

Tasks:

-   Prepare the project files and monorepo structure without running
    `git init` or creating commits. I will create the Git repository
    manually before development begins.
-   Configure npm workspaces.
-   Create `apps/web` using React, TypeScript, and Vite.
-   Configure Tailwind CSS and React Router.
-   Create `apps/api` using Node.js, Express, and TypeScript.
-   Add ESLint and Prettier.
-   Add root development scripts to run both applications.
-   Add `.gitignore` and environment example files.
-   Create the Express app and server entry points.
-   Add a basic `/api/health` endpoint.
-   Add environment-variable validation.
-   Add MongoDB connection configuration for MongoDB Atlas.
-   Add basic not-found and centralized error middleware.
-   Create a simple landing page so the frontend can be checked.

Manual setup:

-   Create a MongoDB Atlas project and free cluster.
-   Create a database user.
-   Configure network access for the development machine.
-   Add the Atlas connection string to `apps/api/.env`.
-   Keep the actual credentials out of Git.

Verification:

-   Dependencies install successfully.
-   Frontend starts independently.
-   Backend starts independently.
-   Root command starts both applications.
-   Health endpoint returns the expected response.
-   TypeScript checks and linting run successfully.
-   Backend can connect to Atlas when valid credentials are supplied.

Deliverable: a clean, runnable monorepo with no movie or cinema business
features yet. I will review the initial structure and make the first Git
commit myself. Do not commit or push it on my behalf.

## Phase 2 --- Movie model and CRUD API

**Goal:** Build the movie data foundation and the required movie
endpoints.

Tasks:

-   Create the Movie Mongoose schema.
-   Add normalized title handling and a unique index.
-   Add prerequisite ObjectId references.
-   Add watched status with a default of `false`.
-   Add timestamps.
-   Add request validation for movie creation and updates.
-   Implement `POST /api/movies`.
-   Implement `GET /api/movies`.
-   Implement `PATCH /api/movies/:id`.
-   Validate referenced prerequisite IDs.
-   Reject direct self-prerequisites.
-   Prevent duplicate prerequisite references.
-   Ensure a failed update does not partially modify the document.

Important boundary:

-   The API must not accept a movie as its own prerequisite.
-   Full indirect cycle detection will be completed in Phase 3.
-   Do not treat the absence of the cycle algorithm as permission to
    save unvalidated relationships. Until Phase 3 is complete,
    prerequisite changes that could create indirect cycles must remain
    disabled or be guarded.

Verification:

-   Create and list movies.
-   Update movie details and watched status.
-   Update prerequisites.
-   Reject invalid IDs and invalid field values.
-   Reject duplicate titles regardless of case or surrounding
    whitespace.
-   Confirm failed updates leave the stored movie unchanged.

Deliverable: working movie CRUD with validated prerequisite references.

## Phase 3 --- Movie graph algorithms and rewatch API

**Goal:** Complete the assessment's first core algorithmic feature.

These algorithms must be implemented directly in the project rather
than solved by a graph or optimization library. AI assistance may be
used to write the implementation, but I will review the approach, tests,
and resulting code so I understand how it works and can explain it.

Tasks before implementation:

-   Agree on the graph representation.
-   Define the cycle-detection function's inputs and output.
-   Define the rewatch-order function's inputs and output.
-   Identify how proposed updates will be applied to an in-memory graph
    before validation.
-   Prepare independent test cases.

Implementation:

1.  Implement direct and indirect circular dependency detection using
    DFS.
2.  Implement prerequisite traversal using DFS and a visited set.
3.  Ensure prerequisites appear before dependent movies.
4.  Ensure shared prerequisites appear once.
5.  Exclude the target movie.
6.  Calculate total prerequisite count.
7.  Calculate watched prerequisite count.
8.  Calculate the runtime of unwatched prerequisites.
9.  Review the implementation together with its tests and make sure I
    can explain the graph representation, traversal, and complexity.

Integration tasks:

-   Connect cycle detection to movie creation and prerequisite updates.
-   Return HTTP `409` with error code `CIRCULAR_DEPENDENCY` when a
    proposed graph contains a cycle.
-   Implement `GET /api/movies/:id/rewatch-order`.
-   Return a consistent response for a movie with no prerequisites.

Verification cases:

-   A valid chain.
-   Multiple independent prerequisites.
-   Shared prerequisites.
-   A direct cycle.
-   An indirect cycle.
-   An update that would introduce a cycle.
-   A movie with no prerequisites.
-   A target that must not appear in its own result.
-   Correct watched counts and unwatched runtime.

Deliverable: complete and tested movie dependency handling and
rewatch-order API.

## Phase 4 --- Cinema model and booking algorithm

**Goal:** Complete the assessment's second core algorithmic feature.

Tasks:

-   Create the Cinema Mongoose schema.
-   Add normalized name handling and a unique index.
-   Validate between 1 and 10 distinct bundle sizes.
-   Validate that each bundle size is an integer from 1 to 500.
-   Implement `POST /api/cinemas`.
-   Implement `GET /api/cinemas`.
-   Implement request validation for the group-size query parameter.
-   Prepare the booking algorithm's function contract and independent
    test cases.

Implementation:

1.  Implement bottom-up dynamic programming.
2.  Track the minimum number of bundles for each seat total.
3.  Track the chosen bundle size for reconstruction.
4.  Reconstruct the quantity of each bundle.
5.  Return an impossible result when no exact combination exists.
6.  Apply deterministic tie-breaking when multiple minimum solutions
    exist.
7.  Review the implementation together with its tests and make sure I
    can explain the DP state, transitions, reconstruction, and complexity.

Integration tasks:

-   Implement `GET /api/cinemas/:id/booking?groupSize=6`.
-   Load bundle sizes from the selected cinema.
-   Return the optimal quote or `possible: false`.
-   Keep the algorithm separate from the controller and database model.

Verification cases:

-   The examples supplied in the assessment.
-   A single bundle type.
-   An exact combination that is impossible.
-   A group size of 1.
-   A group size of 10,000.
-   Multiple optimal combinations.
-   Duplicate and invalid bundle sizes.
-   Invalid cinema IDs and missing cinemas.

Deliverable: working cinema CRUD and a tested minimum-bundle quote API.

## Phase 5 --- Booking persistence and backend completion

**Goal:** Save calculated booking plans without pretending to reserve
real cinema seats.

Tasks:

-   Create the Booking Mongoose schema.
-   Reference the cinema document.
-   Store cinema name and bundle-size snapshots.
-   Store group size and bundle breakdown.
-   Store total bundle count and total seats.
-   Use `saved` as the initial status.
-   Implement `POST /api/bookings`.
-   Implement `GET /api/bookings`.
-   Recalculate the quote on the server when saving.
-   Reject impossible quotes without creating a booking.
-   Prevent deletion of a cinema that has saved booking plans if
    deletion is introduced.

Verification:

-   Save a valid booking plan.
-   Confirm the total seats equal the group size.
-   Confirm the bundle count matches the sum of quantities.
-   Confirm the backend does not trust client-supplied totals.
-   Confirm impossible quotes are not saved.
-   Change a cinema's name or bundle configuration and confirm older
    booking snapshots remain unchanged.

Backend completion review:

-   Check all required endpoints.
-   Check response formats and status codes.
-   Run unit and API tests.
-   Run type checks and linting.
-   Review error handling and database constraints.

Deliverable: completed backend functionality and documented API
behavior.

## Phase 6 --- Frontend foundation and Movies view

**Goal:** Build the main React application and connect the Movies view
to the API.

Tasks:

-   Establish the application layout and navigation.
-   Apply the agreed dark cinematic visual direction with restrained red
    accents.
-   Add responsive page structure.
-   Add a typed API client.
-   Add movie list view.
-   Add create movie form.
-   Add edit movie form.
-   Add prerequisite selection.
-   Add watched/unwatched control.
-   Show validation and server errors.
-   Add loading, empty, and success states.

Verification:

-   Create a movie from the UI.
-   View the updated movie list.
-   Edit movie details.
-   Change prerequisites.
-   Mark a movie watched and unwatched.
-   Confirm API validation messages are understandable.

Deliverable: working Movies view connected to the backend.

## Phase 7 --- Rewatch Plan view

**Goal:** Present the backend's rewatch calculation clearly.

Tasks:

-   Add target movie selection.
-   Request the rewatch-order endpoint.
-   Display the returned movies in the exact API order.
-   Show watched indicators.
-   Display watched progress.
-   Display remaining runtime in hours and minutes.
-   Handle an empty plan.
-   Handle loading and error states.

Verification:

-   Test a target with a long dependency chain.
-   Test shared prerequisites.
-   Test a target with no prerequisites.
-   Change watched status and confirm the plan updates.
-   Confirm frontend calculations do not replace the backend's algorithm
    results.

Deliverable: working Rewatch Plan view.

## Phase 8 --- Booking view and saved plans

**Goal:** Complete the booking experience.

Tasks:

-   Add cinema selection.
-   Add group-size input with appropriate limits.
-   Request a booking quote.
-   Display the minimum bundle count.
-   Display each bundle size and quantity.
-   Display the impossible-combination state.
-   Add an option to save a possible quote.
-   Connect the saved plans list to `GET /api/bookings`.
-   Clearly explain that a saved plan is not a confirmed cinema
    reservation.

Verification:

-   Calculate a valid quote.
-   Calculate an impossible quote.
-   Save a valid quote.
-   Refresh and confirm saved plans remain available.
-   Confirm the displayed quote matches the backend response.
-   Check form validation and loading states.

Deliverable: working Booking view and saved booking plans.

## Phase 9 --- Final quality checks and submission

**Goal:** Prepare a complete, understandable repository for assessment.

Tasks:

-   Review all three frontend views.
-   Check desktop and mobile layouts.
-   Run all backend and frontend tests.
-   Run TypeScript checks and linting.
-   Verify environment setup from a clean clone.
-   Verify MongoDB Atlas connectivity.
-   Add an optional, explicitly invoked seed script for the eight sample
    movies.
-   Add the data model diagram to the README.
-   Document the algorithms in plain technical language.
-   Document API endpoints and example responses.
-   Document environment variables and setup steps.
-   Add useful application screenshots.
-   Add an accurate AI usage disclosure.
-   Review the Git history and repository contents.
-   Remove unused dependencies, debug output, and accidental secrets.
-   Prepare the repository link for the assessment submission.

Optional after the core application is complete:

-   Add Docker Compose if there is enough time and it can be verified
    properly.
-   Deploy the frontend and backend if deployment is useful for the
    submission.

Deliverable: a tested, documented GitHub repository ready to submit.

## Final completion checklist

-   [ ] Monorepo installs and runs using documented commands.
-   [ ] MongoDB Atlas connection works.
-   [ ] Movie CRUD works.
-   [ ] Direct and indirect cycles are rejected.
-   [ ] Rewatch order is valid and contains each prerequisite once.
-   [ ] Watched count and unwatched runtime are correct.
-   [ ] Cinema CRUD works.
-   [ ] Booking algorithm finds a minimum exact combination.
-   [ ] Impossible combinations are reported correctly.
-   [ ] Booking plans can be saved and listed.
-   [ ] Booking snapshots remain accurate.
-   [ ] All three frontend views work.
-   [ ] Important validation and edge cases are tested.
-   [ ] README and data model diagram are complete.
-   [ ] AI assistance is disclosed accurately.
-   [ ] Repository contains no credentials or unintended files.
