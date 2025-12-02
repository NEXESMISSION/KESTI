import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, email, message, timestamp } = req.body;

    // Validate required fields
    if (!name || !phone || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const formData = {
      name,
      phone,
      email,
      message,
      timestamp: timestamp || new Date().toISOString(),
    };

    // Send to Google Apps Script
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbzzQ7e5sbeP4F0RfXJZAgg0FPXoGyc6SnVdXAnF9V26Rj6GU2Rs0HLz0u1MBJHPaRxm/exec',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Apps Script error: ${response.status}`);
    }

    const result = await response.text();

    res.status(200).json({
      success: true,
      message: 'تم إرسال رسالتك بنجاح! سنتواصل معك قريبًا.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.',
    });
  }
}
