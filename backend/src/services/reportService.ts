import { Invoice } from '../models/Invoice';
import { Customer } from '../models/Customer';
import { Payment } from '../models/Payment';

export const getDashboardSummary = async () => {
  const [totalCustomers, rentedCustomers, vacantCustomers, closedCustomers] = await Promise.all([
    Customer.countDocuments(),
    Customer.countDocuments({ status: 'Rented' }),
    Customer.countDocuments({ status: 'Vacant' }),
    Customer.countDocuments({ status: 'Closed' }),
  ]);

  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const monthlyCollection = await Invoice.aggregate([
    { $match: { createdAt: { $gte: new Date(currentMonth + '-01') } } },
    { $group: { _id: null, total: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
  ]);

  const totalCollection = await Invoice.aggregate([
    { $group: { _id: null, total: { $sum: '$amountPaid' } } },
  ]);

  // Customers with pending payments (rented but no invoice covering current month)
  const paidCustomerIds = await Invoice.distinct('customerId', {
    paidFromMonth: { $lte: currentMonth },
    paidToMonth: { $gte: currentMonth },
  });

  const defaulterCount = await Customer.countDocuments({
    status: 'Rented',
    _id: { $nin: paidCustomerIds },
  });

  const recentInvoices = await Invoice.find()
    .populate('customerId', 'nameEnglish roomNumber')
    .sort({ createdAt: -1 })
    .limit(10);

  return {
    totalCustomers,
    rentedCustomers,
    vacantCustomers,
    closedCustomers,
    monthlyCollection: monthlyCollection[0]?.total || 0,
    monthlyInvoiceCount: monthlyCollection[0]?.count || 0,
    totalCollection: totalCollection[0]?.total || 0,
    defaulterCount,
    recentInvoices,
  };
};

export const getMonthlyCollection = async (month: string) => {
  const startDate = new Date(month + '-01');
  const endMonth = new Date(startDate);
  endMonth.setMonth(endMonth.getMonth() + 1);

  return Invoice.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lt: endMonth },
      },
    },
    {
      $group: {
        _id: '$paymentMethod',
        total: { $sum: '$amountPaid' },
        count: { $sum: 1 },
      },
    },
  ]);
};

export const getDefaultersList = async () => {
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const paidCustomerIds = await Invoice.distinct('customerId', {
    paidFromMonth: { $lte: currentMonth },
    paidToMonth: { $gte: currentMonth },
  });

  const defaulterCustomers = await Customer.find({
    status: 'Rented',
    _id: { $nin: paidCustomerIds },
  }).populate('guntaId', 'name');

  const result = [];
  for (const customer of defaulterCustomers) {
    const lastInvoice = await Invoice.findOne({ customerId: customer._id }).sort({ paidToMonth: -1 });

    let pendingFrom = '2024-01';
    if (lastInvoice) {
      const [y, m] = lastInvoice.paidToMonth.split('-').map(Number);
      pendingFrom = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
    }

    const [fy, fm] = pendingFrom.split('-').map(Number);
    const [ty, tm] = currentMonth.split('-').map(Number);
    const pendingMonths = Math.max((ty - fy) * 12 + (tm - fm) + 1, 0);

    result.push({
      customer: {
        _id: customer._id,
        nameEnglish: customer.nameEnglish,
        nameHindi: customer.nameHindi,
        mobile: customer.mobile,
        roomNumber: customer.roomNumber,
        monthlyCharge: customer.monthlyCharge,
        gunta: customer.guntaId,
      },
      pendingFrom,
      pendingMonths,
      pendingAmount: pendingMonths * customer.monthlyCharge,
      lastPaymentDate: lastInvoice?.createdAt || null,
    });
  }

  return result;
};

export const getCollectionSummary = async (fromDate: string, toDate: string) => {
  const invoices = await Invoice.find({
    createdAt: {
      $gte: new Date(fromDate),
      $lte: new Date(toDate + 'T23:59:59.999Z'),
    },
  })
    .populate({
      path: 'customerId',
      select: 'nameEnglish roomNumber guntaId',
      populate: { path: 'guntaId', select: 'name' },
    })
    .sort({ createdAt: -1 });

  // Group by gunta
  const byGunta: Record<string, { cash: number; online: number; total: number; count: number }> = {};

  let cashTotal = 0;
  let onlineTotal = 0;

  for (const inv of invoices) {
    const customer = inv.customerId as any;
    const gunta = customer?.guntaId as any;
    const guntaName = gunta?.name || 'Unknown';

    if (!byGunta[guntaName]) byGunta[guntaName] = { cash: 0, online: 0, total: 0, count: 0 };

    const amount = inv.amountPaid;
    const method = inv.paymentMethod === 'Cash' ? 'cash' : 'online';

    byGunta[guntaName][method] += amount;
    byGunta[guntaName].total += amount;
    byGunta[guntaName].count++;

    if (inv.paymentMethod === 'Cash') cashTotal += amount;
    else onlineTotal += amount;
  }

  return {
    byGunta,
    cashTotal,
    onlineTotal,
    grandTotal: cashTotal + onlineTotal,
    invoiceCount: invoices.length,
    invoices,
  };
};
