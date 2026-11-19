/**
 * Datos iniciales — sección 8 / 10.7.
 * Crea facturas y pagos con los mismos servicios que la app.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import {
  categorias,
  clientes,
  contadores,
  productos,
  usuarios,
} from "../src/lib/db/schema";
import { hashPassword } from "../src/lib/auth/password";
import { createProducto } from "../src/lib/services/productos";
import { createCliente } from "../src/lib/services/clientes";
import { crearFactura } from "../src/lib/services/facturas";
import { registrarPago } from "../src/lib/services/pagos";
import type { SessionUser } from "../src/lib/auth/session";
import { sql } from "drizzle-orm";

const ADMIN: SessionUser = {
  id: 1,
  nombre: "Laura Méndez",
  email: "laura@ferreteria.test",
  rol: "admin",
};

const VENDEDOR: SessionUser = {
  id: 2,
  nombre: "Pablo Ruiz",
  email: "pablo@ferreteria.test",
  rol: "vendedor",
};

const CATEGORIAS = [
  "Herramientas",
  "Electricidad",
  "Pinturería",
  "Plomería",
  "Fijaciones",
];

const PRODUCTOS_BASE: {
  codigo: string;
  descripcion: string;
  cat: number;
  precio: number;
  stockMinimo: number;
  stockInicial: number;
}[] = [];

function buildProductos() {
  const templates = [
    { pref: "HE", cat: 0, items: ["Martillo carpintero 500 g", "Destornillador phillips N2", "Alicate universal 8\"", "Llave francesa 10\"", "Cinta métrica 5 m", "Nivel aluminio 60 cm"] },
    { pref: "EL", cat: 1, items: ["Cinta aisladora 20 m", "Lámpara LED 12 W", "Cable unipolar 2,5 mm", "Enchufe triple", "Interruptor simple", "Portalámpara E27"] },
    { pref: "PI", cat: 2, items: ["Pintura látex 4 L blanco", "Rodillo lana 22 cm", "Pincel 2\"", "Thinner 1 L", "Cinta de enmascarar 24 mm", "Lija grano 120"] },
    { pref: "PL", cat: 3, items: ["Caño PVC 40 mm x 3 m", "Codo PVC 40 mm", "Canilla cromada", "Teflón 19 mm", "Flexible agua 40 cm", "Llave de paso 1/2\""] },
    { pref: "FI", cat: 4, items: ["Tornillo madera 4x40 (caja)", "Tarugo N8 (caja)", "Clavo 2\" (kg)", "Tuerca 8 mm (caja)", "Arandela 8 mm (caja)", "Bisagra 3\""] },
  ];

  let n = 1;
  for (const t of templates) {
    for (const desc of t.items) {
      PRODUCTOS_BASE.push({
        codigo: `${t.pref}-${String(n).padStart(3, "0")}`,
        descripcion: desc,
        cat: t.cat,
        precio: (800 + n * 137) * 100, // centavos
        stockMinimo: 5,
        stockInicial: 20 + (n % 15),
      });
      n++;
    }
  }
  // completar hasta 30
  while (PRODUCTOS_BASE.length < 30) {
    const i = PRODUCTOS_BASE.length + 1;
    PRODUCTOS_BASE.push({
      codigo: `GN-${String(i).padStart(3, "0")}`,
      descripcion: `Artículo general ${i}`,
      cat: i % 5,
      precio: (500 + i * 90) * 100,
      stockMinimo: 3,
      stockInicial: 25,
    });
  }
}

const CLIENTES_SEED = [
  { tipoDoc: "DNI" as const, nroDoc: "28.456.123", nombre: "Mariana López", domicilio: "Las Heras 455", telefono: "381 455-2210", email: "mariana.lopez@correo.test", cuentaCorriente: true, limiteCredito: 40000000 },
  { tipoDoc: "DNI" as const, nroDoc: "32.111.908", nombre: "Carlos Gómez", domicilio: "Belgrano 120", telefono: "381 422-1100", email: "carlos.gomez@correo.test", cuentaCorriente: true, limiteCredito: 20000000 },
  { tipoDoc: "CUIT" as const, nroDoc: "30-71239876-5", nombre: "Construcciones Norte SA", domicilio: "Ruta 9 km 12", telefono: "381 433-9988", email: "compras@norte.test", cuentaCorriente: true, limiteCredito: 150000000 },
  { tipoDoc: "DNI" as const, nroDoc: "25.667.441", nombre: "Ana Pérez", domicilio: "Mitre 88", telefono: "381 411-2233", email: null, cuentaCorriente: false, limiteCredito: null },
  { tipoDoc: "DNI" as const, nroDoc: "40.221.556", nombre: "Diego Fernández", domicilio: "Sarmiento 700", telefono: "381 400-1122", email: "diego.f@correo.test", cuentaCorriente: true, limiteCredito: 10000000 },
  { tipoDoc: "DNI" as const, nroDoc: "18.334.221", nombre: "Lucía Romero", domicilio: "Córdoba 1500", telefono: "381 455-0099", email: null, cuentaCorriente: true, limiteCredito: null },
  { tipoDoc: "CUIT" as const, nroDoc: "27-28455667-3", nombre: "Monotributista Juan Díaz", domicilio: "Lavalle 45", telefono: "381 422-5566", email: "juan.diaz@correo.test", cuentaCorriente: false, limiteCredito: null },
  { tipoDoc: "DNI" as const, nroDoc: "35.998.102", nombre: "Sofía Herrera", domicilio: "25 de Mayo 333", telefono: "381 433-7788", email: "sofia.h@correo.test", cuentaCorriente: true, limiteCredito: 25000000 },
  { tipoDoc: "DNI" as const, nroDoc: "22.445.778", nombre: "Martín Castro", domicilio: "San Juan 212", telefono: "381 411-3344", email: null, cuentaCorriente: false, limiteCredito: null },
  { tipoDoc: "DNI" as const, nroDoc: "29.110.334", nombre: "Valentina Ruiz", domicilio: "Independencia 90", telefono: "381 400-7788", email: "vale.ruiz@correo.test", cuentaCorriente: true, limiteCredito: 30000000 },
];

async function alreadySeeded() {
  const u = await db.query.usuarios.findFirst({
    where: eq(usuarios.email, "laura@ferreteria.test"),
  });
  return !!u;
}

async function main() {
  buildProductos();

  if (await alreadySeeded()) {
    console.log("La base ya tiene datos de prueba. Saltando seed.");
    return;
  }

  console.log("Creando usuarios...");
  const adminHash = await hashPassword("admin1234");
  const vendHash = await hashPassword("vendedor1234");

  const [admin] = await db
    .insert(usuarios)
    .values({
      email: "laura@ferreteria.test",
      nombre: "Laura Méndez",
      passwordHash: adminHash,
      rol: "admin",
    })
    .returning();

  const [vendedor] = await db
    .insert(usuarios)
    .values({
      email: "pablo@ferreteria.test",
      nombre: "Pablo Ruiz",
      passwordHash: vendHash,
      rol: "vendedor",
    })
    .returning();

  ADMIN.id = admin.id;
  VENDEDOR.id = vendedor.id;

  await db.insert(contadores).values([
    { clave: "factura", valor: 0 },
    { clave: "recibo", valor: 0 },
  ]);

  console.log("Creando categorías...");
  const cats: { id: number }[] = [];
  for (const nombre of CATEGORIAS) {
    const [c] = await db.insert(categorias).values({ nombre }).returning();
    cats.push(c);
  }

  console.log("Creando productos...");
  const prodIds: number[] = [];
  for (const p of PRODUCTOS_BASE) {
    const created = await createProducto(ADMIN, {
      codigo: p.codigo,
      descripcion: p.descripcion,
      categoriaId: cats[p.cat].id,
      precio: p.precio,
      stockMinimo: p.stockMinimo,
      stockInicial: p.stockInicial,
    });
    prodIds.push(created.id);
  }

  console.log("Creando clientes...");
  const clienteIds: number[] = [];
  for (const c of CLIENTES_SEED) {
    const created = await createCliente(ADMIN, c);
    clienteIds.push(created.id);
  }

  console.log("Creando facturas (últimos 30 días)...");
  const { facturas } = await import("../src/lib/db/schema");
  const { registrarMovimientoManual } = await import(
    "../src/lib/services/stock"
  );
  const formas = ["contado", "tarjeta", "cuenta_corriente"] as const;
  const clientesCC = CLIENTES_SEED.map((c, i) =>
    c.cuentaCorriente ? clienteIds[i] : null,
  ).filter(Boolean) as number[];

  let facturasCreadas = 0;
  let intento = 0;
  while (facturasCreadas < 50 && intento < 80) {
    const i = intento;
    intento += 1;
    const daysAgo = facturasCreadas % 30;
    const user = facturasCreadas % 3 === 0 ? ADMIN : VENDEDOR;
    const forma = formas[facturasCreadas % 3];
    // Una unidad por renglón para no agotar stock (regla 1).
    const productoId = prodIds[facturasCreadas % prodIds.length];
    const items = [{ productoId, cantidad: 1 }];

    // Reponer stock si hace falta antes de vender.
    try {
      await registrarMovimientoManual(ADMIN, productoId, {
        tipo: "ingreso",
        cantidad: 2,
        motivo: "Reposición",
        observacion: "Seed automático",
      });
    } catch {
      // Si ya hay stock, seguir.
    }

    let clienteId: number | null = null;
    let pago: Record<string, unknown> = { forma: "contado" };

    if (forma === "contado") {
      clienteId =
        facturasCreadas % 4 === 0
          ? clienteIds[facturasCreadas % clienteIds.length]
          : null;
      pago = { forma: "contado" };
    } else if (forma === "tarjeta") {
      clienteId = clienteIds[facturasCreadas % clienteIds.length];
      pago = {
        forma: "tarjeta",
        tarjeta: {
          tipo: facturasCreadas % 2 === 0 ? "debito" : "credito",
          marca: facturasCreadas % 2 === 0 ? "Visa" : "Mastercard",
          ultimos4: String(1000 + (facturasCreadas % 9000)).slice(-4),
        },
      };
    } else {
      clienteId = clientesCC[facturasCreadas % clientesCC.length];
      pago = { forma: "cuenta_corriente" };
    }

    try {
      const factura = await crearFactura(user, {
        clienteId,
        items,
        pago,
      });

      const fecha = new Date();
      fecha.setDate(fecha.getDate() - daysAgo);
      fecha.setHours(10 + (facturasCreadas % 8), facturasCreadas % 60, 0, 0);
      await db
        .update(facturas)
        .set({
          fecha: fecha.toISOString().replace("T", " ").replace("Z", ""),
        })
        .where(eq(facturas.id, factura.id as number));

      if (forma === "cuenta_corriente" && facturasCreadas % 5 === 0 && clienteId) {
        const importe = Math.floor((factura.total as number) / 2);
        if (importe > 0) {
          await registrarPago(user, clienteId, {
            importe,
            medio: "transferencia",
            observacion: "Pago parcial seed",
          });
        }
      }
      facturasCreadas += 1;
    } catch (err) {
      console.warn(`Reintento factura ${i}:`, (err as Error).message);
    }
  }

  if (facturasCreadas < 50) {
    throw new Error(
      `Seed incompleto: solo se crearon ${facturasCreadas}/50 facturas.`,
    );
  }

  void sql;

  console.log(`Seed completo (${facturasCreadas} facturas).`);
  console.log("Usuarios de prueba:");
  console.log("  Admin:    laura@ferreteria.test / admin1234");
  console.log("  Vendedor: pablo@ferreteria.test / vendedor1234");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
