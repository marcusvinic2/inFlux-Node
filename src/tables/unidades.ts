const unidades: Record<string, number> = {
  BB: 31,
  CM: 2, //
  CX: 5,
  G: 4, //
  KG: 4,
  L: 32,
  M: 24,
  'M²': 29,
  'M³': 39,
  ML: 21,
  PAR: 22,
  PÇ: 25,
  PCT: 37,
  POL: 14,
  RL: 19,
  SC: 18,
  UN: 16,
  UND: 1,
}

export const converterUnidadeQuestor = (codigo: keyof typeof unidades) => {
  const descricao = unidades[codigo.toUpperCase()]
  if (!descricao) {
    throw new Error(`Código de unidade inválido: ${codigo}`)
  }
  return descricao
}
