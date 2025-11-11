'use client';
import React, { useCallback } from 'react';
import { Input } from './ui/input';

interface CurrencyInputProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onValueChange }) => {
  const format = (val: number | undefined) => {
    if (val === undefined || val === null) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
      .format(val)
      .replace('R$', '')
      .trim();
  };

  const parse = (val: string) => {
    const numericValue = val.replace(/\D/g, '');
    if (numericValue === '') return undefined;
    return parseFloat(numericValue) / 100;
  };

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsedValue = parse(e.target.value);
      onValueChange(parsedValue);
    },
    [onValueChange]
  );
  
  const formattedValue = value !== undefined ? format(value) : '';

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={formattedValue}
      onChange={handleChange}
      placeholder="0,00"
    />
  );
};
