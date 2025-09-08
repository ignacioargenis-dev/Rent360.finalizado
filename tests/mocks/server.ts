import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock handlers for external APIs
export const handlers = [
  // Mock Khipu API
  rest.post('https://khipu.com/api/v2/payments', (req, res, ctx) => {
    return res(ctx.json({
      payment_id: 'kh_test_123',
      payment_url: 'https://khipu.com/payment/test_123',
      simplified_transfer_url: 'https://khipu.com/simplified/test_123',
      transfer_url: 'https://khipu.com/transfer/test_123',
      app_url: 'https://khipu.com/app/test_123',
      ready_for_terminal: true
    }));
  }),

  rest.get('https://khipu.com/api/v2/payments/:paymentId', (req, res, ctx) => {
    const { paymentId } = req.params;
    return res(ctx.json({
      payment_id: paymentId,
      status: 'done',
      amount: 100000,
      currency: 'CLP',
      subject: 'Pago de arriendo',
      body: 'Pago mensual',
      bank: 'Banco Estado',
      bank_id: '012',
      payer_name: 'Juan Pérez',
      payer_email: 'juan@example.com',
      personal_identifier: '12345678-9',
      bank_account_number: '123456789',
      out_of_date_conciliation: false,
      transaction_id: 'tx_khipu_123',
      responsible_user_email: 'admin@example.com',
      send_reminders: true,
      notify_url: 'https://example.com/webhook',
      return_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      notify_api_version: '1.3',
      expires_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      attachment_urls: [],
      custom: [],
      created_at: new Date().toISOString()
    }));
  }),

  // Mock WebPay API
  rest.post('https://webpay.transbank.cl/api/v1/transactions', (req, res, ctx) => {
    return res(ctx.json({
      token: 'webpay_token_123',
      url: 'https://webpay.transbank.cl/pay/webpay_token_123'
    }));
  }),

  rest.get('https://webpay.transbank.cl/api/v1/transactions/:token', (req, res, ctx) => {
    return res(ctx.json({
      token: req.params.token,
      status: 'AUTHORIZED',
      amount: 100000,
      buy_order: 'order_123',
      session_id: 'session_123',
      card_detail: {
        card_number: '1234-****-****-5678'
      },
      accounting_date: new Date().toISOString().split('T')[0],
      transaction_date: new Date().toISOString(),
      authorization_code: '123456',
      payment_type_code: 'VN',
      response_code: 0,
      installments_amount: 100000,
      installments_number: 1
    }));
  }),

  // Mock Banco Estado API
  rest.post('https://api.bancoestado.cl/v1/transfers', (req, res, ctx) => {
    return res(ctx.json({
      transfer_id: 'be_transfer_123',
      status: 'completed',
      amount: 100000,
      destination_account: '123456789',
      origin_account: '987654321',
      description: 'Transferencia Rent360',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    }));
  }),

  // Mock PayPal API
  rest.post('https://api.paypal.com/v2/payments/captures', (req, res, ctx) => {
    return res(ctx.json({
      id: 'paypal_capture_123',
      status: 'COMPLETED',
      amount: {
        currency_code: 'USD',
        value: '100.00'
      },
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString()
    }));
  }),

  // Mock Stripe API
  rest.post('https://api.stripe.com/v1/charges', (req, res, ctx) => {
    return res(ctx.json({
      id: 'ch_stripe_123',
      object: 'charge',
      amount: 10000,
      currency: 'usd',
      status: 'succeeded',
      paid: true,
      captured: true,
      balance_transaction: 'txn_stripe_123',
      created: Math.floor(Date.now() / 1000)
    }));
  }),

  // Mock external signature services
  rest.post('https://api.trustfactory.cl/v1/signatures', (req, res, ctx) => {
    return res(ctx.json({
      signature_id: 'tf_sig_123',
      status: 'pending',
      document_url: 'https://trustfactory.cl/doc/sig_123',
      signers: [
        {
          email: 'signer1@example.com',
          status: 'pending'
        }
      ],
      created_at: new Date().toISOString()
    }));
  }),

  rest.post('https://api.firmapro.cl/v1/documents', (req, res, ctx) => {
    return res(ctx.json({
      id: 'fp_doc_123',
      status: 'created',
      url: 'https://firmapro.cl/sign/fp_doc_123',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }),

  // Mock external email service
  rest.post('https://api.sendgrid.com/v3/mail/send', (req, res, ctx) => {
    return res(ctx.status(202), ctx.json({}));
  }),

  // Mock SMS service
  rest.post('https://api.twilio.com/2010-04-01/Accounts/*/Messages.json', (req, res, ctx) => {
    return res(ctx.json({
      sid: 'SM_twilio_123',
      status: 'queued',
      to: '+56912345678',
      from: '+56987654321',
      body: req.body.Body,
      date_created: new Date().toISOString()
    }));
  }),

  // Mock AI services
  rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
    return res(ctx.json({
      id: 'chatcmpl_openai_123',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-3.5-turbo',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'Hola, soy tu asistente virtual de Rent360. ¿En qué puedo ayudarte?'
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 30,
        total_tokens: 80
      }
    }));
  }),

  rest.post('https://api.anthropic.com/v1/messages', (req, res, ctx) => {
    return res(ctx.json({
      id: 'msg_anthropic_123',
      type: 'message',
      role: 'assistant',
      content: [{
        type: 'text',
        text: 'Hola, soy Claude, tu asistente de Rent360. Estoy aquí para ayudarte.'
      }],
      model: 'claude-3-sonnet-20240229',
      stop_reason: 'end_turn',
      usage: {
        input_tokens: 50,
        output_tokens: 30
      }
    }));
  }),

  rest.post('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', (req, res, ctx) => {
    return res(ctx.json({
      candidates: [{
        content: {
          parts: [{
            text: 'Hola, soy Gemini, tu asistente de Rent360. ¿Cómo puedo ayudarte hoy?'
          }],
          role: 'model'
        },
        finishReason: 'STOP',
        index: 0
      }],
      usageMetadata: {
        promptTokenCount: 50,
        candidatesTokenCount: 30,
        totalTokenCount: 80
      }
    }));
  }),

  // Mock geolocation service
  rest.get('https://api.opencagedata.com/geocode/v1/json', (req, res, ctx) => {
    return res(ctx.json({
      results: [{
        geometry: {
          lat: -33.4489,
          lng: -70.6693
        },
        components: {
          city: 'Santiago',
          country: 'Chile',
          state: 'Región Metropolitana'
        },
        formatted: 'Santiago, Región Metropolitana, Chile'
      }],
      status: {
        code: 200,
        message: 'OK'
      }
    }));
  }),

  // Mock currency exchange service
  rest.get('https://api.exchangerate-api.com/v4/latest/CLP', (req, res, ctx) => {
    return res(ctx.json({
      provider: 'https://www.exchangerate-api.com',
      WARNING_UPGRADE_TO_V6: 'https://www.exchangerate-api.com/docs/free',
      terms: 'https://www.exchangerate-api.com/terms',
      base: 'CLP',
      date: new Date().toISOString().split('T')[0],
      time_last_updated: Math.floor(Date.now() / 1000),
      rates: {
        USD: 0.0011,
        EUR: 0.0010,
        BRL: 0.0058,
        ARS: 0.92,
        CLP: 1
      }
    }));
  })
];

export const server = setupServer(...handlers);
