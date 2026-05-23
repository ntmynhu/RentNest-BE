import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class SendMessageDto {
  @IsNotEmpty({ message: 'Message content is required' })
  @IsString()
  content!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  listingId?: number
}
