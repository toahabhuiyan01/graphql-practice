import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import Product from './Product';
import Order from './Order';

@Entity()
export default class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	username!: string;

	@Column()
	password!: string;

	@OneToMany(() => Product, (product) => product.user, { onDelete: 'CASCADE' })
	products!: Product[];

	@OneToMany(() => Order, (order) => order.user)
	orders!: Order[];
}