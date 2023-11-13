import * as express from 'express';
import { replaceUnderscoreId, sendErrorResponse } from '../utils';
import * as indicative from 'indicative';
import * as  jwt from 'jsonwebtoken';
import 'dotenv/config'
//console.log(process.env.SECRET)

const router = express.Router();
const usersDB = 'usersDB.json';

// Login (authentication)
//************************************** */
//some authentication stuff here
//************************************** */
router.post('/', async function (req, res) {
   const currInput = new LoginInput(req.body.username, req.body.password);
  
   try {
      await indicative.validator.validate(currInput, {
         username: 'required|string|min:2',
         password: 'required|string|min:2',
      });
      try {
         const user = await req.app.locals.db.collection('users').findOne({ username: currInput.username });
         if (user && user.password === currInput.password) {
            const result = replaceUnderscoreId(user);
            //add JSON web token to response
            const accessToken = jwt.sign(user.username, process.env.ACCESS_TOKEN_SECRET);
            // result.token=accessToken;
            res.status(200).json({data:result, token:accessToken});
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
