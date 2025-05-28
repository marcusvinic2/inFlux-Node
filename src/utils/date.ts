export const parseCustomDate = (date: string) => {
  const day = parseInt(date.slice(0, 2), 10)
  const month = parseInt(date.slice(2, 4), 10) - 1 // JavaScript Date usa meses de 0 a 11
  const year = parseInt(date.slice(4, 8), 10)

  const parsedDate = new Date(Date.UTC(year, month, day)) // Cria data no UTC
  return parsedDate.toISOString()
}
