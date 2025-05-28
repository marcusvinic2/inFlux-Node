import cron from 'node-cron'
import axios from 'axios'

export function startIntegrationOrdersJob() {
  cron.schedule('*/1 * * * *', async () => {
    try {
      console.log(
        `[${new Date().toISOString()}] Iniciando integração com Questor...`,
      )

      const response = await axios.get(
        'http://147.182.254.211:8000/integration/questor/orders',
      )

      console.log(`[${new Date().toISOString()}] Resposta:`, response.data)
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro na integração:`, error)
    }
  })

  console.log(
    '⏱️ Job "integrationOrdersJob" agendado para rodar a cada 1 minuto.',
  )
}
