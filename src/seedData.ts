import { initializeDatabase, AppDataSource } from './datasource'

import User from './models/User'
import Product from './models/Product'
import Order from './models/Order'



async function seedDatabase() {
    await initializeDatabase()
    const userRepository = AppDataSource.getRepository(User);
    const productRepository = AppDataSource.getRepository(Product);
    const orderRepository = AppDataSource.getRepository(Order);

    // Step 1: Create 10,000 Users
    const users: User[] = [];
    for (let i = 0; i < 10000; i++) {
        const user = userRepository.create({
            username: `User${i}`,
            password: i.toString(),
        });
        users.push(user);
    }
    await userRepository.save(users);
    console.log('10,000 users created');

    // Step 2: Create 10,000 Products and assign each to a random User
    const products: Product[] = [];
    for (let i = 0; i < 10000; i++) {
        const product = productRepository.create({
            name: `Product${i}`,
            category: `Category${i % 5}`,
            price: parseFloat((Math.random() * 100).toFixed(2)),
            user: users[Math.floor(Math.random() * users.length)], // Randomly assign a user
        });
        products.push(product);
    }
    await productRepository.save(products);
    console.log('10,000 products created');

    // Step 3: Create 10,000 Orders and assign each to a random Product and User
    const statuses = ['pending', 'completed', 'cancelled'];
    const orders: Order[] = [];
    for (let i = 0; i < 10000; i++) {
    const order = orderRepository.create({
        quantity: Math.floor(Math.random() * 10) + 1,
        status: statuses[Math.floor(Math.random() * statuses.length)] as 'pending' | 'completed' | 'cancelled',
        product: products[Math.floor(Math.random() * products.length)], // Randomly assign a product
        user: users[Math.floor(Math.random() * users.length)], // Randomly assign a user
    });
    orders.push(order);
    }
    await orderRepository.save(orders);
    console.log('10,000 orders created');

    await AppDataSource.destroy();
    console.log('Database seeding completed successfully');
}

seedDatabase().catch((error) => console.log('Error seeding database:', error));