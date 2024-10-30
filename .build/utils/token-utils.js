"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAccessToken = exports.generateAccessToken = exports.TOKEN_EXPIRY = void 0;
exports.generateJwt = generateJwt;
const jsonwebtoken_1 = require("jsonwebtoken");
const keys_json_1 = __importDefault(require("./keys.json"));
const JWT_ALG = 'RS256';
// the keys are attached with the headers in code
// this is because storing new lines in GH actions secrets causes weird issues	
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----\n${keys_json_1.default.private_key}\n-----END RSA PRIVATE KEY-----`;
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----\n${keys_json_1.default.public_key}\n-----END PUBLIC KEY-----`;
exports.TOKEN_EXPIRY = 60 * 24;
const generateAccessToken = (opts) => {
    const jwt = generateJwt(opts);
    const token = (0, jsonwebtoken_1.sign)(jwt, PRIVATE_KEY, { algorithm: JWT_ALG });
    return token;
};
exports.generateAccessToken = generateAccessToken;
function generateJwt({ user, expirationMinutes = exports.TOKEN_EXPIRY }) {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + (expirationMinutes * 60);
    const jwt = {
        user,
        iat,
        exp
    };
    return jwt;
}
const validateAccessToken = (token, opts) => {
    try {
        const user = (0, jsonwebtoken_1.verify)(token, PUBLIC_KEY, {
            algorithms: [JWT_ALG],
            ...(opts || {})
        });
        return user;
    }
    catch (error) {
        throw new Error(error.message);
    }
};
exports.validateAccessToken = validateAccessToken;
