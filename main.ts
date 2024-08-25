import Papa from "papaparse"
import fs from "node:fs"
import { z } from "zod"

// Start and end date for the data
// This is based on the data provided in the tariff pdf
const [startDate, endDate] = [
  new Date("2023/07/01 00:00"),
  new Date("2024/07/01 00:00"),
]

// Schema for the data
// This schema will be used to validate the data and transform it into
// the desired format
const dataSchema = z.array(
  z
    .object({
      Serial: z.string().transform((s) => parseInt(s)), // e.g. "234692379",
      "Time of Reading - Local": z
        .string()
        .transform((s) => new Date(s))
        .refine((date) => date >= startDate && date < endDate), // e.g. "2023/07/03 01:00",
      "Time of Reading - UTC": z.string(), // e.g. "2023/07/02 23:00",
      "forwardActiveEnergy Type": z.enum(["TookReading", "EstimatedReading"]), // e.g. "TookReading",
      "forwardActiveEnergy Value": z.string().transform((s) => parseInt(s)), // e.g. "5323356",
    })
    .transform((datum) => ({
      serial: datum.Serial,
      timeOfReadingLocal: datum["Time of Reading - Local"],
      cumulativeActiveEnergy: datum["forwardActiveEnergy Value"],
    })),
)

// A function to parse the CSV file
function parseCSVFile(filePath: string) {
  try {
    const csvFile = fs.readFileSync(filePath, "utf8")

    const result = Papa.parse<unknown>(csvFile, {
      header: true,
      skipEmptyLines: true,
    })

    if (result.errors.length > 0) {
      throw new Error(
        `Error parsing CSV file: ${JSON.stringify(result.errors)}`,
      )
    }

    return result
  } catch (e) {
    throw new Error(`Error parsing CSV file: ${e}`)
  }
}

// Parse the CSV file, validate the data
const csvData = parseCSVFile("data.csv")
const parsedData = dataSchema.parse(csvData.data)

// Get first and last reading of each month
const monthlyReadingsMap = new Map<
  number,
  {
    first: { reading: number; date: Date }
    last: { reading: number; date: Date }
  }
>()
for (const reading of parsedData) {
  let month = reading.timeOfReadingLocal.getMonth() + 1
  const key = parseInt(
    `${reading.timeOfReadingLocal.getFullYear()}${
      month < 10 ? "0" : ""
    }${month}`,
  )

  if (monthlyReadingsMap.has(key)) {
    const existingReading = monthlyReadingsMap.get(key)!
    if (reading.timeOfReadingLocal < existingReading.first.date) {
      existingReading.first.reading = reading.cumulativeActiveEnergy
      existingReading.first.date = reading.timeOfReadingLocal
    } else if (reading.timeOfReadingLocal > existingReading.last.date) {
      existingReading.last.reading = reading.cumulativeActiveEnergy
      existingReading.last.date = reading.timeOfReadingLocal
    }

    monthlyReadingsMap.set(key, existingReading)
  } else {
    monthlyReadingsMap.set(key, {
      first: {
        reading: reading.cumulativeActiveEnergy,
        date: reading.timeOfReadingLocal,
      },
      last: {
        reading: reading.cumulativeActiveEnergy,
        date: reading.timeOfReadingLocal,
      },
    })
  }
}

// Calculate the energy consumption for each month
const monthlyReadings = Array.from(monthlyReadingsMap.entries()).sort(
  ([a], [b]) => a - b,
)
let lastReading = monthlyReadings[0][1].first.reading
const monthlyConsumption = monthlyReadings.map(([month, readings]) => {
  const reading = readings.last.reading
  const consumption = reading - lastReading
  lastReading = reading

  return {
    month,
    consumption,
  }
})

// Calculate the monthly tariff for each month
const blocks = new Map<number, number>([
  [100, 241.37],
  [350, 282.47],
  [200, 307.75],
  [Infinity, 331.76],
])

const monthlyTariff = monthlyConsumption.map(({ month, consumption }) => {
  if (consumption === 0) return { month, tariff: 0, consumption: 0 }

  consumption = consumption / 1000
  const monthlyConsumption = consumption
  let tariff = 0

  for (const [block, rate] of blocks) {
    const amount = Math.min(consumption, block)
    tariff += amount * rate
    consumption -= amount
  }

  return {
    month,
    tariff,
    consumption: monthlyConsumption,
  }
})

// Output the results
monthlyTariff.forEach(({ month, tariff, consumption }) => {
  console.log(
    `${month.toString().replace(/(\d{4})(\d{2})/, "$1/$2")}: R${(
      tariff / 100
    ).toFixed(2)} (${consumption}kWh, ${tariff}c)`,
  )
})
