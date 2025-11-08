"use strict";
//here we set the Config class for the accessing of environemnt variables
import fs from "fs";
import path from "path";

//this is used to get the process env variable of node
import dotenv from "dotenv";
import { envInterface } from "./application/interfaces/env.interface";
const env = process.env.NODE_ENV || "dev";
console.log("NODE ENV", env, process.env.NODE_ENV);
//a file should be exist - .env.<envName>
const envPath = path.join(__dirname, `/.env`);
if (!process.env.NOENV || process.env.NOENV == "false") {
  if (!fs.existsSync(envPath)) {
    console.log(`Please create env file .env`);
    process.exit(1);
  }
  dotenv.config({ path: envPath });
} else {
  console.log("NO .ENV. SPECIFIED");
  dotenv.config();
}
console.log("ENVIORMENT", process.env.NODE_ENV);
class Config {
  public currentEnv!: envInterface;
 
  loadEnvironment = async (): Promise<any> => {
    const envName = `./environment/${process.env.NODE_ENV}`;
    const currentEnv = await import(envName);
    this.currentEnv = currentEnv.default;
    // console.log(this.currentEnv);
    this.setSecureCredentials();
    console.log("LOADED ENV", this.currentEnv);
    return this.currentEnv;
  };
  setSecureCredentials = () => {
    // database credentials from env variables
    this.currentEnv.database.host = process.env.DB_HOST || this.currentEnv.database.host;
    this.currentEnv.database.port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : this.currentEnv.database.port;
    this.currentEnv.database.name = process.env.DB_NAME || this.currentEnv.database.name;
    this.currentEnv.database.username = process.env.DB_USERNAME || this.currentEnv.database.username;
    this.currentEnv.database.password = process.env.DB_PASSWORD || this.currentEnv.database.password;
  };

  getCurrentEnvironment(): envInterface {
    return this.currentEnv;
  }
}
export default new Config();
