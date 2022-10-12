import * as express from 'express';
import { replaceUnderscoreId, sendErrorResponse, URLIdValidation } from '../utils';
import * as indicative from 'indicative';
import { HOSTNAME, PORT } from '../server';
import { ObjectId } from 'mongodb';
const router = express.Router();

router.get('/', async (req, res) => {
   try {
      const allUsers= await req.app.locals.db.collection("users").find().toArray();
      // console.log(allUsers);
      const result = replaceUnderscoreId(allUsers);
      res.status(200).json(result);
   } catch (err) {
      sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
   }
});

router.get('/:id', async (req, res) => {
   const params = req.params;
   URLIdValidation(req, res, params.id);
   try {
      const currUser = await req.app.locals.db.collection("users").findOne({ _id: new ObjectId(params.id) });
      console.log(currUser);
      if (!currUser) {
         sendErrorResponse(req, res, 404, `User with ID=${req.params.id} does not exist`);
         return;
      }
      const result = replaceUnderscoreId(currUser);
      res.status(200).json(result);
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid User data`, errors);
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
         // phone: 'string|min:10|max:10',
         // mail: 'required|email',
         // userPic: 'url',
         description: 'string',
         role: 'required|number',
         status: 'required|number',
         timeOfCreation: 'required|string',
         timeOfModification: 'string'

      });
      try {
         const usernameCheck = await req.app.locals.db.collection("users").findOne({ username: newUser.username });
         const mailCheck = await req.app.locals.db.collection("users").findOne({ mail: newUser.mail });
         if (usernameCheck) {
            sendErrorResponse(req, res, 400, `Server error: Username is already taken`);
            return;
         }
         if (mailCheck) {
            sendErrorResponse(req, res, 400, `Server error: E-mail is already taken`);
            return;
         }
         delete newUser.id;
         const { acknowledged, insertedId } = await req.app.locals.db.collection('users').insertOne(newUser);
         if (acknowledged) {
            console.log(`Successfully inserted 1 document with ID ${insertedId}`);
            const result = replaceUnderscoreId(newUser);
            res.status(201)
               .location(`http://${HOSTNAME}:${PORT}/api/AllUsers/${insertedId}`)
               .json(result);
         }
      } catch (err) {
         console.error(`Unable to create User`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      console.log(errors)
      sendErrorResponse(req, res, 400, `Invalid User data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});



router.put("/Edit-form:id", async (req, res) => {
   // router.put("/Edit-form/:id", async (req, res) => {
   // router.put("/:id", async (req, res) => {
   const params = req.params;
   URLIdValidation(req, res, params.id);
   const oldUser = await req.app.locals.db.collection('users').findOne({ _id: new ObjectId(params.id) });
   if (!oldUser) {
      sendErrorResponse(req, res, 404, `User with ID=${params.id} does not exist`);
      return;
   }
   const updatedUser = req.body;
   if (oldUser._id.toString() !== updatedUser.id) {
      sendErrorResponse(req, res, 400, `User ID=${updatedUser.id} does not match URL ID=${params.id}`);
      return;
   }
   try {
      await indicative.validator.validate(updatedUser, {
         // id:'required|regex:^[0-9a-f]{24}$',
         fname: 'required|string|min:2',
         lname: 'required|string|min:2',
         username: 'required|string|min:2',
         password: 'required|string|min:2',
         // phone: 'string|min:10|max:10',
         // mail: 'required|email',
         // userPic: 'url',
         description: 'string',
         role: 'required|number',
         status: 'required|number',
         timeOfCreation: 'required|string',
         timeOfModification: 'string'
      });
      try {
         const usernameCheck = await req.app.locals.db.collection("users").findOne({ username: updatedUser.username });
         const mailCheck = await req.app.locals.db.collection("users").findOne({ mail: updatedUser.mail });
         if (usernameCheck !== null && String(usernameCheck._id) !== params.id) {
            sendErrorResponse(req, res, 400, `Server error: Username is already taken`);
            return;
         }
         if (mailCheck !== null && String(mailCheck._id) !== params.id) {
            sendErrorResponse(req, res, 400, `Server error: E-mail is already taken`);
            return;
         }
         delete updatedUser.id
         const { acknowledged, modifiedCount } = await req.app.locals.db.collection('users').replaceOne({ _id: new ObjectId(params.id) }, updatedUser)
         if (acknowledged && modifiedCount === 1) {
            console.log(`Updated User: ${JSON.stringify(updatedUser)}`);
            res.json(updatedUser);
         } else {
            sendErrorResponse(req, res, 500, `Unable to update User: ${updatedUser.id}: ${updatedUser.title}`);
            return;
         }
      } catch (err) {
         console.log(`Unable to update User: ${updatedUser.id}: ${updatedUser.title}`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid User data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});


router.delete('/:id', async (req, res) => {
   const params = req.params;
   URLIdValidation(req, res, params.id);
   try {
      const deleteUser = await req.app.locals.db.collection('users').findOneAndDelete({ _id: new ObjectId(params.id) });
      if (!deleteUser.ok) {
         sendErrorResponse(req, res, 500, `Error deleting the document in Mongodb`);
         return;
      }
      if (deleteUser.lastErrorObject.n === 0) {
         sendErrorResponse(req, res, 404, `User with ID=${req.params.id} does not exist`);
         return;
      }
      res.status(200).json(deleteUser.value);
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid User data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});

export default router;