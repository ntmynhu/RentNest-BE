import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { RoomType } from '~/enums/listing.enum'

export class CreateListingDto {
  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  title!: string

  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description!: string

  @IsNotEmpty({ message: 'Price is required' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number

  @IsNotEmpty({ message: 'Address is required' })
  @IsString()
  address!: string

  @IsOptional()
  @IsString()
  district?: string

  @IsOptional()
  @IsString()
  city?: string

  @IsNotEmpty({ message: 'Area is required' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  area!: number

  @IsNotEmpty({ message: 'Room type is required' })
  @IsEnum(RoomType, { message: 'Invalid room type' })
  roomType!: RoomType

  @IsOptional()
  @IsArray()
  amenityIds?: number[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[]
}
