import axios from 'axios';

export const sendSMS = async (mobile: string, message: string): Promise<boolean> => {
  const apiKey = process.env.TWO_FACTOR_API_KEY;

  if (!apiKey) {
    console.warn('2Factor API key not configured, skipping SMS');
    return false;
  }

  try {
    const response = await axios.get(
      `https://2factor.in/API/V1/${apiKey}/SMS/${mobile}/${encodeURIComponent(message)}`
    );
    return response.data.Status === 'Success';
  } catch (error: any) {
    console.error('SMS send failed:', error.message);
    return false;
  }
};
