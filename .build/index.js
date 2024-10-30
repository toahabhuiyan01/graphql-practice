"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const graphql_yoga_1 = require("graphql-yoga");
const typeDefs_1 = require("./graphql/typeDefs");
const resolvers_1 = require("./graphql/resolvers");
const datasource_1 = require("./datasource");
const token_utils_1 = require("./utils/token-utils");
// here we are using express, we can use any backend framework
async function startServer() {
    await (0, datasource_1.initializeDatabase)();
    const app = (0, express_1.default)();
    const yoga = (0, graphql_yoga_1.createYoga)({
        schema: (0, graphql_yoga_1.createSchema)({
            typeDefs: typeDefs_1.typeDefs,
            resolvers: resolvers_1.resolvers
        }),
        context: ({ request }) => {
            // @ts-ignore
            const authorization = request.headers.headersInit?.authorization || '';
            try {
                const token = authorization.split(' ')[1];
                const user = (0, token_utils_1.validateAccessToken)(token);
                return {
                    userId: user.user.id
                };
            }
            catch (error) {
                console.log('Unauthenticated Request');
                return {};
            }
        }
    });
    app.use(express_1.default.json());
    app.all("/graphql", yoga);
    app.listen(9090, () => {
        console.log('Listening on 9090');
    });
}
startServer();
