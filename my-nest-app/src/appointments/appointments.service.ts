import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  // 👤 PATIENT: Create appointment
async createAppointment(user: any, data: { date: string; description: string; doctorId: number }) {
  const appointment = await this.prisma.appointment.create({
    data: {
      date: new Date(data.date),
      description: data.description,
      doctorId: data.doctorId,
      patientId: user.userId || user.sub,
      seenByDoctor: false, // ✅ Added here
    },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return {
    message: 'Appointment created successfully',
    appointment,
  };
}


  // 🔍 Return appointments based on user role
  async findAppointmentsForUser(user: any) {
    let appointments;

    if (user.role === 'PATIENT') {
      appointments = await this.prisma.appointment.findMany({
        where: { patientId: user.userId || user.sub },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      });
    } else if (user.role === 'DOCTOR') {
      appointments = await this.prisma.appointment.findMany({
        where: { doctorId: user.userId || user.sub },
       include: {
  doctor: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  patient: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
},

        orderBy: { date: 'desc' },
      });
    } else {
      // For ADMIN, return empty array (use separate method)
      appointments = [];
    }

    return {
      appointments,
      count: appointments.length,
    };
  }

  // 🛡️ ADMIN: Get all appointments (cleaned)
  async findAll() {
    const appointments = await this.prisma.appointment.findMany({
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return {
      appointments,
      count: appointments.length,
    };
  }

  // ✅ ADMIN or DOCTOR: Update appointment status
  async updateStatus(user: any, id: number, newStatus: string) {
    // 1. Allow only Admin or Doctor
    if (user.role !== 'DOCTOR' && user.role !== 'ADMIN') {
      throw new Error('Unauthorized to update status');
    }

    // 2. Find appointment
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // 3. If doctor, ensure it's their appointment
    if (user.role === 'DOCTOR' && appointment.doctorId !== (user.userId || user.sub)) {
      throw new Error('You can only update your own appointments');
    }

    // 4. Update status
    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: { status: newStatus as AppointmentStatus },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return {
      message: 'Appointment status updated successfully',
      appointment: updatedAppointment,
    };
  }

  async deleteAppointment(id: number) {
    await this.prisma.appointment.delete({ where: { id } });
    return { message: 'Appointment deleted successfully' };
  }


  async getUnseenForDoctor(user: any) {
  if (user.role !== 'DOCTOR') {
    throw new Error('Unauthorized');
  }

  const doctorId = user.userId || user.sub;

  const unseenAppointments = await this.prisma.appointment.findMany({
    where: {
      doctorId,
      seenByDoctor: false,
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  return unseenAppointments;
}

async markAppointmentsSeen(user: any) {
  if (user.role !== 'DOCTOR') throw new Error("Unauthorized");

  await this.prisma.appointment.updateMany({
    where: {
      doctorId: user.userId || user.sub,
      seenByDoctor: false,
    },
    data: {
      seenByDoctor: true,
    },
  });

  return { message: 'Marked as seen' };
}



}
