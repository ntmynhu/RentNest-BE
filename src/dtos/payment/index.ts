import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CreatePaymentDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  contractId!: number

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  tenantId!: number

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number

  @IsNotEmpty()
  @IsDateString()
  dueDate!: string

  @IsOptional()
  @IsString()
  note?: string
}

export class MarkPaidDto {
  @IsNotEmpty()
  @IsDateString()
  paidDate!: string
}
