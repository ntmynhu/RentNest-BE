import { IsNotEmpty, IsString, Matches } from 'class-validator'

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'Email is required' })
  email!: string
}

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Token is required' })
  @IsString()
  token!: string

  @IsNotEmpty({ message: 'New password is required' })
  @Matches(/^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,}$/, {
    message: 'Password must be at least 8 characters, contain letters, numbers, and a special character',
  })
  newPassword!: string
}
