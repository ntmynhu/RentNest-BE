import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateReviewDto {
  @IsNotEmpty({ message: 'Rating is required' })
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Rating must be between 1 and 5' })
  @Max(5, { message: 'Rating must be between 1 and 5' })
  rating!: number

  @IsOptional()
  @IsString()
  text?: string
}
