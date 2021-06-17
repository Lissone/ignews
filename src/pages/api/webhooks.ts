import { NextApiRequest, NextApiResponse } from 'next'
import { Readable } from 'stream'
import Stripe from 'stripe'

import { stripe } from '../../services/stripe'
import { saveSubscription } from './_lib/manageSubscription'

// função para concatenar respostas de stream do stripe, para receber todas juntas
async function buffer(readable: Readable) { 
  const chunks = []

  for await (const chunk of readable) {
    chunks.push(
      typeof chunk === 'string' ? Buffer.from(chunk) : chunk
    )
  }

  return Buffer.concat(chunks)
}

// desabilitar o bodyparser para poder consumir uma stream na req
export const config = {
  api: {
    bodyParser: false
  }
}

const relevantEvents = new Set([
  'checkout.session.completed'
])

// as respostas dessa função são enviadas para o stripe
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method not allowed')
  }

  const buf = await buffer(req)
  const secret = req.headers['stripe-signature']

  let event: Stripe.Event

  try { // validar se a requisição esta vindo do stripe 
    event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`)
  }

  const { type } = event

  if (relevantEvents.has(type)) {
    try {
      switch (type) {
        case 'checkout.session.completed':
          const checkoutSession = event.data.object as Stripe.Checkout.Session

          await saveSubscription(
            checkoutSession.subscription.toString(),
            checkoutSession.customer.toString()
          )

          break
        default:
          throw new Error('Unhandled event')
      }
    } catch (err) {
      return res.json({ error: 'Webhook handler failed' })
    }
  }

  res.json({ received: true })
}