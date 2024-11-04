import Express from 'express'
import { createSchema, createYoga } from 'graphql-yoga';
import { typeDefs } from './graphql/typeDefs'
import { resolvers } from './graphql/resolvers'
import Cors from 'cors'
import { initializeDatabase } from './datasource'
import { validateAccessToken } from './utils/token-utils';
import { DataSource } from 'typeorm';

export type ResolverContext = {
    userId?: number
    appDataSource: DataSource
}

// here we are using express, we can use any backend framework

async function startServer() {
    const appDataSource = await initializeDatabase()
    const app = Express()
    app.use(Cors())
    const yoga = createYoga({
        schema: createSchema({
            typeDefs,
            resolvers
        }),
        context: ({ request }) => {

            // @ts-ignore
            const authorization = request.headers.headersInit?.authorization || ''
            const authReq: ResolverContext = { appDataSource }

            try {
                const token = authorization.split(' ')[1]
                const user = validateAccessToken(token)

                authReq['userId'] = +user.user.id
            } catch(error) {
                console.log('Unauthenticated Request')
            }

            return authReq
        }
    })

    app.use(Express.json())

    app.all("/graphql", yoga)


    app.listen(9090, () => {
        console.log('Listening on 9090')
    })
}

startServer()