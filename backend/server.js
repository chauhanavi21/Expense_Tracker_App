import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();


app.use(express.json());


const PORT = process.env.PORT || 5001;


app.listen(PORT, () => {
    console.log("Server is up and running on PORT:", PORT);
  });