import express, { Express } from "express";
import cors from "cors"; // Import the CORS package


const app: Express = express();


import deploy from "./routes/deploy";
import kill from "./routes/kill";
const corsOptions = {
    origin: 'http://89.58.41.130:4051', // This should be the domain you want to allow connections from
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  };
  
app.use(cors(corsOptions)); // Use the CORS middleware with the specified options
app.use("/api/deploy", deploy);
app.use("/api/kill", kill);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));