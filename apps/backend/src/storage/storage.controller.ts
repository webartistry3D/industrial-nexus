import {
  Controller,
  Put,
  Param,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  @Put('local-upload/:key(*)')
  @HttpCode(HttpStatus.OK)
  async localUpload(
    @Param('key') key: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const dest = path.join(process.cwd(), 'uploads', path.dirname(key));
    await fs.promises.mkdir(dest, { recursive: true });

    const filePath = path.join(process.cwd(), 'uploads', key);
    const writeStream = fs.createWriteStream(filePath);

    await new Promise<void>((resolve, reject) => {
      req.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    return res.json({ ok: true });
  }
}
