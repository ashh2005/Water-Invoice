import { Gunta } from '../models/Gunta';
import { Customer } from '../models/Customer';
import { AppError } from '../utils/AppError';

export const createGunta = async (data: { name: string; description?: string; assignedStaff?: string | null }) => {
  return Gunta.create(data);
};

export const getGuntas = async (search?: string) => {
  const filter: any = {};
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }
  return Gunta.find(filter)
    .populate('assignedStaff', 'username role')
    .sort({ name: 1 });
};

export const getGuntaById = async (id: string) => {
  const gunta = await Gunta.findById(id).populate('assignedStaff', 'username role');
  if (!gunta) throw new AppError('Gunta not found', 404);
  return gunta;
};

export const updateGunta = async (id: string, data: { name?: string; description?: string; assignedStaff?: string | null }) => {
  const gunta = await Gunta.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('assignedStaff', 'username role');
  if (!gunta) throw new AppError('Gunta not found', 404);
  return gunta;
};

export const deleteGunta = async (id: string) => {
  const customerCount = await Customer.countDocuments({ guntaId: id });
  if (customerCount > 0) {
    throw new AppError('Cannot delete gunta with existing customers. Delete customers first.', 400);
  }
  const gunta = await Gunta.findByIdAndDelete(id);
  if (!gunta) throw new AppError('Gunta not found', 404);
  return gunta;
};
