import { Repository } from 'typeorm';
import { ActivityLog } from '../entity/activityLog.entity';

export interface ActivityLogRepository extends Repository<ActivityLog> {}

