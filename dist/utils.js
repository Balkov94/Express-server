"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URLIdValidation = exports.replaceUnderscoreId = exports.sendErrorResponse = void 0;
const sendErrorResponse = function (req, res, status = 500, message, err = Error) {
    if (req.get('env') === 'production') {
        err = undefined;
    }
    res.status(status).json({
        code: status,
        message,
        error: err
    });
};
exports.sendErrorResponse = sendErrorResponse;
function replaceUnderscoreId(dbOnjects) {
    if (Array.isArray(dbOnjects) === false) {
        const id = dbOnjects._id;
        delete dbOnjects._id;
        dbOnjects.id = id;
        return dbOnjects;
    }
    else {
        const newObjects = dbOnjects.map(element => {
            const id = element._id;
            delete element._id;
            element.id = id;
            return element;
        });
        return newObjects;
    }
}
exports.replaceUnderscoreId = replaceUnderscoreId;
;
function URLIdValidation(req, res, id) {
    if ((id.match(/^[0-9a-f]{24}$/) === null)) {
        (0, exports.sendErrorResponse)(req, res, 400, `Url ID is not the correct format.`);
        return;
    }
}
exports.URLIdValidation = URLIdValidation;
//# sourceMappingURL=utils.js.map