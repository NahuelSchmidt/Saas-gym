# GymFlow — SaaS de Gestión de Gimnasios

Plataforma web completa para gestionar gimnasios: miembros, planes, pagos, control de acceso y reportes.

## Stack tecnológico

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Estilos:** Tailwind CSS + shadcn/ui (componentes propios)
- **Base de datos:** Supabase (PostgreSQL) con Prisma-compatible types
- **Autenticación:** Supabase Auth (@supabase/ssr)
- **Pagos:** MercadoPago
- **Emails:** Resend
- **Deploy:** Vercel + Supabase

## Estructura del proyecto

```
src/
├── app/
│   ├── auth/
│   │   ├── login/          # Página de login
│   │   ├── register/       # Registro + creación de gimnasio
│   │   └── callback/       # Handler OAuth/magic link
│   └── dashboard/
│       ├── page.tsx         # Dashboard principal
│       ├── members/         # Gestión de miembros (CRUD)
│       ├── plans/           # Planes y membresías
│       ├── payments/        # Control de pagos
│       ├── access/          # Portería (control de acceso)
│       ├── reports/         # Reportes exportables
│       └── settings/        # Configuración del gimnasio
├── components/
│   ├── ui/                  # Componentes base (shadcn/ui)
│   ├── layout/              # Sidebar + Header
│   ├── dashboard/           # Gráficos y tarjetas del dashboard
│   ├── members/             # Formularios y acciones de miembros
│   ├── payments/            # Badges y formularios de pagos
│   └── plans/               # Diálogos de planes
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Cliente browser (createBrowserClient)
│   │   ├── server.ts        # Cliente server (createServerClient)
│   │   └── middleware.ts    # Cliente para middleware
│   └── utils.ts             # cn(), formatCurrency(), formatDate()
├── middleware.ts             # Protección de rutas
└── types/
    └── database.ts          # Tipos TypeScript del esquema
```

## Configuración inicial

### 1. Clonar e instalar dependencias

```bash
git clone <repo>
cd gymflow
npm install
```

### 2. Variables de entorno

Copiá `.env.example` a `.env.local` y completá los valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
MERCADOPAGO_ACCESS_TOKEN=tu-access-token
MERCADOPAGO_PUBLIC_KEY=tu-public-key
RESEND_API_KEY=tu-resend-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configurar Supabase

#### a) Crear proyecto en Supabase
1. Entrá a [supabase.com](https://supabase.com) y creá un nuevo proyecto
2. Copiá la URL y las API keys en `.env.local`

#### b) Ejecutar el schema SQL
1. En el panel de Supabase → **SQL Editor**
2. Copiá el contenido de `gymflow_schema.sql`
3. Ejecutalo (incluye tablas, RLS, triggers e índices)

#### c) Configurar Storage
1. En Supabase → **Storage** → crear bucket `member-photos`
2. Configurar como público:
   ```sql
   -- En SQL Editor:
   INSERT INTO storage.buckets (id, name, public) VALUES ('member-photos', 'member-photos', true);
   ```
3. Políticas RLS para el bucket:
   ```sql
   CREATE POLICY "Usuarios autenticados pueden subir fotos"
   ON storage.objects FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'member-photos');

   CREATE POLICY "Fotos son públicas"
   ON storage.objects FOR SELECT TO public
   USING (bucket_id = 'member-photos');
   ```

#### d) Configurar Auth (opcional: magic link)
En Supabase → **Auth** → **URL Configuration**:
- Site URL: `http://localhost:3000` (dev) / tu dominio en producción
- Redirect URLs: `http://localhost:3000/auth/callback`

### 4. Correr en desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) → se redirige automáticamente a `/auth/login`.

## Deploy en Vercel

1. Push el código a GitHub
2. Importar el repositorio en [vercel.com](https://vercel.com)
3. Agregar todas las variables de entorno en Vercel → Settings → Environment Variables
4. Cambiar `NEXT_PUBLIC_APP_URL` al dominio de Vercel
5. En Supabase → Auth → agregar el dominio de Vercel a "Redirect URLs"

## Módulos

### Autenticación
- Login con email/contraseña
- Registro: crea usuario + gimnasio + perfil OWNER automáticamente
- Middleware protege todas las rutas `/dashboard/*`
- Roles: `OWNER`, `STAFF`, `RECEPTIONIST`

### Miembros
- CRUD completo con foto de perfil (Supabase Storage)
- Baja lógica (soft delete)
- QR code único por miembro generado automáticamente
- Historial de pagos y accesos por miembro

### Planes y Membresías
- Planes configurables: precio, duración en días, días de acceso permitidos
- Asignación de plan a miembro con cálculo automático de vencimiento
- Estados: ACTIVO / VENCIDO / PAUSADO / CANCELADO

### Pagos
- Registro manual de pagos (efectivo, transferencia, MercadoPago, tarjeta)
- Resumen diario/mensual en dashboard
- Historial completo por miembro
- Exportación CSV

### Control de Acceso (Portería)
- Interfaz optimizada para tablet/touchscreen
- Búsqueda por nombre o DNI en tiempo real
- Pantalla verde (ACCESO PERMITIDO) / roja (ACCESO DENEGADO)
- Validaciones: membresía activa + pago al día + días permitidos del plan
- Registro de entrada y salida

### Reportes
- Reporte de cobros por período
- Reporte de asistencia
- Reporte de miembros activos/inactivos
- Exportación a CSV

## Convenciones de código

- **Server Actions:** en archivos `actions.ts` con `"use server"` al inicio
- **Server Components:** por defecto (sin `"use client"`)
- **Client Components:** solo cuando se necesita interactividad (marcados con `"use client"`)
- **Types:** todos en `src/types/database.ts`
- **Clientes Supabase:** usar `server.ts` en Server Components/Actions, `client.ts` en Client Components

## RLS (Row Level Security)

Todas las tablas tienen RLS activado. La función `auth_gym_id()` obtiene el `gym_id` del usuario autenticado y lo usa en todas las políticas para aislar datos por gimnasio (multi-tenant).
# Saas-gym
