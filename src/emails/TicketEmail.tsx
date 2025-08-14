// Archivo: src/emails/TicketEmail.tsx

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';

// Definimos las propiedades que nuestro email va a recibir
interface TicketEmailProps {
  buyerName: string;
  qrCodeImages: string[]; // Un array de imágenes de QR en formato base64
}

const main = {
  backgroundColor: '#0a0a0a',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};
const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
  maxWidth: '100%',
};
const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#f3f4f6',
};
const text = {
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#d1d5db',
};
const qrCodeContainer = {
  margin: '24px 0',
  textAlign: 'center' as const,
};
const qrCodeImg = {
  backgroundColor: '#ffffff',
  padding: '12px',
  borderRadius: '8px',
};

export const TicketEmail = ({
  buyerName = 'Asistente',
  qrCodeImages = [],
}: TicketEmailProps) => (
  <Html>
    <Head />
    <Preview>Tu entrada para KARMA está lista.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>¡Gracias por tu compra, {buyerName}!</Heading>
        <Text style={text}>
          Tu lugar para KARMA Vol. 1: Primavera está confirmado.
          Presentá los siguientes códigos QR en la entrada del evento. Cada código es válido para una sola persona.
        </Text>
        
        {/* Aquí mapeamos y mostramos cada uno de los QRs */}
        {qrCodeImages.map((qrSrc, index) => (
          <Section style={qrCodeContainer} key={index}>
            <Text style={text}>Entrada {index + 1} de {qrCodeImages.length}</Text>
            <Img
              src={qrSrc}
              width="200"
              height="200"
              alt={`Código QR Entrada ${index + 1}`}
              style={qrCodeImg}
            />
          </Section>
        ))}

        <Text style={text}>
          ¡Nos vemos en la pista!
          <br />
          El equipo de KARMA
        </Text>
      </Container>
    </Body>
  </Html>
);

export default TicketEmail;