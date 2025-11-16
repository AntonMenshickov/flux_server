import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';
import { ConfigService } from '../../services/configService';
import { container } from 'tsyringe';

@Entity({ name: container.resolve(ConfigService).postgresEventsContentsTable })
export class EventContents extends BaseEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ type: 'text' })
    message!: string;

    @Column({ type: 'text' })
    applicationId!: string;
}

