import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { UserRole } from '~/enums/user.enum'

export class BanUserDto {
  @IsNotEmpty({ message: 'Ban reason is required' })
  @IsString()
  reason!: string
}

export class WarnUserDto {
  @IsNotEmpty({ message: 'Warning reason is required' })
  @IsString()
  reason!: string
}

export class ApproveListingDto {
  // no body needed
}

export class RejectListingDto {
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @IsString()
  rejectionReason!: string
}
