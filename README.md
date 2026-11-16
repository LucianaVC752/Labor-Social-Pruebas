# Labor Social App

Aplicación web desarrollada para la gestión de información de campesinos, incluyendo registro, edición, visualización y análisis de datos demográficos.

## 📋 Funcionalidades Implementadas

### 1. Autenticación y Seguridad
- Sistema de inicio de sesión seguro.
- Rutas protegidas (Dashboard).
- Gestión de sesiones con Supabase Auth.

### 2. Gestión de Campesinos
- **Listado Completo**: Tabla interactiva con paginación y búsqueda.
- **Registro**: Formulario para agregar nuevos campesinos con validación de duplicados (Cédula única).
- **Edición**: Capacidad para actualizar la información de los campesinos existentes.
- **Visualización**: Perfil detallado de cada campesino.
- **Validaciones**: Control de integridad de datos (Cédula, campos requeridos).

### 3. Analíticas y Reportes
- **Distribución por Edad**: Gráficos visuales para entender la demografía.
- **Distribución por Sexo y Edad**: Análisis detallado de la población.

### 4. Interfaz de Usuario (UI)
- **Diseño Responsivo**: Adaptable a dispositivos móviles y escritorio.
- **Componentes Modernos**: Uso de Shadcn UI para una experiencia consistente.
- **Feedback Visual**: Notificaciones de éxito/error (Toasts), estados de carga.

## 🛠 Stack Tecnológico

- **Frontend**: 
  - [Next.js 16](https://nextjs.org/) (App Router)
  - [React 19](https://react.dev/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [Shadcn UI](https://ui.shadcn.com/) (Componentes)
  - [Recharts](https://recharts.org/) (Gráficos)
  - [Tanstack Table](https://tanstack.com/table) (Tablas avanzadas)

- **Backend & Base de Datos**:
  - [Supabase](https://supabase.com/) (PostgreSQL Database & Auth)
  - Server Actions de Next.js para lógica de servidor.

## 💰 Costos de Mantenimiento y Operación

La aplicación está diseñada para funcionar con costos mínimos, aprovechando los niveles gratuitos de servicios modernos.

| Servicio | Plan Recomendado | Costo Estimado | Descripción |
| :--- | :--- | :--- | :--- |
| **Vercel (Hosting)** | **Hobby** | **$0 / mes** | Gratuito para uso personal y proyectos no comerciales. Suficiente para tráfico moderado. |
| **Supabase (Base de Datos)** | **Free Tier** | **$0 / mes** | Incluye 500MB de base de datos y 5GB de ancho de banda. Suficiente para miles de registros de campesinos. |
| **Dominio** | **Anual** | **~$12 - $20 USD / año** | El único costo fijo obligatorio si se desea un nombre personalizado (ej. `miproyecto.com`). |

### Escalabilidad (Costos Potenciales)
Si el proyecto crece significativamente (miles de usuarios activos diarios o gigabytes de archivos):
- **Vercel Pro**: ~$20 USD/mes por desarrollador.
- **Supabase Pro**: ~$25 USD/mes (para más espacio y backups automáticos).

## 🚀 Instalación y Desarrollo Local

1.  **Clonar el repositorio**
    ```bash
    git clone <url-del-repo>
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno**
    Crear un archivo `.env.local` con las credenciales de Supabase:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
    ```

4.  **Ejecutar el servidor de desarrollo**
    ```bash
    npm run dev
    ```

5.  Visita `http://localhost:3000` en tu navegador.
