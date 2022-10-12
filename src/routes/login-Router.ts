import * as express from 'express';
import { replaceUnderscoreId, sendErrorResponse } from '../utils';
import * as indicative from 'indicative';

const router = express.Router();
const usersDB = 'usersDB.json';

// Login (authentication)
//************************************** */
//some authentication stuff here
//************************************** */
router.post('/', async function (req, res) {
   const currInput = new LoginInput(req.body.username, req.body.password);
   console.log(currInput);
   
   try {
      await indicative.validator.validate(currInput, {
         username: 'required|string|min:2',
         password: 'required|string|min:2',
      });
      try {
         const user = await req.app.locals.db.collection('users').findOne({ username: currInput.username });
         if (user && user.password === currInput.password) {
            const result = replaceUnderscoreId(user);
            res.status(200).json(result);
         }
         else {
            sendErrorResponse(req, res, 400, `Wrong username or password.`);
            return;
         }
      }
      catch {
         sendErrorResponse(req, res, 400, `Wrong username or password.`);
         return;
      }
   } catch (errors) {
      console.log(errors)
      sendErrorResponse(req, res, 400, `Invalid User data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});

export default router;


class LoginInput {
   constructor(
      readonly username: string,
      readonly password: string,
   ) { }
}
