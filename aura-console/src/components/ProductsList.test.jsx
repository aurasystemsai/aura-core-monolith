import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { apiFetch } from '../api';
import ProductsList from './ProductsList.jsx';

jest.mock('../api', () => ({
 apiFetch: jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({ products: [] }),
 })),
}));

describe('ProductsList', () => {
 it('renders SEO tips and debug utility', () => {
 render(<ProductsList products={[]} />);
 // Check for a common SEO tip or debug utility text
 expect(
 screen.getByText(/SEO|debug|product|title|description/i, { exact: false })
 ).toBeInTheDocument();
 });

 it('uses the authenticated API helper without rendering a supplied token', async () => {
 const token = 'sensitive-shopify-token';
 render(<ProductsList shopDomain="aurasystemsai.myshopify.com" shopToken={token} />);

 await waitFor(() => {
  expect(apiFetch).toHaveBeenCalledWith('/api/shopify/products?shop=aurasystemsai.myshopify.com');
 });
 expect(document.body.textContent).not.toContain(token);
 });
});
