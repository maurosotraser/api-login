import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { UserRole } from '../types/auth'

@Entity('users', { schema: 'dbo' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ 
        type: 'varchar',
        length: 255
    })
    @Index({ unique: true })
    email: string

    @Column({ 
        type: 'varchar',
        length: 255
    })
    password: string

    @Column({ 
        type: 'nvarchar',
        length: 100,
        nullable: true 
    })
    name?: string

    @Column({
        type: 'varchar',
        length: 10,
        enum: ['admin', 'editor', 'user'],
        default: 'user'
    })
    role: UserRole

    @CreateDateColumn({
        type: 'datetime2'
    })
    createdAt: Date

    @UpdateDateColumn({
        type: 'datetime2'
    })
    updatedAt: Date
} 