import { Customer } from '../models/Customer';
import { Invoice } from '../models/Invoice';
import { sendSMS } from './smsService';

export const sendMonthlyReminders = async () => {
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // Find all rented customers directly
  const rentedCustomers = await Customer.find({ status: 'Rented' });

  let sent = 0;
  let failed = 0;

  for (const customer of rentedCustomers) {
    // Check if there's an invoice covering the current month
    const existingInvoice = await Invoice.findOne({
      customerId: customer._id,
      paidFromMonth: { $lte: currentMonth },
      paidToMonth: { $gte: currentMonth },
    });

    if (!existingInvoice) {
      // Find the last invoice to calculate pending
      const lastInvoice = await Invoice.findOne({ customerId: customer._id }).sort({ paidToMonth: -1 });

      let pendingFrom = currentMonth;
      if (lastInvoice) {
        const [y, m] = lastInvoice.paidToMonth.split('-').map(Number);
        const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
        pendingFrom = nextMonth;
      }

      const pendingMonths = monthDiff(pendingFrom, currentMonth);
      const pendingAmount = pendingMonths * customer.monthlyCharge;

      const message =
        `Water Bill Reminder: Room ${customer.roomNumber}, ` +
        `Pending: ${pendingMonths} month(s), Rs.${pendingAmount}. ` +
        `Please pay at the earliest.`;

      const success = await sendSMS(customer.mobile, message);
      if (success) sent++;
      else failed++;
    }
  }

  console.log(`Monthly reminders: ${sent} sent, ${failed} failed`);
  return { sent, failed };
};

function monthDiff(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return Math.max((ty - fy) * 12 + (tm - fm) + 1, 0);
}
