import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateContractDto {
  @IsNotEmpty({ message: 'Tenant ID is required' })
  @Type(() => Number)
  @IsInt()
  tenantId!: number

  @IsNotEmpty({ message: 'Listing ID is required' })
  @Type(() => Number)
  @IsInt()
  listingId!: number

  @IsNotEmpty({ message: 'Start date is required' })
  @IsDateString()
  startDate!: string

  @IsNotEmpty({ message: 'End date is required' })
  @IsDateString()
  endDate!: string

  @IsNotEmpty({ message: 'Rent amount is required' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rentAmount!: number

  @IsNotEmpty({ message: 'Deposit amount is required' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  depositAmount!: number

  @IsNotEmpty({ message: 'Contract terms are required' })
  @IsString()
  terms!: string
}

export class UpdateContractDto {
  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rentAmount?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  depositAmount?: number

  @IsOptional()
  @IsString()
  terms?: string

  @IsOptional()
  @IsString()
  status?: string
}
