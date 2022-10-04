"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replace_id = exports.sendErrorResponse = void 0;
const sendErrorResponse = function (req, res, status = 500, message, err) {
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
const replace_id = function (entity) {
    entity.id = entity._id;
    delete entity._id;
    return entity;
};
exports.replace_id = replace_id;
//# sourceMappingURL=utils.js.map