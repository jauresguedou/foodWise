import 'server-only';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { OutgoingEmail } from '@/src/server/email';

type SignInCodeEmailProps = { code: string; expiresInMinutes: number };

// Email clients ignore stylesheets, so styles are inline. Colors match
// app/globals.css.
const colors = {
  ink: '#202a25',
  inkSoft: '#4a544e',
  paper: '#f7f6f0',
  line: '#dfe2d9',
  green: '#285742',
};

function SignInCodeEmail({ code, expiresInMinutes }: SignInCodeEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your FoodWise sign-in code is {code}</Preview>
      <Body
        style={{
          backgroundColor: colors.paper,
          color: colors.ink,
          fontFamily: 'Arial, Helvetica, sans-serif',
          margin: 0,
          padding: '32px 16px',
        }}
      >
        <Container
          style={{
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.line}`,
            borderRadius: '12px',
            maxWidth: '480px',
            padding: '32px',
          }}
        >
          <Text
            style={{
              color: colors.green,
              fontSize: '18px',
              fontWeight: 800,
              margin: 0,
            }}
          >
            FoodWise
          </Text>
          <Heading
            as="h1"
            style={{ fontSize: '24px', fontWeight: 800, margin: '24px 0 8px' }}
          >
            Your sign-in code
          </Heading>
          <Text style={{ color: colors.inkSoft, fontSize: '16px', margin: 0 }}>
            Enter this code on the FoodWise sign-in page.
          </Text>
          <Section
            style={{
              backgroundColor: colors.paper,
              borderRadius: '8px',
              margin: '24px 0',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: '32px',
                fontWeight: 700,
                letterSpacing: '8px',
                margin: 0,
              }}
            >
              {code}
            </Text>
          </Section>
          <Text style={{ color: colors.inkSoft, fontSize: '14px', margin: 0 }}>
            It expires in {expiresInMinutes} minutes. If you didn&apos;t ask for
            this code, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// The plain-text version is what the dev terminal and the tests read, and
// what email clients show when they block HTML.
export function signInCodeEmail(
  code: string,
  expiresInMinutes: number
): Omit<OutgoingEmail, 'to'> {
  return {
    subject: 'Your FoodWise sign-in code',
    text: [
      `Your FoodWise sign-in code is ${code}.`,
      `It expires in ${expiresInMinutes} minutes.`,
      '',
      "If you didn't ask for this code, you can ignore this email.",
    ].join('\n'),
    react: <SignInCodeEmail code={code} expiresInMinutes={expiresInMinutes} />,
  };
}
