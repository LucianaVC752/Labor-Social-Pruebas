import Image from "next/image";

export default function Home() {
  return (
    <section className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="text-justify leading-relaxed">
          <h1 className="text-2xl font-semibold mb-1">Bienvenido</h1>
          <h2 className="text-lg text-neutral-600 mb-4">San Carlos</h2>
          <p>
            El municipio de San Carlos se localiza en el suroriente de Antioquia, en las estribaciones de la cordillera central de Los Andes y al vertiente occidental del rio Magdalena, formando parte de la región del Oriente Antioqueño, a los 06°11′ 7′′ de latitud norte y 74°59′ 35′′ de longitud oeste del meridiano de Greenwich. Dista a unos 108 kilómetros de la ciudad de Medellín y pertenece a la Subregión Aguas. Limita por el norte con los municipios de San Rafael, San Roque y Caracolí, por el este con el municipio de Puerto Nare, por el sur con los municipios de Puerto Nare y San Luis y por el oeste con los municipios de Granada, y Guatapé y posee una temperatura promedio de 23°C (Figura 1). La extensión total del municipio son 702 Km2 , de los cuales 2.3 Km2 corresponden al casco urbano. En municipio está constituido por tres corregimientos que son: El Jordán, Samana y Puerto Garza (Narices), y 78 veredas, distribuidas y organizadas en 14 centros zonales. La cabecera municipal cuenta con las siguientes vías de acceso desde la ciudad de Medellín: Medellín- Guarne- Marinilla- El Peñol- Guatapé - San Rafael- San Carlos que hacen parte del anillo vial del oriente, recién pavimentada hasta San Carlos, con un recorrido de 149 Km. Otra vía de acceso es Medellín- Guarne- Marinilla-SantuarioGranada-San Carlos, con un recorrido de 117 Km. y pavimentada desde Medellín hasta Granada.
          </p>
        </div>
        <div className="flex justify-end">
          <figure>
            <Image
              src="/uploads/san-carlos-mapa.jpg"
              alt="Mapa del municipio de San Carlos"
              width={800}
              height={720}
              className="rounded-lg border shadow-sm"
              priority
            />
            <figcaption className="mt-2 text-sm text-neutral-600 text-right">Figura 1</figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
