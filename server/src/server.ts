import "dotenv/config";
import { App } from "./app.js"

const PORT = process.env.PORT || 3000;
const app = new App();

app.getApp().listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
