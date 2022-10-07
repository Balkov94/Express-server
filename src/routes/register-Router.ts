import * as express from 'express';
import { sendErrorResponse } from '../utils';
import * as indicative from 'indicative';
import { promises } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { HOSTNAME, PORT } from '../server';

const router = express.Router();
const usersDB = 'usersDB.json';

// Register user
//1 Unique username 2.validation - ok
router.post('/', async function (req, res) {
   const newUser = req.body;
   try {
      await indicative.validator.validate(newUser, {
         // id: 'required|string',
         fname: 'required|string|min:2',
         lname: 'required|string|min:2',
         username: 'required|string|min:2',
         password: 'required|string|min:2',
         phone: 'string|min:10|max:10',
         mail: 'required|email',
         userPic: 'url',
         description: 'string',
         role: 'required',
         status: 'required',
         timeOfCreation: 'required|string',
         timeOfModification: 'string'
      });

      const usersData = await promises.readFile(usersDB)
      const users = JSON.parse(usersData.toString());
      newUser.id = uuidv4();
      // 1. Unique username and mail =>  register
      if (users.some(user =>user.username === newUser.username || user.mail === newUser.mail)) {
         sendErrorResponse(req, res, 400, `Invalid User data: Username or email are already taken`)
         return;
      }
      users.push(newUser);
      try {
         await promises.writeFile(usersDB, JSON.stringify(users));
         res.status(201)
         .location(`http://${HOSTNAME}:${PORT}/api/AllUsers/${newUser.id }`)
         .json(newUser);
      } catch (err) {
         console.error(`Unable to create User: ${newUser.id}: ${newUser.title}.`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      console.log(errors)
      sendErrorResponse(req, res, 400, `Invalid User data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});

export default router;