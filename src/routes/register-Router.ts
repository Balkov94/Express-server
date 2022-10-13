import * as express from 'express';
import { sendErrorResponse } from '../utils';
import * as indicative from 'indicative';
import { HOSTNAME, PORT } from '../server';

const router = express.Router();

router.post('/', async function (req, res) {
   const newUser = req.body;
   try {
      await indicative.validator.validate(newUser, {
         fname: 'required|string|min:2',
         lname: 'required|string|min:2',
         username: 'required|string|min:5|max:15',
         password: 'required|string|min:5',
         phone: 'string|min:10|max:10',
         mail: 'required|string',
         description: 'string',
         role: 'required',
         status: 'required',
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
            res.status(201)
               .location(`http://${HOSTNAME}:${PORT}/api/AllUsers/${insertedId}`)
               .json(newUser);
         }
      } catch (err) {
         console.error(`Unable to create User`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      console.log(errors)
      sendErrorResponse(req, res, 400, `Invalid User data: ${errors?.map(e => e.message).join(', ')}`, errors);
   }
});

export default router;