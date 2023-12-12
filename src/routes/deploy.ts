import {
  Router,
  json
} from 'express';
import { exec, execSync } from 'child_process';
import fs from 'fs';
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
    "repository": {
      "url": "url of the repository",
      "fine-grained-token": "token for fine-grained access to the repository"
    }
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

  // verify data
  if (!body.data) {
    res.status(400).json({
      "status": "error",
      "message": "no data"
    });
    return;
  }

  if (!body.data.name) {
    res.status(400).json({
      "status": "error",
      "message": "no name"
    });
    return;
  }

  if (!body.data.repository) {
    res.status(400).json({
      "status": "error",
      "message": "no repository"
    });
    return;
  }

  const url = body.data.repository.url;

  if (!url) {
    res.status(400).json({
      "status": "error",
      "message": "no repository url"
    });
    return;
  }

  // check validity of the url
  // a valid url is of the form: https://github.com/ownerName/project-name.git
  if (!verifyUrl(url)) {
    res.status(400).json({
      "status": "error",
      "message": "invalid repository url"
    });
    return;
  }

  // get project name
  const projectName = url.substring(url.lastIndexOf("/") + 1, url.lastIndexOf(".git"));



  /* ------go to DEPLOY_DIR------ */
  try {
    // check if the directory exists
    // if it does not exist, create it
    if (!fs.existsSync(DEPLOY_DIR)) {
      fs.mkdirSync(DEPLOY_DIR);
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      "status": "error while getting to deploy dir",
    });
  }

  /* ------clone the repository------ */
  // construct the clone url
  const token = body.data.repository["fine-grained-token"];
  const prefix = url.startsWith("https://") ? "https://" : "http://";
  const cloneUrl = prefix + token + ":x-oauth-basic@" + url.substring(prefix.length);

  let port: number = 0;
  try {
    port = await getUnusedPort();
  } catch (err) {
    console.log(err);
    res.status(400).json({
      "status": "error while getting an unused port: " + err,
    });
  }

  // clone the repository into the deploy dir
  try {
    // if the project already exists, delete it
    if (fs.existsSync(DEPLOY_DIR + "/" + projectName)) {
      console.log(`${projectName}: existing project found: deleting ...`);
      execSync(`rm -rf ${DEPLOY_DIR}/${projectName}`);
    }
    console.log(`${projectName}: cloning ...`);
    execSync(
      `cd ${DEPLOY_DIR} && git clone ${cloneUrl}`,
    );
    console.log(`${projectName}: cloned`);
    execSync(
      `cd ${DEPLOY_DIR}/${projectName} && npm i --force`,
    );
    console.log(`${projectName}: npm i --force executed`);
    exec(
      `cd ${DEPLOY_DIR}/${projectName} && PORT=${port} pm2 --name ${projectName} start npm -- start && pm2 save`,
    );
    console.log(`${projectName}: pm2 started, port: ${port}`);

    // check if the port is open
    // if it is not open, then open it
    checkAndOpenPort(port);

  } catch (err) {
    console.log(err);
    res.status(400).json({
      "status": "error while cloning the repository",
    });
    return;
  }

  try {
    res.status(200).json({
      "status": "ok",
      "port": port,
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

function checkAndOpenPort(port: number): void { // run as root
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