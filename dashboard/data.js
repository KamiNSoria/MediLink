// Datos simulados para el prototipo. No hay backend: todo vive en el navegador.

const HOSPITALES_INICIALES = [
  {
    id: "A", nombre: "Hospital Eugenio Espejo", x: 110, y: 90,
    camas: 0,
    medicinas: [
      { nombre: "Noradrenalina", cant: 4, caducaEnDias: 120 },
      { nombre: "Insulina", cant: 30, caducaEnDias: 200 }
    ]
  },
  {
    id: "B", nombre: "Hospital Pablo Arturo Suárez", x: 490, y: 90,
    camas: 2,
    medicinas: [
      { nombre: "Noradrenalina", cant: 12, caducaEnDias: 9 },
      { nombre: "Heparina", cant: 8, caducaEnDias: 60 }
    ]
  },
  {
    id: "C", nombre: "Hospital Carlos Andrade Marín", x: 300, y: 340,
    camas: 3,
    medicinas: [
      { nombre: "Heparina", cant: 15, caducaEnDias: 14 },
      { nombre: "Insulina", cant: 6, caducaEnDias: 7 }
    ]
  }
];

// Centro del mapa: el bus de eventos (en el sistema real sería RabbitMQ).
const BUS = { x: 300, y: 190 };

const PACIENTES = [
  { nombre: "Paciente 001", necesita: "Noradrenalina", motivo: "Shock séptico" },
  { nombre: "Paciente 002", necesita: "Heparina", motivo: "Trombosis" },
  { nombre: "Paciente 003", necesita: "Insulina", motivo: "Cetoacidosis" }
];

const TTL_SEGUNDOS = 30; // tiempo que dura una reserva sin aprobar
