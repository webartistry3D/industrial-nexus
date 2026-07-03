import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
