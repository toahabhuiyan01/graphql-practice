export const typeDefs = `

    """ A signle User """
    type User {
        id: ID!
        username: String!
        orders: [Order]
    }

    """ A single Product """
    type Product {
        id: ID!
        name: String!
        category: String!
        price: Float!
    }

    """ A Single Order """
    type Order {
        id: ID!
        user: User!
        status: String!
        product: Product!
        quantity: Int!
    }

    type Query {
        users: [User]

        """This Needs Authorization"""
        products(
            category: String,
            minPrice: Float,
            maxPrice: Float,
            limit: Int = 10,
            offset: Int = 0
        ): [Product]

        """This Needs Authorization"""
        orders(
            productId: String,
            limit: Int = 10,
            offset: Int = 0
        ): [Order]

        topRankingUsers: [User]

        totalSalesPerCategory: [CategorySales]
    }

    """ Sales By Category """
    type CategorySales {
        category: String!
        totalSales: Float!
    }

    """ Access Token when logged In"""
    type AccessToken {
        token: String!
    }

    type Success {
        success: Boolean!
    }

    type Mutation {
        """This Needs Authorization"""
        createUser(username: String!, password: String!): User

        """This Needs Authorization"""
        updateUser(username: String, password: String): Success

        login(username: String!, password: String!): AccessToken

        """This Needs Authorization"""
        createProduct(name: String!, category: String!, price: Float!): Product

        """This Needs Authorization"""
        updateProduct(id: ID!, name: String, category: String, price: Float): Product

        createOrder(productId: ID!, quantity: Int!): Order

        """This Needs Authorization"""
        updateOrder(id: ID!, status: String): Success

        """This Needs Authorization"""
        deleteProduct(id: ID!): Boolean
    }
`