import type { Locale } from "./config";

/**
 * Spanish names for the built-in content: the routine's exercises, plan days, foods and meal templates.
 * Names you create yourself, and the wider exercise library, are shown as stored.
 */
const ES: Readonly<Record<string, string>> = {
  // exercises
  "Incline Press": "Press inclinado",
  "Machine Flat Chest Press": "Press de pecho plano en máquina",
  "Pec Deck / Cable Fly": "Pec deck / Aperturas en polea",
  "Shoulder Press": "Press de hombros",
  "Lateral Raise": "Elevaciones laterales",
  "Reverse Pec Deck": "Pec deck inverso",
  "Rope Triceps Pushdown": "Extensión de tríceps en polea con cuerda",
  "Overhead Cable Triceps Extension": "Extensión de tríceps sobre la cabeza en polea",
  "Lat Pulldown": "Jalón al pecho",
  "Chest Supported Row": "Remo con apoyo en el pecho",
  "Single Arm Row": "Remo a una mano",
  "Straight Arm Pulldown": "Jalón con brazos rectos",
  "Seated Row": "Remo sentado",
  "Preacher Curl": "Curl predicador",
  "Hammer Curl": "Curl martillo",
  "Cable Curl": "Curl en polea",
  "EZ Bar Curl": "Curl con barra Z",
  "Hack Squat": "Sentadilla hack",
  "Leg Press": "Prensa de piernas",
  "Bulgarian Split Squat": "Sentadilla búlgara",
  "Leg Extension": "Extensión de piernas",
  "Leg Curl": "Curl femoral",
  "Seated Leg Curl": "Curl femoral sentado",
  "Romanian Deadlift": "Peso muerto rumano",
  "Hip Thrust": "Hip thrust",
  "Adductor Machine": "Máquina de aductores",
  "Calf Raise": "Elevación de talones",
  // plan days
  "Push Heavy": "Empuje pesado",
  Push: "Empuje",
  "Pull Heavy": "Tirón pesado",
  Pull: "Tirón",
  "Legs / Quad Focus": "Piernas / Énfasis en cuádriceps",
  Legs: "Piernas",
  Upper: "Tren superior",
  "Upper Body": "Tren superior",
  "Legs / Posterior + Shoulders + Arms": "Piernas / Posterior + Hombros + Brazos",
  "Legs & Arms": "Piernas y brazos",
  // foods
  "Egg (whole)": "Huevo (entero)",
  "White rice (cooked)": "Arroz blanco (cocido)",
  "Yogurt (plain)": "Yogur (natural)",
  "Greek yogurt (low fat)": "Yogur griego (bajo en grasa)",
  "Lean meat (cooked)": "Carne magra (cocida)",
  "Protein powder": "Proteína en polvo",
  "Oats (dry)": "Avena (seca)",
  Banana: "Banano",
  Blueberries: "Arándanos",
  "Peanut butter": "Mantequilla de maní",
  "Milk (semi-skimmed)": "Leche (semidescremada)",
  Water: "Agua",
  // natural pieces
  egg: "huevo",
  scoop: "medida",
  banana: "banano",
  // meal templates and option groups
  Breakfast: "Desayuno",
  Lunch: "Almuerzo",
  "Pre workout": "Pre-entreno",
  "Post workout": "Post-entreno",
  "Before bed": "Antes de dormir",
  "High calorie protein shake": "Batido proteico alto en calorías",
  liquid: "Líquido",
};

export function localizeName(name: string, locale: Locale): string {
  return locale === "es" ? (ES[name] ?? name) : name;
}

export const SPANISH_NAMES = ES;
