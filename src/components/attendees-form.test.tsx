/// <reference types="vitest/globals" />
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { attendeesAllValid, AttendeesForm, type AttendeesValue } from './attendees-form';

describe('attendeesAllValid — requireEmail', () => {
  it('com requireEmail, email vazio invalida', () => {
    const v = [{ name: 'Ana Silva', email: '' }];
    expect(attendeesAllValid(v, 1, true)).toBe(false);
  });
  it('com requireEmail, todos com email válido valida', () => {
    const v = [{ name: 'Ana Silva', email: 'a@x.com' }];
    expect(attendeesAllValid(v, 1, true)).toBe(true);
  });
  it('sem requireEmail, email vazio continua válido', () => {
    const v = [{ name: 'Ana Silva', email: '' }];
    expect(attendeesAllValid(v, 1)).toBe(true);
  });
});

it('mostra erro de email vazio quando requireEmail', () => {
  function Harness() {
    const [v, setV] = React.useState<AttendeesValue>([{ name: 'Ana Silva', email: '' }]);
    return <AttendeesForm expectedCount={1} value={v} onChange={setV} requireEmail />;
  }
  render(<Harness />);
  expect(screen.getByText(/email obrigat/i)).toBeInTheDocument();
});
