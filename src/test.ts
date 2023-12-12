// call localhost:3000/api/deploy

import * as dotenv from 'dotenv';

dotenv.config();

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
const token = process.env.AUTH_TOKEN;
const body = {
  "auth": {
    "type": "token",
    "token": token
  },
  "data": {
    "name": "test",
    "repository": {
      "url": "https://github.com/hakcthaon-xrpl-evm/API.git",
      "fine-grained-token": "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"
    }
  }

}

const axios = require('axios');

// axios.post('http://localhost:3000/api/deploy', body)
//   .then((res: any) => {
//     console.log(`statusCode: ${res.statusCode}`)
//     console.log(res)
//   })
//   .catch((error: any) => {
//     console.error(error)
//   })

// wait for 10 seconds and kill it
//   body:
// {
//   "auth": {
//     type: "token", // or signature
//     token?: "token",
//     signature?: "signature object"
//   },
//   "data": {
//     "name": "name of the project",
//     "port": "port of the project" as number
//   }
// }
const bodyKill = {
  "auth": {
    "type": "token",
    "token": process.env.AUTH_TOKEN,
  },
  "data": {
    "name": "API",
    "port": 2000
  }
}



axios.post('http://localhost:3000/api/kill', bodyKill)
  .then((res: any) => {
    console.log(`statusCode: ${res.statusCode}`)
    console.log(res)
  })
  .catch((error: any) => {
    console.error(error)
  })

