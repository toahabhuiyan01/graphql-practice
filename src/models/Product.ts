import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import User from './User';
import Order from './Order';

@Entity()
@Index('proudctIdCategory', ['id', 'category'])
export default class Product {
    @PrimaryGeneratedColumn()
    id!: number;
    
    @Column()
    @Index() // Filter products by category
    category!: string;

    @Column()
    name!: string;


    @Column('decimal')
    @Index() // when fetch products by price, range, condition
    price!: number;

    @ManyToOne(() => User, (user) => user.products)
    user!: User;

    @OneToMany(() => Order, (order) => order.product)
    orders!: Order[];
}