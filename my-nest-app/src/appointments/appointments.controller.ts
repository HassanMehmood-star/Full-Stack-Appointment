import { Controller, Get, Post, Body, UseGuards, Req, Param, Patch, HttpException, HttpStatus, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppointmentsService } from './appointments.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async findMyAppointments(@Req() req) {
    try {
      return await this.appointmentsService.findAppointmentsForUser(req.user);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async create(@Req() req, @Body() body: { date: string; description: string; doctorId: number }) {
    try {
      // Only patients can create appointments
      if (req.user.role !== 'PATIENT') {
        throw new HttpException('Only patients can create appointments', HttpStatus.FORBIDDEN);
      }
      
      return await this.appointmentsService.createAppointment(req.user, body);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('all')
  async getAllAppointments() {
    try {
      return await this.appointmentsService.findAll();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() req,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    try {
      return await this.appointmentsService.updateStatus(req.user, parseInt(id), body.status);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  async deleteAppointment(@Param('id') id: string) {
    return this.appointmentsService.deleteAppointment(Number(id));
  }

@Post('doctor/mark-seen')
async markSeen(@Req() req) {
  try {
    const result = await this.appointmentsService.markAppointmentsSeen(req.user);
    return { message: result.message };
  } catch (error) {
    throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  }
}



  @Get('doctor/unseen')
async getUnseenAppointments(@Req() req) {
  try {
    return await this.appointmentsService.getUnseenForDoctor(req.user);
  } catch (error) {
    throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  }
}
@Patch(':id/seen')
async markSingleSeen(@Param('id') id: string, @Req() req) {
  try {
    return await this.appointmentsService.markSingleAppointmentSeen(req.user, parseInt(id));
  } catch (error) {
    throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  }
}



}
