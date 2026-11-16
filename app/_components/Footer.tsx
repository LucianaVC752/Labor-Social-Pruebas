 

export default function Footer() {
  return (
    <footer className="w-full border-t border-primary bg-primary-complementary text-primary-foreground">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-2">
        <div className="text-sm">© {new Date().getFullYear()} Labor Social - Luciana Velasquez Ciro</div>
        <div className="text-sm">Código Postal: 687571</div>
        <div className="text-sm">Jornada de trabajo: martes a viernes de 7:30 a.m. - 12:30 p.m. y 2:00 p.m. - 6:00 p.m.</div>
        <div className="text-sm">Sábado en jornada continua de 7:00 a.m. a 3:00 p.m</div>
      </div>
    </footer>
  )
}
