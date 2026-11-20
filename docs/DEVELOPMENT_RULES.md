# Doomsday Ready --- Development Rules

These rules describe how I want this project implemented. Keep the work
focused on the assessment, make the code easy to follow, and avoid
adding complexity just because a library or pattern is available.

## 1. General approach

-   Read `PROJECT_SPEC.md` and `IMPLEMENTATION_ROADMAP.md` before
    starting a task.
-   Work only on the phase or task I have asked you to work on.
-   Do not move to the next phase automatically.
-   Inspect the existing repository before creating, replacing, or
    reorganizing files.
-   Preserve working code unless a change is required and its reason is
    clear.
-   Prefer straightforward solutions over clever abstractions.
-   Do not invent extra product requirements.
-   If a requirement is unclear, explain the ambiguity and recommend a
    practical choice before making a significant change.
-   Keep dependencies to a reasonable minimum.

I want to understand the application and be able to explain the
important decisions in a technical interview. Do not hide complexity
behind unnecessary helpers or generate large amounts of code that I
cannot reasonably review.

## 2. Assessment algorithms

The two algorithmic features are important parts of this assessment.
Their core logic must be implemented directly in the project, without
using a graph, topological-sort, coin-change, knapsack, or optimization
library to solve the required problems.

AI assistance may be used during implementation, including generating
code. I am responsible for reviewing the approach and final code,
checking it against meaningful test cases, understanding the data
structures and algorithm steps, and being able to explain the decisions
and complexity during an assessment or interview.

Keep the algorithm modules focused and easy to inspect. Prefer clear
functions and straightforward control flow over clever abstractions.
The implementation should make the DFS and dynamic programming steps
easy to follow.

## 3. Repository and package management

-   Use one Git repository with npm workspaces.
-   I will create the Git repository manually. Do not run `git init` or
    create the initial commit.
-   After the initial project structure is ready, I will review it and
    make the first commit myself.
-   Keep the frontend in `apps/web` and backend in `apps/api`.
-   Use npm consistently; do not introduce Yarn or pnpm.
-   Provide root scripts for common development and verification tasks.
-   Keep frontend and backend independently runnable.
-   Do not add Docker or Docker Compose during the initial
    implementation.
-   Do not add a shared package unless there is a real need for it.

## 4. TypeScript and code style

-   Use TypeScript in both applications.
-   Avoid `any`. If a type is genuinely unknown, use `unknown` and
    narrow it.
-   Define clear types for API inputs and outputs.
-   Keep functions small enough to understand.
-   Use descriptive names; avoid cryptic abbreviations.
-   Avoid deeply nested conditionals when a simple early return is
    clearer.
-   Handle asynchronous errors explicitly.
-   Do not suppress TypeScript or lint errors just to make a command
    pass.
-   Do not add comments that simply repeat what the next line of code
    does.
-   Add comments when they explain a non-obvious decision or constraint.

Use ESLint and Prettier consistently. Formatting should not become a
reason to rewrite unrelated files.

## 5. Backend organization

Keep backend responsibilities separated:

-   **Routes:** map HTTP methods and paths to controllers.
-   **Controllers:** read request data, call services, and send HTTP
    responses.
-   **Services:** contain application and business logic.
-   **Models:** define Mongoose schemas, indexes, and persistence
    constraints.
-   **Validation:** validate request parameters, query strings, and
    bodies.
-   **Middleware:** handle shared concerns such as errors and not-found
    routes.

Do not put the full business logic in route handlers or controllers.

Use a consistent response envelope as defined in `PROJECT_SPEC.md`.

Use the required status codes and stable error codes. In particular,
circular dependencies must return HTTP `409` with `CIRCULAR_DEPENDENCY`.

Do not expose stack traces, MongoDB error internals, credentials, or
other sensitive details in API responses.

## 6. MongoDB and Mongoose

-   Use MongoDB Atlas as the database.
-   Read the connection string from `MONGODB_URI`.
-   Never hardcode credentials or commit a real `.env` file.
-   Keep `.env.example` files with placeholder values.
-   Use Mongoose models with explicit schemas and appropriate
    validation.
-   Add indexes for normalized unique movie titles and cinema names.
-   Use ObjectId references for movie prerequisites and cinema bookings.
-   Check that referenced documents exist before accepting
    relationships.
-   Prevent duplicate prerequisite IDs and duplicate bundle sizes.
-   Store timestamps consistently.
-   Do not assume that Mongoose validation alone can enforce graph
    rules.
-   Validate circular dependencies in application logic before saving.

Do not introduce transactions without a reason. If a multi-document
operation needs atomicity, check the Atlas deployment's transaction
support and explain the approach.

## 7. Validation and error handling

Validate incoming data at the API boundary.

At minimum, validate:

-   Required strings and trimmed names.
-   Movie title uniqueness.
-   Positive integer release years.
-   Movie runtime from 1 to 300.
-   Existing prerequisite movie IDs.
-   No self-prerequisite.
-   No duplicate prerequisite IDs.
-   No circular dependencies.
-   Cinema name uniqueness.
-   Between 1 and 10 bundle sizes.
-   Distinct bundle sizes from 1 to 500.
-   Group size from 1 to 10,000.
-   Valid MongoDB ObjectId route parameters.

Return useful validation messages without leaking implementation
details.

Distinguish invalid input, missing resources, duplicate resources,
circular dependencies, impossible booking combinations, and unexpected
server failures.

An impossible booking combination is a valid business result. It should
not be reported as an internal server error.

## 8. Data integrity

-   Validate the complete proposed prerequisite graph before persisting
    a movie relationship change.
-   A rejected movie update must not partially change the saved
    prerequisites.
-   A booking must only be saved after the server has calculated a
    possible exact quote.
-   Never trust bundle quantities or totals sent by the frontend.
-   Recalculate the quote on the backend when creating a booking.
-   Store a snapshot of the cinema name and bundle information in a
    booking.
-   Do not silently cascade-delete movies, cinemas, or booking records.
-   Follow the deletion restrictions in `PROJECT_SPEC.md` if deletion
    endpoints are introduced.

## 9. Frontend rules

-   Keep feature code grouped by Movies, Rewatch Plan, and Booking.
-   Use reusable components when they remove genuine duplication.
-   Keep API communication in a small, consistent API layer.
-   Use typed request and response data.
-   Do not duplicate backend business logic in the frontend.
-   The backend is the source of truth for rewatch ordering and booking
    calculations.
-   Handle loading, empty, success, and error states.
-   Prevent duplicate submissions while a request is in progress.
-   Show clear validation messages.
-   Keep forms accessible and usable on smaller screens.
-   Do not add a global state library unless the actual requirements
    justify it.

The UI should be cinematic but practical. Do not sacrifice readability
or usability for visual effects.

## 10. Testing expectations

Tests are required for the important behavior, not just for basic server
startup.

Prioritize:

-   Movie input validation.
-   Duplicate movie titles.
-   Direct and indirect dependency cycles.
-   A valid dependency graph.
-   Shared prerequisites appearing once.
-   Target movie exclusion.
-   Correct watched count and unwatched runtime.
-   Empty rewatch plans.
-   Booking minimum-bundle results.
-   Impossible exact combinations.
-   Multiple optimal combinations and deterministic tie-breaking.
-   Minimum and maximum group sizes.
-   Invalid and duplicate bundle sizes.
-   Saving a booking snapshot.
-   Rejection of a booking when no exact quote exists.
-   Failed updates leaving existing data unchanged.

Use unit tests for the algorithm modules and API tests for HTTP
behavior. Do not replace the required algorithm implementations with
mocks in their unit tests.

## 11. Development workflow

For each task:

1.  Read the relevant requirements.
2.  Inspect the current implementation.
3.  Explain briefly what you intend to change.
4.  Implement only the requested scope.
5.  Run the relevant tests, type checks, and lint checks.
6.  Review the resulting diff for unrelated changes.
7.  Report what changed, what was verified, and what remains.

Do not claim that a test passed unless it was actually run and its
result was checked.

Do not commit or push changes unless I explicitly ask you to do so.
For later development work, I may ask you to create a commit and push
it after I have reviewed the changes. Never do this automatically.

Do not modify the roadmap or specification just to make an
implementation appear complete. If a requirement needs to change,
explain the reason and let me decide.

## 12. Scope control

Do not add:

-   Authentication.
-   Payment gateways.
-   Real seat inventory or seat locking.
-   External cinema integrations.
-   Email or SMS services.
-   Redis, queues, or microservices.
-   Complex role-based access control.
-   Unrequested analytics or dashboards.

The saved booking feature is a record of a calculated plan, not a real
ticket reservation.

Do not add dependencies or features solely for the sake of making the
project look more advanced.

## 13. Documentation and honesty

Keep the README useful and accurate. It should explain:

-   What the application does.
-   How to run it.
-   Required environment variables.
-   The MongoDB Atlas setup.
-   The data model.
-   How cycle detection and rewatch ordering work.
-   How the booking dynamic programming solution works.
-   Available API endpoints.
-   How to run tests.
-   Which AI tools were used and what they assisted with.

Describe AI assistance accurately. Do not claim that AI-generated
implementation work was written entirely without assistance. At the
same time, avoid overstating the role of AI or adding unnecessary
self-deprecating language. The README should briefly state which tools
assisted with development and the kinds of tasks they helped with.
I am responsible for understanding the final implementation and being
able to explain the design, algorithms, tests, and trade-offs.

## 14. Completion standard

A task is complete only when:

-   The requested behavior is implemented.
-   Relevant validation is present.
-   Relevant tests have been run.
-   TypeScript and lint checks pass, where applicable.
-   No unrelated functionality has been changed.
-   Any limitations or remaining work are reported clearly.

If something cannot be verified, say so instead of presenting it as
complete.
