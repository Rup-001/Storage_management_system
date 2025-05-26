require("dotenv").config(); // Load environment variables
const app = require("./app"); // Import the app

const port = process.env.PORT || 4000; // Use process.env.PORT or default to 4000

app.listen(port, () => {
    console.log(`Server is running in port ${port}`);
});
