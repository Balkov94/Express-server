"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizationMiddleware = void 0;
function authorizationMiddleware(req, res, next) {
    if (req.headers && req.headers["Authorization"]) {
        const value = req.headers["Authorization"];
        console.log(value);
        next();
    }
    else {
        console.log('NOT AUTHORIZED');
        throw new Error('Not Authorized');
    }
}
exports.authorizationMiddleware = authorizationMiddleware;
//# sourceMappingURL=autMiddleware.js.map