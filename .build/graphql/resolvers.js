"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const User_1 = __importDefault(require("../models/User"));
const Product_1 = __importDefault(require("../models/Product"));
const Order_1 = __importDefault(require("../models/Order"));
const datasource_1 = require("../datasource");
const token_utils_1 = require("../utils/token-utils");
exports.resolvers = {
    Query: {
        users: async () => {
            return await datasource_1.AppDataSource.getRepository(User_1.default).find({ relations: ['orders'] });
        },
        products: async (_, { category, minPrice, maxPrice, limit, offset }, { userId }) => {
            if (!userId) {
                throw new Error('Unauthorized');
            }
            const query = datasource_1.AppDataSource.getRepository(Product_1.default)
                .createQueryBuilder('product')
                .innerJoin('product.user', 'user')
                .where('user.id =:userId', { userId })
                .skip(offset)
                .take(limit);
            if (category) {
                query.andWhere('product.category = :category', { category });
            }
            if (minPrice) {
                query.andWhere('product.price >= :minPrice', { minPrice });
            }
            if (maxPrice) {
                query.andWhere('product.price <= :maxPrice', { maxPrice });
            }
            const data = await query.getMany();
            return data;
        },
        orders: async (_, { productId, limit, offset }, { userId }) => {
            if (!userId) {
                throw new Error('Unauthorized');
            }
            const orderRepo = datasource_1.AppDataSource.getRepository(Order_1.default);
            const qb = orderRepo.createQueryBuilder('order');
            if (productId) {
                const product = await datasource_1.AppDataSource.getRepository(Product_1.default).findOneBy({
                    id: productId,
                    user: { id: userId }
                });
                if (!product) {
                    throw new Error('Product not found');
                }
                qb.innerJoin('order.product', 'product')
                    .where('product.id = :productId', { productId });
            }
            else {
                qb.innerJoin('order.user', 'user')
                    .where('user.id = :userId', { userId });
            }
            const data = await qb.skip(offset).take(limit).getMany();
            return data;
        },
        topRankingUsers: async () => {
            console.time("query-started");
            const users = await datasource_1.AppDataSource.getRepository(User_1.default)
                .createQueryBuilder('user')
                .leftJoinAndSelect('user.orders', 'order')
                .groupBy('user.id, order.id')
                .orderBy('COUNT(order.id)', 'DESC')
                .getMany();
            console.timeEnd("query-started");
            return users.map(({ id, username, orders }) => ({ id, username, orders }));
        },
        totalSalesPerCategory: async () => {
            console.time("query-started");
            let sales = await datasource_1.AppDataSource.getRepository(Product_1.default)
                .createQueryBuilder('product')
                .select('product.category')
                .leftJoin('product.orders', 'order')
                .addSelect('SUM(order.quantity * product.price)', 'totalSales')
                .groupBy('product.category')
                // TypeORM doesn't support to use aliases as orderby
                .orderBy('SUM(order.quantity * product.price)', 'DESC')
                .getRawMany();
            console.timeEnd("query-started");
            return sales.map(({ product_category, totalSales }) => ({ category: product_category, totalSales: parseFloat(totalSales) }));
        },
    },
    Mutation: {
        createUser: async (_, { username, password }) => {
            const existingUser = await datasource_1.AppDataSource.getRepository(User_1.default).findOneBy({ username });
            if (existingUser) {
                throw new Error('Username already exists');
            }
            const user = new User_1.default();
            user.username = username;
            user.password = password;
            return await datasource_1.AppDataSource.getRepository(User_1.default).save(user);
        },
        updateUser: async (_, { username, password }, { userId }) => {
            if (userId) {
                throw new Error('Unauthorized');
            }
            const userRepo = datasource_1.AppDataSource.getRepository(User_1.default);
            const user = await userRepo.findOneBy({ id: userId });
            if (!user) {
                throw new Error('User not found');
            }
            user.username = username ?? user.username;
            user.password = password ?? user.password;
            await userRepo.save(user);
            return { success: true };
        },
        login: async (_, { username, password }) => {
            const user = await datasource_1.AppDataSource.getRepository(User_1.default).findOneBy({ username, password });
            if (!user) {
                throw new Error('Invalid username or password');
            }
            const token = (0, token_utils_1.generateAccessToken)({ user: { id: user.id.toString() } });
            return { token };
        },
        createProduct: async (_, { name, category, price }, { userId }) => {
            if (!userId) {
                throw new Error('Unauthorized');
            }
            const user = await datasource_1.AppDataSource.getRepository(User_1.default).findOneBy({ id: userId });
            if (!user) {
                throw new Error('User not found');
            }
            const product = new Product_1.default();
            product.user = user;
            product.name = name;
            product.category = category;
            product.price = price;
            return await datasource_1.AppDataSource.getRepository(Product_1.default).save(product);
        },
        updateProduct: async (_, { id, name, category, price }, { userId }) => {
            if (!userId) {
                throw new Error('Unauthorized');
            }
            const productRepo = datasource_1.AppDataSource.getRepository(Product_1.default);
            const product = await productRepo.findOneOrFail({
                where: { id },
                relations: ['user'],
            });
            if (!product) {
                throw new Error('Product not found');
            }
            if (product.user.id !== userId) {
                throw new Error('Unauthorized');
            }
            if (name) {
                product.name = name;
            }
            if (category) {
                product.category = category;
            }
            if (price) {
                product.price = price;
            }
            return await productRepo.save(product);
        },
        createOrder: async (_, { productId, quantity }, { userId }) => {
            if (!userId) {
                throw new Error('Unauthorized');
            }
            const user = await datasource_1.AppDataSource.getRepository(User_1.default).findOneBy({ id: userId });
            const product = await datasource_1.AppDataSource.getRepository(Product_1.default).findOneBy({ id: productId });
            if (!user || !product) {
                throw new Error('User or Product not found');
            }
            const order = new Order_1.default();
            order.user = user;
            order.product = product;
            order.status = 'pending';
            order.quantity = quantity;
            return await datasource_1.AppDataSource.getRepository(Order_1.default).save(order);
        },
        updateOrder: async (_, { id, status }, { userId }) => {
            if (!userId) {
                throw new Error('Unauthorized');
            }
            const orderRepo = datasource_1.AppDataSource.getRepository(Order_1.default);
            const order = await orderRepo.createQueryBuilder('order')
                .leftJoinAndSelect('order.user', 'user')
                .leftJoinAndSelect('order.product', 'product')
                .leftJoinAndSelect('product.user', 'productUser')
                .where('order.id = :id', { id })
                .getOne();
            if (!order) {
                throw new Error('Order not found');
            }
            if (order.user.id !== userId || order.product.user.id !== userId) {
                throw new Error('Unauthorized');
            }
            order.status = status;
            await orderRepo.save(order);
            return { success: true };
        },
        deleteProduct: async (_, { id }) => {
            const result = await datasource_1.AppDataSource.getRepository(Product_1.default).delete(id);
            return (result.affected || 0) > 0;
        },
    },
};
