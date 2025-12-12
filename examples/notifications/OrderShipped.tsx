import {
  Html, Head, Body, Container, Text, Button, Preview
} from '@react-email/components'

type Props = {
  userName: string
  orderNumber: string
  trackingUrl: string
}

export function OrderShippedEmail({ userName, orderNumber, trackingUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Seu pedido foi enviado!</Preview>
      <Body style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <Container>
          <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
            Pedido Enviado!
          </Text>

          <Text>Olá {userName},</Text>

          <Text>
            Seu pedido <strong>#{orderNumber}</strong> foi enviado e está a caminho!
          </Text>

          <Button
            href={trackingUrl}
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            Rastrear Pedido
          </Button>

          <Text style={{ color: '#666', fontSize: '14px', marginTop: '20px' }}>
            Dúvidas? Responda este email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
