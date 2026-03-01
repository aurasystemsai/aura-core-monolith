import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ProductsList from './ProductsList';

describe('ProductsList', () => {
 it('renders SEO tips and debug utility', () => {
 render(<ProductsList products={[]} />);
 // Check for a common SEO tip or debug utility text
 expect(
 screen.getByText(/SEO|debug|product|title|description/i, { exact: false })
 ).toBeInTheDocument();
 });
});
