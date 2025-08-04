import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller'; // <-- Import controller

@Module({
  controllers: [UsersController], // <-- Register controller here
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
