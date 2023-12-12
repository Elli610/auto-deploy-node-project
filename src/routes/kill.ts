// stop a node app from running

import {
  Router,
  json
} from 'express';
import { exec, execSync } from 'child_process';
import fs, { existsSync } from 'fs';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const router = Router();
router.use(json());

const DEPLOY_DIR = "./deploy";

/*
body:
{
  "auth": {
    type: "token", // or signature
    token?: "token",
    signature?: "signature object"
  },
  "data": {
    "name": "name of the project",
    "port": "port of the project" as number
  }
}
*/


router.post('/', async (req, res) => {
  const body = req.body;
  // get the token from the environment variable

  // verify authToken
  if (body.auth.type === "token") {
    if (body.auth.token !== process.env.AUTH_TOKEN) {
      console.log(`invalid token received: ${body.auth.token}`);
      res.status(401).json({
        "status": "error",
        "message": "invalid token"
      });
      return;
    }
  } else if (body.auth.type === "signature") {
    // TODO
  } else {
    res.status(400).json({
      "status": "error",
      "message": "invalid auth type"
    });
    return;
  }

  // check if body.data contains the port
  if (!body.data.port) {
    res.status(400).json({
      "status": "error",
      "message": "port not provided"
    });
    return;
  }
  console.log(`${body.data.name}: kill in progress`)
  /* ------go to DEPLOY_DIR------ */
  // check if the directory exists. if it does not exist, return no project found
  if (!fs.existsSync(DEPLOY_DIR)) {
    res.status(400).json({
      "status": "error",
      "message": "no project found"
    });
    return;
  }


  /* ------clone the repository------ */

  // check if DEPLOY_DIR contains the project folder
  try {
    if (!existsSync(`${DEPLOY_DIR}/${body.data.name}`)) {
      res.status(400).json({
        "status": "error",
        "message": "no project found"
      });
      return;
    }

    // check if the port is open
    // if it is open, then close it
    checkAndClosePort(body.data.port);

    // if the folder exists, then remove it
    execSync(`rm -rf ${DEPLOY_DIR}/${body.data.name}`);

    // remove the pm2 process
    execSync(`pm2 delete ${body.data.name} && pm2 save`);
  } catch (err) {
    console.log(err);
    res.status(400).json({
      "status": "error while removing the project",
    });
    return;
  }

  try {
    res.status(200).json({
      "status": "ok",
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      "status": "error",
    });
  }
  return;
});

export default router;



function verifyUrl(url: string): boolean {
  // a valid url is of the form: https://github.com/ownerName/project-name.git

  // check if the url starts with http://github.com/ or https://github.com/
  if (!url.startsWith("http://github.com/") && !url.startsWith("https://github.com/")) {
    return false;
  }

  // check if the url ends with .git
  if (!url.endsWith(".git")) {
    return false;
  }

  return true;
}

const MIN_PORT = 2000;
const MAX_PORT = 2050;

async function getUnusedPort(): Promise<number> {
  for (let port = MIN_PORT; port <= MAX_PORT; port++) {
    if (!(await isPortUsed(port))) {
      return port;
    }
  }

  throw new Error("no unused port found");
}

async function isPortUsed(port: number) {
  try {
    const url = `http://localhost:${port}`;
    await axios.get(url);
    return true;
  } catch (error) {
    return false;
  }
}

function checkAndClosePort(port: number): void { // run as root
  // try {
  //   const status = execSync(`sudo ufw status | grep '${port}'`);

  //   if (status.includes("ALLOW")) {
  //     // console.log(`Port ${port} is already open.`);
  //   } else {
  //     console.log(`Port ${port} is not open. Opening port...`);
  //     const result = execSync(`sudo ufw allow ${port}`);
  //     console.log(result);
  //   }
  // } catch (error) {
  //   console.error('Error:', error);
  // }
}