import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { RoomType, SortBy } from '~/enums/listing.enum'

export class SearchListingDto {
  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsString()
  location?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number

  @IsOptional()
  @IsEnum(RoomType)
  roomType?: RoomType

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  areaMin?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  areaMax?: number

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.NEWEST

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10
}
