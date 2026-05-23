import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator'

export class RegisterDto {
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  fullName!: string

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string

  @IsNotEmpty({ message: 'Password is required' })
  @Matches(/^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,}$/, {
    message: 'Password must be at least 8 characters, contain letters, numbers, and a special character',
  })
  password!: string

  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^(84|0[3|5|7|8|9])+([0-9]{8})$/, { message: 'Invalid Vietnamese phone number' })
  phone!: string
}
