import { Router } from 'express';
import * as oauth from '../controllers/oauthController';
import { forceCookie } from '../middleware/forceCookie';

const router = Router();

router.get('/authorize', forceCookie, oauth.getAuthorize);
// router.post('/authorize', forceCookie, oauth.postAuthorize);
router.post('/token', oauth.tokenExchange);
router.get('/userinfo', oauth.userinfo);

export default router;
