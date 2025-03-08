## Running the application

1. Clone the repo
   `git@github.com:DaFrankort/nodejs-measurements.git`
   `cd nodejs-measurements`

2. Install all NPM packages
   `npm install`

3. Build the application
   `npm run build`

4. Run the application
   `npm run start`

## Design considerations

When designing this API, I primarly focused on practical use cases and keeping clean & maintainable code. Since this API is not intended for production use I made the following design choices:

### SQLite for Database

SQLite was chosen because:

- It is lightweight and easy to set up.
- It does not require an external database server.
- It is well-suited for small applications.
- The `sqlite3` library is used for better asynchronous operations, allowing efficient handling of multiple read and write operations.

For a larger, scalable API, a more robust database like **PostgreSQL** or **MySQL** would be considered.

### Table Class

To improve readability and maintainability, a `Table` class was created to handle table creation in the database. Instead of writing complex table creation logic in multiple places, the structure of each table is defined within models for clarity and consistency.

### MeasurementQueryBuilder

Since query-building is a repetitive task within the service layer, a `MeasurementQueryBuilder` class was introduced. This helps to:

- Standardize query creation.
- Reduce redundant code.
- Improve maintainability by encapsulating query logic in a single place.

By structuring the API this way, the code remains clean, modular, and easy to extend if needed.

#### Unit Tests

The following components are tested:

Table Class:

- Ensures tables are created correctly within the database.
- Verifies schema definitions are properly applied.

Service Classes:

- Tests if data is correctly handled and stored in the database.
- Mocks database interactions to isolate service logic.

Controller Classes:

- Validates incoming requests and ensures proper handling.
- Checks if correct responses are returned based on different inputs.

API Endpoints:

- Confirms that routes exist and function as expected.
- Validates response status codes and response structures.
