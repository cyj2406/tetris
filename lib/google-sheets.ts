
import { google } from 'googleapis';

export async function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error('Google Service Account credentials are not defined in environment variables');
  }

  // Use the modern object-based configuration for google.auth.JWT
  const auth = new google.auth.JWT({
    email: email,
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}
