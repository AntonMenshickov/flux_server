import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';
import { LogLevel } from '../eventMessageDto';


@Entity({ name: process.env.POSTGRES_EVENTS_TABLE })
export class EventMessage extends BaseEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ type: 'timestamptz' })
    timestamp!: Date;

    @Column({ type: 'text' })
    logLevel!: LogLevel;

    @PrimaryColumn({ type: 'text' })
    applicationId!: string;

    @Column({ type: 'text' })
    platform!: string;

    @Column({ type: 'text' })
    bundleId!: string;

    @Column({ type: 'text' })
    deviceId!: string;

    @Column({ type: 'text' })
    deviceName!: string;

    @Column({ type: 'text' })
    osName!: string;

    @Column({ type: 'text' })
    message!: string;

    @Column('text', { array: true, nullable: true })
    tags?: string[];

    @Column({ type: 'jsonb', nullable: true })
    meta?: Record<string, string>;

    @Column({ type: 'text', nullable: true })
    stackTrace?: string;
}