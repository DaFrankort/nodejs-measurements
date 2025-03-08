## Running the application

1. Clone the repo
   `git clone git@github.com:DaFrankort/nodejs-measurements.git`
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

SQLite was chosen as a database because:

- It is lightweight and easy to set up.
- No external database server is required.
- It is well-suited for small applications.
- The `sqlite3` library is used for better asynchronous operations, allowing efficient handling of multiple read and write operations.

For a larger, scalable API, a more robust database like **PostgreSQL** or **MySQL** would be considered.

### Models

Since the project uses only a single table, models were not implemented. If additional tables are added in the future, models would be used to define the relationships between tables and improve maintainability.

### Table Class

To improve readability and maintainability, a `Table` class was created to handle table creation in the database. Instead of writing complex table creation logic in multiple places, the structure of each table is defined within service for clarity and consistency.

### MeasurementQueryBuilder

Since query-building is a repetitive task within the service layer, a `MeasurementQueryBuilder` class was introduced. This helps to:

- Standardize query creation.
- Reduce redundant code.
- Improve maintainability by encapsulating query logic in a single place.

By structuring the API this way, the code remains clean, modular, and easy to extend if needed.

#### Unit Tests

The following components are tested:

- **Table Class:** Ensures tables are created correctly and verifies that schema definitions are properly applied.
- **Service Classes:** Tests if data is correctly handled and stored in the database. Database interactions are mocked to isolate service logic.
- **Controller Classes:** Validates incoming requests and ensures proper handling. Tests if correct responses are returned based on different inputs.
- **API Endpoints:** Verifies that routes exist and function as expected. Confirms that response status codes and response structures are correct.
