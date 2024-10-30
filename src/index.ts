import Express from 'express'
import { createSchema, createYoga } from 'graphql-yoga';
import { typeDefs } from './graphql/typeDefs'
import { resolvers } from './graphql/resolvers'
import { initializeDatabase } from './datasource';
import { validateAccessToken } from './utils/token-utils';


// here we are using express, we can use any backend framework

async function startServer() {
    await initializeDatabase()
    const app = Express()
    const yoga = createYoga({
        schema: createSchema({
            typeDefs,
            resolvers
        }),
        context: ({ request }) => {

            // @ts-ignore
            const authorization = request.headers.headersInit?.authorization || ''

            try {
                const token = authorization.split(' ')[1]
                const user = validateAccessToken(token)

                return {
                    userId: user.user.id
                }
            } catch(error) {
                console.log('Unauthenticated Request')
                return {}
            }
        }
    })

    app.use(Express.json())

    app.all("/graphql", yoga)


    app.listen(9090, () => {
        console.log('Listening on 9090')
    })
}

startServer()