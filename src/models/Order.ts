import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, Index } from 'typeorm';
import Product from './Product';
import User from './User';

@Entity()
export default class Order {
	@PrimaryGeneratedColumn()
	id!: number;

    @Column()
    @Index() // when order filter by quantity or sort by quantity
    quantity!: number;

    @Column()
    @Index() // when fetch orders by status
    status!: 'pending' | 'completed' | 'cancelled'

    @ManyToOne(() => Product, (product) => product.orders)
    @Index()
    product!: Product

    @ManyToOne(() => User, (user) => user.orders)
    @Index()
    user!: User
}