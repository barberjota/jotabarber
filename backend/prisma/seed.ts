import { PrismaClient, Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el seeding de la base de datos (Español)...');

  // 1. Crear Usuario Admin
  const adminPhone = '123456789';
  const existingAdmin = await prisma.usuario.findUnique({
    where: { telefono: adminPhone },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.usuario.create({
      data: {
        password: hashedPassword,
        nombre: 'Administrador JotaBarber',
        telefono: adminPhone,
        rol: Rol.ADMIN,
      },
    });
    console.log('Usuario Admin creado con éxito (teléfono 123456789 / admin123).');
  } else {
    console.log('Usuario Admin ya existía.');
  }

  // 2. Crear Estilistas (Barberos)
  const stylistsData = [
    { name: 'Jota Barber' },
    { name: 'Mateo Estilista' },
    { name: 'Carlos Navaja' },
  ];

  const stylists = [];
  for (const stylistData of stylistsData) {
    const existing = await prisma.estilista.findFirst({
      where: { nombre: stylistData.name },
    });
    if (!existing) {
      const created = await prisma.estilista.create({
        data: {
          nombre: stylistData.name,
          photoUrl: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=200&h=200&fit=crop',
          isActive: true,
        },
      });
      stylists.push(created);
      console.log(`Estilista creado: ${created.nombre}`);
    } else {
      stylists.push(existing);
      console.log(`Estilista ya existía: ${existing.nombre}`);
    }
  }

  // 3. Crear Horarios para Estilistas (Lunes a Sábado, 09:00 a 19:00)
  for (const stylist of stylists) {
    const schedulesCount = await prisma.horarioEstilista.count({
      where: { estilistaId: stylist.id },
    });

    if (schedulesCount === 0) {
      // 1 (Lunes) a 6 (Sábado)
      const schedules = [];
      for (let day = 1; day <= 6; day++) {
        schedules.push({
          estilistaId: stylist.id,
          diaSemana: day,
          horaInicio: '09:00',
          horaFin: '19:00',
        });
      }
      await prisma.horarioEstilista.createMany({
        data: schedules,
      });
      console.log(`Horarios agregados para ${stylist.nombre}`);
    }
  }

  // 4. Crear Servicios
  const servicesData = [
    {
      nombre: 'Corte de Cabello Clásico',
      descripcion: 'Corte clásico con tijera y máquina, lavado y peinado simple.',
      duracionMin: 30,
      precio: 15.00,
      aplicaFidelidad: true,
    },
    {
      nombre: 'Perfilado y Afeitado de Barba',
      descripcion: 'Diseño de barba con toalla caliente, navaja libre y bálsamos.',
      duracionMin: 25,
      precio: 10.00,
      aplicaFidelidad: true,
    },
    {
      nombre: 'Combo Jotabarber (Corte + Barba)',
      descripcion: 'Servicio completo de corte de cabello y arreglo de barba premium.',
      duracionMin: 50,
      precio: 22.00,
      aplicaFidelidad: true,
    },
    {
      nombre: 'Tratamiento Capilar e Hidratación',
      descripcion: 'Mascarilla capilar nutritiva con masajes estimulantes.',
      duracionMin: 40,
      precio: 18.00,
      aplicaFidelidad: false,
    },
  ];

  for (const serviceData of servicesData) {
    const existing = await prisma.servicio.findFirst({
      where: { nombre: serviceData.nombre },
    });
    if (!existing) {
      const created = await prisma.servicio.create({
        data: serviceData,
      });
      console.log(`Servicio creado: ${created.nombre}`);
    } else {
      console.log(`Servicio ya existía: ${existing.nombre}`);
    }
  }

  // 5. Crear Productos de Venta / Canje
  const productsData = [
    {
      nombre: 'Cera Modeladora Matte Premium',
      descripcion: 'Fijación fuerte y acabado mate natural de larga duración.',
      precio: 12.00,
      costoPuntos: 120,
      stock: 30,
      imageUrl: 'https://images.unsplash.com/photo-1608248597481-496100c8c836?w=200&h=200&fit=crop',
    },
    {
      nombre: 'Aceite Hidratante para Barba',
      descripcion: 'Suaviza la barba e hidrata la piel debajo de ella.',
      precio: 15.00,
      costoPuntos: 150,
      stock: 15,
      imageUrl: 'https://images.unsplash.com/photo-1626015713026-d837d172406f?w=200&h=200&fit=crop',
    },
    {
      nombre: 'Champú Revitalizante Anticaspa',
      descripcion: 'Limpia profundamente el cuero cabelludo con extractos de menta.',
      precio: 18.00,
      costoPuntos: 180,
      stock: 10,
      imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=200&h=200&fit=crop',
    },
    {
      nombre: 'Fijador de Cabello Spray B&W',
      descripcion: 'Fijador de laca extra fuerte en spray.',
      precio: 8.50,
      costoPuntos: 85,
      stock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1608248597481-496100c8c836?w=200&h=200&fit=crop',
    },
  ];

  for (const productData of productsData) {
    const existing = await prisma.producto.findFirst({
      where: { nombre: productData.nombre },
    });
    if (!existing) {
      const created = await prisma.producto.create({
        data: productData,
      });
      console.log(`Producto creado: ${created.nombre}`);
    } else {
      console.log(`Producto ya existía: ${existing.nombre}`);
    }
  }

  console.log('Seeding en Español finalizado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
