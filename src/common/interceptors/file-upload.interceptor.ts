// src/common/interceptors/file-upload.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const request = context.switchToHttp().getRequest();

        // Asegurar que los directorios existen
        this.ensureDirectoryExists("./uploads/productos/");
        this.ensureDirectoryExists("./uploads/diseños/");
        this.ensureDirectoryExists("./uploads/general/");

        return data;
      })
    );
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
