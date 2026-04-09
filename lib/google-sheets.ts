
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function getGoogleSheetsClient() {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    SCOPES
  );

  return google.sheets({ version: 'v4', auth });
}

export async function saveScoreToSheet(data: {
  name: string;
  timeSeconds: number;
  score: number;
  date: string;
}) {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:D',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[data.name, data.timeSeconds, data.score, data.date]],
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return { success: false, error };
  }
}

export async function getTopRankings() {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:D',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return [];

    // Assuming first row might be header if manually added, but we'll treat all as data or filter
    // Data format: Name, TimeSeconds, Score, Date
    const rankings = rows
      .map((row) => ({
        name: row[0],
        timeSeconds: parseInt(row[1], 10),
        score: parseInt(row[2], 10),
        date: row[3],
      }))
      .filter((r) => !isNaN(r.timeSeconds))
      .sort((a, b) => a.timeSeconds - b.timeSeconds) // Faster time is better
      .slice(0, 3);

    return rankings;
  } catch (error) {
    console.error('Error fetching rankings from Google Sheets:', error);
    return [];
  }
}
