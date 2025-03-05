### Running the application

_-> TODO FILL THIS IN_

### Initial design considerations

When designing this API, I primarly focused on practical use cases and keeping clean & maintainable code. Since this API is not intended for production use I made the following design choices:

#### Multithreading Considerations

Some endpoints, like `POST /api/measurements`, may need to process large amounts of data, making multithreading a potential optimization. However, introducing multithreading can add complexity and reduce code simplicity. To keep the initial implementation straightforward, I have opted not to use multithreading at this stage. If performance later suggests significant benefits, I would consider adding it.

#### SQLite for Database

Since this API is relatively small and will not need to be scaled up down the line, I will use SQLite. Since it's easy to set up, most familiar to me, lightweight and doesn't require any external database hosting. If this API were to be bigger I would consider using PostgreSQL or MySQL since they're better suited for larger APIs.

To use SQLite I have opted to use the `sqlite3` library, since this library is better for asynchronous operations. This allows me to easily implement multithreading if need-be.
