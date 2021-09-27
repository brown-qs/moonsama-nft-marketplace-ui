import { ReactNode } from 'react';
import { Layout } from './Layout';

export interface LayoutProps {
  fullWidth?: boolean,
  children: NonNullable<ReactNode>;
}