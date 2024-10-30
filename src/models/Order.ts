import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import Product from './Product';
import User from './User';

@Entity()
export default class Order {
	@PrimaryGeneratedColumn()
	id!: number;

    @Column()
    quantity!: number;

    @Column()
    status!: 'pending' | 'completed' | 'cancelled'

    @ManyToOne(() => Product, (product) => product.orders)
    product!: Product

    @ManyToOne(() => User, (user) => user.orders)
    user!: User
}