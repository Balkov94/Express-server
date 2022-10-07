import * as express from 'express';
import { sendErrorResponse } from '../utils';
import * as indicative from 'indicative';
import { promises } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { HOSTNAME, PORT } from '../server';

const router = express.Router();
const usersDB = 'usersDB.json';

// Login (authentication)
//************************************** */
//some authentication stuff here */
//************************************** */



export default router;