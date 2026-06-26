import { IsString, IsNotEmpty } from 'class-validator';

export class CreateHandlingTagDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateHandlingTagDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class HandlingTagDto {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
