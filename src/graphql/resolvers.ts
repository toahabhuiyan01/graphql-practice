import User from '../models/User';
import Product from '../models/Product';
import Order from '../models/Order';
import { generateAccessToken } from '../utils/token-utils';
import { DataSource } from 'typeorm';
import { ResolverContext } from '..';

export const resolvers = {
    Query: {
        users: async (_, {}, { appDataSource }: ResolverContext) => {
            return await appDataSource.getRepository(User).find({ relations: ['orders'] });
        },
        products: async (_, { category, minPrice, maxPrice, limit=10, page=1 }, { userId, appDataSource }: ResolverContext) => {
            if(!userId) {
                throw new Error('Unauthorized');
            }
            
            const query = appDataSource.getRepository(Product)
                .createQueryBuilder('product')
                .innerJoin('product.user', 'user')
                .where('user.id =:userId', { userId })
                .skip (page * limit)
                .take(limit)

            if(category) {
                query.andWhere('product.category = :category', { category })
            }

            if(minPrice) {
                query.andWhere('product.price >= :minPrice', { minPrice })
            }

            if(maxPrice) {
                query.andWhere('product.price <= :maxPrice', { maxPrice })
            }

            const data = await query.getMany()
            return data
        },
        orders: async (_, { productId, limit, offset }, { userId, appDataSource }: ResolverContext) => {
            if(!userId) {
                throw new Error('Unauthorized');
            }
            const orderRepo = appDataSource.getRepository(Order)

            const qb = orderRepo.createQueryBuilder('order')


            if(productId) {
                const product = await appDataSource.getRepository(Product).findOneBy({
                    id: productId,
                    user: { id: userId }
                });

                if (!product) {
                    throw new Error('Product not found');
                }

                qb.innerJoin('order.product', 'product')
                    .where('product.id = :productId', { productId })
            } else {
                qb.innerJoin('order.user', 'user')
                    .where('user.id = :userId', { userId })
            }

            const data = await qb.skip(offset).take(limit).getMany()

            return data
        },
        topRankingUsers: async ({}, {}, { appDataSource }: ResolverContext) => {
            console.time("query-started")
            const users =  await appDataSource.getRepository(User)
                .createQueryBuilder('user')
                .leftJoinAndSelect('user.orders', 'order')
                .groupBy('user.id, order.id')
                .orderBy('COUNT(order.id)', 'DESC')
                .getMany();
            console.timeEnd("query-started")
            
            return users.map(({id, username, orders}) => ({ id, username, orders }));
        },
        totalSalesPerCategory: async ({}, {}, {userId, appDataSource }: ResolverContext) => {
            console.time("query-started")
            if(!userId) {
                throw new Error('Unauthorized');
            }

            let sales =  await appDataSource.getRepository(Product)
                .createQueryBuilder('product')
                .select('product.category')
                .leftJoin('product.orders', 'order')
                .addSelect('SUM(order.quantity * product.price)', 'totalSales')
                .groupBy('product.category')
                // TypeORM doesn't support to use aliases as orderby
                .orderBy('SUM(order.quantity * product.price)', 'DESC')
                .getRawMany()
            
            console.timeEnd("query-started")

            return sales.map(({ product_category, totalSales }) => ({ category: product_category, totalSales: parseFloat(totalSales) }));
        },
    },
    Mutation: {
        createUser: async (_: any, { username, password }: { username: string, password: string}, { appDataSource }: ResolverContext) => {
            const existingUser = await appDataSource.getRepository(User).findOneBy({ username });
            if(existingUser) {
                throw new Error('Username already exists');
            }

            const user = new User();
            user.username = username;
            user.password = password;
            return await appDataSource.getRepository(User).save(user);
        },
        updateUser: async (_: any, { username, password }: { username: string, password: string }, { userId, appDataSource }: ResolverContext) => {
            if(userId) {
                throw new Error('Unauthorized');
            }

            const userRepo = appDataSource.getRepository(User);
            const user = await userRepo.findOneBy({ id: userId });

            if (!user) {
                throw new Error('User not found');
            }

            user.username = username ?? user.username;
            user.password = password ?? user.password;
            await userRepo.save(user);

            return { success: true };
        },
        login: async (_: any, { username, password }: { username: string, password: string }, { appDataSource }: ResolverContext) => {
            const user = await appDataSource.getRepository(User).findOneBy({ username, password });

            if (!user) {
                throw new Error('Invalid username or password');
            }

            const token = generateAccessToken({ user: { id: user.id.toString() } });
            return { token };
        },
        createProduct: async (_: any, { name, category, price }: { name: string, category: string, price: number }, { userId, appDataSource }: ResolverContext) => {
            if(!userId) {
                throw new Error('Unauthorized');
            }
            
            const user = await appDataSource.getRepository(User).findOneBy({ id: userId });
            if (!user) {
                throw new Error('User not found');
            }
            const product = new Product();
            product.user = user;
            product.name = name;
            product.category = category;
            product.price = price;
            return await appDataSource.getRepository(Product).save(product);
        },
        updateProduct: async (_: any, { id, name, category, price }: { id: number, name: string, category: string, price: number }, { userId, appDataSource }: ResolverContext) => {
            if(!userId) {
                throw new Error('Unauthorized');
            }

            const productRepo = appDataSource.getRepository(Product);
            const product = await productRepo.findOneOrFail(
                {
                    where: { id },
                    relations: ['user'],
                }
            );

            if (!product) {
                throw new Error('Product not found');
            }

            if(product.user.id !== userId) {
                throw new Error('Unauthorized');
            }

            if(name) {
                product.name = name
            }

            if(category) {
                product.category = category
            }

            if(price) {
                product.price = price
            }

            return await productRepo.save(product);
        },
        createOrder: async (_: any, { productId, quantity }: { productId: number, quantity: number }, { userId, appDataSource }: ResolverContext) => {
            if(!userId) {
                throw new Error('Unauthorized');
            }

            const user = await appDataSource.getRepository(User).findOneBy({ id: userId });
            const product = await appDataSource.getRepository(Product).findOneBy({ id: productId });

            if (!user || !product) {
                throw new Error('User or Product not found');
            }

            const order = new Order();
            order.user = user;
            order.product = product;
            order.status = 'pending';
            order.quantity = quantity;
            return await appDataSource.getRepository(Order).save(order);
        },
        updateOrder: async(_: any, { id, status }: { id: number, status: string }, { userId, appDataSource }: ResolverContext) => {
            if(!userId) {
                throw new Error('Unauthorized');
            }

            const orderRepo = appDataSource.getRepository(Order);
            const order = await orderRepo.createQueryBuilder('order')
                .leftJoinAndSelect('order.user', 'user')
                .leftJoinAndSelect('order.product', 'product')
                .leftJoinAndSelect('product.user', 'productUser')
                .where('order.id = :id', { id })
                .getOne();

            if (!order) {
                throw new Error('Order not found');
            }

            if(order.user.id !== userId || order.product.user.id !== userId) {
                throw new Error('Unauthorized');
            }

            order.status = status as Order['status']
            await orderRepo.save(order);

            return { success: true };
        },
        deleteProduct: async (_: any, { id }: { id: number }, { userId, appDataSource }: ResolverContext) => {
            const product = await appDataSource
                .getRepository(Product)
                .findOneOrFail({
                    where: {
                        id,
                        user: { id: userId }
                    } 
                });

            const result = await appDataSource.getRepository(Product).delete(product);
            return {
                success: (result.affected || 0) > 0
            }
        },
    },
};
