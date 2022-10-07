import * as express from 'express';
import { sendErrorResponse } from '../utils';
import * as indicative from 'indicative';
import { promises } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { HOSTNAME, PORT } from '../server';

const router = express.Router();
const usersDB = 'usersDB.json';

// users = (AllUsers) API Feature
router.get('/', async (req, res) => {
   try {
      const usersData = await promises.readFile(usersDB)
      const users = JSON.parse(usersData.toString());
      res.json(users);
   } catch (err) {
      sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
   }
});

router.get('/:id', async (req, res) => {
   const params = req.params;
   try {
      await indicative.validator.validate(params.id, { id: 'required|regex:^[0-9a-f]{24}$' });
      // await indicative.validator.validate(params, { id: 'required|regex:^[0-9a-f]{24}$' });
      //   const currComment = await req.app.locals.db.collection('posts').findOne({ _id: new ObjectID(req.params.id) });
      const usersData = await promises.readFile(usersDB)
      const users = JSON.parse(usersData.toString());
      const currUser = users.find(c => c.id === params.id)
      console.log(currUser);
      if (!currUser) {
         sendErrorResponse(req, res, 404, `User with ID=${req.params.id} does not exist`);
         return;
      }
      res.json(currUser);
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid User data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});


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
         role: 'required|string',
         status: 'required|string',
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



router.put('/:id', async (req, res) => {
   const params = req.params;
   const usersData = await promises.readFile(usersDB)
   const users = JSON.parse(usersData.toString());
   console.log(params)
   const currUser = users.find(c => c.id === params.id)
   if (!currUser) {
      sendErrorResponse(req, res, 404, `User with ID=${req.params.id} does not exist`);
      return;
   }
   const newUserData = req.body;
   if (currUser.id.toString() !== newUserData.id) {
      sendErrorResponse(req, res, 400, `User ID=${newUserData.id} does not match URL ID=${req.params.id}`);
      return;
   }
   try {
      await indicative.validator.validate(newUserData, {
         // id:'required|regex:^[0-9a-f]{24}$',
         fname: 'required|string|min:2',
         lname: 'required|string|min:2',
         username: 'required|string|min:2',
         password: 'required|string|min:2',
         phone: 'string|min:10|max:10',
         mail: 'required|email',
         userPic: 'url',
         description: 'string',
         role: 'required|string',
         status: 'required|string',
         timeOfCreation: 'required|string',
         timeOfModification: 'string'
      });
      try {
         const updatedUser = { ...req.body, id: params.id }
         const updatedUsersDB = users.map(c => {
            if (c.id === updatedUser.id) {
               return updatedUser;
            }
            return c;
         })
         await promises.writeFile(usersDB, JSON.stringify(updatedUsersDB));
         res.json(updatedUser);

      } catch (err) {
         console.log(`Unable to update User: ${newUserData.id}: ${newUserData.title}`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid User data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});

router.delete('/:id', async (req, res) => {
   const params = req.params;
   try {
      // await indicative.validator.validate(params.id, { id: 'required|regex:^[0-9a-f]{24}$' });
      const usersData = await promises.readFile(usersDB);
      const users = JSON.parse(usersData.toString());
      const currUser = users.find(c => c.id === params.id)
      if (!currUser) {
         sendErrorResponse(req, res, 404, `User with ID=${req.params.id} does not exist`);
         return;
      }
      else {
         const updatedUsersDB = users.filter(user => user.id !== params.id)
         console.log(updatedUsersDB);
         await promises.writeFile(usersDB, JSON.stringify(updatedUsersDB));
         res.json({ message: `User ID:${params.id} was deleted.` });   
         res.json(updatedUsersDB);
      }

   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid User data: ${errors.map(e => e.message).join(', ')}`, errors);

   }
});

export default router;