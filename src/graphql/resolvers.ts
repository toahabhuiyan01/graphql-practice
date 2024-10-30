import User from '../models/User';
import Product from '../models/Product';
import Order from '../models/Order';
import { AppDataSource } from '../datasource';
import { generateAccessToken } from '../utils/token-utils';

export const resolvers = {
    Query: {
        users: async () => {
            return await AppDataSource.getRepository(User).find({ relations: ['orders'] });
        },
        products: async (_, { category, minPrice, maxPrice, limit, offset }, { userId }) => {
            if(!userId) {
                throw new Error('Unauthorized');
            }
            
            const query = AppDataSource.getRepository(Product)
                            .createQueryBuilder('product')
                            .innerJoin('product.user', 'user')
                            .where('user.id =:userId', { userId })
                            .skip (offset)
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
        orders: async (_, { productId, limit, offset }, { userId }) => {
            if(!userId) {
                throw new Error('Unauthorized');
            }
            const orderRepo = AppDataSource.getRepository(Order)

            const qb = orderRepo.createQueryBuilder('order')


            if(productId) {
                const product = await AppDataSource.getRepository(Product).findOneBy({
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
        topRankingUsers: async () => {
            const users =  await AppDataSource.getRepository(User)
                .createQueryBuilder('user')
                .leftJoinAndSelect('user.orders', 'order')
                .groupBy('user.id, order.id')
                .orderBy('COUNT(order.id)', 'DESC')
                .getMany();
            
            return users.map(({id, username, orders}) => ({ id, username, orders }));
        },
        totalSalesPerCategory: async () => {
            const sales =  await AppDataSource.getRepository(Product)
                .createQueryBuilder('product')
                .select('product.category')
                .leftJoin('product.orders', 'order')
                .addSelect('SUM(order.quantity * product.price)', 'totalSales')
                .groupBy('product.category')
                .getRawMany()

            return sales.map(({ product_category, totalSales }) => ({ category: product_category, totalSales: parseFloat(totalSales) }));
        },
    },
    Mutation: {
        createUser: async (_: any, { username, password }: { username: string, password: string}) => {
            const existingUser = await AppDataSource.getRepository(User).findOneBy({ username });
            if(existingUser) {
                throw new Error('Username already exists');
            }

            const user = new User();
            user.username = username;
            user.password = password;
            return await AppDataSource.getRepository(User).save(user);
        },
        updateUser: async (_: any, { username, password }: { username: string, password: string }, { userId }) => {
            if(userId) {
                throw new Error('Unauthorized');
            }

            const userRepo = AppDataSource.getRepository(User);
            const user = await userRepo.findOneBy({ id: userId });

            if (!user) {
                throw new Error('User not found');
            }

            user.username = username ?? user.username;
            user.password = password ?? user.password;
            await userRepo.save(user);

            return { success: true };
        },
        login: async (_: any, { username, password }: { username: string, password: string }) => {
            const user = await AppDataSource.getRepository(User).findOneBy({ username, password });

            if (!user) {
                throw new Error('Invalid username or password');
            }

            const token = generateAccessToken({ user: { id: user.id.toString() } });
            return { token };
        },
        createProduct: async (_: any, { name, category, price }: { name: string, category: string, price: number }, { userId }) => {
            if(!userId) {
                throw new Error('Unauthorized');
            }
            
            const user = await AppDataSource.getRepository(User).findOneBy({ id: userId });
            if (!user) {
                throw new Error('User not found');
            }
            const product = new Product();
            product.user = user;
            product.name = name;
            product.category = category;
            product.price = price;
            return await AppDataSource.getRepository(Product).save(product);
        },
        updateProduct: async (_: any, { id, name, category, price }: { id: number, name: string, category: string, price: number }, { userId }) => {
            if(!userId) {
                throw new Error('Unauthorized');
            }

            const productRepo = AppDataSource.getRepository(Product);
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
        createOrder: async (_: any, { productId, quantity }: { productId: number, quantity: number }, { userId }) => {
            if(!userId) {
                throw new Error('Unauthorized');
            }

            const user = await AppDataSource.getRepository(User).findOneBy({ id: userId });
            const product = await AppDataSource.getRepository(Product).findOneBy({ id: productId });

            if (!user || !product) {
                throw new Error('User or Product not found');
            }

            const order = new Order();
            order.user = user;
            order.product = product;
            order.status = 'pending';
            order.quantity = quantity;
            return await AppDataSource.getRepository(Order).save(order);
        },
        updateOrder: async(_: any, { id, status }: { id: number, status: string }, { userId }) => {
            if(!userId) {
                throw new Error('Unauthorized');
            }

            const orderRepo = AppDataSource.getRepository(Order);
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
        deleteProduct: async (_: any, { id }: { id: number }) => {
            const result = await AppDataSource.getRepository(Product).delete(id);
            return (result.affected || 0) > 0;
        },
    },
};
