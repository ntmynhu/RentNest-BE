import { IsDateString, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateTenantDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  name!: string

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string

  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^(84|0[3|5|7|8|9])+([0-9]{8})$/, { message: 'Invalid Vietnamese phone number' })
  phone!: string

  @IsNotEmpty({ message: 'Move-in date is required' })
  @IsDateString()
  moveInDate!: string

  @IsNotEmpty({ message: 'Listing ID is required' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  listingId!: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @Matches(/^(84|0[3|5|7|8|9])+([0-9]{8})$/)
  phone?: string

  @IsOptional()
  @IsDateString()
  moveInDate?: string

  @IsOptional()
  @IsDateString()
  moveOutDate?: string

  @IsOptional()
  @IsInt()
  listingId?: number
}
