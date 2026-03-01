import { Customer } from '../models/Customer';
import { Gunta } from '../models/Gunta';
import { AppError } from '../utils/AppError';

export const createCustomer = async (data: {
  nameEnglish: string;
  nameHindi?: string;
  mobile: string;
  address?: string;
  guntaId: string;
  roomNumber: string;
  monthlyCharge: number;
  status?: string;
  notes?: string;
}) => {
  // Validate gunta exists
  const gunta = await Gunta.findById(data.guntaId);
  if (!gunta) throw new AppError('Gunta not found', 404);

  // Auto-generate username and password
  // Strip "Gunta " prefix if present and remove spaces, e.g. "Gunta A" -> "A"
  // Username: Gunta{shortName}Room{roomNumber}  e.g. GuntaARoom101
  // Password: {roomNumber}{shortName}            e.g. 101A
  const shortName = gunta.name.replace(/^Gunta\s*/i, '').replace(/\s+/g, '');
  const username = `Gunta${shortName}Room${data.roomNumber}`;
  const password = `${data.roomNumber}${shortName}`;

  const customer = await Customer.create({ ...data, username, password });

  // Return customer with generated credentials (password is select:false by default)
  return { customer, generatedUsername: username, generatedPassword: password };
};

export const getCustomers = async (filters: { search?: string; guntaId?: string; status?: string }) => {
  const query: any = {};
  if (filters.search) {
    query.$or = [
      { nameEnglish: { $regex: filters.search, $options: 'i' } },
      { nameHindi: { $regex: filters.search, $options: 'i' } },
      { mobile: { $regex: filters.search, $options: 'i' } },
      { roomNumber: { $regex: filters.search, $options: 'i' } },
    ];
  }
  if (filters.guntaId) query.guntaId = filters.guntaId;
  if (filters.status) query.status = filters.status;

  return Customer.find(query)
    .populate('guntaId', 'name')
    .sort({ nameEnglish: 1 });
};

export const getCustomerById = async (id: string) => {
  const customer = await Customer.findById(id).populate('guntaId', 'name');
  if (!customer) throw new AppError('Customer not found', 404);
  return customer;
};

export const updateCustomer = async (id: string, data: {
  nameEnglish?: string;
  nameHindi?: string;
  mobile?: string;
  address?: string;
  roomNumber?: string;
  monthlyCharge?: number;
  status?: string;
  username?: string;
  password?: string;
  notes?: string;
}) => {
  // If password is being changed, use .save() to trigger pre-save hook
  if (data.password) {
    const customer = await Customer.findById(id).select('+password');
    if (!customer) throw new AppError('Customer not found', 404);

    Object.assign(customer, data);
    await customer.save();

    return Customer.findById(id).populate('guntaId', 'name');
  }

  // Remove password from update data if empty/undefined
  const { password, ...updateData } = data;
  const customer = await Customer.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
    .populate('guntaId', 'name');
  if (!customer) throw new AppError('Customer not found', 404);
  return customer;
};

export const deleteCustomer = async (id: string) => {
  const customer = await Customer.findById(id);
  if (!customer) throw new AppError('Customer not found', 404);
  await customer.deleteOne();
  return customer;
};
