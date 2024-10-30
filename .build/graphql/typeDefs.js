"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
exports.typeDefs = `
    type User {
        id: ID!
        username: String!
        orders: [Order]
    }

    type Product {
        id: ID!
        name: String!
        category: String!
        price: Float!
    }

    type Order {
        id: ID!
        user: User!
        status: String!
        product: Product!
        quantity: Int!
    }

    type Query {
        users: [User]
        products(
            category: String,
            minPrice: Float,
            maxPrice: Float,
            limit: Int = 10,
            offset: Int = 0
        ): [Product]
        orders(
            productId: String,
            limit: Int = 10,
            offset: Int = 0
        ): [Order]
        topRankingUsers: [User]
        totalSalesPerCategory: [CategorySales]
    }

    type CategorySales {
        category: String!
        totalSales: Float!
    }

    type AccessToken {
        token: String!
    }

    type Success {
        success: Boolean!
    }

    type Mutation {
        createUser(username: String!, password: String!): User
        updateUser(username: String, password: String): Success
        login(username: String!, password: String!): AccessToken
        createProduct(name: String!, category: String!, price: Float!): Product
        updateProduct(id: ID!, name: String, category: String, price: Float): Product
        createOrder(productId: ID!, quantity: Int!): Order
        updateOrder(id: ID!, status: String): Success
        deleteProduct(id: ID!): Boolean
    }
`;
