/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from 'xlsx'
import * as path from 'path'
import * as fs from 'fs'

export async function buscarCodigoPorCep(cep: string): Promise<number | null> {
  const cleanCEP = cep.replace(/\D/g, '') // remove hífens, espaços, etc.

  const filePath = path.resolve(__dirname, '..', 'data', 'Cidade.xlsx')

  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`)
  }

  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  const rows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 }) // lê como matriz de arrays

  for (const row of rows) {
    const code = row[0]
    const cepFromFile = row[row.length - 1]

    if (
      typeof cepFromFile === 'string' &&
      cepFromFile.replace(/\D/g, '') === cleanCEP
    ) {
      return Number(code)
    }
  }

  return null // se não encontrar
}
