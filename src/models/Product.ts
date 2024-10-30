import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import User from './User';
import Order from './Order';

@Entity()
export default class Product {
    @PrimaryGeneratedColumn()
    id!: number;
    
    @Column()
    category!: string;

    @Column()
    name!: string;


    @Column('decimal')
    price!: number;

    @ManyToOne(() => User, (user) => user.products)
    user!: User;

    @OneToMany(() => Order, (order) => order.product)
    orders!: Order[];
}