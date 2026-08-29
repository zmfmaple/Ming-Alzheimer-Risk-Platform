export const MODEL_DEFAULTS: Record<string, number> = {
  BMI: 27.82,
  AlcoholConsumption: 9.93,
  PhysicalActivity: 4.77,
  DietQuality: 5.08,
  SleepQuality: 7.12,
  SystolicBP: 134,
  DiastolicBP: 91,
  CholesterolTotal: 225.09,
  CholesterolLDL: 123.34,
  CholesterolHDL: 59.77,
  CholesterolTriglycerides: 230.3,
  MMSE: 14.44,
  FunctionalAssessment: 5.09,
  ADL: 5.04,
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const calculateBMI = (heightCm?: number, weightKg?: number) => {
  if (!heightCm || !weightKg) return null
  const metres = heightCm / 100
  return Number((weightKg / (metres * metres)).toFixed(1))
}

export const calculateActivityScore = (
  moderateDays?: number,
  moderateMinutesPerDay?: number,
  vigorousDays?: number,
  vigorousMinutesPerDay?: number,
) => {
  if (
    moderateDays === undefined ||
    moderateMinutesPerDay === undefined ||
    vigorousDays === undefined ||
    vigorousMinutesPerDay === undefined
  ) return null
  const moderateMinutes = moderateDays * moderateMinutesPerDay
  const vigorousMinutes = vigorousDays * vigorousMinutesPerDay
  return Number(
    clamp((moderateMinutes + vigorousMinutes * 2) / 60, 0, 10).toFixed(1),
  )
}

export const calculateAlcoholUnits = (
  beerServings: number,
  wineServings: number,
  spiritServings: number,
) => {
  const beerUnits = beerServings * 568 * 4 / 1000
  const wineUnits = wineServings * 175 * 12 / 1000
  const spiritUnits = spiritServings * 25 * 40 / 1000
  return Number((beerUnits + wineUnits + spiritUnits).toFixed(1))
}

export type CholesterolUnit = 'mg/dL' | 'mmol/L'

export const cholesterolToMgDl = (
  field: string,
  value: number,
  unit: CholesterolUnit,
) => {
  if (unit === 'mg/dL') return Number(value.toFixed(1))
  const factor = field === 'CholesterolTriglycerides' ? 88.57 : 38.67
  return Number((value * factor).toFixed(1))
}

export const cholesterolFromMgDl = (
  field: string,
  value: number,
  unit: CholesterolUnit,
) => {
  if (unit === 'mg/dL') return Number(value.toFixed(1))
  const factor = field === 'CholesterolTriglycerides' ? 88.57 : 38.67
  return Number((value / factor).toFixed(2))
}

export type EvidenceQuality = 'High' | 'Moderate' | 'Limited'

export const calculateEvidenceQuality = (
  completeness: number,
  imputedFields: string[],
  formalCognitiveScoreProvided: boolean,
) => {
  const criticalLabels = new Set([
    'Formal cognitive score',
    'Basic daily living score',
    'Independent living score',
  ])
  const missingCritical = imputedFields.filter((field) =>
    criticalLabels.has(field),
  ).length

  let quality: EvidenceQuality = 'Moderate'
  if (
    completeness >= 90 &&
    missingCritical === 0 &&
    formalCognitiveScoreProvided
  ) {
    quality = 'High'
  } else if (
    completeness < 75 ||
    missingCritical >= 2 ||
    !formalCognitiveScoreProvided
  ) {
    quality = 'Limited'
  }

  const reasons: string[] = []
  if (!formalCognitiveScoreProvided) {
    reasons.push('No formal cognitive score was provided.')
  }
  if (missingCritical > 0) {
    reasons.push(`${missingCritical} cognition or function field(s) were substituted.`)
  }
  if (completeness < 90) {
    reasons.push(`Questionnaire completeness was ${completeness}%.`)
  }
  if (!reasons.length) {
    reasons.push('Key cognitive, functional and questionnaire fields were supplied.')
  }

  return { quality, reasons, missingCritical }
}

const frequencyScore: Record<string, number> = {
  rarely: 0,
  sometimes: 1,
  usually: 2,
}

const inverseFrequencyScore: Record<string, number> = {
  rarely: 2,
  sometimes: 1,
  often: 0,
}

export const calculateDietScore = (
  fruitVegetableServings?: string,
  wholeGrainFrequency?: string,
  fishServings?: string,
  legumesFrequency?: string,
  processedFoodFrequency?: string,
  sugaryDrinkFrequency?: string,
) => {
  if (
    [
      fruitVegetableServings,
      wholeGrainFrequency,
      fishServings,
      legumesFrequency,
      processedFoodFrequency,
      sugaryDrinkFrequency,
    ]
      .some((value) => value === undefined)
  ) return null

  const fruitScore: Record<string, number> = {
    none: 0,
    '1-2': 1,
    '3-4': 2,
    '5+': 3,
  }
  const fishScore: Record<string, number> = {
    none: 0,
    one: 1,
    '2+': 2,
  }
  if (
    fruitScore[fruitVegetableServings!] === undefined ||
    frequencyScore[wholeGrainFrequency!] === undefined ||
    fishScore[fishServings!] === undefined ||
    frequencyScore[legumesFrequency!] === undefined ||
    inverseFrequencyScore[processedFoodFrequency!] === undefined ||
    inverseFrequencyScore[sugaryDrinkFrequency!] === undefined
  ) return null
  const points =
    fruitScore[fruitVegetableServings!] +
    frequencyScore[wholeGrainFrequency!] +
    fishScore[fishServings!] +
    frequencyScore[legumesFrequency!] +
    inverseFrequencyScore[processedFoodFrequency!] +
    inverseFrequencyScore[sugaryDrinkFrequency!]
  return Number(clamp((points / 13) * 10, 0, 10).toFixed(1))
}

const frequencyPenalty: Record<string, number> = {
  rarely: 0,
  sometimes: 1,
  often: 2,
}

export const calculateSleepScore = (
  hours?: number,
  wakingFrequency?: string,
  daytimeSleepiness?: string,
) => {
  if (!hours || !wakingFrequency || !daytimeSleepiness) return null
  const durationScore =
    hours >= 7 && hours <= 9
      ? 6
      : hours >= 6 && hours <= 10
        ? 4.5
        : hours >= 5 && hours <= 11
          ? 3
          : 1
  return Number(
    clamp(
      durationScore +
        2 - frequencyPenalty[wakingFrequency] +
        2 - frequencyPenalty[daytimeSleepiness],
      4,
      10,
    ).toFixed(1),
  )
}

export type AbilityAnswer =
  | 'independent'
  | 'assistive'
  | 'help'
  | 'unable'
  | 'unknown'
  | 'never'

export const calculateAbilityScore = (
  answers: Record<string, AbilityAnswer>,
) => {
  const usable = Object.values(answers).filter(
    (answer) => answer !== 'unknown' && answer !== 'never',
  )
  if (!usable.length) return null
  const points = usable.reduce((total, answer) => {
    if (answer === 'independent') return total + 2
    if (answer === 'assistive') return total + 1.5
    if (answer === 'help') return total + 1
    return total
  }, 0)
  return Number(((points / (usable.length * 2)) * 10).toFixed(1))
}
