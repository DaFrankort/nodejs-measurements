import { app } from "./app";
import { initDatabaseTables } from "./config/database";

const PORT = process.env.PORT || 3000;

// Database setup
initDatabaseTables();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
