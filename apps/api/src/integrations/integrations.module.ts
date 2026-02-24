import { Module } from "@nestjs/common";
import { MetaController } from "./meta/meta.controller";
import { MetaService } from "./meta/meta.service";
import { CryptoModule } from "../crypto/crypto.module";

@Module({
  imports: [CryptoModule],
  controllers: [MetaController],
  providers: [MetaService],
  exports: [MetaService],
})
export class IntegrationsModule {}
