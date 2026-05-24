import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator'

export class RegisterDto {
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  fullName!: string

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[@#$%^&+=!])(?=\S+$).{8,}$/, {
    message: 'Mật khẩu phải chứa chữ cái, chữ số và ký tự đặc biệt (@#$%^&+=!)',
  })
  @IsString()
  password!: string

  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^(84|0[3|5|7|8|9])+([0-9]{8})$/, { message: 'Invalid Vietnamese phone number' })
  phone!: string

  @IsOptional()
  @IsEnum(['TENANT', 'LANDLORD'])
  role?: 'TENANT' | 'LANDLORD'
}
