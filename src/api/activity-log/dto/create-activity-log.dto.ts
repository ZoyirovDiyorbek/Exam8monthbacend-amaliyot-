import { IsString, IsOptional, IsEnum, IsUUID, IsObject } from 'class-validator';
import { Roles } from 'src/common/enum/index.enum';

export class CreateActivityLogDto {
  @IsUUID()
  userId: string;

  @IsEnum(Roles)
  userRole: Roles;

  @IsString()
  action: string;

  @IsString()
  entityType: string;

  @IsUUID()
  @IsOptional()
  entityId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}

