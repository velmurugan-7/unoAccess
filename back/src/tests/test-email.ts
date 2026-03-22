// test-email.ts
import 'dotenv/config';               // loads .env into process.env
import nodemailer from 'nodemailer';
import { config } from '../config/env'; // adjust the import path to your config file
// import { logger } from './utils/logger'; // optional, if you want logging

async function testEmail() {
  try {
    // Create transporter using your existing config
    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure, // should be boolean (true for 465, false for 587)
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });

    // Verify connection configuration
    await transporter.verify();
    console.log('✅ SMTP connection successful');

    // Send a test email
    const info = await transporter.sendMail({
      from: config.email.from,
      to: 'imthorfinnv2@gmail.com', // replace with your email address
      subject: 'Test Email from UnoAccess',
      text: 'If you receive this, your Gmail SMTP is working!',
      html: '<p>If you receive this, your Gmail SMTP is working!</p>',
    });

    console.log('✅ Email sent:', info.messageId);
    if (config.nodeEnv !== 'production') {
      // If using Ethereal, a preview URL might be available
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEmail();