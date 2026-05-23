import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'

enum ReportType {
  LISTING = 'LISTING',
  PROFILE = 'PROFILE',
}

export class CreateReportDto {
  @IsNotEmpty({ message: 'Report type is required' })
  @IsEnum(ReportType)
  reportedItemType!: ReportType

  @IsNotEmpty({ message: 'Reported item ID is required' })
  @Type(() => Number)
  @IsInt()
  reportedItemId!: number

  @IsNotEmpty({ message: 'Reason is required' })
  @IsString()
  reason!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEmail()
  contactEmail?: string

  @IsOptional()
  @IsString()
  contactPhone?: string
}
