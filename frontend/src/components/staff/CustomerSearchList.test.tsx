import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomerSearchList } from './CustomerSearchList';
import { Customer } from '../../types';

const mockCustomers: Customer[] = [
  { _id: '1', nameEnglish: 'Prem Thatikonda', roomNumber: '101', mobile: '9876543210', monthlyCharge: 600, status: 'Rented', guntaId: { _id: 'g1', name: 'Gunta A' } as any, username: 'prem', createdAt: '', updatedAt: '' },
  { _id: '2', nameEnglish: 'Aayush Chounkar', roomNumber: '103', mobile: '9876543211', monthlyCharge: 600, status: 'Rented', guntaId: { _id: 'g1', name: 'Gunta A' } as any, username: 'aayush', createdAt: '', updatedAt: '' },
];

describe('CustomerSearchList', () => {
  it('shows skeleton rows while loading', () => {
    render(
      <CustomerSearchList
        customers={[]}
        isLoading={true}
        search=""
        onSearchChange={() => {}}
        onSelect={() => {}}
      />
    );
    expect(screen.getAllByTestId('customer-row-skeleton')).toHaveLength(3);
  });

  it('renders customer rows when loaded', () => {
    render(
      <CustomerSearchList
        customers={mockCustomers}
        isLoading={false}
        search=""
        onSearchChange={() => {}}
        onSelect={() => {}}
      />
    );
    expect(screen.getByText('Prem Thatikonda')).toBeInTheDocument();
    expect(screen.getByText('Aayush Chounkar')).toBeInTheDocument();
  });

  it('calls onSelect with the customer when a row is clicked', async () => {
    const onSelect = vi.fn();
    render(
      <CustomerSearchList
        customers={mockCustomers}
        isLoading={false}
        search=""
        onSearchChange={() => {}}
        onSelect={onSelect}
      />
    );
    await userEvent.click(screen.getByText('Prem Thatikonda'));
    expect(onSelect).toHaveBeenCalledWith(mockCustomers[0]);
  });
});
