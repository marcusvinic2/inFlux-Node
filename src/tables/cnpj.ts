export const findCodigoCliente = (cnpj: string) => {
  const action_flow_custom_data = [
    { cnpj: '16882484000341', codigo: '404' },
    { cnpj: '16882484000422', codigo: '405' },
    { cnpj: '16882484000503', codigo: '406' },
    { cnpj: '16882484000694', codigo: '407' },
    { cnpj: '16882484000775', codigo: '408' },
    { cnpj: '16882484000856', codigo: '409' },
  ]

  const result = action_flow_custom_data.find((x) => x.cnpj === cnpj)
  return result ? result.codigo : null
}
